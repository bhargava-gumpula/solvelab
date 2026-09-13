import type { CubeEvent } from "@/types/domain";

export interface ScrambleProvider {
  readonly id: string;
  /** True when scrambles are drawn uniformly from all cube states (WCA quality). */
  readonly randomState: boolean;
  generate(event: CubeEvent): Promise<string>;
}

export interface GeneratedScramble {
  event: CubeEvent;
  scramble: string;
  providerId: string;
  randomState: boolean;
}
