import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { z } from 'zod'
import { checkBearer } from '#/server/auth'
import { createTransactionCore } from '#/server/transactions.core'
import { transactionInput } from '#/server/schemas'

/**
 * The hermes webhook + any external write path. Auth is checked BEFORE the body
 * is parsed. The UI does NOT use this route (it uses same-origin server
 * functions) so the secret never reaches the browser.
 */
export const Route = createFileRoute('/api/transactions')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!checkBearer(request, 'HERMES_WEBHOOK_SECRET')) {
          return new Response('Unauthorized', { status: 401 })
        }
        const userId = process.env.HERMES_USER_ID
        if (!userId) return json({ error: 'HERMES_USER_ID is not configured' }, { status: 500 })
        let body: unknown
        try {
          body = await request.json()
        } catch {
          return json({ error: 'Invalid JSON' }, { status: 400 })
        }
        const parsed = transactionInput.safeParse(body)
        if (!parsed.success) {
          return json(
            { error: 'Validation failed', issues: z.treeifyError(parsed.error) },
            { status: 400 },
          )
        }
        try {
          const result = await createTransactionCore(userId, parsed.data)
          return json(result, { status: 201 })
        } catch (e) {
          const err = e as Error & { cause?: unknown }
          // assertMoney is the only expected client-fault throw here (400);
          // anything else is a server/DB fault (500). Log the full cause.
          if (err.message.startsWith('Invalid money amount')) {
            return json({ error: err.message }, { status: 400 })
          }
          console.error('[POST /api/transactions]', err.message, err.cause ?? '')
          return json({ error: 'Internal error' }, { status: 500 })
        }
      },
    },
  },
})
