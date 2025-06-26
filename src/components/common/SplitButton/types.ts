import { ButtonHTMLAttributes } from 'react';

type ButtonColor = 'black' | 'gray' | 'line' | 'primary';

type Option = {
  key: string | undefined;
  text: string;
  action: () => void;
};

export interface ISplitButton extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * buttonStyle
   */
  color?: ButtonColor;
  /**
   * 버튼크기
   */
  size?: 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge';

  /**
   * 커스텀 클래스명
   */
  className?: string;

  /**
   * 버튼타입
   */
  type?: 'submit' | 'reset' | 'button';

  /**
   * disabled
   */
  disabled?: boolean;

  /**
   * icon
   */
  icon?: string;
  /**
   * 버튼뒤에 붙는 아이콘
   */
  iconAfter?: string;
  /**
   * onClick 이벤트
   */
  onClick?: (e?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  options: Option[];
}
