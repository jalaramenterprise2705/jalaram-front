import { Button } from './ui/button';

export const PAGE_SIZES = [20, 50, 100, 500];

// Page buttons + "rows per page" dropdown (choose a bigger size to see more rows on one page)
export default function Pagination({ page, pages = 1, total = 0, limit, onPage, onLimit }) {
  return (
    <div
      className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-2">
        <span>
          Total:
          {' '}
          {total}
        </span>
        <span className="text-slate-400">|</span>
        <label className="flex items-center gap-2">
          Rows per page
          <select
            className="h-8 rounded-lg border border-slate-300 bg-white px-2"
            value={limit}
            onChange={(e) => onLimit(Number(e.target.value))}
          >
            {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </Button>
        <span>
          {page}
          {' '}
          /
          {' '}
          {pages || 1}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= (pages || 1)}
          onClick={() => onPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
