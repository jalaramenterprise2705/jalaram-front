import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { cn } from '../lib/utils';

// One loader for the whole app
// <Spinner />      small, inside buttons
// <PageLoader />   centered on the page while data is loading (the page content is hidden meanwhile)
// <GlobalLoader /> thin bar at the top while any request is running
export const Spinner = ({ className }) => (
  <span className={cn(
    'inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent',
    className,
  )} role="status" aria-label="Loading" />
);

export const PageLoader = ({ text = 'Loading...' }) => (
  <div
    className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-slate-500"
  >
    <Spinner className="h-8 w-8 text-indigo-600" />
    <span className="text-sm">{text}</span>
  </div>
);

export const GlobalLoader = () => {
  const busy = useIsFetching() + useIsMutating() > 0;
  if (!busy) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] h-1 overflow-hidden bg-indigo-100"
    >
      <div
        className="h-full w-1/3 animate-[slide_1s_ease-in-out_infinite] bg-indigo-600"
      />
    </div>
  );
};
