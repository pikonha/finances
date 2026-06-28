import { z } from 'zod'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')
const cents = z.number().int('amount must be integer cents')

/** Shared create contract — hermes webhook payload AND the UI create form. */
export const transactionInput = z.object({
  type: z.enum(['earn', 'expend']),
  amount: cents,
  date: isoDate,
  category_id: z.string().uuid().optional(),
  card_id: z.string().uuid().optional(),
  note: z.string().max(500).optional(),
})
export type TransactionInput = z.infer<typeof transactionInput>

export const categoryInput = z.object({ name: z.string().min(1).max(100) })

export const cardInput = z.object({
  name: z.string().min(1).max(100),
  limit: cents.nonnegative().optional(),
})

export const installmentPlanInput = z.object({
  card_id: z.string().uuid(),
  total_amount: cents.positive(),
  count: z.number().int().min(1).max(360),
  start_date: isoDate,
  category_id: z.string().uuid().optional(),
  note: z.string().max(500).optional(),
})

export const recurrenceRuleInput = z.object({
  type: z.enum(['earn', 'expend']),
  amount: cents.positive(),
  interval: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  start_date: isoDate,
  category_id: z.string().uuid().optional(),
  note: z.string().max(500).optional(),
})
