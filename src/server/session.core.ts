import { getRequest } from '@tanstack/react-start/server'
import { auth } from './auth-config'

export async function getSession() {
  return auth.api.getSession({ headers: getRequest().headers })
}

export async function requireUser() {
  const session = await getSession()
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}
