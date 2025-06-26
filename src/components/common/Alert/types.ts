export interface IAlert {
  /**
   * 오픈 여부
   */
  isOpen?: boolean;
  /**
   * 알럿 메세지
   */
  message: string;
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
}

export interface IAlertStore {
  alert: IAlert;
  showAlert: (props: IAlert) => void;
  closeAlert: () => void;
  setAlertInfo: (props: IAlert) => void;
}
