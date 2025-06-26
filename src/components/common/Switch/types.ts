import { ChangeEvent } from 'react';

export interface ISwitch {
  /**
   * size
   */
  size?: 'small' | 'large';
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
  label: string;
  /**
   * label 숨김여부
   */
  labHidden?: boolean;
  /**
   * checked
   */
  checked?: boolean;
  /**
   * disabled
   */
  disabled?: boolean;
  /**
   * onChange 이벤트
   */
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}
