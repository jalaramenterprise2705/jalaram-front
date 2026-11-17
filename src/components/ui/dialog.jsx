import * as D from '@radix-ui/react-dialog';
import { cn } from '../../lib/utils';

export const Dialog = D.Root;
export const DialogContent = ({ className, children, ...p }) => (
  <D.Portal>
    <D.Overlay className="fixed inset-0 z-50 bg-black/50" />
    <D.Content className={cn(
      'fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white p-5 shadow-xl sm:p-6',
      className,
    )} {...p}>{children}</D.Content>
  </D.Portal>
);

export const DialogHeader = ({ className, ...p }) => <div className={cn('mb-4 space-y-1', className)} {...p} />;
export const DialogTitle = ({ className, ...p }) => <D.Title className={cn('text-lg font-semibold', className)} {...p} />;
export const DialogDescription = ({ className, ...p }) => (
  <D.Description
    className={cn('text-sm text-slate-500', className)}
    {...p}
  />
);

export const DialogFooter = ({ className, ...p }) => (
  <div
    className={cn('mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
    {...p}
  />
);
