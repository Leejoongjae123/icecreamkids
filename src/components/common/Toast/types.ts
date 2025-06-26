import type { ReactNode } from 'react';

export const TOAST_MESSAGE_DURATION: number = 5000;
export const TOAST_MESSAGE_DURATION_OFF: number = 4500;

export interface IToast {
  /**
   * 삭제를 위한 id
   */
  id: string;
  /**
   * 노출 메세지
   */
  message: string;
  /**
   * 위치 조정을 위한 순서
   */
  toastIdx?: number;
  /**
   * toast 팝업 수량
   */
  toastCnt?: number;
}

export interface IToastStore {
  messages: IToast[];
  add: (message: Omit<IToast, 'id'>) => void;
  remove: (id: string) => void;
}
