import { describe, expect, it } from 'vitest'
import { availableLimit, cycleKeyFor, faturaLabel, faturaStatus, vencimentoFor } from './faturas'

describe('cycleKeyFor', () => {
  it('on-the-day expense belongs to the next cycle', () => expect(cycleKeyFor('2026-07-10', 10)).toBe('2026-07-10'))
  it('day before closing belongs to the current cycle', () => expect(cycleKeyFor('2026-07-09', 10)).toBe('2026-06-10'))
})

describe('vencimentoFor / faturaLabel', () => {
  it('vencimento is dueDay in the month after closing', () => expect(vencimentoFor('2026-07-10', 20)).toBe('2026-08-20'))
  it('label uses the vencimento month', () => expect(faturaLabel('2026-08-20')).toBe('Agosto'))
})

describe('faturaStatus', () => {
  it('current cycle is open', () => expect(faturaStatus({ cycleKey: '2026-07-10', currentCycleKey: '2026-07-10', vencimento: '2026-08-20', today: '2026-07-19', paid: false })).toBe('open'))
  it('closed cycle past due is overdue', () => expect(faturaStatus({ cycleKey: '2026-06-10', currentCycleKey: '2026-07-10', vencimento: '2026-07-20', today: '2026-07-25', paid: false })).toBe('overdue'))
  it('paid marker wins', () => expect(faturaStatus({ cycleKey: '2026-06-10', currentCycleKey: '2026-07-10', vencimento: '2026-07-20', today: '2026-07-25', paid: true })).toBe('paid'))
})

describe('availableLimit', () => {
  it('excludes paid faturas, includes open/closed/overdue', () => {
    const faturas = [
      { total: 1000, status: 'open' as const },
      { total: 2000, status: 'closed' as const },
      { total: 500, status: 'paid' as const },
    ]
    expect(availableLimit(10000, faturas)).toBe(7000)
  })
})
