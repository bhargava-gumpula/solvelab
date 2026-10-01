/**
 * The coach model's reasons read like model output ("Likely holding you back:
 * Turning speed (100% sure)."). In the Hub they read as words instead.
 */
export function plainReason(reason: string): string {
  const match = /^Likely holding you back: (.+) \((\d+)% sure\)\.$/.exec(reason);
  if (!match) return reason;
  const sure = Number(match[2]);
  const lead = sure >= 90 ? "Almost certainly" : sure >= 60 ? "Likely" : "Possibly";
  return `${lead} holding you back: ${match[1]}.`;
}
