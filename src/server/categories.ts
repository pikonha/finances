import { createServerFn } from '@tanstack/react-start'
import { and, asc, eq } from 'drizzle-orm'
import { db } from '#/db/index'
import { tag } from '#/db/schema'
import { tagColorForIndex } from '#/lib/tag-colors'
import { categoryInput } from './schemas'
import { requireUser } from './session.core'

const DEFAULTS = ['Groceries', 'Transport', 'Utilities', 'Entertainment', 'Salary']

export const listCategories = createServerFn({ method: 'GET' }).handler(async () => {
  const userId = await requireUser()
  const query = () => db.select().from(tag).where(eq(tag.userId, userId)).orderBy(asc(tag.name))
  const rows = await query()
  if (rows.length) return rows
  await db.insert(tag).values(DEFAULTS.map((name, index) => ({ userId, name, color: tagColorForIndex(index) })))
  return query()
})
export const listTags = listCategories

export const createCategory = createServerFn({ method: 'POST' })
  .validator((data: unknown) => categoryInput.parse(data))
  .handler(async ({ data }) => {
    const userId = await requireUser()
    const [row] = await db.insert(tag).values({ userId, name: data.name, color: data.color }).returning({ id: tag.id })
    return { id: row.id }
  })
export const createTag = createCategory

export const deleteCategory = createServerFn({ method: 'POST' })
  .validator((data: unknown) => String((data as { id: string }).id))
  .handler(async ({ data: id }) => {
    const userId = await requireUser()
    await db.delete(tag).where(and(eq(tag.id, id), eq(tag.userId, userId)))
    return { success: true }
  })
export const deleteTag = deleteCategory
