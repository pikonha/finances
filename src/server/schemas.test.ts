import { describe, expect, it } from 'vitest'
import { accountInput, createTransactionInput, transferInput, updateAccountInput, updateTransactionInput } from './schemas'
const base={type:'expend' as const,amount:1200,date:'2026-07-11'}
describe('createTransactionInput',()=>{
  it('accepts plain transactions',()=>expect(createTransactionInput.safeParse(base).success).toBe(true))
  it('accepts installments',()=>expect(createTransactionInput.safeParse({...base,installments:{count:3}}).success).toBe(true))
  it('rejects recurrence with installments',()=>expect(createTransactionInput.safeParse({...base,installments:{count:3},recurrence:{interval:'monthly'}}).success).toBe(false))
  it('rejects one installment',()=>expect(createTransactionInput.safeParse({...base,installments:{count:1}}).success).toBe(false))
})
describe('transferInput',()=>{
  const transferBase={amount:1200,date:'2026-07-11',account_id:'11111111-1111-4111-8111-111111111111',counter_account_id:'22222222-2222-4222-8222-222222222222'}
  it('defaults the transfer name',()=>expect(transferInput.parse(transferBase).note).toBe('Transferência'))
  it('keeps custom transfer names',()=>expect(transferInput.parse({...transferBase,note:'Reserva'}).note).toBe('Reserva'))
})
describe('update schemas',()=>{
  const id='11111111-1111-4111-8111-111111111111'
  it('accepts transaction edits without recurrence/installments',()=>expect(updateTransactionInput.safeParse({...base,id}).success).toBe(true))
  it('rejects transaction edits without an id',()=>expect(updateTransactionInput.safeParse(base).success).toBe(false))
  it('normalizes account names on create and update',()=>{
    expect(accountInput.parse({name:' Checking ',kind:'bank_account'}).name).toBe('Checking')
    expect(updateAccountInput.parse({id,name:' Visa ',kind:'credit_card',limit:1000,closingDay:5,dueDay:10}).name).toBe('Visa')
  })
})
