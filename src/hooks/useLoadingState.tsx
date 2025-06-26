/**
 * * @description 로딩 상태를 관리하는 커스텀 훅
 * @param loadingStatesInput 로딩 상태 배열
 * @returns 로딩 상태 객체
 * @example
 * const loadingStates = [
 *  { name: 'Data Fetching', isLoading: true, message: '데이터를 가져오는 중...' },
 * { name: 'Image Upload', isLoading: false },
 * { name: 'File Upload', isLoading: true, message: '파일을 업로드하는 중...' },
 * ];
 * const { isLoading, message } = useLoadingState(loadingStates);
 * if (isLoading) {
 *  return <Loader hasOverlay loadingMessage={message} />;
 * }
 */

import { useMemo } from 'react';

interface LoadingState {
  isLoading: boolean;
  message?: string | null;
}

interface LoadingStateItem extends LoadingState {
  name: string;
  priority?: number; // 우선순위 추가 (낮을수록 높은 우선순위)
}

export function useLoadingState(loadingStatesInput: LoadingStateItem[]): LoadingState {
  // loadingStates의 각 항목의 isLoading 상태를 직접 확인
  const isAnyLoading = loadingStatesInput.some((state) => state.isLoading);

  // 우선순위에 따라 메시지 선택 (메모이제이션 적용)
  const message = useMemo(() => {
    if (!isAnyLoading) return null;

    // 로딩 중인 항목들 필터링
    const activeLoadingStates = loadingStatesInput.filter((state) => state.isLoading);

    // 우선순위가 설정된 경우 우선순위에 따라 정렬
    const sortedStates = [...activeLoadingStates].sort(
      (a, b) => (a.priority ?? Number.MAX_SAFE_INTEGER) - (b.priority ?? Number.MAX_SAFE_INTEGER),
    );

    // 첫 번째(가장 우선순위가 높은) 항목의 메시지 반환
    if (sortedStates.length > 0) {
      return sortedStates[0].message || `${sortedStates[0].name} 로딩 중...`;
    }

    return null;
  }, [isAnyLoading, loadingStatesInput]);

  return { isLoading: isAnyLoading, message };
}
