// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CategorySelect } from './CategorySelect'

afterEach(cleanup)

describe('CategorySelect', () => {
  it('creates and selects a category from the dropdown', async () => {
    const onChange = vi.fn()
    const onCreate = vi.fn().mockResolvedValue('new-id')
    render(<CategorySelect categories={[{ id: 'existing-id', name: 'Groceries' }]} value='' onChange={onChange} onCreate={onCreate} />)

    fireEvent.change(screen.getByLabelText('Category'), { target: { value: '__create_category__' } })
    fireEvent.change(screen.getByLabelText('New category name'), { target: { value: '  Travel  ' } })
    fireEvent.click(screen.getByLabelText('Create category'))

    await waitFor(() => expect(onCreate).toHaveBeenCalledWith('Travel'))
    expect(onChange).toHaveBeenCalledWith('new-id')
    expect(screen.queryByLabelText('New category name')).toBeNull()
  })

  it('cancels category creation without changing the selection', () => {
    const onChange = vi.fn()
    render(<CategorySelect categories={[]} value='' onChange={onChange} onCreate={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Category'), { target: { value: '__create_category__' } })
    fireEvent.click(screen.getByLabelText('Cancel category creation'))

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.queryByLabelText('New category name')).toBeNull()
  })
})
