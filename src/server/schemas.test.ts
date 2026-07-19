import { describe, expect, it } from 'vitest'
import { createTransactionInput } from './schemas'
const base={type:'expend' as const,amount:1200,date:'2026-07-11'}
describe('createTransactionInput',()=>{
  it('accepts plain transactions',()=>expect(createTransactionInput.safeParse(base).success).toBe(true))
  it('accepts installments',()=>expect(createTransactionInput.safeParse({...base,installments:{count:3}}).success).toBe(true))
  it('rejects recurrence with installments',()=>expect(createTransactionInput.safeParse({...base,installments:{count:3},recurrence:{interval:'monthly'}}).success).toBe(false))
  it('rejects one installment',()=>expect(createTransactionInput.safeParse({...base,installments:{count:1}}).success).toBe(false))
})
