"use client";

import React from 'react';
import { MemoIndicatorProps } from './types';

/**
 * 이미지에 메모가 있을 때 우측하단에 표시되는 28x28 사각형 인디케이터
 * 클릭하면 메모 편집 모달이 열림
 */
export const MemoIndicator = ({ show, onMemoClick }: MemoIndicatorProps) => {
  if (!show) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 상위 요소의 클릭 이벤트 방지
    onMemoClick?.();
  };

  return (
    <div 
      className="absolute bottom-2 right-2 w-7 h-7 bg-primary rounded opacity-80 flex items-center justify-center cursor-pointer hover:opacity-100 transition-opacity"
      style={{
        width: '28px',
        height: '28px',
      }}
      onClick={handleClick}
      title="메모 보기/편집"
    >
      <img
        src="/report/memo.png"
        alt="메모 아이콘"
        className="w-full h-full pointer-events-none"
        style={{
          width: '16px',
          height: '16px',
        }}
      />
    </div>
  );
};

export default MemoIndicator;
