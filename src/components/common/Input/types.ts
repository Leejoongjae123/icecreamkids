import React, { ChangeEventHandler, FocusEventHandler, KeyboardEventHandler } from 'react';

type InputType = 'text' | 'number' | 'tel' | 'password' | 'search' | 'file';
type InputSizeType = 'small' | 'large';
type SelectOption = {
  [key: string]: string | number;
};
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * id
   */
  id: string;
  /**
   * type 생략시 text
   */
  type?: InputType;
  /**
   * sizeType 생략시 small
   */
  sizeType?: InputSizeType;
  /**
   * disabled
   */
  disabled?: boolean;
  /**
   * readOnly
   */
  readOnly?: boolean;
  /**
   * style
   */
  style?: React.CSSProperties;
  /**
   * 에러 여부
   */
  isError?: boolean;
  /**
   * 입력필드 긍정메시지
   */
  infoMessage?: string | null;
  /**
   * 입력필드 부정 메시지
   */
  errorMessage?: string | null;
  /**
   * 입력필드 시간 카운트
   */
  time?: number | string;
  /**
   * Enter 키보드 클릭 이벤트
   */
  onPressEnter?: KeyboardEventHandler<HTMLInputElement>;
  /**
   * 입력 이벤트
   */
  onChange?: ChangeEventHandler<HTMLInputElement>;
  /**
   * blur 이벤트 처리
   */
  onBlur?: FocusEventHandler<HTMLInputElement>;
  /**
   * focus 이벤트
   */
  onFocus?: FocusEventHandler<HTMLInputElement>;
  /**
   * 입력값 초기화 이벤트
   */
  onClear?: () => void;
  onSearch?: (value: string | number | string[]) => void;
  options?: SelectOption[] | (string | number)[];
  value?: string | number | string[];
  textKey?: string;
  valueKey?: string;
  iconKey?: string;
  labelKey?: string;
  hasDelBtn?: boolean;
  onSelectOption?: (value: string) => void;
  onDeleteOption?: (value: string | number) => void;
  useSearchHistory?: boolean;
}
