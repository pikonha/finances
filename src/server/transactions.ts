import { createServerFn } from '@tanstack/react-start'
import { and, asc, desc, eq } from 'drizzle-orm'
import { db } from '#/db/index'
import { installmentPlan, recurrenceRule, transaction } from '#/db/schema'
import { createTransactionInput, transferInput } from './schemas'
import { createInstallmentPlanCore, createRecurrenceRuleCore, createTransactionCore, createTransferCore } from './transactions.core'
import { requireUser } from './session.core'

const idInput = (data: unknown) => String((data as { id: string }).id)

export const listTransactions = createServerFn({ method: 'GET' }).handler(async () => {
  const userId = await requireUser()
  return db.select().from(transaction).where(eq(transaction.userId, userId)).orderBy(desc(transaction.date), desc(transaction.createdAt))
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
  return db.select().from(recurrenceRule).where(eq(recurrenceRule.userId, userId)).orderBy(asc(recurrenceRule.nextRun))
})
export const deleteRecurrenceRule = createServerFn({ method: 'POST' }).validator(idInput).handler(async ({ data: id }) => {
  const userId = await requireUser()
  await db.delete(recurrenceRule).where(and(eq(recurrenceRule.id, id), eq(recurrenceRule.userId, userId)))
  return { success: true }
})
