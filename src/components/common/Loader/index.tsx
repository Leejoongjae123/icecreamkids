import Image from 'next/image';
import type React from 'react';
import { useEffect } from 'react';

type ILoaderProps = {
  hasOverlay?: boolean;
  loadingMessage?: string | null;
  opacity?: number;
  blur?: number;
  isAbsolute?: boolean;
  scrollContainerSelector?: string | null /** 스크롤을 잠글 컨테이너 ID (없으면 전체 페이지 잠금) */;
  disableBodyScroll?: boolean;
  isDark?: boolean;
};

export const Loader = ({
  hasOverlay = false,
  loadingMessage = '로딩 중입니다.',
  opacity = 0.25,
  blur = 0.25,
  isAbsolute = false,
  scrollContainerSelector,
  disableBodyScroll = true,
  isDark = true,
}: ILoaderProps) => {
  useEffect(() => {
    let cleanup = () => {};

    // 스크롤 잠금 대상 선택자 있으면 querySelector, 없으면 body
    const container = scrollContainerSelector
      ? document.querySelector<HTMLElement>(scrollContainerSelector)
      : document.body;

    if (container) {
      // 이전 스타일 백업
      const prevOverflow = container.style.overflow;
      let prevPaddingRight: string | null = null;

      // 전체 body 잠글 때만 스크롤바 보정
      if (container === document.body) {
        prevPaddingRight = document.body.style.paddingRight;
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        if (scrollbarWidth > 0) {
          document.body.style.paddingRight = `${scrollbarWidth}px`;
        }
      }

      // // 실제 잠금
      // container.style.overflow = 'hidden';

      // cleanup 에서 복구
      cleanup = () => {
        // container.style.overflow = prevOverflow;
        if (container === document.body && prevPaddingRight !== null) {
          document.body.style.paddingRight = prevPaddingRight;
        }
      };
    }

    return () => {
      cleanup();
    };
  }, [scrollContainerSelector]);
  const isDarkText = isDark ? '#FFE742' : '#FBB347';

  const overlayStyle: React.CSSProperties = hasOverlay
    ? {
        position: isAbsolute ? 'absolute' : 'fixed',
        backgroundColor: `rgba(${isDark ? '0,0,0' : '255, 255, 255'}, ${opacity || 0.7})`,
        backdropFilter: `blur(${blur || 1.5}px)`, // 블러 효과 조절 가능하게 수정
        WebkitBackdropFilter: `blur(${blur || 1.5}px)`, // Safari 지원
      }
    : {};

  return (
    <>
      <style>
        {/* 모달 켜짐 시 스크롤 비활성화 */}
        {disableBodyScroll &&
          `
        body {
          overflow: hidden;
        }
      `}
      </style>
      <div className="loader_wrap" style={overlayStyle}>
        <div className="loading-box">
          <Image src="/images/loading_img.svg" alt="" className="img-loading" priority width="50" height="50" />
        </div>
        {loadingMessage && (
          <p className="txt-loader" style={{ color: isDarkText }}>
            {loadingMessage}
          </p>
        )}
      </div>
    </>
  );
};

Loader.displayName = 'Loader';
export default Loader;