import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { checkBearer } from '#/server/auth'
import { materializeDueRules } from '#/server/recurrence.core'

/** Invoked daily by the Railway scheduled job. Secured by CRON_SECRET. */
export const Route = createFileRoute('/api/cron/materialize-recurrence')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!checkBearer(request, 'CRON_SECRET')) {
          return new Response('Unauthorized', { status: 401 })
        }
        const today = new Date().toISOString().slice(0, 10)
        const result = await materializeDueRules(today)
        return json(result)
      },
    },
  },
})
