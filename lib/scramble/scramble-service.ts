import type { CubeEvent } from "@/types/domain";
import { isValidAlgorithm, normalizeNotation } from "@/lib/cube/notation";
import type { GeneratedScramble, ScrambleProvider } from "./types";

export interface ScrambleServiceOptions {
  primary: ScrambleProvider;
  fallback: ScrambleProvider;
  /** Give up on the primary provider after this long and use the fallback. */
  timeoutMs?: number;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Scramble generation timed out.")), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Generates scrambles and keeps the next one prepared so a new scramble is
 * available the instant a solve ends.
 */
export class ScrambleService {
  private readonly prepared = new Map<CubeEvent, Promise<GeneratedScramble>>();
  private readonly timeoutMs: number;

  constructor(private readonly options: ScrambleServiceOptions) {
    this.timeoutMs = options.timeoutMs ?? 8000;
  }

  /** Returns the prepared scramble (or generates one) and prepares the next. */
  async next(event: CubeEvent): Promise<GeneratedScramble> {
    const current = this.prepared.get(event) ?? this.generate(event);
    this.prepared.delete(event);
    const scramble = await current;
    this.prepare(event);
    return scramble;
  }

  prepare(event: CubeEvent): void {
    if (!this.prepared.has(event)) this.prepared.set(event, this.generate(event));
  }

  private async generate(event: CubeEvent): Promise<GeneratedScramble> {
    const { primary, fallback } = this.options;
    try {
      return await this.fromProvider(primary, event);
    } catch (error) {
      console.warn(`Scramble provider ${primary.id} failed; using ${fallback.id}.`, error);
      return this.fromProvider(fallback, event);
    }
  }

  private async fromProvider(
    provider: ScrambleProvider,
    event: CubeEvent,
  ): Promise<GeneratedScramble> {
    const scramble = normalizeNotation(await withTimeout(provider.generate(event), this.timeoutMs));
    if (!scramble || !isValidAlgorithm(scramble)) {
      throw new Error(`Provider ${provider.id} returned an invalid scramble.`);
    }
    return { event, scramble, providerId: provider.id, randomState: provider.randomState };
  }
}
