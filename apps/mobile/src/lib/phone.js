/** Accepts "98765 43210", "+91 98765-43210" or "919876543210"; defaults to India (+91). */
export function toE164(input) {
  const digits = input.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return `+${digits}`;
}
