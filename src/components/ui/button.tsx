import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
const buttonVariants = cva('inline-flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wide disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-0 cursor-pointer', { variants: { variant: { default: 'border-2 border-foreground bg-primary text-primary-foreground brutal-hover', destructive: 'border-2 border-foreground bg-destructive text-destructive-foreground brutal-hover', outline: 'border-2 border-foreground bg-background hover:bg-accent hover:text-accent-foreground brutal-hover', ghost: 'border-2 border-transparent hover:bg-accent hover:text-accent-foreground', link: 'text-foreground underline underline-offset-4 hover:no-underline' }, size: { default: 'h-10 px-4 py-2', sm: 'h-8 px-3', icon: 'size-10' } }, defaultVariants: { variant: 'default', size: 'default' } })
export function Button({ className, variant, size, asChild = false, ...props }: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) { const Comp = asChild ? Slot : 'button'; return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} /> }
export { buttonVariants }
