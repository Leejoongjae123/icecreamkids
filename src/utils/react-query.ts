/**
 * NOTE: 서버컴포넌트에서 사용시 필요해서 추가.
 */

import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
  QueryKey,
  useInfiniteQuery,
  UseInfiniteQueryResult,
  InfiniteData,
} from '@tanstack/react-query';
import { cache } from 'react';
import { isEqual } from '@/utils';
import {
  DehydratedQueryExtended,
  IUseInfiniteQueryWithLimit,
  QueryProps,
  TPageResponse,
  UnwrapPromise,
} from '@/utils/types';

export const getQueryClient = cache(() => new QueryClient());

export async function getDehydratedQuery<Q extends QueryProps>({ queryKey, queryFn, staleTime = 60 * 1000 }: Q) {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({ queryKey, queryFn, staleTime });

  const { queries } = await dehydrate(queryClient);

  if (!queries || queries.length === 0) {
    console.error('No queries found in dehydrated state');
    return null; // 빈 배열이나 undefined 처리
  }

  const [dehydratedQuery] = queries.filter((query) => isEqual(query.queryKey, queryKey));
  return (await dehydratedQuery) as DehydratedQueryExtended<UnwrapPromise<ReturnType<Q['queryFn']>>>;
}

export async function getDehydratedQueries<Q extends QueryProps[]>(queries: Q) {
  const queryClient = getQueryClient();
  await Promise.all(
    queries.map(({ queryKey, queryFn, staleTime }) => queryClient.prefetchQuery({ queryKey, queryFn, staleTime })),
  );

  return dehydrate(queryClient).queries as DehydratedQueryExtended<UnwrapPromise<ReturnType<Q[number]['queryFn']>>>[];
}

export const Hydrate = HydrationBoundary;

export const useInfiniteQueryWithLimit = <TData, TError = Error, TQueryKey extends QueryKey = QueryKey>({
  queryKey,
  queryFn,
  limit,
  enabled = true,
  options = {},
}: IUseInfiniteQueryWithLimit<TData, TError, TQueryKey>): UseInfiniteQueryResult<
  InfiniteData<TPageResponse<TData>>,
  TError
> => {
  return useInfiniteQuery<TPageResponse<TData>, TError, InfiniteData<TPageResponse<TData>>, TQueryKey, number>({
    queryKey,
    queryFn: ({ pageParam = 0 }) => queryFn(pageParam),
    getNextPageParam: (lastPage: TPageResponse<TData>, allPages: TPageResponse<TData>[]) => {
      return (lastPage.result?.length ?? 0) > limit ? allPages?.length : undefined;
    },
    enabled,
    initialPageParam: 0,
    staleTime: 1000 * 60,
    ...options,
  });
};
