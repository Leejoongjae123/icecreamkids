export interface ITypeSelectionModal {
  /**
   * 모달 오픈 여부
   */
  isOpen: boolean;
  /**
   * 타입 선택 시 호출되는 함수
   */
  onSelect: (type: "A" | "B" | "C") => void;
  /**
   * 모달 취소 시 호출되는 함수
   */
  onCancel: () => void;
}

export type ReportType = "A" | "B" | "C";
