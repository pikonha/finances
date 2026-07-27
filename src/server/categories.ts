import { createServerFn } from '@tanstack/react-start'
import { and, asc, eq } from 'drizzle-orm'
import { db } from '#/db/index'
import { category } from '#/db/schema'
import { categoryInput } from './schemas'
import { requireUser } from './session.core'

const DEFAULTS = ['Groceries', 'Transport', 'Utilities', 'Entertainment', 'Salary']

export const listCategories = createServerFn({ method: 'GET' }).handler(async () => {
  const userId = await requireUser()
  const query = () => db.select().from(category).where(eq(category.userId, userId)).orderBy(asc(category.name))
  const rows = await query()
  if (rows.length) return rows
  await db.insert(category).values(DEFAULTS.map((name) => ({ userId, name })))
  return query()
})

export const createCategory = createServerFn({ method: 'POST' })
  .validator((data: unknown) => categoryInput.parse(data))
  .handler(async ({ data }) => {
    const userId = await requireUser()
    const [row] = await db.insert(category).values({ userId, name: data.name }).returning({ id: category.id })
    return { id: row.id }
  })

export const deleteCategory = createServerFn({ method: 'POST' })
  .validator((data: unknown) => String((data as { id: string }).id))
  .handler(async ({ data: id }) => {
    const userId = await requireUser()
    await db.delete(category).where(and(eq(category.id, id), eq(category.userId, userId)))
    return { success: true }
  })
