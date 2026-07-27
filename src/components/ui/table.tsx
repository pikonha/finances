import * as React from 'react'; import { cn } from '@/lib/utils'
export function Table({ className, ...props }: React.ComponentProps<'table'>) { return <div className='relative w-full overflow-auto'><table className={cn('w-full caption-bottom text-sm', className)} {...props} /></div> }
export function TableHeader(p: React.ComponentProps<'thead'>) { return <thead className='border-b-2 border-foreground bg-muted [&_tr]:border-0' {...p} /> }
export function TableBody(p: React.ComponentProps<'tbody'>) { return <tbody className='[&_tr:last-child]:border-0' {...p} /> }
export function TableRow({ className, ...props }: React.ComponentProps<'tr'>) { return <tr className={cn('border-b-2 border-border transition-colors hover:bg-accent/30', className)} {...props} /> }
export function TableHead({ className, ...props }: React.ComponentProps<'th'>) { return <th className={cn('h-11 whitespace-nowrap px-3 text-left align-middle text-xs font-bold uppercase tracking-wide text-foreground', className)} {...props} /> }
export function TableCell({ className, ...props }: React.ComponentProps<'td'>) { return <td className={cn('whitespace-nowrap p-3 align-middle', className)} {...props} /> }
