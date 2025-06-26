import { Loader } from '@/components/common';
import React from 'react';
import { ImageProcessMessages } from '../const';

// 1) props 타입 정의
interface FastAiLoaderProps {
  selectValue: keyof typeof ImageProcessMessages;
}

// 2) props 구조분해 할당
const FastAiLoader: React.FC<FastAiLoaderProps> = ({ selectValue }) => {
  return (
    <Loader
      hasOverlay
      loadingMessage={ImageProcessMessages[selectValue]?.loading || 'AI작업중이에요. 잠시만 기다려주세요.'}
    />
  );
};

export default FastAiLoader;
