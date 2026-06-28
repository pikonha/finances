import { assertMoney } from './money'

/**
 * Split a total into `count` equal integer-cent installments; the last row
 * absorbs the rounding remainder so SUM(rows) === total exactly.
 * Pure — covered by installments.test.ts.
 */
export function splitInstallments(total: number, count: number): number[] {
  assertMoney(total)
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`Invalid installment count: ${count}`)
  }
  const base = Math.floor(total / count)
  const amounts = Array(count).fill(base)
  amounts[count - 1] = total - base * (count - 1)
  return amounts
}

/** ISO date `startDate` plus `n` whole months, in UTC. */
export function addMonths(startDate: string, n: number): string {
  const [y, m, d] = startDate.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1 + n, d))
  return date.toISOString().slice(0, 10)
}
