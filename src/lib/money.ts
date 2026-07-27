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

/** Prepaid card balance: earns + incoming transfers − expends − outgoing transfers, for one account. */
export function prepaidBalanceOf(
  accountId: string,
  rows: Array<{ type: 'earn' | 'expend' | 'transfer'; amount: number; accountId: string | null; counterAccountId: string | null }>,
): number {
  return rows.reduce((acc, r) => {
    if (r.type === 'earn' && r.accountId === accountId) return acc + r.amount
    if (r.type === 'expend' && r.accountId === accountId) return acc - r.amount
    if (r.type === 'transfer' && r.counterAccountId === accountId) return acc + r.amount
    if (r.type === 'transfer' && r.accountId === accountId) return acc - r.amount
    return acc
  }, 0)
}
