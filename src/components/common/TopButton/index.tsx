import React, { useState, useEffect, useMemo } from 'react';
import cx from 'clsx';
import { usePathname } from 'next/navigation';
import { ITopButton } from '@/components/common/TopButton/types';

export function TopButton({ contents = 'TOP', isIndependent = true, targetClass = '' }: ITopButton) {
  // 우측 플로팅 메뉴바 관련
  const [isSticky, setIsSticky] = useState(false);
  const pathname = usePathname();

  const isHide = useMemo(() => {
    return pathname === '/introduce';
  }, [pathname]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (isHide) return;
    const handleScroll = () => {
      const targetItem = document.querySelector(targetClass ? `.${targetClass}` : '.floating-top');
      if (targetItem) {
        const topOffset = targetItem.getBoundingClientRect().top;
        setIsSticky(topOffset < 0);
      } else {
        const topOffset = window.pageYOffset;
        setIsSticky(topOffset > 500);
      }
    };
    window.addEventListener('scroll', handleScroll);

    // eslint-disable-next-line consistent-return
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {isIndependent && (
        <button type="button" className="btn-top" onClick={scrollToTop}>
          <span className="ico-comm ico-triangle-8" />
          {contents}
        </button>
      )}
      {!isIndependent && !isHide && (
        <div className={cx('floating-top-move', isSticky && 'sticky')} style={{ opacity: isSticky ? '1' : '0' }}>
          <button type="button" className="btn-top" onClick={scrollToTop}>
            &#x25b2; {contents}
          </button>
        </div>
      )}
    </>
  );
}

TopButton.displayName = 'TopButton';
export default TopButton;
