import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  date,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'

// Single-user constant reserved on every owned row for future multi-user.
export const USER_ID = 'default-user'

export const txTypeEnum = pgEnum('tx_type', ['earn', 'expend'])
export const intervalEnum = pgEnum('rec_interval', [
  'daily',
  'weekly',
  'monthly',
  'yearly',
])

export const category = pgTable('category', {
  id: uuid().primaryKey().defaultRandom(),
  userId: text('user_id').notNull().default(USER_ID),
  name: text().notNull(),
})

export const card = pgTable('card', {
  id: uuid().primaryKey().defaultRandom(),
  userId: text('user_id').notNull().default(USER_ID),
  name: text().notNull(),
  limit: integer(), // optional credit limit, integer cents
})

export const recurrenceRule = pgTable('recurrence_rule', {
  id: uuid().primaryKey().defaultRandom(),
  userId: text('user_id').notNull().default(USER_ID),
  amount: integer().notNull(), // integer cents
  type: txTypeEnum().notNull(),
  interval: intervalEnum().notNull(),
  nextRun: date('next_run').notNull(),
  categoryId: uuid('category_id').references(() => category.id, {
    onDelete: 'set null',
  }),
  note: text(),
})

export const installmentPlan = pgTable('installment_plan', {
  id: uuid().primaryKey().defaultRandom(),
  userId: text('user_id').notNull().default(USER_ID),
  cardId: uuid('card_id')
    .notNull()
    .references(() => card.id, { onDelete: 'cascade' }),
  totalAmount: integer('total_amount').notNull(), // integer cents
  count: integer().notNull(),
  startDate: date('start_date').notNull(),
  note: text(),
})

export const transaction = pgTable(
  'transaction',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text('user_id').notNull().default(USER_ID),
    type: txTypeEnum().notNull(),
    amount: integer().notNull(), // integer cents, always positive; sign derived from type
    date: date().notNull(),
    categoryId: uuid('category_id').references(() => category.id, {
      onDelete: 'set null',
    }),
    cardId: uuid('card_id').references(() => card.id, { onDelete: 'set null' }),
    installmentPlanId: uuid('installment_plan_id').references(
      () => installmentPlan.id,
      { onDelete: 'cascade' },
    ),
    recurrenceRuleId: uuid('recurrence_rule_id').references(
      () => recurrenceRule.id,
      { onDelete: 'cascade' },
    ),
    periodKey: text('period_key'), // set only for recurrence-materialized rows
    note: text(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [
    // Idempotency: cron cannot materialize the same period twice.
    // (NULLs are distinct in Postgres, so non-recurrence rows never collide.)
    unique('uq_recurrence_period').on(t.recurrenceRuleId, t.periodKey),
  ],
)

export type Transaction = typeof transaction.$inferSelect
export type Category = typeof category.$inferSelect
export type Card = typeof card.$inferSelect
export type InstallmentPlan = typeof installmentPlan.$inferSelect
export type RecurrenceRule = typeof recurrenceRule.$inferSelect
