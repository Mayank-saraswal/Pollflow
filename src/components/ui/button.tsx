import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  // Base — always pill shaped, Plus Jakarta Sans for primary weight
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'rounded-full font-sans text-sm font-medium',
    'transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2',
    'focus-visible:ring-white/25 focus-visible:ring-offset-2',
    'focus-visible:ring-offset-[#09090B]',
    'disabled:pointer-events-none disabled:opacity-35',
    'select-none',
  ].join(' '),
  {
    variants: {
      variant: {
        // White pill — main CTA
        default: [
          'bg-white text-[#09090B]',
          'font-display font-semibold',
          'hover:bg-white/88 hover:-translate-y-px',
          'hover:shadow-[0_4px_24px_rgba(255,255,255,0.12)]',
          'active:translate-y-0',
        ].join(' '),

        // Outlined / secondary
        secondary: [
          'bg-white/[0.06] text-white',
          'border border-white/[0.12]',
          'hover:bg-white/[0.10] hover:border-white/[0.20]',
          'hover:-translate-y-px',
        ].join(' '),

        // Ghost — nav links
        ghost: [
          'bg-transparent text-white/55',
          'hover:text-white hover:bg-white/[0.05]',
        ].join(' '),

        // Outline only
        outline: [
          'bg-transparent text-white',
          'border border-white/[0.12]',
          'hover:bg-white/[0.04] hover:border-white/[0.20]',
        ].join(' '),

        // Destructive
        destructive: [
          'bg-red-500 text-white',
          'font-display font-semibold',
          'hover:bg-red-600 hover:-translate-y-px',
        ].join(' '),

        // Minimal text link
        link: [
          'bg-transparent text-white/70 underline-offset-4',
          'hover:text-white hover:underline p-0 h-auto',
        ].join(' '),
      },
      size: {
        sm:   'h-8  px-4  text-xs',
        default: 'h-10 px-5  text-sm',
        lg:   'h-12 px-7  text-base',
        xl:   'h-14 px-9  text-base',
        icon: 'h-10 w-10 p-0',
        'icon-sm': 'h-8 w-8 p-0',
        'icon-lg': 'h-12 w-12 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {children}
          </>
        ) : children}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
