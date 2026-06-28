import { createServerFn } from '@tanstack/react-start'
import { asc, eq } from 'drizzle-orm'
import { db } from '#/db/index'
import { card, USER_ID } from '#/db/schema'
import { assertMoney } from '#/lib/money'
import { cardInput } from './schemas'

export const listCards = createServerFn({ method: 'GET' }).handler(async () => {
  return db
    .select()
    .from(card)
    .where(eq(card.userId, USER_ID))
    .orderBy(asc(card.name))
})

export const createCard = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => cardInput.parse(data))
  .handler(async ({ data }) => {
    if (data.limit !== undefined) assertMoney(data.limit)
    const [row] = await db
      .insert(card)
      .values({ userId: USER_ID, name: data.name, limit: data.limit ?? null })
      .returning({ id: card.id })
    return { id: row.id }
  })

export const deleteCard = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => String((data as { id: string }).id))
  .handler(async ({ data: id }) => {
    await db.delete(card).where(eq(card.id, id))
    return { success: true }
  })
