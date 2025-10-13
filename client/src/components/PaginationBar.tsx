import React, { useMemo, KeyboardEvent } from "react";

type Props = {
  page: number;
  setPage: (p: number) => void;
  totalItems: number;
  pageSize?: number;
  setPageSize?: (s: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  ariaLabel?: string;
};

// small classNames helper
const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

// returns an array like [1, '...', 4, 5, 6, '...', 20]
function makePageList(total: number, current: number, siblingCount = 1, boundaryCount = 1) {
  const totalNumbers = siblingCount * 2 + boundaryCount * 2 + 3; // pages + 2 ellipses
  if (total <= totalNumbers) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: Array<number | "..."> = [];
  const left = Math.max(current - siblingCount, boundaryCount + 2);
  const right = Math.min(current + siblingCount, total - boundaryCount - 1);

  for (let i = 1; i <= boundaryCount; i++) pages.push(i);
  if (left > boundaryCount + 2) pages.push("...");
  else if (left === boundaryCount + 2) pages.push(boundaryCount + 1);

  for (let i = left; i <= right; i++) pages.push(i);

  if (right < total - boundaryCount - 1) pages.push("...");
  else if (right === total - boundaryCount - 1) pages.push(total - boundaryCount);

  for (let i = total - boundaryCount + 1 - (boundaryCount === 0 ? 0 : 0); i <= total; i++) pages.push(i);

  return pages;
}

export default function PaginationBar({
  page,
  setPage,
  totalItems,
  pageSize = 12,
  //setPageSize,
  //pageSizeOptions = [10, 25, 50, 100],
  className,
  ariaLabel = "Pagination",
}: Props) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const startIndex = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(totalItems, page * pageSize);

  // memoized page list with ellipses
  const pageList = useMemo(() => makePageList(totalPages, page, 1, 1), [totalPages, page]);

  const go = (p: number) => {
    const next = Math.max(1, Math.min(totalPages, p));
    if (next !== page) setPage(next);
  };

  function onKeyNumber(e: KeyboardEvent<HTMLButtonElement>, p: number) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      go(p);
    }
  }

  return (
    <nav
      className={cx("flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4", className)}
      aria-label={ariaLabel}
    >
      {/* Summary for SR and visual users. aria-live announces page changes. */}
      <div className="text-sm text-muted-foreground w-full sm:w-auto">
        <div className="sr-only" aria-live="polite">
          Showing {startIndex} to {endIndex} of {totalItems} items — page {page} of {totalPages}.
        </div>
        <span className="inline-flex items-baseline gap-1">
          <span className="text-xs text-muted-foreground">Showing</span>
          <strong className="mx-1">{startIndex || 0}</strong>
          <span className="text-xs text-muted-foreground">—</span>
          <strong className="mx-1">{endIndex}</strong>
          <span className="text-xs text-muted-foreground">of</span>
          <strong className="ml-1">{totalItems}</strong>
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <button
          type="button"
          onClick={() => go(1)}
          disabled={page === 1}
          aria-label="Go to first page"
          className={cx(
            "px-2 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-offset-1",
            page === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"
          )}
          title="First page"
        >
          «
        </button>

        <button
          type="button"
          onClick={() => go(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
          className={cx(
            "px-3 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-offset-1",
            page === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"
          )}
        >
          Prev
        </button>

        {/* Page buttons - hidden on very small screens, where a compact select will be used instead */}
        <div className="hidden sm:flex items-center gap-1 border rounded-md px-2 py-1">
          {pageList.map((p, idx) =>
            p === "..." ? (
              <span key={`dots-${idx}`} className="px-2 text-sm text-muted-foreground select-none">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => go(p as number)}
                onKeyDown={(e) => onKeyNumber(e, p as number)}
                aria-current={p === page ? "page" : undefined}
                aria-label={p === page ? `Current page, page ${p}` : `Go to page ${p}`}
                className={cx(
                  "min-w-[36px] h-8 flex items-center justify-center rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1",
                  p === page
                    ? "bg-primary text-white"
                    : "hover:bg-gray-100"
                )}
              >
                {p}
              </button>
            )
          )}
        </div>

        {/* Compact page selector for small screens */}
        <div className="sm:hidden">
          <label htmlFor="page-select" className="sr-only">Select page</label>
          <select
            id="page-select"
            value={String(page)}
            onChange={(e) => go(Number(e.target.value))}
            className="px-2 py-1 rounded-md border text-sm"
          >
            {Array.from({ length: totalPages }).map((_, i) => (
              <option key={i} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => go(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
          className={cx(
            "px-3 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-offset-1",
            page === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"
          )}
        >
          Next
        </button>

        <button
          type="button"
          onClick={() => go(totalPages)}
          disabled={page === totalPages}
          aria-label="Go to last page"
          className={cx(
            "px-2 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-offset-1",
            page === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"
          )}
          title="Last page"
        >
          »
        </button>

        {/* Page size selector - optional 
        {setPageSize && (
          <div className="ml-2 flex items-center gap-2">
            <label htmlFor="page-size" className="text-xs text-muted-foreground hidden sm:inline-block">
              / page
            </label>
            <select
              id="page-size"
              value={String(pageSize)}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                setPageSize(newSize);
                // reset to first page to avoid out-of-range page
                setPage(1);
              }}
              className="px-2 py-1 rounded-md border text-sm"
              aria-label="Items per page"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}*/}

        {/* Jump to page input - small, optional enhancement */}
        <div className="hidden sm:flex items-center gap-2">
          <label htmlFor="jump" className="sr-only">Jump to page</label>
          <input
            id="jump"
            type="number"
            min={1}
            max={totalPages}
            placeholder={String(page)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const val = Number((e.target as HTMLInputElement).value);
                if (Number.isFinite(val)) go(val);
              }
            }}
            className="w-20 px-2 py-1 rounded-md border text-sm"
            aria-label="Jump to page number and press Enter"
            title="Type a page number and press Enter"
          />
        </div>
      </div>
    </nav>
  );
}
