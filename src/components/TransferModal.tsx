import { useState } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import type { TransferInput } from '#/server/schemas'
import { Button } from './ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'

type AccountOption = {
  id: string
  name: string
}

type TransferModalProps = {
  accounts: AccountOption[]
  onTransfer: (data: TransferInput) => Promise<void>
}

export function TransferModal({ accounts, onTransfer }: TransferModalProps) {
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const reset = () => {
    setFrom('')
    setTo('')
    setAmount('')
    setDate(new Date().toISOString().slice(0, 10))
    setError('')
  }

  const changeOpen = (nextOpen: boolean) => {
    if (isSaving) return
    setOpen(nextOpen)
    if (!nextOpen) reset()
  }

  return <Dialog open={open} onOpenChange={changeOpen}>
    <DialogTrigger asChild>
      <Button type='button' variant='outline'><ArrowRightLeft className='size-4' />Transfer</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Transfer between accounts</DialogTitle>
        <DialogDescription>Move money without changing your total balance.</DialogDescription>
      </DialogHeader>
      <form className='space-y-4' onSubmit={async(event) => {
        event.preventDefault()
        const dollars = Number(amount)
        if (!dollars || dollars <= 0 || !from || !to) return

        setIsSaving(true)
        setError('')
        try {
          await onTransfer({ amount: Math.round(dollars * 100), date, account_id: from, counter_account_id: to })
          setOpen(false)
          reset()
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : 'Could not complete transfer')
        } finally {
          setIsSaving(false)
        }
      }}>
        <div className='grid gap-4 sm:grid-cols-2'>
          <Field label='From' htmlFor='transfer-from'>
            <select id='transfer-from' className='control' value={from} onChange={(event) => {
              setFrom(event.target.value)
              if (to === event.target.value) setTo('')
            }} required autoFocus>
              <option value=''>Select…</option>
              {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
            </select>
          </Field>
          <Field label='To' htmlFor='transfer-to'>
            <select id='transfer-to' className='control' value={to} onChange={(event) => setTo(event.target.value)} required>
              <option value=''>Select…</option>
              {accounts.map((account) => <option key={account.id} value={account.id} disabled={account.id === from}>{account.name}</option>)}
            </select>
          </Field>
          <Field label='Amount ($)' htmlFor='transfer-amount'>
            <Input id='transfer-amount' type='number' min='.01' step='.01' value={amount} onChange={(event) => setAmount(event.target.value)} required />
          </Field>
          <Field label='Date' htmlFor='transfer-date'>
            <Input id='transfer-date' type='date' value={date} onChange={(event) => setDate(event.target.value)} required />
          </Field>
        </div>
        {error && <p role='alert' className='text-sm text-destructive'>{error}</p>}
        <div className='flex justify-end gap-2'>
          <DialogClose asChild><Button type='button' variant='ghost' disabled={isSaving}>Cancel</Button></DialogClose>
          <Button disabled={isSaving}>{isSaving ? 'Transferring…' : 'Transfer'}</Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return <div className='space-y-2'><Label htmlFor={htmlFor}>{label}</Label>{children}</div>
}
