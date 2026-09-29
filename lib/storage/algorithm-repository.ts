import type { AlgorithmAttempt, AlgorithmProgress, AlgorithmVariant } from "@/types/domain";
import { stateForLabel, type CaseLabel } from "@/lib/algorithms/labels";
import type { LocalDatabase } from "./database";
import { createId } from "./ids";
import { algorithmAttemptSchema, algorithmProgressSchema } from "./schemas";

/** One answer in a recognition drill. */
export interface RecognitionAnswer {
  caseId: string;
  /** The algorithm the case was shown with. */
  variantId: string;
  successful: boolean;
  recognitionMs: number;
}

const blank = (caseId: string): AlgorithmProgress => ({
  caseId,
  state: "not_started",
  favorite: false,
  ignored: false,
  customVariants: [],
});

/** What a person has done with the algorithm bank: labels, picks and their own algorithms. */
export class AlgorithmRepository {
  constructor(private readonly db: LocalDatabase) {}

  async list(): Promise<AlgorithmProgress[]> {
    return this.db.algorithmProgress.toArray();
  }

  /**
   * Saves a recognition deck's answers, one row each. Rows are only ever
   * added, so a deck answered on one device can't overwrite one from another.
   */
  async recordRecognition(
    answers: readonly RecognitionAnswer[],
    now = new Date().toISOString(),
  ): Promise<void> {
    // A millisecond apart, so two answers to one case in a deck keep their order.
    const base = Date.parse(now);
    const rows = answers.map((answer, index) =>
      algorithmAttemptSchema.parse({
        id: createId(),
        caseId: answer.caseId,
        variantId: answer.variantId,
        createdAt: new Date(base + index).toISOString(),
        mode: "recognition",
        successful: answer.successful,
        recognitionMs: Math.round(answer.recognitionMs),
      }),
    );
    if (rows.length) await this.db.algorithmAttempts.bulkPut(rows);
  }

  /** Every saved recognition answer, oldest first. */
  async recognitionAttempts(): Promise<AlgorithmAttempt[]> {
    const rows = await this.db.algorithmAttempts.orderBy("createdAt").toArray();
    return rows.filter((row) => row.mode === "recognition");
  }

  async get(caseId: string): Promise<AlgorithmProgress | undefined> {
    return this.db.algorithmProgress.get(caseId);
  }

  private async update(
    caseId: string,
    change: (progress: AlgorithmProgress) => AlgorithmProgress,
    now = new Date().toISOString(),
  ): Promise<void> {
    await this.db.transaction("rw", this.db.algorithmProgress, async () => {
      const current = (await this.db.algorithmProgress.get(caseId)) ?? blank(caseId);
      const next = { ...change(current), caseId, updatedAt: now };
      await this.db.algorithmProgress.put(algorithmProgressSchema.parse(next));
    });
  }

  /** Marks the case as known, being learned, or not known. */
  async setLabel(caseId: string, label: CaseLabel): Promise<void> {
    await this.update(caseId, (progress) => ({ ...progress, state: stateForLabel(label) }));
  }

  /** Remembers which algorithm this person uses for the case. */
  async setPreferred(caseId: string, variantId: string | null): Promise<void> {
    await this.update(caseId, (progress) => ({
      ...progress,
      preferredVariantId: variantId ?? undefined,
    }));
  }

  async setNotes(caseId: string, notes: string): Promise<void> {
    await this.update(caseId, (progress) => ({
      ...progress,
      notes: notes.trim() ? notes.trim() : undefined,
    }));
  }

  async setFavorite(caseId: string, favorite: boolean): Promise<void> {
    await this.update(caseId, (progress) => ({ ...progress, favorite }));
  }

  /** Adds an algorithm of the person's own to the case. */
  async addCustom(caseId: string, variant: AlgorithmVariant): Promise<void> {
    await this.update(caseId, (progress) => ({
      ...progress,
      customVariants: [...progress.customVariants.filter((v) => v.id !== variant.id), variant],
    }));
  }

  async removeCustom(caseId: string, variantId: string): Promise<void> {
    await this.update(caseId, (progress) => ({
      ...progress,
      customVariants: progress.customVariants.filter((variant) => variant.id !== variantId),
      preferredVariantId:
        progress.preferredVariantId === variantId ? undefined : progress.preferredVariantId,
    }));
  }
}
