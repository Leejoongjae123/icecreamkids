import { InfiniteData, QueryKey, QueryState } from '@tanstack/react-query';
import type { UseInfiniteQueryOptions } from '@tanstack/react-query';

export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

export interface QueryProps<ResponseType = unknown> {
  queryKey: QueryKey;
  queryFn: (() => Promise<ResponseType>) | any;
  staleTime?: number;
}

export interface DehydratedQueryExtended<TData = unknown, TError = unknown> {
  state: QueryState<TData, TError>;
}

// 인피니티 쿼리 Page 타입 response
export interface TPageResponse<T> {
  result?: T[];
}

// 공통 인피니티 쿼리 interface (w/ offsetWithLimit)
export interface IUseInfiniteQueryWithLimit<
  TData, // 단일 item의 타입
  TError = Error, // 에러 타입
  TQueryKey extends QueryKey = QueryKey, // 쿼리 키 타입
> {
  queryKey: TQueryKey;
  queryFn: (pageParam: number) => Promise<TPageResponse<TData>>;
  limit: number;
  enabled?: boolean;
  options?: Omit<
    UseInfiniteQueryOptions<
      TPageResponse<TData>, // queryFn에서 반환된 데이터
      TError, // error
      InfiniteData<TPageResponse<TData>>, // useInfiniteQuery의 최종 반환값 타입
      TQueryKey, // queryKey unKnwon 방지
      number // pageParam
    >,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  >;
}
