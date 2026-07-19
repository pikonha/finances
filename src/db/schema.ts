import { boolean, date, integer, pgEnum, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { authUser } from './auth-schema'

export const txTypeEnum = pgEnum('tx_type', ['earn', 'expend', 'transfer'])
export const intervalEnum = pgEnum('rec_interval', ['daily', 'weekly', 'monthly', 'yearly'])
export const accountKindEnum = pgEnum('account_kind', ['credit_card', 'bank_account'])

const owner = () => text('user_id').notNull().references(() => authUser.id, { onDelete: 'cascade' })

export const category = pgTable('category', {
  id: uuid().primaryKey().defaultRandom(), userId: owner(), name: text().notNull(),
})

export const account = pgTable('account', {
  id: uuid().primaryKey().defaultRandom(), userId: owner(), name: text().notNull(),
  kind: accountKindEnum().notNull(), limit: integer(),
  closingDay: integer('closing_day'), dueDay: integer('due_day'), prepaid: boolean().notNull().default(false),
})

export const faturaPayment = pgTable('fatura_payment', {
  id: uuid().primaryKey().defaultRandom(), userId: owner(),
  accountId: uuid('account_id').notNull().references(() => account.id, { onDelete: 'cascade' }),
  cycleKey: text('cycle_key').notNull(), paidAt: date('paid_at').notNull(),
}, (t) => [unique('uq_fatura_payment').on(t.accountId, t.cycleKey)])

export const recurrenceRule = pgTable('recurrence_rule', {
  id: uuid().primaryKey().defaultRandom(), userId: owner(), amount: integer().notNull(),
  type: txTypeEnum().notNull(), interval: intervalEnum().notNull(), nextRun: date('next_run').notNull(),
  categoryId: uuid('category_id').references(() => category.id, { onDelete: 'set null' }), note: text(),
})

export const installmentPlan = pgTable('installment_plan', {
  id: uuid().primaryKey().defaultRandom(), userId: owner(),
  accountId: uuid('account_id').notNull().references(() => account.id, { onDelete: 'cascade' }),
  totalAmount: integer('total_amount').notNull(), count: integer().notNull(),
  startDate: date('start_date').notNull(), note: text(),
})

export const transaction = pgTable('transaction', {
  id: uuid().primaryKey().defaultRandom(), userId: owner(), type: txTypeEnum().notNull(),
  amount: integer().notNull(), date: date().notNull(),
  categoryId: uuid('category_id').references(() => category.id, { onDelete: 'set null' }),
  accountId: uuid('account_id').references(() => account.id, { onDelete: 'set null' }),
  counterAccountId: uuid('counter_account_id').references(() => account.id, { onDelete: 'set null' }),
  installmentPlanId: uuid('installment_plan_id').references(() => installmentPlan.id, { onDelete: 'cascade' }),
  recurrenceRuleId: uuid('recurrence_rule_id').references(() => recurrenceRule.id, { onDelete: 'cascade' }),
  periodKey: text('period_key'), note: text(), createdAt: timestamp('created_at').defaultNow(),
}, (t) => [unique('uq_recurrence_period').on(t.recurrenceRuleId, t.periodKey)])

export type Transaction = typeof transaction.$inferSelect
export type Category = typeof category.$inferSelect
export type Account = typeof account.$inferSelect
export type InstallmentPlan = typeof installmentPlan.$inferSelect
export type RecurrenceRule = typeof recurrenceRule.$inferSelect
export type FaturaPayment = typeof faturaPayment.$inferSelect
