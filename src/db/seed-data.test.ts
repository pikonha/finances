import { describe, expect, it } from 'vitest'

import { assertLocalDatabaseUrl, buildSeedData, SEED_USER_ID } from './seed-data'

describe('local seed data', () => {
  it('builds deterministic, referentially valid finance data', () => {
    const data = buildSeedData('2026-07-20')
    const categoryIds = new Set(data.categories.map(({ id }) => id))
    const accountIds = new Set(data.accounts.map(({ id }) => id))
    const ruleIds = new Set(data.recurrenceRules.map(({ id }) => id))
    const planIds = new Set(data.installmentPlans.map(({ id }) => id))
    const allIds = [
      ...categoryIds, ...accountIds, ...ruleIds, ...planIds,
      ...data.transactions.map(({ id }) => id), ...data.faturaPayments.map(({ id }) => id),
    ]

    expect(new Set(allIds)).toHaveLength(allIds.length)
    expect(data.accounts).toHaveLength(5)
    expect(data.categories).toHaveLength(10)
    expect(data.transactions.length).toBeGreaterThan(60)
    expect(data.faturaPayments.length).toBeGreaterThan(0)
    expect(data.transactions.some(({ date }) => date > '2026-07-20')).toBe(true)
    expect(data.transactions.every(({ amount }) => Number.isSafeInteger(amount) && amount > 0)).toBe(true)

    for (const row of [...data.categories, ...data.accounts, ...data.recurrenceRules, ...data.installmentPlans, ...data.transactions, ...data.faturaPayments]) {
      expect(row.userId).toBe(SEED_USER_ID)
    }
    for (const row of data.transactions) {
      if (row.categoryId) expect(categoryIds.has(row.categoryId)).toBe(true)
      if (row.accountId) expect(accountIds.has(row.accountId)).toBe(true)
      if (row.counterAccountId) expect(accountIds.has(row.counterAccountId)).toBe(true)
      if (row.recurrenceRuleId) expect(ruleIds.has(row.recurrenceRuleId)).toBe(true)
      if (row.installmentPlanId) expect(planIds.has(row.installmentPlanId)).toBe(true)
    }

    for (const plan of data.installmentPlans) {
      const rows = data.transactions.filter(({ installmentPlanId }) => installmentPlanId === plan.id)
      expect(rows).toHaveLength(plan.count)
      expect(rows.reduce((total, row) => total + row.amount, 0)).toBe(plan.totalAmount)
    }

    const recurrenceKeys = data.transactions
      .filter(({ recurrenceRuleId }) => recurrenceRuleId)
      .map(({ recurrenceRuleId, periodKey }) => `${recurrenceRuleId}:${periodKey}`)
    expect(new Set(recurrenceKeys)).toHaveLength(recurrenceKeys.length)
  })

  it('accepts Docker and loopback databases only', () => {
    expect(assertLocalDatabaseUrl('postgresql://postgres:postgres@db:5432/finances').hostname).toBe('db')
    expect(assertLocalDatabaseUrl('postgres://postgres:postgres@127.0.0.1:5432/finances').hostname).toBe('127.0.0.1')
    expect(() => assertLocalDatabaseUrl('postgresql://user:secret@production.example.com/finances')).toThrow(
      'Refusing to seed non-local database host',
    )
    expect(() => assertLocalDatabaseUrl(undefined)).toThrow('DATABASE_URL is required')
  })
})
