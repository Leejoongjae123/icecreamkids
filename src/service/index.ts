import { ICustomError } from '@/service/types';

interface HTTPInstance {
  get<T>(url: string, config?: RequestInit): Promise<T>;
  delete<T>(url: string, data?: unknown, config?: RequestInit): Promise<T>;
  head<T>(url: string, config?: RequestInit): Promise<T>;
  options<T>(url: string, config?: RequestInit): Promise<T>;
  post<T>(url: string, data?: unknown, config?: RequestInit): Promise<T>;
  put<T>(url: string, data?: unknown, config?: RequestInit): Promise<T>;
  patch<T>(url: string, data?: unknown, config?: RequestInit): Promise<T>;
}

class BaseService {
  public http: HTTPInstance;

  private headers: Record<string, string>;

  constructor() {
    this.headers = {
      csrf: 'token',
    };

    this.http = {
      get: this.get.bind(this),
      delete: this.delete.bind(this),
      head: this.head.bind(this),
      options: this.options.bind(this),
      post: this.post.bind(this),
      put: this.put.bind(this),
      patch: this.patch.bind(this),
    };
  }

  private async request<T = unknown>(method: string, url: string, data?: unknown, config?: any): Promise<T> {
    try {
      // URL이 AI 및 Proxy 엔드포인트인지 확인
      const isAiAndProxyEndpoint = url.startsWith('/ai/');

      // 엔드포인트 유형에 따라 baseURL 결정
      let baseURL: string;
      if (isAiAndProxyEndpoint) {
        // AI 및 Proxy API용 baseURL 사용
        baseURL = process.env.NEXT_PUBLIC_AI_AND_PROXY_URL || 'https://ai.dev.i-screamdrive.com';
      } else {
        // 일반 API용 기존 baseURL 사용
        baseURL =
          typeof window !== 'undefined' ? '/api' : process.env.NEXT_PUBLIC_API_URL || 'http://3.37.227.162:8080';
      }
      // const baseURL = typeof window !== 'undefined' ? '/api' : process.env.NEXT_PUBLIC_API_URL;
      // await httpClient(url);
      // const token = tokenManager.getToken();
      const response = await fetch(baseURL + url, {
        baseURL,
        method,
        headers: {
          ...this.headers,
          'Content-Type': 'application/json',
          // Authorization: token ? `Bearer ${token}` : '',
          ...config?.headers,
        },
        // http only 쿠키 전송을 위한 옵션
        credentials: 'include',
        body: data ? JSON.stringify(data) : undefined,
        ...config,
      });

      if (!response.ok) {
        // 토큰 만료 시 갱신 로직 (예시)
        if (response.status === 401) {
          // const refreshSuccess = await refreshAccessToken();
          // if (refreshSuccess) {
          //   // 토큰 갱신 후 다시 요청
          //   return this.request(method, url, data, config);
          // }
          // tokenManager.clearToken();
          throw new Error('세션이 만료되었습니다. 다시 로그인 해 주세요.');
        }

        // 그 외 에러 처리
        const errorResponse = await response.json();

        const err = new Error(errorResponse?.error) as ICustomError;
        err.status = response?.status || 500;
        err.realCode = errorResponse.status;

        throw err;
      }

      return await response.json();
    } catch (error) {
      /**
       * NOTE: 추후 프로젝트에서 알맞은 에러처리를 해주세요.
       */
      /* eslint-disable no-console */
      console.error(error);
      throw error;
    }
  }

  private get<T>(url: string, config?: RequestInit & { params?: Record<string, any> }): Promise<T> {
    const baseUrl = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    let queryUrl = url;
    let options = config;

    // params가 있는 경우 queryString으로 변환하여 URL에 추가
    if (config?.params) {
      const searchParams = new URLSearchParams();
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });

      const queryString = searchParams.toString();
      if (queryString) {
        queryUrl = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
      }

      // params는 URL에 추가했으므로 config에서 제거
      const { ...restConfig } = config;
      options = restConfig;
    }

    return this.request<T>('GET', queryUrl, undefined, options);
  }

  private delete<T>(url: string, data?: unknown, config?: RequestInit): Promise<T> {
    return this.request<T>('DELETE', url, data, config);
  }

  private head<T>(url: string, config?: RequestInit): Promise<T> {
    return this.request<T>('HEAD', url, undefined, config);
  }

  private options<T>(url: string, config?: RequestInit): Promise<T> {
    return this.request<T>('OPTIONS', url, undefined, config);
  }

  private post<T>(url: string, data?: unknown, config?: RequestInit): Promise<T> {
    return this.request<T>('POST', url, data, config);
  }

  private put<T>(url: string, data?: unknown, config?: RequestInit): Promise<T> {
    return this.request<T>('PUT', url, data, config);
  }

  private patch<T>(url: string, data?: unknown, config?: RequestInit): Promise<T> {
    return this.request<T>('PATCH', url, data, config);
  }
}

export default BaseService;

export const ENDPOINT = {
  core: '/core',
  file: '/file',
  member: '/member',
  message: '/message',
  aiAndProxy: '/ai-and-proxy',
};
