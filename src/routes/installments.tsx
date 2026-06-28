import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  listInstallmentPlans,
  createInstallmentPlan,
  deleteInstallmentPlan,
} from '#/server/installments'
import { listCards } from '#/server/cards'
import { listCategories } from '#/server/categories'

export const Route = createFileRoute('/installments')({ component: Installments })

function Installments() {
  const qc = useQueryClient()
  const { data: plans = [] } = useQuery({
    queryKey: ['installmentPlans'],
    queryFn: () => listInstallmentPlans(),
  })
  const { data: cards = [] } = useQuery({
    queryKey: ['cards'],
    queryFn: () => listCards(),
  })
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => listCategories(),
  })

  const [cardId, setCardId] = useState('')
  const [totalDollars, setTotalDollars] = useState('')
  const [count, setCount] = useState('')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [categoryId, setCategoryId] = useState('')
  const [note, setNote] = useState('')

  const createMutation = useMutation({
    mutationFn: (data: {
      card_id: string
      total_amount: number
      count: number
      start_date: string
      category_id?: string
      note?: string
    }) => createInstallmentPlan({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['installmentPlans'] })
      qc.invalidateQueries({ queryKey: ['transactions'] })
      setCardId('')
      setTotalDollars('')
      setCount('')
      setCategoryId('')
      setNote('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInstallmentPlan({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['installmentPlans'] })
      qc.invalidateQueries({ queryKey: ['transactions'] })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const dollars = parseFloat(totalDollars)
    const num = parseInt(count, 10)
    if (!cardId || isNaN(dollars) || dollars <= 0 || isNaN(num) || num <= 0) return
    createMutation.mutate({
      card_id: cardId,
      total_amount: Math.round(dollars * 100),
      count: num,
      start_date: startDate,
      category_id: categoryId || undefined,
      note: note || undefined,
    })
  }

  const cardMap = new Map(cards.map((c) => [c.id, c.name]))

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="demo-panel mb-6">
        <h1 className="demo-title mb-6">Installment Plans</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="demo-section-title mb-2 block">Card</label>
              <select
                value={cardId}
                onChange={(e) => setCardId(e.target.value)}
                className="demo-select"
                required
              >
                <option value="">Select a card</option>
                {cards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="demo-section-title mb-2 block">Total Amount ($)</label>
              <input
                type="number"
                step="0.01"
                value={totalDollars}
                onChange={(e) => setTotalDollars(e.target.value)}
                className="demo-input"
                required
              />
            </div>
            <div>
              <label className="demo-section-title mb-2 block">Number of Months</label>
              <input
                type="number"
                step="1"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="demo-input"
                required
              />
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
            Create Installment Plan
          </button>
        </form>
      </section>

      <section className="demo-panel">
        <h2 className="demo-section-title mb-4">All Installment Plans</h2>
        <p className="demo-muted mb-4 text-sm">
          Note: Deleting a plan removes all generated transaction rows.
        </p>
        {plans.length === 0 ? (
          <p className="demo-muted">No installment plans yet.</p>
        ) : (
          <div className="space-y-2">
            {plans.map((plan) => (
              <div key={plan.id} className="demo-list-item">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="font-semibold">
                      {cardMap.get(plan.cardId) || 'Unknown Card'}
                    </p>
                    <p className="demo-muted text-sm">
                      Total: {(plan.totalAmount / 100).toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      })} × {plan.count} months
                    </p>
                    <p className="demo-muted text-sm">Start: {plan.startDate}</p>
                    {plan.note && <p className="demo-muted text-sm">{plan.note}</p>}
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(plan.id)}
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
