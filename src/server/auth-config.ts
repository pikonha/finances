import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { mcp } from 'better-auth/plugins'
import { db } from '#/db/index'
import {
  authAccount, authSession, authUser, authVerification,
  oauthAccessToken, oauthApplication, oauthConsent,
} from '#/db/auth-schema'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: authUser, session: authSession, account: authAccount, verification: authVerification,
      oauthApplication, oauthAccessToken, oauthConsent,
    },
  }),
  emailAndPassword: { enabled: true },
  plugins: [mcp({ loginPage: '/login' })],
})
