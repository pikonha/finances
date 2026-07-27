import { createServerFn } from '@tanstack/react-start'
import { getSession } from './session.core'

export const getSessionFn = createServerFn({ method: 'GET' }).handler(getSession)
