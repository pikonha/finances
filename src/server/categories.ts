import { createServerFn } from '@tanstack/react-start'
import { asc, eq } from 'drizzle-orm'
import { db } from '#/db/index'
import { category, USER_ID } from '#/db/schema'
import { categoryInput } from './schemas'

const DEFAULTS = ['Groceries', 'Transport', 'Utilities', 'Entertainment', 'Salary']

export const listCategories = createServerFn({ method: 'GET' }).handler(
  async () => {
    const rows = await db
      .select()
      .from(category)
      .where(eq(category.userId, USER_ID))
      .orderBy(asc(category.name))
    if (rows.length === 0) {
      await db
        .insert(category)
        .values(DEFAULTS.map((name) => ({ userId: USER_ID, name })))
      return db
        .select()
        .from(category)
        .where(eq(category.userId, USER_ID))
        .orderBy(asc(category.name))
    }
    return rows
  },
)

export const createCategory = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => categoryInput.parse(data))
  .handler(async ({ data }) => {
    const [row] = await db
      .insert(category)
      .values({ userId: USER_ID, name: data.name })
      .returning({ id: category.id })
    return { id: row.id }
  })

export const deleteCategory = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => String((data as { id: string }).id))
  .handler(async ({ data: id }) => {
    await db.delete(category).where(eq(category.id, id))
    return { success: true }
  })
