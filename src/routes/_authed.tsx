import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
export const Route = createFileRoute('/_authed')({ beforeLoad:({context})=>{ if(!context.session?.user) throw redirect({to:'/login'}) }, component:Outlet })
