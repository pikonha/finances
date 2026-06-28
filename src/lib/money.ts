/**
 * Money is stored as integer minor units (cents). Never floats.
 * Call at every trust boundary before persisting an amount.
 */
export function assertMoney(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new Error(`Invalid money amount: ${String(value)} (must be integer cents)`)
  }
  if (value < 0) {
    throw new Error(`Invalid money amount: ${value} (must be non-negative)`)
  }
  return value
}

/** Signed balance contribution: earn adds, expend subtracts. */
export function signedAmount(type: 'earn' | 'expend', amount: number): number {
  return type === 'earn' ? amount : -amount
}

/** Sum of transaction rows, signed by type. Returns integer cents. */
export function balanceOf(
  rows: Array<{ type: 'earn' | 'expend'; amount: number }>,
): number {
  return rows.reduce((acc, r) => acc + signedAmount(r.type, r.amount), 0)
}
