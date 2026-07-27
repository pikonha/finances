import { and, eq } from 'drizzle-orm'
import { db } from '#/db/index'
import { account, faturaPayment, transaction } from '#/db/schema'
import { cycleKeyFor, faturaLabel, faturaStatus, nextCycleKey, vencimentoFor } from '#/lib/faturas'

export type FaturaRow = Awaited<ReturnType<typeof listFaturasCore>>[number]

export async function listFaturasCore(userId: string, today: string) {
  const cards = await db.select().from(account).where(
    and(eq(account.userId, userId), eq(account.kind, 'credit_card'), eq(account.prepaid, false)),
  )
  const txs = await db.select().from(transaction).where(and(eq(transaction.userId, userId), eq(transaction.type, 'expend')))
  const payments = await db.select().from(faturaPayment).where(eq(faturaPayment.userId, userId))

  return cards.flatMap((card) => {
    const cardTxs = txs.filter((t) => t.accountId === card.id)
    const totals = new Map<string, number>()
    for (const t of cardTxs) {
      const key = cycleKeyFor(t.date, card.closingDay!)
      totals.set(key, (totals.get(key) ?? 0) + t.amount)
    }
    const currentCycleKey = cycleKeyFor(today, card.closingDay!)
    totals.set(currentCycleKey, totals.get(currentCycleKey) ?? 0)
    const populatedKeys = [...totals.keys()].sort()
    for (let key = populatedKeys[0]; key < populatedKeys.at(-1)!; key = nextCycleKey(key)) {
      totals.set(key, totals.get(key) ?? 0)
    }
    const paidKeys = new Set(payments.filter((p) => p.accountId === card.id).map((p) => p.cycleKey))
    return [...totals.entries()].map(([cycleKey, total]) => {
      const vencimento = vencimentoFor(cycleKey, card.dueDay!)
      return {
        accountId: card.id, accountName: card.name, closingDay: card.closingDay!,
        cycleKey, isCurrent: cycleKey === currentCycleKey, total, vencimento,
        label: faturaLabel(vencimento),
        status: faturaStatus({ cycleKey, currentCycleKey, vencimento, today, paid: paidKeys.has(cycleKey) }),
      }
    })
  }).sort((a, b) => b.vencimento.localeCompare(a.vencimento))
}
