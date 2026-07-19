import { and, eq } from 'drizzle-orm'
import { db } from '#/db/index'
import { account, installmentPlan, recurrenceRule, transaction } from '#/db/schema'
import { addMonths, splitInstallments } from '#/lib/installments'
import { assertMoney } from '#/lib/money'
import type { TransactionInput, TransferInput } from './schemas'

export async function createTransactionCore(userId: string, input: TransactionInput) {
  assertMoney(input.amount)
  const [row] = await db.insert(transaction).values({
    userId, type: input.type, amount: input.amount, date: input.date,
    categoryId: input.category_id ?? null, accountId: input.account_id ?? null, note: input.note ?? null,
  }).returning({ id: transaction.id })
  return { id: row.id }
}

export async function createTransferCore(userId: string, input: TransferInput) {
  assertMoney(input.amount)
  const [row] = await db.insert(transaction).values({
    userId, type: 'transfer', amount: input.amount, date: input.date,
    accountId: input.account_id, counterAccountId: input.counter_account_id, note: input.note ?? null,
  }).returning({ id: transaction.id })
  return { id: row.id }
}

export async function createInstallmentPlanCore(userId: string, input: TransactionInput & { installments: { count: number } }) {
  assertMoney(input.amount)
  if (input.type !== 'expend' || !input.account_id) throw new Error('Installments require an expense and credit-card account')
  const [ownedAccount] = await db.select({ kind: account.kind }).from(account).where(
    and(eq(account.id, input.account_id), eq(account.userId, userId)),
  )
  if (ownedAccount?.kind !== 'credit_card') throw new Error('Installments require an owned credit-card account')
  const amounts = splitInstallments(input.amount, input.installments.count)
  return db.transaction(async (tx) => {
    const [plan] = await tx.insert(installmentPlan).values({
      userId, accountId: input.account_id!, totalAmount: input.amount,
      count: input.installments.count, startDate: input.date, note: input.note ?? null,
    }).returning({ id: installmentPlan.id })
    await tx.insert(transaction).values(amounts.map((amount, index) => ({
      userId, type: 'expend' as const, amount, date: addMonths(input.date, index),
      categoryId: input.category_id ?? null, accountId: input.account_id!,
      installmentPlanId: plan.id, note: input.note ?? null,
    })))
    if (amounts.reduce((sum, value) => sum + value, 0) !== input.amount) throw new Error('Installment split drift')
    return { id: plan.id, rows: amounts.length }
  })
}

export async function createRecurrenceRuleCore(userId: string, input: TransactionInput & { recurrence: { interval: 'daily' | 'weekly' | 'monthly' | 'yearly' } }) {
  assertMoney(input.amount)
  const [row] = await db.insert(recurrenceRule).values({
    userId, type: input.type, amount: input.amount, interval: input.recurrence.interval,
    nextRun: input.date, categoryId: input.category_id ?? null, note: input.note ?? null,
  }).returning({ id: recurrenceRule.id })
  return { id: row.id }
}
