import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const base = 'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100';
export const Input = forwardRef(({ className, ...p }, ref) => <input ref={ref} className={cn(base, className)} {...p} />);
export const Label = ({ className, ...p }) => (
  <label
    className={cn('mb-1 block text-xs font-medium text-slate-600', className)}
    {...p}
  />
);

export const Card = ({ className, ...p }) => (
  <div
    className={cn('rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5', className)}
    {...p}
  />
);
