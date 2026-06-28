import { createServerFn } from '@tanstack/react-start'
import { asc, eq } from 'drizzle-orm'
import { db } from '#/db/index'
import { installmentPlan, transaction, USER_ID } from '#/db/schema'
import { assertMoney } from '#/lib/money'
import { addMonths, splitInstallments } from '#/lib/installments'
import { installmentPlanInput } from './schemas'

export const listInstallmentPlans = createServerFn({ method: 'GET' }).handler(
  async () => {
    return db
      .select()
      .from(installmentPlan)
      .where(eq(installmentPlan.userId, USER_ID))
      .orderBy(asc(installmentPlan.startDate))
  },
)

/**
 * Creates the plan and materializes N real transaction rows up front on a
 * monthly schedule. Last row absorbs the rounding remainder so the generated
 * rows sum exactly to the total. Rows are delete-only afterward.
 */
export const createInstallmentPlan = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => installmentPlanInput.parse(data))
  .handler(async ({ data }) => {
    assertMoney(data.total_amount)
    const amounts = splitInstallments(data.total_amount, data.count)

    return db.transaction(async (tx) => {
      const [plan] = await tx
        .insert(installmentPlan)
        .values({
          userId: USER_ID,
          cardId: data.card_id,
          totalAmount: data.total_amount,
          count: data.count,
          startDate: data.start_date,
          note: data.note ?? null,
        })
        .returning({ id: installmentPlan.id })

      const rows = amounts.map((amount, i) => ({
        userId: USER_ID,
        type: 'expend' as const,
        amount,
        date: addMonths(data.start_date, i),
        categoryId: data.category_id ?? null,
        cardId: data.card_id,
        installmentPlanId: plan.id,
        note: data.note ?? null,
      }))
      await tx.insert(transaction).values(rows)

      const sum = amounts.reduce((a, b) => a + b, 0)
      if (sum !== data.total_amount) {
        throw new Error(`Installment split drift: ${sum} !== ${data.total_amount}`)
      }
      return { id: plan.id, rows: amounts.length }
    })
  })

export const deleteInstallmentPlan = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => String((data as { id: string }).id))
  .handler(async ({ data: id }) => {
    // FK onDelete: 'cascade' removes the generated transaction rows.
    await db.delete(installmentPlan).where(eq(installmentPlan.id, id))
    return { success: true }
  })
