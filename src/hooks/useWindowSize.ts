'use client';

import { useState, useEffect } from 'react';

type WindowSizeType = {
  width: number | undefined;
  height: number | undefined;
};

export default function useWindowSize() {
  const [windowSize, setWindowSize] = useState<WindowSizeType>({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    // 최초 마운트 시 사이즈 설정
    handleResize();

    // 리사이즈 이벤트 리스너 등록
    window.addEventListener('resize', handleResize);

    // 언마운트 시 리스너 제거 (cleanup)
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}
