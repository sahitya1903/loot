// Cursor pagination helpers for the API's `{ items, cursor }` pages.

import { useInfiniteQuery } from '@tanstack/react-query';

/**
 * @param {unknown[]} queryKey
 * @param {(cursor: string | undefined) => Promise<{ items: object[], cursor: string | null }>} fetchPage
 * @param {{ enabled?: boolean }} [options]
 */
export function usePagedList(queryKey, fetchPage, { enabled = true } = {}) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: undefined,
    getNextPageParam: (last) => last.cursor ?? undefined,
    enabled,
  });
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  return {
    ...query,
    items,
    loadMore: () =>
      query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage(),
  };
}
