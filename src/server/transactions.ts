import { createServerFn } from '@tanstack/react-start'
import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm'
import { db } from '#/db/index'
import { installmentPlan, recurrenceRule, recurrenceRuleTag, tag, transaction, transactionTag, type RecurrenceRule, type Tag, type Transaction } from '#/db/schema'
import { assertMoney } from '#/lib/money'
import { createTransactionInput, inputTagIds, transferInput, updateTransactionInput } from './schemas'
import { createInstallmentPlanCore, createRecurrenceRuleCore, createTransactionCore, createTransferCore } from './transactions.core'
import { requireUser } from './session.core'

const idInput = (data: unknown) => String((data as { id: string }).id)
export type TransactionRow = Transaction & { tags: Tag[] }
export type RecurrenceRuleRow = RecurrenceRule & { tags: Tag[] }

async function assertOwnedTags(userId: string, tagIds: string[]) {
  if (!tagIds.length) return
  const rows = await db.select({ id: tag.id }).from(tag).where(and(eq(tag.userId, userId), inArray(tag.id, tagIds)))
  if (rows.length !== tagIds.length) throw new Error('One or more tags do not exist')
}

async function tagsByTransaction(ids: string[]) {
  const grouped = new Map<string, Tag[]>()
  if (!ids.length) return grouped
  const rows = await db.select({
    transactionId: transactionTag.transactionId,
    id: tag.id,
    userId: tag.userId,
    name: tag.name,
    color: tag.color,
  }).from(transactionTag).innerJoin(tag, eq(transactionTag.tagId, tag.id)).where(inArray(transactionTag.transactionId, ids))
  for (const row of rows) {
    const current = grouped.get(row.transactionId) ?? []
    current.push({ id: row.id, userId: row.userId, name: row.name, color: row.color })
    grouped.set(row.transactionId, current)
  }
  return grouped
}

async function tagsByRule(ids: string[]) {
  const grouped = new Map<string, Tag[]>()
  if (!ids.length) return grouped
  const rows = await db.select({
    recurrenceRuleId: recurrenceRuleTag.recurrenceRuleId,
    id: tag.id,
    userId: tag.userId,
    name: tag.name,
    color: tag.color,
  }).from(recurrenceRuleTag).innerJoin(tag, eq(recurrenceRuleTag.tagId, tag.id)).where(inArray(recurrenceRuleTag.recurrenceRuleId, ids))
  for (const row of rows) {
    const current = grouped.get(row.recurrenceRuleId) ?? []
    current.push({ id: row.id, userId: row.userId, name: row.name, color: row.color })
    grouped.set(row.recurrenceRuleId, current)
  }
  return grouped
}

export const listTransactions = createServerFn({ method: 'GET' }).handler(async () => {
  const userId = await requireUser()
  const rows = await db.select().from(transaction).where(eq(transaction.userId, userId)).orderBy(desc(transaction.date), desc(transaction.createdAt))
  const groupedTags = await tagsByTransaction(rows.map((row) => row.id))
  return rows.map((row) => ({ ...row, tags: groupedTags.get(row.id) ?? [] }))
})

export const createTransaction = createServerFn({ method: 'POST' })
  .validator((data: unknown) => createTransactionInput.parse(data))
  .handler(async ({ data }) => {
    const userId = await requireUser()
    if (data.installments) return createInstallmentPlanCore(userId, { ...data, installments: data.installments })
    if (data.recurrence) return createRecurrenceRuleCore(userId, { ...data, recurrence: data.recurrence })
    return createTransactionCore(userId, data)
  })

export const createTransfer = createServerFn({ method: 'POST' })
  .validator((data: unknown) => transferInput.parse(data))
  .handler(async ({ data }) => {
    const userId = await requireUser()
    return createTransferCore(userId, data)
  })

export const updateTransaction = createServerFn({ method: 'POST' })
  .validator((data: unknown) => updateTransactionInput.parse(data))
  .handler(async ({ data }) => {
    const userId = await requireUser()
    assertMoney(data.amount)
    const tagIds = inputTagIds(data)
    await assertOwnedTags(userId, tagIds)
    return db.transaction(async (tx) => {
      const [row] = await tx.update(transaction).set({
        type: data.type,
        amount: data.amount,
        date: data.date,
        accountId: data.account_id ?? null,
        note: data.note ?? null,
      }).where(and(
        eq(transaction.id, data.id),
        eq(transaction.userId, userId),
        isNull(transaction.installmentPlanId),
      )).returning({ id: transaction.id })
      if (!row) throw new Error('Transaction not found or cannot be edited')
      await tx.delete(transactionTag).where(eq(transactionTag.transactionId, row.id))
      if (tagIds.length) await tx.insert(transactionTag).values(tagIds.map((tagId) => ({ transactionId: row.id, tagId })))
      return { id: row.id }
    })
  })

export const deleteTransaction = createServerFn({ method: 'POST' }).validator(idInput).handler(async ({ data: id }) => {
  const userId = await requireUser()
  await db.delete(transaction).where(and(eq(transaction.id, id), eq(transaction.userId, userId)))
  return { success: true }
})

export const listInstallmentPlans = createServerFn({ method: 'GET' }).handler(async () => {
  const userId = await requireUser()
  return db.select().from(installmentPlan).where(eq(installmentPlan.userId, userId)).orderBy(asc(installmentPlan.startDate))
})
export const deleteInstallmentPlan = createServerFn({ method: 'POST' }).validator(idInput).handler(async ({ data: id }) => {
  const userId = await requireUser()
  await db.delete(installmentPlan).where(and(eq(installmentPlan.id, id), eq(installmentPlan.userId, userId)))
  return { success: true }
})

export const listRecurrenceRules = createServerFn({ method: 'GET' }).handler(async () => {
  const userId = await requireUser()
  const rows = await db.select().from(recurrenceRule).where(eq(recurrenceRule.userId, userId)).orderBy(asc(recurrenceRule.nextRun))
  const groupedTags = await tagsByRule(rows.map((row) => row.id))
  return rows.map((row) => ({ ...row, tags: groupedTags.get(row.id) ?? [] }))
})
export const deleteRecurrenceRule = createServerFn({ method: 'POST' }).validator(idInput).handler(async ({ data: id }) => {
  const userId = await requireUser()
  await db.delete(recurrenceRule).where(and(eq(recurrenceRule.id, id), eq(recurrenceRule.userId, userId)))
  return { success: true }
})
