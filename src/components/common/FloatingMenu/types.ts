import React, { ReactNode } from 'react';

export interface IActionButton {
  key: string;
  label: string;
  action: () => void;
  icon?: string;
}

export interface IFloatingMenu {
  /**
   * isChecked: 전체선택 체크박스 플로팅 여부 (그리드형, 자료가 없는 경우 등)
   */
  isChecked?: boolean;
  /**
   * actionButton: 저장/삭제/이동/복사 버튼 등 액션 버튼 그룹
   */
  actionButton?: IActionButton[];
  /**
   * floatingActionButton: 액션 버튼 활성화 여부 (자료가 1개라도 선택되는 경우 true)
   */
  floatingActionButton?: boolean;
  /**
   * isAllSelected: 전체선택 체크박스의 체크 여부
   */
  isAllSelected?: boolean;
  /**
   * setIsAllSelected: 체크박스 컨트롤용
   */
  setIsAllSelected?: React.Dispatch<React.SetStateAction<boolean>>;
  /**
   * handleAllSelected: 전체선택 체크박스의 핸들러
   */
  handleAllSelected?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /**
   * renderButton: 우측 버튼 렌더링 여부, 자료보드 > 휴지통엔 버튼 없길래 분기처리용
   */
  renderButton?: boolean;
  /**
   * buttonLabel: 우측 버튼 라벨명
   */
  buttonLabel?: string;
  /**
   * handleButton: 우측 버튼 실행 함수
   */
  handleButton?: () => void;
  /**
   * filter: 공개 여부, 날짜 등 필터링 셀렉트 박스, 없으면 제외
   */
  filter?: ReactNode;
  /**
   * viewMode: 자료 보기 형태
   */
  currentViewMode: 'grid' | 'list';
  /**
   * setCurrentViewMode: 자료 보기 형태 상태 관리 SetStateAction
   */
  setCurrentViewMode: React.Dispatch<React.SetStateAction<'grid' | 'list'>>;
}
