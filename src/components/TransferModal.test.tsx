// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TransferModal } from './TransferModal'

afterEach(cleanup)

const accounts = [
  { id: '11111111-1111-4111-8111-111111111111', name: 'Checking' },
  { id: '22222222-2222-4222-8222-222222222222', name: 'Savings' },
]

describe('TransferModal', () => {
  it('opens on demand and submits integer cents', async () => {
    const onTransfer = vi.fn().mockResolvedValue(undefined)
    render(<TransferModal accounts={accounts} onTransfer={onTransfer} />)

    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Transfer' }))

    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('From'), { target: { value: accounts[0].id } })
    fireEvent.change(within(dialog).getByLabelText('To'), { target: { value: accounts[1].id } })
    fireEvent.change(within(dialog).getByLabelText('Amount ($)'), { target: { value: '12.34' } })
    fireEvent.change(within(dialog).getByLabelText('Date'), { target: { value: '2026-07-19' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Transfer' }))

    await waitFor(() => expect(onTransfer).toHaveBeenCalledWith({
      amount: 1234,
      date: '2026-07-19',
      account_id: accounts[0].id,
      counter_account_id: accounts[1].id,
    }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('closes without submitting', () => {
    const onTransfer = vi.fn()
    render(<TransferModal accounts={accounts} onTransfer={onTransfer} />)

    fireEvent.click(screen.getByRole('button', { name: 'Transfer' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(onTransfer).not.toHaveBeenCalled()
  })
})
