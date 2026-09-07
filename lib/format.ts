/**
 * Shared display formatting.
 */

/**
 * English ordinal suffix: 1 → "1st", 2 → "2nd", 3 → "3rd", 4 → "4th",
 * and the teens correctly as "11th", "12th", "13th".
 *
 * Used for day-of-month labels across group rules, which are only ever 1–31,
 * but the general rule is implemented so it stays correct anywhere else.
 */
export function ordinal(n: number): string {
  if (!Number.isFinite(n)) return String(n ?? '');
  const i = Math.trunc(n);
  const abs = Math.abs(i);

  // 11th, 12th, 13th break the pattern — every other number follows the last digit
  const teens = abs % 100;
  if (teens >= 11 && teens <= 13) return `${i}th`;

  switch (abs % 10) {
    case 1:  return `${i}st`;
    case 2:  return `${i}nd`;
    case 3:  return `${i}rd`;
    default: return `${i}th`;
  }
}
