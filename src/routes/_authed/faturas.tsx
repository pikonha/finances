import { createFileRoute } from '@tanstack/react-router'; import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query'; import { listFaturas,markFaturaPaid,unmarkFaturaPaid } from '#/server/faturas'; import { Badge } from '@/components/ui/badge'; import { Button } from '@/components/ui/button'; import { Card,CardContent,CardHeader,CardTitle } from '@/components/ui/card'
export const Route=createFileRoute('/_authed/faturas')({component:Faturas})
const money=(c:number)=>(c/100).toLocaleString('en-US',{style:'currency',currency:'USD'})
const statusVariant={open:'default',closed:'secondary',paid:'outline',overdue:'destructive'} as const
function Faturas(){
  const qc=useQueryClient()
  const{data=[]}=useQuery({queryKey:['faturas'],queryFn:()=>listFaturas()})
  const refresh=()=>qc.invalidateQueries({queryKey:['faturas']})
  const markPaid=useMutation({mutationFn:(v:{account_id:string;cycle_key:string})=>markFaturaPaid({data:v}),onSuccess:refresh})
  const unmarkPaid=useMutation({mutationFn:(v:{account_id:string;cycle_key:string})=>unmarkFaturaPaid({data:v}),onSuccess:refresh})
  return <main className='page-wrap rise-in py-10'><h1 className='display-title mb-6 text-4xl font-bold'>Faturas</h1>
    <Card><CardHeader><CardTitle>All faturas</CardTitle></CardHeader><CardContent className='space-y-2'>
      {data.map(f=><div key={`${f.accountId}-${f.cycleKey}`} className='flex items-center gap-3 rounded-lg border p-3'>
        <span className='font-medium'>{f.accountName}</span>
        <span className='text-sm text-muted-foreground'>{f.label} · due {f.vencimento}</span>
        <Badge variant={statusVariant[f.status]}>{f.status}</Badge>
        <span className='ml-auto font-medium'>{money(f.total)}</span>
        {f.status!=='open'&&(f.status==='paid'
          ?<Button variant='outline' size='sm' onClick={()=>unmarkPaid.mutate({account_id:f.accountId,cycle_key:f.cycleKey})}>Unmark paid</Button>
          :<Button variant='default' size='sm' onClick={()=>markPaid.mutate({account_id:f.accountId,cycle_key:f.cycleKey})}>Mark paid</Button>)}
      </div>)}
      {!data.length&&<p className='text-muted-foreground'>No faturas yet.</p>}
    </CardContent></Card></main>
}
