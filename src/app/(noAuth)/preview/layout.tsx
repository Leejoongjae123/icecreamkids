'use client';

import { PropsWithChildren, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

export default function PreviewLayout({ children }: PropsWithChildren) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const root = document.getElementById('modal-root');

    if (root) {
      // 자료 상세 용 스타일 설정
      root.style.position = 'fixed';
      root.style.top = '0';
      root.style.left = '0';
      root.style.width = '100vw';
      root.style.height = '100vh';
      root.style.zIndex = '1000';
    }
    setMounted(true);
    return () => {
      if (root) {
        // 스타일 제거
        root.removeAttribute('style');
      }
    };
  }, []);

  if (!mounted) return null;

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return ReactDOM.createPortal(children, modalRoot);
}
