import { createServerFn } from '@tanstack/react-start'
import { and, asc, eq } from 'drizzle-orm'
import { db } from '#/db/index'
import { account } from '#/db/schema'
import { assertMoney } from '#/lib/money'
import { accountInput } from './schemas'
import { requireUser } from './session.core'

export const listAccounts = createServerFn({ method: 'GET' }).handler(async () => {
  const userId = await requireUser()
  return db.select().from(account).where(eq(account.userId, userId)).orderBy(asc(account.name))
})

export const createAccount = createServerFn({ method: 'POST' })
  .validator((data: unknown) => accountInput.parse(data))
  .handler(async ({ data }) => {
    const userId = await requireUser()
    if (data.limit !== undefined) assertMoney(data.limit)
    const isCreditCard = data.kind === 'credit_card'
    const prepaid = isCreditCard && (data.prepaid ?? false)
    const [row] = await db.insert(account).values({
      userId, name: data.name, kind: data.kind,
      limit: isCreditCard && !prepaid ? data.limit ?? null : null,
      closingDay: isCreditCard && !prepaid ? data.closingDay ?? null : null,
      dueDay: isCreditCard && !prepaid ? data.dueDay ?? null : null,
      prepaid,
    }).returning({ id: account.id })
    return { id: row.id }
  })

export const deleteAccount = createServerFn({ method: 'POST' })
  .validator((data: unknown) => String((data as { id: string }).id))
  .handler(async ({ data: id }) => {
    const userId = await requireUser()
    await db.delete(account).where(and(eq(account.id, id), eq(account.userId, userId)))
    return { success: true }
  })
