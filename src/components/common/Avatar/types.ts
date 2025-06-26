import { StaticImport } from 'next/dist/shared/lib/get-img-props';

/**
 * 프로필 이미지 컴포넌트의 props 타입 정의
 *
 * @interface IAvatar
 * @property {string | StaticImport} [src] - 프로필 이미지 경로 (기본값: `/images/profile.png`)
 * @property {boolean} [icon=false] - 아이콘 여부 (기본값: false)
 * @property {number} [height] - 이미지 높이 (기본값: 40)
 * @property {number} [width] - 이미지 너비 (기본값: 40)
 * @property {string} [classNames] - 추가적인 CSS 클래스
 */
export interface IAvatar {
  src?: string | StaticImport;
  icon?: boolean;
  height?: number;
  width?: number;
  classNames?: string;
}
