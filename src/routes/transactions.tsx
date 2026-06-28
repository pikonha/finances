import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import {
  listTransactions,
  createTransaction,
  deleteTransaction,
} from '#/server/transactions'
import { listCategories } from '#/server/categories'
import { listCards } from '#/server/cards'
import type { Transaction } from '#/db/schema'

export const Route = createFileRoute('/transactions')({ component: Transactions })

const columnHelper = createColumnHelper<Transaction>()

function Transactions() {
  const qc = useQueryClient()
  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => listTransactions(),
  })
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => listCategories(),
  })
  const { data: cards = [] } = useQuery({
    queryKey: ['cards'],
    queryFn: () => listCards(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTransaction({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  })

  const [type, setType] = useState<'earn' | 'expend'>('expend')
  const [amountDollars, setAmountDollars] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [categoryId, setCategoryId] = useState('')
  const [cardId, setCardId] = useState('')
  const [note, setNote] = useState('')

  const createMutation = useMutation({
    mutationFn: (data: {
      type: 'earn' | 'expend'
      amount: number
      date: string
      category_id?: string
      card_id?: string
      note?: string
    }) => createTransaction({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      setAmountDollars('')
      setNote('')
      setCategoryId('')
      setCardId('')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const dollars = parseFloat(amountDollars)
    if (isNaN(dollars) || dollars <= 0) return
    createMutation.mutate({
      type,
      amount: Math.round(dollars * 100),
      date,
      category_id: categoryId || undefined,
      card_id: cardId || undefined,
      note: note || undefined,
    })
  }

  const columns = [
    columnHelper.accessor('date', {
      header: 'Date',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('type', {
      header: 'Type',
      cell: (info) => (
        <span className={info.getValue() === 'earn' ? 'text-green-700' : 'text-red-700'}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('amount', {
      header: 'Amount',
      cell: (info) => {
        const row = info.row.original
        const signed = row.type === 'earn' ? info.getValue() : -info.getValue()
        return (signed / 100).toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
        })
      },
    }),
    columnHelper.accessor('note', {
      header: 'Note',
      cell: (info) => info.getValue() || '—',
    }),
    columnHelper.display({
      id: 'tags',
      header: 'Tags',
      cell: (info) => {
        const row = info.row.original
        return (
          <div className="flex gap-1">
            {row.installmentPlanId && (
              <span className="demo-pill">installment</span>
            )}
            {row.recurrenceRuleId && (
              <span className="demo-pill">recurring</span>
            )}
          </div>
        )
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => (
        <button
          onClick={() => deleteMutation.mutate(info.row.original.id)}
          className="demo-button-danger text-xs"
          disabled={deleteMutation.isPending}
        >
          Delete
        </button>
      ),
    }),
  ]

  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="demo-panel mb-6">
        <h1 className="demo-title mb-6">Transactions</h1>
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
              <label className="demo-section-title mb-2 block">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
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
              <label className="demo-section-title mb-2 block">Card (optional)</label>
              <select
                value={cardId}
                onChange={(e) => setCardId(e.target.value)}
                className="demo-select"
              >
                <option value="">None</option>
                {cards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name}
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
            Add Transaction
          </button>
        </form>
      </section>

      <section className="demo-panel">
        <h2 className="demo-section-title mb-4">All Transactions</h2>
        <div className="demo-table-shell">
          <table className="demo-table">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
