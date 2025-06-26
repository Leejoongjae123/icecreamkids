// BaseService 클래스의 인스턴스를 생성.
import BaseService from '@/service/index';
import { useLoadingStore } from '@/hooks/store/useLoadingStore';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import { ICustomError } from '@/service/types';
import useUserStore from '@/hooks/store/useUserStore';
import { isPublicPreview } from '@/utils/publicPreview';
import { tokenManager } from '@/utils/tokenManager';

const baseService = new BaseService();

// customFetcher 함수 구현
export const customFetcher = async <T>(
  {
    url,
    method,
    params,
    data,
    signal,
  }: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: any;
    params?: any;
    data?: any;
    signal?: AbortSignal; // signal을 선택적으로 전달받음
    responseType?: string;
  },
  options: RequestInit = {},
): Promise<T> => {
  // 로딩 카운터
  const { increment, decrement } = useLoadingStore.getState();
  const { showAlert } = useAlertStore.getState();
  const { userInfo } = useUserStore.getState();

  let isUnauthenticated = !userInfo;
  if (isUnauthenticated) {
    const path = url.split('/');
    if (isPublicPreview(path)) isUnauthenticated = false;
    if (isUnauthenticated) {
      const result = await tokenManager.getCheckToken();
      if (result?.state) isUnauthenticated = false;
    }
  }

  increment();
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      params,
      ...options,
    };

    if (isUnauthenticated) {
      throw new Error(`unauthenticated: ${isUnauthenticated}`);
    }

    // HTTP 요청 메서드(GET, POST, PUT 등)에 따라 적절한 호출을 합니다.
    if (method === 'GET') {
      return await baseService.http.get<T>(url, config);
    }

    if (method === 'POST') {
      return await baseService.http.post<T>(url, data, config);
    }

    if (method === 'PUT') {
      return await baseService.http.put<T>(url, data, config);
    }

    if (method === 'PATCH') {
      return await baseService.http.patch<T>(url, data, config);
    }

    if (method === 'DELETE') {
      return await baseService.http.delete<T>(url, data, config);
    }

    throw new Error(`Unsupported HTTP method: ${method}`);
  } catch (error) {
    const customError = error as ICustomError;
    if (customError.realCode === 1000) {
      showAlert({ message: '폴더 명이 중복됩니다. 다른 폴더 명을 사용해 주세요.' });
    }

    if (!isUnauthenticated) {
      console.error('Fetcher error:', customError);
    } else {
      console.info('로그인이 필요한 서비스입니다.');
    }

    throw error;
  } finally {
    decrement();
  }
};
