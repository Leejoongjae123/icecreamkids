import { ReactNode } from 'react';

export interface IModal {
  /**
   * 모달 클래스
   */
  className?: string;
  /**
   * 오픈 여부
   */
  isOpen?: boolean;
  /**
   * 딤드 없는 케이스
   */
  isClear?: boolean;
  /**
   * 알럿 메세지 (모달 제목)
   */
  message?: string;
  /**
   * 모달 사이즈
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * description
   */
  description?: string;
  /**
   * plusButton: 기본 버튼 (취소, 적용)을 제외한 추가 버튼
   */
  plusButton?: ReactNode;
  /**
   * confirm 여부 (false인경우 alert)
   */
  isConfirm?: boolean;
  /**
   * 취소 버튼 명칭 (기본값: 취소)
   */
  cancelText?: string;
  /**
   * 확인 버튼 명칭 (기본값: 확인)
   */
  confirmText?: string;
  /**
   * 확인 버튼 이벤트
   */
  onConfirm?: ((val?: File | string) => void | Promise<void>) | null;
  /**
   * 취소 버튼 이벤트
   */
  onCancel?: (() => void | Promise<void>) | null;
  /**
   * 하단 버튼
   */
  // btns?: [
  //   {
  //     color: string;
  //     title: string;
  //     onClick?: string;
  //   },
  // ];
  btns?: {
    color: string;
    title: string;
    onClick?: string;
    icon?: string;
    size?: string;
  }[];
  disabled?: boolean;
  children?: ReactNode;
  /**
   * 제목 숨김 여부
   */
  hiddenTitle?: boolean;
}

export interface IModalStore {
  alert: IModal;
  showAlert: (props: IModal) => void;
  closeAlert: () => void;
  setAlertInfo: (props: IModal) => void;
}
