const PRECISION = 2;

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    throw new RangeError("number is not finite");
  }
  const formatted = value.toFixed(PRECISION);
  return Number(formatted) === 0 ? (0).toFixed(PRECISION) : formatted;
}
