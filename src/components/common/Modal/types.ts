import { ReactNode } from 'react';

export interface IModal {
  hiddenTitle?: boolean;
  /**
   * 모달 클래스
   */
  className: string;
  /**
   * 오픈 여부
   */
  isOpen?: boolean;
  /**
   * 딤드 없는 케이스
   */
  isClear?: boolean;
  /**
   * 알럿 메세지
   */
  message: string;
  /**
   * 모달 사이즈
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * description
   */
  description?: string;
  /**
   * confirm 여부 (false인경우 alert)
   */
  isConfirm?: boolean;
  /**
   * 확인 버튼 이벤트
   */
  onConfirm?: (() => void | Promise<void>) | null;
  /**
   * 취소 버튼 이벤트
   */
  onCancel?: (() => void | Promise<void>) | null;
  /**
   * 하단 버튼
   */
  btns?: {
    color: string;
    title: string;
    onClick?: string;
    icon?: string;
    size?: string;
  }[];
  children?: ReactNode;
}

export interface IModalStore {
  alert: IModal;
  showAlert: (props: IModal) => void;
  closeAlert: () => void;
  setAlertInfo: (props: IModal) => void;
}
