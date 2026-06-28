import { timingSafeEqual } from 'node:crypto'

/** Constant-time bearer check against an env secret. Never logs the secret. */
export function checkBearer(request: Request, envVar: string): boolean {
  const expected = process.env[envVar]
  if (!expected) return false // misconfigured server rejects rather than allows
  const header = request.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const a = Buffer.from(token)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
