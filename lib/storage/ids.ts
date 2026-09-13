/** Stable, collision-resistant identifiers for locally created records. */
export function createId(): string {
  return crypto.randomUUID();
}
