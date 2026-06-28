import { createServerFn } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'
import { db } from '#/db/index'
import { transaction, USER_ID } from '#/db/schema'
import { transactionInput } from './schemas'
import { createTransactionCore } from './transactions.core'

export const listTransactions = createServerFn({ method: 'GET' }).handler(
  async () => {
    return db
      .select()
      .from(transaction)
      .where(eq(transaction.userId, USER_ID))
      .orderBy(desc(transaction.date), desc(transaction.createdAt))
  },
)

export const createTransaction = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => transactionInput.parse(data))
  .handler(async ({ data }) => createTransactionCore(data))

export const deleteTransaction = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => String((data as { id: string }).id))
  .handler(async ({ data: id }) => {
    await db.delete(transaction).where(eq(transaction.id, id))
    return { success: true }
  })
