'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { debounce } from '@/utils';
import { useFileContext } from '@/context/fileContext';

interface UseWindowScrollProps {
  scrollDirection?: string;
  hideHeader?: boolean;
  setScrollDirection?: (direction: string) => void; // 최대갯수 제한 필요할경우 (놀이보고서!)
  setHideHeader?: (isHide: boolean) => void; // 최대갯수 제한 필요할경우 (놀이보고서!)
  setIsHeaderFixed?: (isFixed: boolean) => void; // 최대갯수 제한 필요할경우 (놀이보고서!)
}

export const useWindowScroll = ({
  scrollDirection,
  hideHeader,
  setScrollDirection,
  setHideHeader,
  setIsHeaderFixed,
}: UseWindowScrollProps) => {
  const [scrollY, setScrollY] = useState(0);

  const setTimeObj = useRef<string | number | NodeJS.Timeout | null | undefined>(null);

  // 헤더 스크롤 중지 이벤트
  const { stopHeaderScroll } = useFileContext();

  // timeout 초기화
  const clearSetTimeout = useCallback(() => {
    if (setTimeObj?.current) {
      clearTimeout(setTimeObj.current);
      setTimeObj.current = null;
    }
    setHideHeader?.(false);
  }, [setHideHeader]);

  // 해더 숨기기
  const hideAppHeader = useCallback(
    (direction: string = '', delayTime: number = 200) => {
      return setTimeout(async () => {
        await setScrollDirection?.(direction);
        await clearSetTimeout();
        await setHideHeader?.(false);
      }, delayTime);
    },
    [clearSetTimeout, setHideHeader, setScrollDirection],
  );

  const debounceDirectionUp = useMemo(
    (delay: number = 200, delayTime: number = 400) => {
      const callBack = () => {
        clearSetTimeout();
        const setTimeoutItem = setTimeout(() => {
          clearSetTimeout();
          if (!hideHeader) {
            setHideHeader?.(true);
          }
          setTimeObj.current = hideAppHeader('');
        }, delayTime);
        setTimeObj.current = setTimeoutItem;
      };
      return debounce(callBack, delay);
    },
    [clearSetTimeout, hideAppHeader, hideHeader, setHideHeader],
  );

  const clearHideTimeout = useCallback(async () => {
    setHideHeader?.(false);
    await clearSetTimeout();
  }, [clearSetTimeout, setHideHeader]);

  const setHideTimeout = useCallback(async () => {
    await debounceDirectionUp(200);
  }, [debounceDirectionUp]);

  useEffect(() => {
    const lastScrollY = scrollY;
    const scrollMoveEvent = async () => {
      const bodyItem = document.querySelector('body');
      const bodyItemHeight = bodyItem?.offsetHeight || 1000;
      if (!stopHeaderScroll) {
        const direction = lastScrollY < window.scrollY ? 'down' : 'up';
        if (bodyItemHeight - 5 < window.scrollY) {
          setIsHeaderFixed?.(true);
        } else {
          setIsHeaderFixed?.(false);
        }
        setScrollY(window.scrollY);
        if (window.scrollY > 80) {
          if (direction === 'down') {
            const headerItem = document.querySelector('header.doc-header');
            if (!headerItem?.classList?.contains('hover')) {
              setTimeObj.current = hideAppHeader();
            }
          }
          if (direction === 'up') {
            await clearSetTimeout();
            if (scrollDirection !== 'up') {
              await setScrollDirection?.(direction);
            }
            debounceDirectionUp(600, 200);
          }
        } else {
          hideAppHeader('', 0);
        }
      }
    };

    const handleScroll = async () => {
      scrollMoveEvent();
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollY, stopHeaderScroll]);

  return {
    clearHideTimeout,
    setHideTimeout,
  };
};
