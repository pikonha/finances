import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '#/db/index'
import { authAccount, authSession, authUser, authVerification } from '#/db/auth-schema'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user: authUser, session: authSession, account: authAccount, verification: authVerification },
  }),
  emailAndPassword: { enabled: true },
})
