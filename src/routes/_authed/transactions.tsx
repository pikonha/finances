import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Repeat, StickyNote } from 'lucide-react'
import { listAccounts } from '#/server/accounts'
import { createCategory, listCategories } from '#/server/categories'
import { createTransaction, createTransfer, deleteTransaction, listInstallmentPlans, listTransactions } from '#/server/transactions'
import type { CreateTransactionInput } from '#/server/schemas'
import { CategorySelect } from '@/components/CategorySelect'
import { TransferModal } from '@/components/TransferModal'
import { Badge } from '@/components/ui/badge'; import { Button } from '@/components/ui/button'; import { Card,CardContent,CardHeader,CardTitle } from '@/components/ui/card'; import { Input } from '@/components/ui/input'; import { Label } from '@/components/ui/label'; import { Table,TableBody,TableCell,TableHead,TableHeader,TableRow } from '@/components/ui/table'

export const Route=createFileRoute('/_authed/transactions')({component:Transactions})
type Repeat='daily'|'weekly'|'monthly'|'yearly'|'installments'
const money=(c:number)=>(c/100).toLocaleString('en-US',{style:'currency',currency:'USD'})
const monthLabel=(key:string)=>new Date(key+'-01T00:00:00Z').toLocaleDateString('en-US',{month:'long',year:'numeric',timeZone:'UTC'})

function Transactions(){
  const qc=useQueryClient(); const{data:transactions=[]}=useQuery({queryKey:['transactions'],queryFn:()=>listTransactions()}); const{data:categories=[]}=useQuery({queryKey:['categories'],queryFn:()=>listCategories()}); const{data:accounts=[]}=useQuery({queryKey:['accounts'],queryFn:()=>listAccounts()}); const{data:plans=[]}=useQuery({queryKey:['installmentPlans'],queryFn:()=>listInstallmentPlans()})
  const[type,setType]=useState<'earn'|'expend'>('expend'),[amount,setAmount]=useState(''),[date,setDate]=useState(()=>new Date().toISOString().slice(0,10)),[categoryId,setCategoryId]=useState(''),[accountId,setAccountId]=useState(''),[note,setNote]=useState(''),[showRepeat,setShowRepeat]=useState(false),[showNote,setShowNote]=useState(false),[repeat,setRepeat]=useState<Repeat>('monthly'),[count,setCount]=useState('2')
  const selected=accounts.find(a=>a.id===accountId); const canInstall=type==='expend'&&selected?.kind==='credit_card'
  useEffect(()=>{if(repeat==='installments'&&!canInstall)setRepeat('monthly')},[repeat,canInstall])
  const refresh=()=>{qc.invalidateQueries({queryKey:['transactions']});qc.invalidateQueries({queryKey:['installmentPlans']})}
  const create=useMutation({mutationFn:(data:CreateTransactionInput)=>createTransaction({data}),onSuccess:()=>{refresh();setAmount('');setNote('');setShowNote(false);setShowRepeat(false);setRepeat('monthly')}})
  const createCategoryMutation=useMutation({mutationFn:(name:string)=>createCategory({data:{name}}),onSuccess:()=>qc.invalidateQueries({queryKey:['categories']})})
  const removeTx=useMutation({mutationFn:(id:string)=>deleteTransaction({data:{id}}),onSuccess:refresh})

  // Group by month (newest first); the arrows page through months that have transactions.
  const months=useMemo(()=>[...new Set(transactions.map(t=>t.date.slice(0,7)))].sort().reverse(),[transactions])
  const[monthIdx,setMonthIdx]=useState(0); useEffect(()=>{if(monthIdx>months.length-1)setMonthIdx(Math.max(0,months.length-1))},[months.length,monthIdx])
  const activeMonth=months[monthIdx]; const monthTx=transactions.filter(t=>t.date.slice(0,7)===activeMonth)
  // installment payment position: x/y where y=plan.count, x=1-based order within the plan.
  const planCount=useMemo(()=>new Map(plans.map(p=>[p.id,p.count])),[plans])
  const installIndex=useMemo(()=>{const groups=new Map<string,typeof transactions>();for(const tx of transactions)if(tx.installmentPlanId){const g=groups.get(tx.installmentPlanId)??[];g.push(tx);groups.set(tx.installmentPlanId,g)}const idx=new Map<string,number>();for(const g of groups.values()){g.sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);g.forEach((t,i)=>idx.set(t.id,i+1))}return idx},[transactions])

  return <main className='page-wrap rise-in py-10'><div className='mb-6 flex items-center justify-between gap-4'><h1 className='display-title text-4xl font-bold'>Transactions</h1><TransferModal accounts={accounts} onTransfer={async(data)=>{await createTransfer({data});refresh()}}/></div>
    <Card className='mb-6'><CardHeader><CardTitle>Add transaction</CardTitle></CardHeader><CardContent><form className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3' onSubmit={e=>{e.preventDefault();const dollars=Number(amount);if(!dollars||dollars<=0)return;create.mutate({type,amount:Math.round(dollars*100),date,category_id:categoryId||undefined,account_id:accountId||undefined,note:showNote&&note?note:undefined,recurrence:showRepeat&&repeat!=='installments'?{interval:repeat}:undefined,installments:showRepeat&&repeat==='installments'?{count:Number(count)}:undefined})}}>
      <Field label='Type'><select className='control' value={type} onChange={e=>setType(e.target.value as typeof type)}><option value='expend'>Expense</option><option value='earn'>Income</option></select></Field><Field label='Amount ($)'><Input type='number' min='.01' step='.01' value={amount} onChange={e=>setAmount(e.target.value)} required/></Field><Field label='Date'><Input type='date' value={date} onChange={e=>setDate(e.target.value)} required/></Field>
      <Field label='Category'><CategorySelect categories={categories} value={categoryId} onChange={setCategoryId} onCreate={async(name)=>(await createCategoryMutation.mutateAsync(name)).id}/></Field><Field label='Account'><select className='control' value={accountId} onChange={e=>setAccountId(e.target.value)}><option value=''>None</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name} · {a.kind.replace('_',' ')}</option>)}</select></Field>
      <div className='flex items-end gap-3'><Button type='button' variant={showRepeat?'default':'outline'} onClick={()=>setShowRepeat(v=>!v)}><Repeat className='size-4'/>Repeat</Button><Button type='button' variant={showNote?'default':'outline'} onClick={()=>{setShowNote(v=>!v);if(showNote)setNote('')}}><StickyNote className='size-4'/>Note</Button></div>
      {showRepeat&&<Field label='Repeat'><select className='control' value={repeat} onChange={e=>setRepeat(e.target.value as Repeat)}><option value='daily'>Daily</option><option value='weekly'>Weekly</option><option value='monthly'>Monthly</option><option value='yearly'>Yearly</option><option value='installments' disabled={!canInstall}>Installments…</option></select></Field>}
      {showRepeat&&repeat==='installments'&&<Field label='Installment count'><Input type='number' min='2' max='60' value={count} onChange={e=>setCount(e.target.value)}/><p className='mt-1 text-xs text-muted-foreground'>Total split monthly; final row absorbs rounding.</p></Field>}
      {showNote&&<Field label='Note'><Input value={note} maxLength={500} onChange={e=>setNote(e.target.value)}/></Field>}
      <div className='self-end'><Button disabled={create.isPending}>Add transaction</Button></div>{create.error&&<p className='text-sm text-destructive sm:col-span-full'>{create.error.message}</p>}
    </form></CardContent></Card>
    <Card><CardHeader><CardTitle>All transactions</CardTitle></CardHeader><CardContent>
      <div className='mb-4 flex items-center justify-center gap-4'><Button type='button' variant='ghost' size='icon' disabled={monthIdx>=months.length-1} onClick={()=>setMonthIdx(i=>i+1)}><ChevronLeft/></Button><span className='min-w-40 text-center font-medium'>{activeMonth?monthLabel(activeMonth):'No transactions'}</span><Button type='button' variant='ghost' size='icon' disabled={monthIdx<=0} onClick={()=>setMonthIdx(i=>i-1)}><ChevronRight/></Button></div>
      <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Note</TableHead><TableHead>Tags</TableHead><TableHead/></TableRow></TableHeader><TableBody>{monthTx.map(tx=><TableRow key={tx.id}><TableCell>{tx.date}</TableCell><TableCell><Badge variant={tx.type==='earn'?'default':'secondary'}>{tx.type}</Badge></TableCell><TableCell className={tx.type==='earn'?'text-emerald-600':'text-destructive'}>{tx.type==='earn'?'+':'−'}{money(tx.amount)}</TableCell><TableCell>{tx.note||'—'}</TableCell><TableCell>{tx.installmentPlanId&&<Badge variant='outline'>{installIndex.get(tx.id)}/{planCount.get(tx.installmentPlanId)}</Badge>} {tx.recurrenceRuleId&&<Badge variant='outline'>recurring</Badge>}</TableCell><TableCell><Button variant='destructive' size='sm' onClick={()=>removeTx.mutate(tx.id)}>Delete</Button></TableCell></TableRow>)}{monthTx.length===0&&<TableRow><TableCell colSpan={6} className='text-center text-muted-foreground'>No transactions this month.</TableCell></TableRow>}</TableBody></Table>
    </CardContent></Card></main>
}
function Field({label,children}:{label:string;children:React.ReactNode}){return <div className='space-y-2'><Label>{label}</Label>{children}</div>}
