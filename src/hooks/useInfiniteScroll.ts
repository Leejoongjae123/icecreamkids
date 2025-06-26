import { useEffect, useState, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  callback: () => void;
  threshold?: number;
  root?: HTMLElement | null;
  rootMargin?: string;
  excludedClass?: string; // 감지 제외 클래스
}

export const useInfiniteScroll = ({
  callback,
  threshold = 0.1,
  root = null,
  rootMargin = '0px 0px 175px 0px', // foooter 높이 만큼 제외
  excludedClass = '.doc-footer', // 감지에서 제외할 요소 기본값: 푸터
}: UseInfiniteScrollOptions) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  /**
   *
   *  감지 요소가 뷰포트에 들어올 때 콜백 실행
   *  특정 요소와 겹치면 감지되지 않도록 예외 처리
   */
  const observerCallback: IntersectionObserverCallback = useCallback(
    (entries) => {
      const [entry] = entries;
      const element = document.querySelector(excludedClass);
      if (element && entry.boundingClientRect.bottom > element.getBoundingClientRect().top) {
        return;
      }
      if (entry.isIntersecting) {
        setIsIntersecting(true);
        callback();
      } else {
        setIsIntersecting(false);
      }
    },
    [callback, excludedClass],
  );

  useEffect(() => {
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(observerCallback, {
        root,
        rootMargin,
        threshold,
      });
    }
    return () => {
      observerRef.current?.disconnect();
    };
  }, [observerCallback, root, rootMargin, threshold]);
  /**
   * 감지 대상으로 등록
   * @param element 감지할 요소
   */
  const observe = (element: HTMLElement | null) => {
    if (element) {
      observerRef.current?.observe(element);
    }
  };

  return { observe, isIntersecting };
};
