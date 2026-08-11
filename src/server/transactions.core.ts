import { and, eq, inArray } from 'drizzle-orm'
import { db } from '#/db/index'
import { account, installmentPlan, recurrenceRule, recurrenceRuleTag, tag, transaction, transactionTag } from '#/db/schema'
import { addMonths, splitInstallments } from '#/lib/installments'
import { assertMoney, paidByDate } from '#/lib/money'
import { transferNote } from '#/lib/transaction-labels'
import { inputTagIds, type TransactionInput, type TransferInput } from './schemas'

async function assertOwnedTags(userId: string, tagIds: string[]) {
  if (!tagIds.length) return
  const rows = await db.select({ id: tag.id }).from(tag).where(and(eq(tag.userId, userId), inArray(tag.id, tagIds)))
  if (rows.length !== tagIds.length) throw new Error('One or more tags do not exist')
}

export async function assertOwnedAccounts(userId: string, ids: (string | null | undefined)[]) {
  const list = [...new Set(ids.filter((id): id is string => !!id))]
  if (!list.length) return
  const rows = await db.select({ id: account.id }).from(account).where(
    and(eq(account.userId, userId), inArray(account.id, list)),
  )
  if (rows.length !== list.length) throw new Error('One or more accounts do not exist')
}

const transactionTagRows = (transactionId: string, tagIds: string[]) => tagIds.map((tagId) => ({ transactionId, tagId }))
const recurrenceTagRows = (recurrenceRuleId: string, tagIds: string[]) => tagIds.map((tagId) => ({ recurrenceRuleId, tagId }))

export async function createTransactionCore(userId: string, input: TransactionInput) {
  assertMoney(input.amount)
  const tagIds = inputTagIds(input)
  await assertOwnedTags(userId, tagIds)
  await assertOwnedAccounts(userId, [input.account_id])
  const todayISO = new Date().toISOString().slice(0, 10)
  return db.transaction(async (tx) => {
    const [row] = await tx.insert(transaction).values({
      userId, type: input.type, amount: input.amount, date: input.date,
      accountId: input.account_id ?? null, note: input.note ?? null,
      paid: input.paid ?? paidByDate(input.date, todayISO),
    }).returning({ id: transaction.id })
    if (tagIds.length) await tx.insert(transactionTag).values(transactionTagRows(row.id, tagIds))
    return { id: row.id }
  })
}

export async function createTransferCore(userId: string, input: TransferInput) {
  assertMoney(input.amount)
  await assertOwnedAccounts(userId, [input.account_id, input.counter_account_id])
  const [row] = await db.insert(transaction).values({
    userId, type: 'transfer', amount: input.amount, date: input.date,
    accountId: input.account_id, counterAccountId: input.counter_account_id, note: transferNote(input.note),
  }).returning({ id: transaction.id })
  return { id: row.id }
}

export async function createInstallmentPlanCore(userId: string, input: TransactionInput & { installments: { count: number } }) {
  assertMoney(input.amount)
  const tagIds = inputTagIds(input)
  await assertOwnedTags(userId, tagIds)
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
    const rows = await tx.insert(transaction).values(amounts.map((amount, index) => ({
      userId, type: 'expend' as const, amount, date: addMonths(input.date, index),
      accountId: input.account_id!,
      installmentPlanId: plan.id, note: input.note ?? null,
    }))).returning({ id: transaction.id })
    if (tagIds.length) await tx.insert(transactionTag).values(rows.flatMap((row) => transactionTagRows(row.id, tagIds)))
    if (amounts.reduce((sum, value) => sum + value, 0) !== input.amount) throw new Error('Installment split drift')
    return { id: plan.id, rows: amounts.length }
  })
}

export async function createRecurrenceRuleCore(userId: string, input: TransactionInput & { recurrence: { interval: 'daily' | 'weekly' | 'monthly' | 'yearly' } }) {
  assertMoney(input.amount)
  const tagIds = inputTagIds(input)
  await assertOwnedTags(userId, tagIds)
  return db.transaction(async (tx) => {
    const [row] = await tx.insert(recurrenceRule).values({
      userId, type: input.type, amount: input.amount, interval: input.recurrence.interval,
      nextRun: input.date, note: input.note ?? null,
    }).returning({ id: recurrenceRule.id })
    if (tagIds.length) await tx.insert(recurrenceRuleTag).values(recurrenceTagRows(row.id, tagIds))
    return { id: row.id }
  })
}
