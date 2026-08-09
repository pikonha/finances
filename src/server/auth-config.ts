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
  // Railway's x-forwarded-for is a 2-hop chain, which better-auth rejects without a
  // trustedProxies CIDR list. x-real-ip is a single value the edge overwrites, so it
  // can't be spoofed. Without this every request shares one rate-limit bucket.
  advanced: { ipAddress: { ipAddressHeaders: ['x-real-ip'] } },
  plugins: [mcp({ loginPage: '/login' })],
})
