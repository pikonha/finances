import { QueryClient } from '@tanstack/react-query'
import { financeQueryKeys, liveFinanceQuery } from '#/lib/optimistic'

export function getContext() {
  const queryClient = new QueryClient()
  for (const queryKey of Object.values(financeQueryKeys)) {
    queryClient.setQueryDefaults(queryKey, liveFinanceQuery)
  }

  return {
    queryClient,
  }
}
export default function TanstackQueryProvider() {}
