import type { PaginationMeta } from "../api/types";
import { Button } from "./ui";

const PAGE_SIZES = [5, 10, 20, 50];

/** The one pagination control every list screen uses, so `?page=&limit=` behaves identically. */
export function Pager({
  meta,
  unit,
  onPage,
  onLimit,
}: {
  meta: PaginationMeta;
  /** What is being counted, so "21" reads as "21 notes". */
  unit: string;
  onPage: (page: number) => void;
  onLimit: (limit: number) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
      <Button variant="secondary" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
        Previous
      </Button>
      <span className="tabular">
        Page {meta.page} of {Math.max(meta.totalPages, 1)} · {meta.total} {unit} in total
      </span>
      <Button variant="secondary" disabled={!meta.hasNext} onClick={() => onPage(meta.page + 1)}>
        Next
      </Button>

      <label className="ml-auto flex items-center gap-2">
        Per page
        <select
          value={meta.limit}
          onChange={(event) => onLimit(Number(event.target.value))}
          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
