/**
 * Runs the coach against made-up profiles on a live local Ollama model and
 * scores the replies (plan 3.3). Nothing leaves the Mac: every request goes to
 * 127.0.0.1:11434, the profiles are fixtures in tests/coach-eval/fixtures, and
 * no production table is touched.
 *
 *   npm run coach:eval -- --model qwen3.5:4b
 *   npm run coach:eval -- --model qwen3.5:9b --out coach-eval-9b.json
 *   npm run coach:eval -- --dry-run            (no model: checks the fixtures and prompt sizes)
 *
 * Pass mark: at least 95% of checks and zero "must never" breaks. Exit code 0
 * is a pass, 1 a fail, 2 a setup problem (Ollama not running, model missing).
 * Run it before any prompt, model or digest change, and on each pinned tag.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildCoachContextV2, estimateTokens, MAX_PROMPT_TOKENS } from "@/lib/coach-chat/context";
import {
  PASS_MARK,
  failedTurn,
  fixtureErrors,
  fixtureToContextInput,
  renderReport,
  scoreTurn,
  summarise,
  type EvalFixture,
  type TurnResult,
} from "@/lib/coach-chat/eval";
import {
  DEFAULT_NUM_CTX,
  OLLAMA_BASE_URL,
  OllamaError,
  ollamaStatus,
  streamOllamaChat,
  type OllamaStats,
} from "@/lib/coach-chat/ollama";
import { COACH_REPLY_SCHEMA, parseCoachReply } from "@/lib/coach-chat/reply";
import type { ChatMessage } from "@/lib/coach-chat/types";

const FIXTURE_DIR = join("tests", "coach-eval", "fixtures");
const DEFAULT_MODEL = "qwen3.5:4b";

interface Options {
  model: string;
  baseUrl: string;
  only: string[];
  limit: number;
  numCtx: number;
  numPredict: number;
  temperature: number;
  timeoutS: number;
  out: string | null;
  dryRun: boolean;
}

const USAGE = `Usage: npm run coach:eval -- [options]
  --model <tag>          Ollama model to test (default ${DEFAULT_MODEL})
  --base-url <url>       Ollama address (default ${OLLAMA_BASE_URL})
  --fixture <text>       only fixtures whose id contains this (repeat for several)
  --limit <n>            only the first n fixtures
  --num-ctx <n>          context size (default ${DEFAULT_NUM_CTX}, what the app sets)
  --num-predict <n>      reply length cap in tokens (default 700)
  --temperature <x>      sampling temperature (default 0.2)
  --timeout <seconds>    per reply (default 300)
  --out <file>           also write the results as JSON
  --dry-run              check the fixtures and prompt sizes without a model`;

class SetupError extends Error {}

function parseArgs(argv: string[]): Options {
  const options: Options = {
    model: DEFAULT_MODEL,
    baseUrl: OLLAMA_BASE_URL,
    only: [],
    limit: Infinity,
    numCtx: DEFAULT_NUM_CTX,
    numPredict: 700,
    temperature: 0.2,
    timeoutS: 300,
    out: null,
    dryRun: false,
  };
  const number = (flag: string, value: string | undefined) => {
    const parsed = Number(value);
    if (!value || !Number.isFinite(parsed) || parsed <= 0)
      throw new SetupError(`${flag} needs a positive number`);
    return parsed;
  };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i]!;
    const value = () => {
      const next = argv[++i];
      if (next === undefined) throw new SetupError(`${flag} needs a value`);
      return next;
    };
    switch (flag) {
      case "--model":
        options.model = value();
        break;
      case "--base-url":
        options.baseUrl = value().replace(/\/+$/, "");
        break;
      case "--fixture":
        options.only.push(value());
        break;
      case "--limit":
        options.limit = number(flag, value());
        break;
      case "--num-ctx":
        options.numCtx = number(flag, value());
        break;
      case "--num-predict":
        options.numPredict = number(flag, value());
        break;
      case "--temperature":
        options.temperature = Number(value());
        if (!Number.isFinite(options.temperature) || options.temperature < 0)
          throw new SetupError("--temperature needs a number of 0 or more");
        break;
      case "--timeout":
        options.timeoutS = number(flag, value());
        break;
      case "--out":
        options.out = value();
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--help":
      case "-h":
        console.log(USAGE);
        process.exit(0);
        break;
      default:
        throw new SetupError(`Unknown option ${flag}\n${USAGE}`);
    }
  }
  return options;
}

function loadFixtures(options: Options): EvalFixture[] {
  const files = readdirSync(FIXTURE_DIR)
    .filter((file) => file.endsWith(".json"))
    .sort();
  const fixtures: EvalFixture[] = [];
  for (const file of files) {
    const parsed: unknown = JSON.parse(readFileSync(join(FIXTURE_DIR, file), "utf8"));
    const errors = fixtureErrors(parsed);
    if (errors.length)
      throw new SetupError(`${file} is not a valid fixture:\n  ${errors.join("\n  ")}`);
    fixtures.push(parsed as EvalFixture);
  }
  const chosen = fixtures.filter(
    (fixture) => !options.only.length || options.only.some((text) => fixture.id.includes(text)),
  );
  if (!chosen.length) throw new SetupError(`No fixture matches ${options.only.join(", ")}`);
  return chosen.slice(0, options.limit);
}

/** The name Ollama lists a model under: a tag-less name means `:latest`. */
function hasModel(models: string[], model: string): boolean {
  const wanted = model.includes(":") ? model : `${model}:latest`;
  return models.includes(model) || models.includes(wanted);
}

async function modelDigest(baseUrl: string, model: string): Promise<string | null> {
  try {
    const res = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(5000) });
    const body = (await res.json()) as {
      models?: { name?: string; model?: string; digest?: string }[];
    };
    const wanted = model.includes(":") ? model : `${model}:latest`;
    return (
      body.models?.find((entry) => entry.name === wanted || entry.model === wanted)?.digest ?? null
    );
  } catch {
    return null;
  }
}

function dryRun(fixtures: EvalFixture[]): number {
  const rows: string[][] = [["fixture", "turns", "prompt tokens", "history tokens", "catalogue"]];
  let tooBig = 0;
  for (const fixture of fixtures) {
    const { system, catalogue } = buildCoachContextV2(fixtureToContextInput(fixture));
    const history = (fixture.history ?? []).reduce(
      (sum, message) => sum + estimateTokens(message.content),
      0,
    );
    const prompt = estimateTokens(system);
    if (prompt > MAX_PROMPT_TOKENS) tooBig++;
    rows.push([
      fixture.id,
      String(fixture.turns.length),
      String(prompt),
      String(history),
      String(catalogue.length),
    ]);
  }
  const widths = rows[0]!.map((_, col) => Math.max(...rows.map((row) => row[col]!.length)));
  for (const row of rows)
    console.log(
      row
        .map((cell, col) => (col === 0 ? cell.padEnd(widths[col]!) : cell.padStart(widths[col]!)))
        .join("  "),
    );
  console.log(
    `\n${fixtures.length} fixtures are valid and build a prompt. ${tooBig} over the ${MAX_PROMPT_TOKENS}-token limit.`,
  );
  return tooBig ? 1 : 0;
}

/** One question to the model: its raw reply, and Ollama's token counts. */
async function ask(
  messages: ChatMessage[],
  options: Options,
): Promise<{ raw: string; stats: OllamaStats | undefined; timedOut: boolean }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutS * 1000);
  try {
    const stream = streamOllamaChat(messages, {
      model: options.model,
      baseUrl: options.baseUrl,
      numCtx: options.numCtx,
      numPredict: options.numPredict,
      temperature: options.temperature,
      format: COACH_REPLY_SCHEMA,
      keepAlive: "30m",
      signal: controller.signal,
    });
    let raw = "";
    for (;;) {
      const next = await stream.next();
      if (next.done) return { raw, stats: next.value, timedOut: controller.signal.aborted };
      raw += next.value;
    }
  } finally {
    clearTimeout(timer);
  }
}

const FATAL = new Set(["not-running", "model-missing", "old-version", "out-of-memory"]);

async function runFixture(fixture: EvalFixture, options: Options): Promise<TurnResult[]> {
  const { system, catalogue } = buildCoachContextV2(fixtureToContextInput(fixture));
  const messages: ChatMessage[] = [{ role: "system", content: system }, ...(fixture.history ?? [])];
  const results: TurnResult[] = [];
  for (const [index, turn] of fixture.turns.entries()) {
    messages.push({ role: "user", content: turn.user });
    const started = performance.now();
    let result: TurnResult;
    let note = "";
    try {
      const { raw, stats, timedOut } = await ask(messages, options);
      const seconds = (performance.now() - started) / 1000;
      if (timedOut) throw new Error(`no complete reply within ${options.timeoutS} s`);
      const parsed = parseCoachReply(raw, catalogue);
      const told = messages.map((message) => message.content).join("\n");
      const scored = scoreTurn({
        fixture,
        turn,
        raw,
        reply: parsed.reply,
        unknownIds: parsed.unknownIds,
        catalogue,
        told,
      });
      result = {
        ...scored,
        fixtureId: fixture.id,
        turn: index,
        user: turn.user,
        answer: parsed.reply.answer,
        refs: parsed.reply.refs.map((ref) => ref.id),
        seconds,
      };
      // What the app would keep in the conversation is what the model said.
      messages.push({ role: "assistant", content: raw });
      const used = (stats?.promptEvalCount ?? 0) + (stats?.evalCount ?? 0);
      if (used >= options.numCtx * 0.95)
        note += `  [context nearly full: ${used} of ${options.numCtx} tokens, the oldest messages may be cut]`;
      if (stats?.doneReason === "length") note += "  [reply hit the length cap]";
    } catch (error) {
      if (error instanceof OllamaError && FATAL.has(error.code)) throw error;
      const message = error instanceof Error ? error.message : String(error);
      result = {
        ...failedTurn(fixture, turn, message),
        fixtureId: fixture.id,
        turn: index,
        user: turn.user,
        answer: "",
        refs: [],
        seconds: (performance.now() - started) / 1000,
      };
      messages.pop();
    }
    results.push(result);
    const mark = result.breaks.length
      ? "BREAK"
      : result.passed === result.total
        ? "ok   "
        : "miss ";
    console.log(
      `${mark} ${fixture.id} #${index + 1}  ${result.passed}/${result.total} checks  ${result.breaks.length} breaks  ${result.seconds?.toFixed(1)} s${note}`,
    );
    // A failed turn leaves the conversation without an answer: the later turns would be about nothing.
    if (!result.answer && result.checks[0]?.id === "reply") break;
  }
  return results;
}

async function main(): Promise<number> {
  const options = parseArgs(process.argv.slice(2));
  const fixtures = loadFixtures(options);
  if (options.dryRun) return dryRun(fixtures);

  const status = await ollamaStatus(options.baseUrl);
  if (!status.running) {
    throw new SetupError(
      `Ollama is not running at ${options.baseUrl}. Open the Ollama app (or run "ollama serve") and try again.`,
    );
  }
  if (!hasModel(status.models, options.model)) {
    const installed = status.models.length ? status.models.join(", ") : "none";
    throw new SetupError(
      `The model ${options.model} is not installed. Run "ollama pull ${options.model}" first. Installed: ${installed}.`,
    );
  }
  const digest = await modelDigest(options.baseUrl, options.model);
  console.log(
    `Model ${options.model}  digest ${digest ?? "unknown"}  Ollama ${status.version ?? "unknown"}`,
  );
  console.log(
    `${fixtures.length} fixtures, num_ctx ${options.numCtx}, num_predict ${options.numPredict}, temperature ${options.temperature}, thinking off\n`,
  );

  // With --out the file is rewritten after every fixture, so a long run can be read while it goes.
  const save = (results: TurnResult[]) => {
    if (!options.out) return;
    const body = {
      model: options.model,
      digest,
      ollama: status.version ?? null,
      date: new Date().toISOString(),
      passMark: PASS_MARK,
      options: {
        numCtx: options.numCtx,
        numPredict: options.numPredict,
        temperature: options.temperature,
      },
      summary: summarise(results),
      results,
    };
    writeFileSync(options.out, `${JSON.stringify(body, null, 2)}\n`);
  };

  const results: TurnResult[] = [];
  try {
    for (const fixture of fixtures) {
      results.push(...(await runFixture(fixture, options)));
      save(results);
    }
  } catch (error) {
    save(results);
    if (error instanceof OllamaError)
      throw new SetupError(`Ollama stopped the run: ${error.message}`);
    throw error;
  }

  console.log(`\n${renderReport(results)}`);
  const summary = summarise(results);
  if (options.out) console.log(`Results written to ${options.out}`);
  return summary.pass ? 0 : 1;
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    console.error(error instanceof SetupError ? error.message : error);
    process.exitCode = 2;
  },
);
