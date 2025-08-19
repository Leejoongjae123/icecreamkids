"use client";
import { useEffect, useCallback, useRef } from 'react';

interface MousePosition {
  x: number;
  y: number;
}

interface UseMousePositionTrackerOptions {
  enabled?: boolean;
  throttleMs?: number;
  containerRef: React.RefObject<HTMLElement>;
}

/**
 * 마우스 위치를 추적하여 스티커 저장시 사용되는 좌표계로 변환하여 console.log로 출력하는 훅
 * @param options 옵션 객체
 * @param options.enabled 추적 활성화 여부 (기본값: true)
 * @param options.throttleMs 출력 쓰로틀링 시간 (기본값: 100ms)
 * @param options.containerRef 좌표계 기준이 되는 컨테이너 ref
 */
export const useMousePositionTracker = ({
  enabled = true,
  throttleMs = 100,
  containerRef
}: UseMousePositionTrackerOptions) => {
  const lastLogTime = useRef<number>(0);
  const isTrackingRef = useRef<boolean>(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!enabled || !containerRef.current) {
      return;
    }

    const now = Date.now();
    
    // 쓰로틀링: 지정된 시간 간격으로만 로그 출력
    if (now - lastLogTime.current < throttleMs) {
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    
    // 스티커 저장시 사용되는 좌표계와 동일하게 계산
    // containerRef의 상단 왼쪽 모서리를 (0, 0)으로 하는 픽셀 단위 좌표
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;

    // 컨테이너 영역 내부에 있을 때만 출력
    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;

    if (mouseX >= 0 && mouseX <= containerWidth && mouseY >= 0 && mouseY <= containerHeight) {
      // 스티커 좌표계와 동일한 형태로 출력
      console.log(`마우스 위치 - X: ${Math.round(mouseX)}px, Y: ${Math.round(mouseY)}px`);
      lastLogTime.current = now;
    }
  }, [enabled, throttleMs, containerRef]);

  const startTracking = useCallback(() => {
    if (!isTrackingRef.current && enabled) {
      isTrackingRef.current = true;
      document.addEventListener('mousemove', handleMouseMove);
      console.log('🖱️ 마우스 위치 추적 시작 (스티커 좌표계 기준)');
    }
  }, [enabled, handleMouseMove]);

  const stopTracking = useCallback(() => {
    if (isTrackingRef.current) {
      isTrackingRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      console.log('🖱️ 마우스 위치 추적 종료');
    }
  }, [handleMouseMove]);

  const toggleTracking = useCallback(() => {
    if (isTrackingRef.current) {
      stopTracking();
    } else {
      startTracking();
    }
  }, [startTracking, stopTracking]);

  // 컴포넌트 언마운트시 이벤트 리스너 정리
  useEffect(() => {
    return () => {
      if (isTrackingRef.current) {
        document.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [handleMouseMove]);

  return {
    startTracking,
    stopTracking,
    toggleTracking,
    isTracking: isTrackingRef.current
  };
};

export default useMousePositionTracker;
