import { createServerFn } from '@tanstack/react-start'
import { asc, eq } from 'drizzle-orm'
import { db } from '#/db/index'
import { recurrenceRule, USER_ID } from '#/db/schema'
import { assertMoney } from '#/lib/money'
import { recurrenceRuleInput } from './schemas'

export const listRecurrenceRules = createServerFn({ method: 'GET' }).handler(
  async () => {
    return db
      .select()
      .from(recurrenceRule)
      .where(eq(recurrenceRule.userId, USER_ID))
      .orderBy(asc(recurrenceRule.nextRun))
  },
)

export const createRecurrenceRule = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => recurrenceRuleInput.parse(data))
  .handler(async ({ data }) => {
    assertMoney(data.amount)
    const [row] = await db
      .insert(recurrenceRule)
      .values({
        userId: USER_ID,
        type: data.type,
        amount: data.amount,
        interval: data.interval,
        nextRun: data.start_date,
        categoryId: data.category_id ?? null,
        note: data.note ?? null,
      })
      .returning({ id: recurrenceRule.id })
    return { id: row.id }
  })

export const deleteRecurrenceRule = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => String((data as { id: string }).id))
  .handler(async ({ data: id }) => {
    await db.delete(recurrenceRule).where(eq(recurrenceRule.id, id))
    return { success: true }
  })
