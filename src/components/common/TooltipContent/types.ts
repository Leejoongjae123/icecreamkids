export interface ITooltipBase {
  /**
   * 컬러 타입
   */
  colorType?: 'default' | 'dark';
  /**
   * 사이즈 타입
   */
  sizeType?: 'default' | 'small';
  /**
   * 꼬리 방향
   */
  position?: 'left' | 'right' | 'top' | 'bottom';
  /**
   * 타이틀 텍스트
   */
  title?: string;
  /**
   * 서브 텍스트
   */
  sub?: string;
  /**
   * 컨텐츠 텍스트
   */
  contents: string;
  isShow?: boolean;
}
