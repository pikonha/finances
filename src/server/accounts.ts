import { createServerFn } from '@tanstack/react-start'
import { and, asc, eq } from 'drizzle-orm'
import { db } from '#/db/index'
import { account } from '#/db/schema'
import { assertMoney } from '#/lib/money'
import { accountInput, updateAccountInput, type AccountInput } from './schemas'
import { requireUser } from './session.core'

function accountValues(userId: string, data: AccountInput) {
  if (data.limit !== undefined) assertMoney(data.limit)
  const isCreditCard = data.kind === 'credit_card'
  const prepaid = isCreditCard && (data.prepaid ?? false)
  return {
    userId, name: data.name, kind: data.kind,
    limit: isCreditCard && !prepaid ? data.limit ?? null : null,
    closingDay: isCreditCard && !prepaid ? data.closingDay ?? null : null,
    dueDay: isCreditCard && !prepaid ? data.dueDay ?? null : null,
    prepaid,
  }
}

export const listAccounts = createServerFn({ method: 'GET' }).handler(async () => {
  const userId = await requireUser()
  return db.select().from(account).where(eq(account.userId, userId)).orderBy(asc(account.name))
})

export const createAccount = createServerFn({ method: 'POST' })
  .validator((data: unknown) => accountInput.parse(data))
  .handler(async ({ data }) => {
    const userId = await requireUser()
    const [row] = await db.insert(account).values(accountValues(userId, data)).returning({ id: account.id })
    return { id: row.id }
  })

export const updateAccount = createServerFn({ method: 'POST' })
  .validator((data: unknown) => updateAccountInput.parse(data))
  .handler(async ({ data }) => {
    const userId = await requireUser()
    const [row] = await db.update(account).set(accountValues(userId, data)).where(and(eq(account.id, data.id), eq(account.userId, userId))).returning({ id: account.id })
    if (!row) throw new Error('Account not found')
    return { id: row.id }
  })

export const deleteAccount = createServerFn({ method: 'POST' })
  .validator((data: unknown) => String((data as { id: string }).id))
  .handler(async ({ data: id }) => {
    const userId = await requireUser()
    await db.delete(account).where(and(eq(account.id, id), eq(account.userId, userId)))
    return { success: true }
  })
