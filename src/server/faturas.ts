import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import { db } from '#/db/index'
import { faturaPayment } from '#/db/schema'
import { faturaPaymentInput } from './schemas'
import { listFaturasCore } from './faturas.core'
import { assertOwnedAccounts } from './transactions.core'
import { requireUser } from './session.core'

export const listFaturas = createServerFn({ method: 'GET' }).handler(async () => {
  const userId = await requireUser()
  return listFaturasCore(userId, new Date().toISOString().slice(0, 10))
})

export const markFaturaPaid = createServerFn({ method: 'POST' })
  .validator((data: unknown) => faturaPaymentInput.parse(data))
  .handler(async ({ data }) => {
    const userId = await requireUser()
    await assertOwnedAccounts(userId, [data.account_id])
    await db.insert(faturaPayment).values({
      userId, accountId: data.account_id, cycleKey: data.cycle_key, paidAt: data.paid_at ?? new Date().toISOString().slice(0, 10),
    }).onConflictDoNothing()
    return { success: true }
  })

export const unmarkFaturaPaid = createServerFn({ method: 'POST' })
  .validator((data: unknown) => faturaPaymentInput.parse(data))
  .handler(async ({ data }) => {
    const userId = await requireUser()
    await db.delete(faturaPayment).where(and(
      eq(faturaPayment.userId, userId), eq(faturaPayment.accountId, data.account_id), eq(faturaPayment.cycleKey, data.cycle_key),
    ))
    return { success: true }
  })
