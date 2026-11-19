import { useCallback, useEffect, useState } from "react";
import { messageOf } from "../api/client";
import type { Paginated, PaginationMeta } from "../api/types";

const EMPTY_META: PaginationMeta = { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false };

interface PaginatedList<T> {
  items: T[];
  meta: PaginationMeta;
  loading: boolean;
  error: string | null;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  /** Re-runs the request — what every screen calls after a create/update/delete. */
  reload: () => void;
}

/**
 * The list plumbing shared by four screens: page/limit state, the request, and a `reload()`.
 *
 * `load` is deliberately *not* a dependency — it is a fresh closure on every render — so callers pass
 * the values the request really depends on (e.g. the admin's owner filter) through `deps` instead.
 */
export function usePaginated<T>(
  load: (page: number, limit: number) => Promise<Paginated<T>>,
  deps: readonly unknown[] = [],
): PaginatedList<T> {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [reloadToken, setReloadToken] = useState(0);
  const [items, setItems] = useState<T[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    load(page, limit)
      .then((result) => {
        if (cancelled) return;
        setItems(result.data);
        setMeta(result.meta);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setItems([]);
        setError(messageOf(cause));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Guards against a stale response overwriting a newer one when page/limit change quickly.
    return () => {
      cancelled = true;
    };
  }, [page, limit, reloadToken, ...deps]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  return { items, meta, loading, error, setPage, setLimit, reload };
}
