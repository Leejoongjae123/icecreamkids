"use client";

import React from 'react';

interface MemoIndicatorProps {
  show: boolean;
}

/**
 * 이미지에 메모가 있을 때 우측하단에 표시되는 28x28 사각형 인디케이터
 * @param show - 인디케이터 표시 여부
 */
export const MemoIndicator = ({ show }: MemoIndicatorProps) => {
  if (!show) {
    return null;
  }

  return (
    <div 
      className="absolute bottom-2 right-2 w-7 h-7 bg-primary rounded opacity-80 flex items-center justify-center"
      style={{
        width: '28px',
        height: '28px',
      }}
    >
      <img
        src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/memo.png"
        alt="메모 아이콘"
        className="w-full h-full"
        style={{
          width: '16px',
          height: '16px',
        }}
      />
    </div>
  );
};

export default MemoIndicator;
