// 공통 타입 정의

export interface ICommRes<Res = object> {
  result?: Res;
  status: number;
  timestamp: string;
  error?: string;
  debug?: string;
}

export interface ICommListReq {
  /** 페이징 설정 페이지(0부터), 한 페이지에 나올 수 */
  offset_with_limit?: string;
  /** 정렬 설정 */
  sorts?: string;
}

export interface ICustomError extends Error {
  status: number;
  realCode: number;
}
