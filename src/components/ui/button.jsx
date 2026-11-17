import { Spinner } from '../Loader';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const variants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
  {
    variants: {
      variant: {
        default: 'bg-indigo-600 text-white hover:bg-indigo-700',
        outline: 'border border-slate-300 bg-white hover:bg-slate-50',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        ghost: 'hover:bg-slate-100',
      },
      size: { default: 'h-10 px-4', sm: 'h-8 px-3', icon: 'h-9 w-9' },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

// loading = shows a spinner and blocks clicks, so a button can never be pressed twice
export const Button = ({ className, variant, size, type = 'button', loading = false, disabled, children, ...p }) => (
  <button
    type={type}
    disabled={disabled || loading}
    className={cn(variants({ variant, size }), className)}
    {...p}
  >
    {loading && <Spinner className="h-4 w-4" />}
    {children}
  </button>
);
