import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { listCategories, createCategory, deleteCategory } from '#/server/categories'

export const Route = createFileRoute('/categories')({ component: Categories })

function Categories() {
  const qc = useQueryClient()
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => listCategories(),
  })

  const [name, setName] = useState('')

  const createMutation = useMutation({
    mutationFn: (data: { name: string }) => createCategory({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      setName('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    createMutation.mutate({ name: name.trim() })
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="demo-panel mb-6">
        <h1 className="demo-title mb-6">Categories</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <button type="submit" className="demo-button" disabled={createMutation.isPending}>
            Add Category
          </button>
        </form>
      </section>

      <section className="demo-panel">
        <h2 className="demo-section-title mb-4">All Categories</h2>
        {categories.length === 0 ? (
          <p className="demo-muted">No categories yet.</p>
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => (
              <div key={cat.id} className="demo-list-item flex items-center justify-between">
                <p className="font-semibold">{cat.name}</p>
                <button
                  onClick={() => deleteMutation.mutate(cat.id)}
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
