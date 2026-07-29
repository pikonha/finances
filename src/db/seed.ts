import { config } from 'dotenv'
import { eq, or } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { hashPassword } from 'better-auth/crypto'
import { Pool } from 'pg'

import { authAccount, authUser } from './auth-schema'
import { account, category, faturaPayment, installmentPlan, recurrenceRule, recurrenceRuleTag, transaction, transactionTag } from './schema'
import { assertLocalDatabaseUrl, buildSeedData, SEED_EMAIL, SEED_PASSWORD, SEED_USER_ID } from './seed-data'

config({ path: ['.env.local', '.env'], quiet: true })

async function seed() {
  const databaseUrl = assertLocalDatabaseUrl(process.env.DATABASE_URL)
  const pool = new Pool({ connectionString: databaseUrl.toString() })
  const db = drizzle(pool)
  const data = buildSeedData()

  try {
    data.authAccount.password = await hashPassword(SEED_PASSWORD)

    await db.transaction(async (tx) => {
      await tx.delete(authUser).where(or(eq(authUser.id, SEED_USER_ID), eq(authUser.email, SEED_EMAIL)))
      await tx.insert(authUser).values(data.user)
      await tx.insert(authAccount).values(data.authAccount)
      await tx.insert(category).values(data.categories)
      await tx.insert(account).values(data.accounts)
      await tx.insert(recurrenceRule).values(data.recurrenceRules)
      await tx.insert(recurrenceRuleTag).values(data.recurrenceRuleTags)
      await tx.insert(installmentPlan).values(data.installmentPlans)
      await tx.insert(transaction).values(data.transactions)
      await tx.insert(transactionTag).values(data.transactionTags)
      await tx.insert(faturaPayment).values(data.faturaPayments)
    })

    console.log(`Seeded local database for ${SEED_EMAIL}`)
    console.log(`Login: ${SEED_EMAIL} / ${SEED_PASSWORD}`)
    console.log(
      `${data.accounts.length} accounts, ${data.categories.length} tags, ` +
      `${data.transactions.length} transactions, ${data.recurrenceRules.length} recurrence rules, ` +
      `${data.installmentPlans.length} installment plan`,
    )
  } finally {
    await pool.end()
  }
}

seed().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
