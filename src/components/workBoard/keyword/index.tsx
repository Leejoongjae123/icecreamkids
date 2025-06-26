import { Button, Input } from '@/components/common';
import { useRef } from 'react';
import { useGetRecommendationKeyword } from '@/service/file/fileStore';
import type { IKeywordUpdateFn } from './types';

const MAX_LENGTH = 30; // 최대 30자 제한

const sanitizeInput = (value: string) => {
  let sanitizedValue = value.replace(/[^가-힣a-zA-Z0-9, ]/g, ''); // 한글, 영어, 숫자, 콤마, 띄어쓰기만 허용
  sanitizedValue = sanitizedValue.replace(/,{2,}/g, ','); // 연속된 콤마 두 개 이상을 하나로 변환
  return sanitizedValue;
};

export default function KeywordInput({ onUpdateKeyword }: IKeywordUpdateFn) {
  const keywordRef = useRef<HTMLInputElement>(null);
  // 추천키워드 호출
  const { data: keywordData } = useGetRecommendationKeyword();
  const keywordList = keywordData?.result || [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { isComposing } = e.nativeEvent as InputEvent;
    const { value } = e.target;

    if (!isComposing) {
      const sanitizedValue = sanitizeInput(value);
      if (sanitizedValue.length > MAX_LENGTH) {
        alert('최대 30자를 초과할 수 없습니다.');
        return;
      }
      if (!keywordRef.current) return;
      keywordRef.current.value = sanitizedValue;
    }
  };

  // 값 없데이트 함수
  const handleUpdateKeyword = (valueList: string[]) => {
    onUpdateKeyword(valueList);
  };

  // input 포커스 아웃시, 값 올림
  const handleBlur = () => {
    if (!keywordRef.current) return;
    const newKeyword = keywordRef.current.value.trim();
    handleUpdateKeyword(newKeyword.split(','));
  };

  // 추천키워드 클릭
  const handleClickRecommended = (selectKeyword: string) => {
    if (!keywordRef.current) return;
    // 현재 키워드들 배열로 구분처리 (중복체크용)
    const currentKeywords = keywordRef.current.value
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    // 이미 있는 키워드는 추가 안함
    if (currentKeywords.includes(selectKeyword)) return;

    const newKeywords = [...currentKeywords, selectKeyword];
    const newKeywordString = newKeywords.join(', ');
    if (newKeywordString.length > MAX_LENGTH) {
      alert('최대 30자를 초과할 수 없습니다.');
      return;
    }

    if (keywordRef.current && newKeywordString !== keywordRef.current.value) {
      keywordRef.current.value = newKeywordString;
      handleUpdateKeyword(newKeywords);
    }
  };

  return (
    <div className="item-preset preset-type2">
      <strong className="title-preset">놀이 키워드</strong>
      <div className="item-text type-small">
        <div className="inner-text">
          <Input
            type="text"
            id="keywordInput"
            ref={keywordRef}
            style={{ width: '400px' }}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder="키워드를 입력해 주세요."
            maxLength={30}
          />
        </div>
      </div>
      <div className="group-keyword">
        {keywordList.map((val) => (
          <button type="button" onClick={() => handleClickRecommended(val)} key={val} className="btn-keyword">
            {val}
          </button>
        ))}
      </div>
    </div>
  );
}
