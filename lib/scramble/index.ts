import { siteConfig } from "@/lib/config/site";
import { createCubingProvider, randomMoveProvider, type CubingScrambleModule } from "./providers";
import { ScrambleService } from "./scramble-service";

export * from "./types";
export { ScrambleService } from "./scramble-service";
export { createCubingProvider, randomMoveProvider, type CubingScrambleModule } from "./providers";

/** Built by scripts/bundle-cubing.mjs; loaded natively so its worker can resolve its own chunks. */
const loadBundledCubing = () =>
  import(
    /* webpackIgnore: true */ `${siteConfig.basePath}/vendor/cubing/scramble.js`
  ) as Promise<CubingScrambleModule>;

let service: ScrambleService | undefined;

export function getScrambleService(): ScrambleService {
  service ??= new ScrambleService({
    primary: createCubingProvider(loadBundledCubing),
    fallback: randomMoveProvider,
  });
  return service;
}
