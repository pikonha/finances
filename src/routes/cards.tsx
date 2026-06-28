import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { listCards, createCard, deleteCard } from '#/server/cards'

export const Route = createFileRoute('/cards')({ component: Cards })

function Cards() {
  const qc = useQueryClient()
  const { data: cards = [] } = useQuery({
    queryKey: ['cards'],
    queryFn: () => listCards(),
  })

  const [name, setName] = useState('')
  const [limitDollars, setLimitDollars] = useState('')

  const createMutation = useMutation({
    mutationFn: (data: { name: string; limit?: number }) => createCard({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cards'] })
      setName('')
      setLimitDollars('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCard({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cards'] }),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const data: { name: string; limit?: number } = { name: name.trim() }
    if (limitDollars) {
      const dollars = parseFloat(limitDollars)
      if (!isNaN(dollars) && dollars > 0) {
        data.limit = Math.round(dollars * 100)
      }
    }
    createMutation.mutate(data)
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="demo-panel mb-6">
        <h1 className="demo-title mb-6">Cards</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="demo-section-title mb-2 block">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="demo-input"
                required
              />
            </div>
            <div>
              <label className="demo-section-title mb-2 block">Limit ($, optional)</label>
              <input
                type="number"
                step="0.01"
                value={limitDollars}
                onChange={(e) => setLimitDollars(e.target.value)}
                className="demo-input"
              />
            </div>
          </div>
          <button type="submit" className="demo-button" disabled={createMutation.isPending}>
            Add Card
          </button>
        </form>
      </section>

      <section className="demo-panel">
        <h2 className="demo-section-title mb-4">All Cards</h2>
        {cards.length === 0 ? (
          <p className="demo-muted">No cards yet.</p>
        ) : (
          <div className="space-y-2">
            {cards.map((card) => (
              <div key={card.id} className="demo-list-item flex items-center justify-between">
                <div>
                  <p className="font-semibold">{card.name}</p>
                  {card.limit && (
                    <p className="demo-muted text-sm">
                      Limit: {(card.limit / 100).toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      })}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => deleteMutation.mutate(card.id)}
                  className="demo-button-danger text-sm"
                  disabled={deleteMutation.isPending}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
