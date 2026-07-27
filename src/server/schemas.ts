import { z } from 'zod'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')
const cents = z.number().int('amount must be integer cents')

export const transactionInput = z.object({
  type: z.enum(['earn', 'expend']), amount: cents.positive(), date: isoDate,
  category_id: z.string().uuid().optional(), account_id: z.string().uuid().optional(),
  note: z.string().max(500).optional(),
})
export type TransactionInput = z.infer<typeof transactionInput>

export const createTransactionInput = transactionInput.extend({
  installments: z.object({ count: z.number().int().min(2).max(360) }).optional(),
  recurrence: z.object({ interval: z.enum(['daily', 'weekly', 'monthly', 'yearly']) }).optional(),
}).refine((data) => !(data.installments && data.recurrence), {
  message: 'Installments and recurrence are mutually exclusive',
})
export type CreateTransactionInput = z.infer<typeof createTransactionInput>

export const transferInput = z.object({
  amount: cents.positive(), date: isoDate,
  account_id: z.string().uuid(), counter_account_id: z.string().uuid(),
  note: z.string().max(500).optional(),
}).refine((data) => data.account_id !== data.counter_account_id, {
  message: 'Cannot transfer to the same account',
})
export type TransferInput = z.infer<typeof transferInput>

export const faturaPaymentInput = z.object({ account_id: z.string().uuid(), cycle_key: isoDate })

export const categoryInput = z.object({ name: z.string().trim().min(1).max(100) })
export const accountInput = z.object({
  name: z.string().trim().min(1).max(100),
  kind: z.enum(['credit_card', 'bank_account']), limit: cents.nonnegative().optional(),
  closingDay: z.number().int().min(1).max(28).optional(),
  dueDay: z.number().int().min(1).max(28).optional(),
  prepaid: z.boolean().optional(),
}).refine((data) => data.kind !== 'credit_card' || data.prepaid || (data.closingDay !== undefined && data.dueDay !== undefined), {
  message: 'closingDay and dueDay are required for limit-based credit cards',
})
