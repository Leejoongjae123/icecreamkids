// src/hooks/useKeyword.ts
import { useState, useRef } from 'react';
import { useGetRecommendationKeyword } from '@/service/file/fileStore';

interface UseKeywordProps {
  maxLength?: number;
  onKeywordChange?: (keywords: string[]) => void;
}

export function useRecommendedKeywordManager({ maxLength = 30, onKeywordChange }: UseKeywordProps = {}) {
  // 입력 필드 참조와 상태 관리
  const keywordInputRef = useRef<HTMLInputElement>(null);
  const [inputKeyword, setInputKeyword] = useState<string>('');
  const [selectedKeyword, setSelectedKeyword] = useState<string[]>([]);

  // API로부터 추천 키워드 가져오기
  const { data: keywordData } = useGetRecommendationKeyword();
  const recommendedKeywords = keywordData?.result || [];

  // 입력값 정제 함수
  const sanitizeKeywordInput = (value: string) => {
    // 연속된 콤마 두 개 이상을 하나로 변환
    return value.replace(/,{2,}/g, ',');
  };

  // 키워드 입력 변경 처리
  const handleKeywordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { isComposing } = e.nativeEvent as InputEvent;
    const { value } = e.target;

    // 조합 중일 때는 필터링을 건너뛰고 그대로 허용
    if (isComposing) {
      setInputKeyword(value);
      return;
    }

    // 조합이 완료된 후에만 필터링 적용
    const sanitizedValue = sanitizeKeywordInput(value);
    if (sanitizedValue.length > maxLength) {
      alert(`최대 ${maxLength}자를 초과할 수 없습니다.`);
      return;
    }
    setInputKeyword(sanitizedValue);
  };

  // 포커스 아웃 시 키워드 업데이트
  const handleKeywordBlur = () => {
    const newKeywords = inputKeyword.trim().split(',').filter(Boolean);
    setSelectedKeyword(newKeywords);

    // 부모 컴포넌트에 변경 알림
    if (onKeywordChange) {
      onKeywordChange(newKeywords);
    }
  };

  // 추천 키워드 클릭 시 처리
  const handleRecommendedKeywordClick = (clickedKeyword: string) => {
    // 현재 키워드들 배열로 구분처리 (중복체크용)
    const currentKeywords = inputKeyword
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    // 이미 있는 키워드는 추가 안함
    if (currentKeywords.includes(clickedKeyword)) return;

    const newKeywords = [...currentKeywords, clickedKeyword];
    const newKeywordString = newKeywords.join(', ');

    if (newKeywordString.length > maxLength) {
      alert(`최대 ${maxLength}자를 초과할 수 없습니다.`);
      return;
    }

    setInputKeyword(newKeywordString);
    setSelectedKeyword(newKeywords);

    // 부모 컴포넌트에 변경 알림
    if (onKeywordChange) {
      onKeywordChange(newKeywords);
    }
  };

  return {
    keywordInputRef,
    inputKeyword,
    selectedKeyword,
    recommendedKeywords,
    handleKeywordInputChange,
    handleKeywordBlur,
    handleRecommendedKeywordClick,
    setInputKeyword,
    setSelectedKeyword,
  };
}
