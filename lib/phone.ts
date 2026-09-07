/**
 * Zambian mobile numbers for Lipila.
 *
 * Lipila requires 260XXXXXXXXX, but people type what they know: 0977123456,
 * +260 97 712 3456, 260-977-123-456. These helpers accept all of those and
 * produce the one format the API will take.
 *
 * Subscriber numbers are 9 digits starting with 9 (MTN 96, Airtel 97,
 * Zamtel 95) or 7 (MTN 76, Airtel 77, Zamtel 75).
 */

const ZM_SUBSCRIBER = /^[79]\d{8}$/;

/**
 * Convert any recognisable Zambian mobile number to 260XXXXXXXXX.
 * Returns null when the input can't be read as one, so callers can show
 * their own message rather than sending something Lipila will reject.
 */
export function normalizeZmPhone(input: string): string | null {
  const digits = (input || '').replace(/\D/g, '');
  if (!digits) return null;

  let subscriber: string;
  if (digits.startsWith('260')) subscriber = digits.slice(3);      // 260977123456
  else if (digits.startsWith('0')) subscriber = digits.slice(1);   // 0977123456
  else subscriber = digits;                                        // 977123456

  if (!ZM_SUBSCRIBER.test(subscriber)) return null;
  return `260${subscriber}`;
}

/** True when the input is already a valid Zambian mobile number in any accepted shape. */
export function isValidZmPhone(input: string): boolean {
  return normalizeZmPhone(input) !== null;
}

/** Display form: 260 977 123 456. Falls back to the raw input if unrecognised. */
export function formatZmPhone(input: string): string {
  const n = normalizeZmPhone(input);
  if (!n) return input;
  return `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6, 9)} ${n.slice(9)}`;
}
