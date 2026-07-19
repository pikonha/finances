import { createFileRoute } from '@tanstack/react-router'; import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query'; import { useState } from 'react'; import { createAccount,deleteAccount,listAccounts } from '#/server/accounts'; import { listFaturas } from '#/server/faturas'; import { listTransactions } from '#/server/transactions'; import { availableLimit } from '#/lib/faturas'; import { prepaidBalanceOf } from '#/lib/money'; import { Badge } from '@/components/ui/badge'; import { Button } from '@/components/ui/button'; import { Card,CardContent,CardHeader,CardTitle } from '@/components/ui/card'; import { Input } from '@/components/ui/input'; import { Label } from '@/components/ui/label'
export const Route=createFileRoute('/_authed/accounts')({component:Accounts})
const money=(c:number)=>(c/100).toLocaleString('en-US',{style:'currency',currency:'USD'})
function Accounts(){
  const qc=useQueryClient(),[name,setName]=useState(''),[kind,setKind]=useState<'credit_card'|'bank_account'>('bank_account'),[limit,setLimit]=useState(''),[closingDay,setClosingDay]=useState(''),[dueDay,setDueDay]=useState(''),[prepaid,setPrepaid]=useState(false)
  const{data=[]}=useQuery({queryKey:['accounts'],queryFn:()=>listAccounts()})
  const{data:faturas=[]}=useQuery({queryKey:['faturas'],queryFn:()=>listFaturas()})
  const{data:transactions=[]}=useQuery({queryKey:['transactions'],queryFn:()=>listTransactions()})
  const create=useMutation({mutationFn:(d:{name:string;kind:'credit_card'|'bank_account';limit?:number;closingDay?:number;dueDay?:number;prepaid?:boolean})=>createAccount({data:d}),onSuccess:()=>{setName('');setLimit('');setClosingDay('');setDueDay('');setPrepaid(false);qc.invalidateQueries({queryKey:['accounts']})}})
  const remove=useMutation({mutationFn:(id:string)=>deleteAccount({data:{id}}),onSuccess:()=>qc.invalidateQueries({queryKey:['accounts']})})
  return <main className='page-wrap rise-in py-10'><h1 className='display-title mb-6 text-4xl font-bold'>Accounts</h1>
    <Card className='mb-6'><CardHeader><CardTitle>Add account</CardTitle></CardHeader><CardContent><form className='grid gap-4 sm:grid-cols-3' onSubmit={e=>{e.preventDefault();create.mutate({name:name.trim(),kind,limit:kind==='credit_card'&&!prepaid&&limit?Math.round(Number(limit)*100):undefined,closingDay:kind==='credit_card'&&!prepaid&&closingDay?Number(closingDay):undefined,dueDay:kind==='credit_card'&&!prepaid&&dueDay?Number(dueDay):undefined,prepaid:kind==='credit_card'?prepaid:undefined})}}>
      <div className='space-y-2'><Label>Name</Label><Input value={name} onChange={e=>setName(e.target.value)} required/></div>
      <div className='space-y-2'><Label>Kind</Label><select className='h-9 w-full rounded-md border bg-transparent px-3 text-sm' value={kind} onChange={e=>setKind(e.target.value as typeof kind)}><option value='bank_account'>Bank account</option><option value='credit_card'>Credit card</option></select></div>
      {kind==='credit_card'&&<div className='flex items-end gap-2'><input id='prepaid' type='checkbox' checked={prepaid} onChange={e=>setPrepaid(e.target.checked)}/><Label htmlFor='prepaid'>Prepaid card</Label></div>}
      {kind==='credit_card'&&!prepaid&&<div className='space-y-2'><Label>Limit ($)</Label><Input type='number' min='0' step='.01' value={limit} onChange={e=>setLimit(e.target.value)}/></div>}
      {kind==='credit_card'&&!prepaid&&<div className='space-y-2'><Label>Closing day</Label><Input type='number' min='1' max='28' value={closingDay} onChange={e=>setClosingDay(e.target.value)} required/></div>}
      {kind==='credit_card'&&!prepaid&&<div className='space-y-2'><Label>Due day</Label><Input type='number' min='1' max='28' value={dueDay} onChange={e=>setDueDay(e.target.value)} required/></div>}
      <Button className='sm:col-span-3 sm:w-fit'>Add account</Button>{create.error&&<p className='text-sm text-destructive sm:col-span-3'>{create.error.message}</p>}
    </form></CardContent></Card>
    <Card><CardHeader><CardTitle>All accounts</CardTitle></CardHeader><CardContent className='space-y-2'>{data.map(a=>{
      const cardFaturas=faturas.filter(f=>f.accountId===a.id)
      return <div key={a.id} className='flex items-center gap-3 rounded-lg border p-3'>
        <span className='font-medium'>{a.name}</span><Badge variant='secondary'>{a.kind.replace('_',' ')}</Badge>
        {a.kind==='credit_card'&&a.prepaid&&<span className='text-sm text-muted-foreground'>Balance {money(prepaidBalanceOf(a.id,transactions))}</span>}
        {a.kind==='credit_card'&&!a.prepaid&&a.limit!=null&&<span className='text-sm text-muted-foreground'>Available {money(availableLimit(a.limit,cardFaturas))} / {money(a.limit)}</span>}
        <Button className='ml-auto' variant='destructive' size='sm' onClick={()=>remove.mutate(a.id)}>Delete</Button>
      </div>
    })}</CardContent></Card></main>
}
