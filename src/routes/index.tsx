import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { listTransactions } from '#/server/transactions'
import { balanceOf } from '#/lib/money'

export const Route = createFileRoute('/')({ component: Dashboard })

function Dashboard() {
  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => listTransactions(),
  })

  const balance = balanceOf(transactions)
  const recent = transactions.slice(0, 10)

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="demo-panel mb-6">
        <h1 className="demo-title mb-6">Dashboard</h1>
        <div className="mb-8">
          <p className="demo-muted mb-2 text-sm font-semibold uppercase tracking-wide">
            Total Balance
          </p>
          <p className="text-5xl font-bold">
            {(balance / 100).toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/transactions"
            className="demo-button no-underline"
          >
            View All Transactions
          </Link>
          <Link
            to="/cards"
            className="demo-button-secondary no-underline"
          >
            Manage Cards
          </Link>
          <Link
            to="/categories"
            className="demo-button-secondary no-underline"
          >
            Manage Categories
          </Link>
        </div>
      </section>

      <section className="demo-panel">
        <h2 className="demo-section-title mb-4">Recent Transactions</h2>
        {recent.length === 0 ? (
          <p className="demo-muted">No transactions yet.</p>
        ) : (
          <div className="space-y-2">
            {recent.map((tx) => (
              <div key={tx.id} className="demo-list-item flex items-center justify-between">
                <div>
                  <p className="font-semibold">
                    {tx.type === 'earn' ? '+' : '-'}
                    {(tx.amount / 100).toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    })}
                  </p>
                  {tx.note && <p className="demo-muted text-sm">{tx.note}</p>}
                </div>
                <p className="demo-muted text-sm">{tx.date}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
