import { ChangeEvent, ReactNode } from 'react';

export interface ICheckboxProps {
  /**
   * 카드형때문에 존재하는 타입..
   */
  type?: 'checkbox' | 'radio';
  /**
   * name
   */
  name: string;
  /**
   * id
   */
  id: string;
  /**
   * label
   */
  label: ReactNode; // 변경: string | HTMLElement -> ReactNode
  /**
   * label 숨김여부
   */
  labHidden?: boolean;
  /**
   * 아이콘 숨김여부.. (빠른업무AI.. ㅜㅜ)
   */
  isIcoHidden?: boolean;
  /**
   * checked
   */
  checked?: boolean;
  /**
   * disabled
   */
  disabled?: boolean;
  /**
   * class
   */
  className?: string;
  /**
   * value
   */
  value?: string | number | readonly string[] | boolean | undefined;
  /**
   * 빠른업무AI : 이미지 타입
   */
  isImage?: boolean;
  /**
   * 빠른업무AI : 이미지 설정
   */
  thumbnail?: string;
  /**
   * onChange 이벤트
   */
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  /**
   * 체크 박스 대신 check number 표시
   */
  checkNum?: number;
}
