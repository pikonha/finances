import { db } from '#/db/index'
import { transaction, USER_ID } from '#/db/schema'
import { assertMoney } from '#/lib/money'
import type { TransactionInput } from './schemas'

/**
 * Single insert path shared by the hermes webhook (authed API route) and the
 * UI create form (server function). Validates money at the trust boundary.
 *
 * Lives in its own module (not transactions.ts) so it never enters the client
 * bundle — a plain db-importing export there would drag pg/Buffer into the
 * browser. Only server code (the API route + the server-fn handler) imports it.
 */
export async function createTransactionCore(input: TransactionInput) {
  assertMoney(input.amount)
  const [row] = await db
    .insert(transaction)
    .values({
      userId: USER_ID,
      type: input.type,
      amount: input.amount,
      date: input.date,
      categoryId: input.category_id ?? null,
      cardId: input.card_id ?? null,
      note: input.note ?? null,
    })
    .returning({ id: transaction.id })
  return { id: row.id }
}
