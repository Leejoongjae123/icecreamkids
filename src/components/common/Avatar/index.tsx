import React, { FC, PropsWithChildren } from 'react';
import Image from 'next/image';
import { IAvatar } from '@/components/common/Avatar/types';

/**
 * 프로필 이미지를 렌더링하는 컴포넌트
 *
 * @component
 * @param {string | StaticImport} [src='/images/profile.png'] - 프로필 이미지 경로 (기본값: `/images/profile.png`)
 * @param {boolean} [icon=false] - 프로필 아이콘 여부
 * @param {number} [height=48] - 이미지 높이 (기본값: 아이콘-48, 130)
 * @param {number} [width=48] - 이미지 너비 (기본값: 아이콘-48, 130)
 * @param {string} [classNames] - 추가적인 CSS 클래스
 * @param {React.ReactNode} [children] - 프로필 이미지 아래 추가적으로 렌더링할 요소
 * @returns {JSX.Element} 프로필 이미지 컴포넌트
 */
export const Avatar: FC<PropsWithChildren<IAvatar>> = ({
  src = '/images/profile.png',
  icon = false,
  height = icon ? 48 : 130,
  width = icon ? 48 : 130,
  classNames = '',
  children,
}: PropsWithChildren<IAvatar>) => {
  const isPriority = src === '/images/profile.png';
  const loadingType = !isPriority ? 'eager' : undefined;
  const renderImage = (
    <Image
      src={src}
      className="img-user"
      width={width}
      height={height}
      alt="프로필 이미지"
      priority={isPriority}
      loading={loadingType}
      style={{ borderRadius: '50%' }}
    />
  );

  return (
    <div className={classNames}>
      {src && src !== 'string' && renderImage}
      {children}
    </div>
  );
};

Avatar.displayName = 'Avatar';
export default Avatar;
