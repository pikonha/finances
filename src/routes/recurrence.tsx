import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  listRecurrenceRules,
  createRecurrenceRule,
  deleteRecurrenceRule,
} from '#/server/recurrence'
import { listCategories } from '#/server/categories'

export const Route = createFileRoute('/recurrence')({ component: Recurrence })

function Recurrence() {
  const qc = useQueryClient()
  const { data: rules = [] } = useQuery({
    queryKey: ['recurrenceRules'],
    queryFn: () => listRecurrenceRules(),
  })
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => listCategories(),
  })

  const [type, setType] = useState<'earn' | 'expend'>('expend')
  const [amountDollars, setAmountDollars] = useState('')
  const [interval, setInterval] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [categoryId, setCategoryId] = useState('')
  const [note, setNote] = useState('')

  const createMutation = useMutation({
    mutationFn: (data: {
      type: 'earn' | 'expend'
      amount: number
      interval: 'daily' | 'weekly' | 'monthly' | 'yearly'
      start_date: string
      category_id?: string
      note?: string
    }) => createRecurrenceRule({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurrenceRules'] })
      setAmountDollars('')
      setCategoryId('')
      setNote('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRecurrenceRule({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurrenceRules'] }),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const dollars = parseFloat(amountDollars)
    if (isNaN(dollars) || dollars <= 0) return
    createMutation.mutate({
      type,
      amount: Math.round(dollars * 100),
      interval,
      start_date: startDate,
      category_id: categoryId || undefined,
      note: note || undefined,
    })
  }

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]))

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="demo-panel mb-6">
        <h1 className="demo-title mb-6">Recurrence Rules</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="demo-section-title mb-2 block">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'earn' | 'expend')}
                className="demo-select"
              >
                <option value="earn">Earn</option>
                <option value="expend">Expend</option>
              </select>
            </div>
            <div>
              <label className="demo-section-title mb-2 block">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                value={amountDollars}
                onChange={(e) => setAmountDollars(e.target.value)}
                className="demo-input"
                required
              />
            </div>
            <div>
              <label className="demo-section-title mb-2 block">Interval</label>
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly')}
                className="demo-select"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="demo-section-title mb-2 block">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="demo-input"
                required
              />
            </div>
            <div>
              <label className="demo-section-title mb-2 block">Category (optional)</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="demo-select"
              >
                <option value="">None</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="demo-section-title mb-2 block">Note (optional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="demo-input"
              />
            </div>
          </div>
          <button type="submit" className="demo-button" disabled={createMutation.isPending}>
            Create Recurrence Rule
          </button>
        </form>
      </section>

      <section className="demo-panel">
        <h2 className="demo-section-title mb-4">All Recurrence Rules</h2>
        {rules.length === 0 ? (
          <p className="demo-muted">No recurrence rules yet.</p>
        ) : (
          <div className="space-y-2">
            {rules.map((rule) => (
              <div key={rule.id} className="demo-list-item">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">
                      {rule.type === 'earn' ? '+' : '-'}
                      {(rule.amount / 100).toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      })}
                    </p>
                    <p className="demo-muted text-sm">
                      Interval: {rule.interval} | Next run: {rule.nextRun}
                    </p>
                    {rule.categoryId && (
                      <p className="demo-muted text-sm">
                        Category: {categoryMap.get(rule.categoryId) || 'Unknown'}
                      </p>
                    )}
                    {rule.note && <p className="demo-muted text-sm">{rule.note}</p>}
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(rule.id)}
                    className="demo-button-danger text-sm"
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
