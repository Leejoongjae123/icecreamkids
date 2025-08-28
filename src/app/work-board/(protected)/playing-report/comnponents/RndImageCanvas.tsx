"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Rnd } from "react-rnd";
import { useImageRatioStore } from "@/hooks/store/useImageRatioStore";

interface RndImageCanvasProps {
  imageUrl: string;
  targetFrame: { width: number; height: number; x?: number; y?: number };
  transform: {
    scale: number;
    rotation: number;
    translateX: number;
    translateY: number;
  };
  onTransformChange: (transform: {
    scale: number;
    rotation: number;
    translateX: number;
    translateY: number;
  }) => void;
  onLoadingChange: (loading: boolean) => void;
  onError: (error: string) => void;
  zoomTrigger?: { type: 'in' | 'out' | 'reset'; timestamp: number }; // 줌 제어용
}

export default function RndImageCanvas({
  imageUrl,
  targetFrame,
  transform,
  onTransformChange,
  onLoadingChange,
  onError,
  zoomTrigger,
}: RndImageCanvasProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 200, height: 200 });
  const imageRef = useRef<HTMLImageElement>(null);
  const { targetImageRatio } = useImageRatioStore();

  // 캔버스 크기 (targetFrame 기반)
  const canvasWidth = Math.max(targetFrame.width, 400);
  const canvasHeight = Math.max(targetFrame.height, 300);

  // 이미지 로드 처리
  useEffect(() => {
    if (!imageUrl) return;

    // 이미지가 변경될 때 상태 초기화
    setImageLoaded(false);
    onLoadingChange(true);
    const img = new Image();
    
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
      
      // 초기 크기 설정 (targetFrame에 맞춰서)
      let initialWidth = targetFrame.width * 0.8;
      let initialHeight = targetFrame.height * 0.8;
      
      // 이미지 비율 유지
      const imageAspectRatio = img.width / img.height;
      const targetAspectRatio = initialWidth / initialHeight;
      
      if (imageAspectRatio > targetAspectRatio) {
        initialHeight = initialWidth / imageAspectRatio;
      } else {
        initialWidth = initialHeight * imageAspectRatio;
      }
      
      setSize({ width: initialWidth, height: initialHeight });
      
      // 중앙 위치 설정
      setPosition({
        x: (canvasWidth - initialWidth) / 2,
        y: (canvasHeight - initialHeight) / 2
      });
      
      setImageLoaded(true);
      onLoadingChange(false);
    };
    
    img.onerror = () => {
      onError("이미지를 불러올 수 없습니다.");
      onLoadingChange(false);
    };
    
    img.src = imageUrl;
  }, [imageUrl, targetFrame, canvasWidth, canvasHeight, onLoadingChange, onError]);

  // 외부 줌 제어 처리
  useEffect(() => {
    if (!zoomTrigger || !imageLoaded) return;
    
    setSize(prevSize => {
      let newWidth = prevSize.width;
      let newHeight = prevSize.height;
      
      switch (zoomTrigger.type) {
        case 'in':
          newWidth = Math.min(prevSize.width * 1.2, canvasWidth * 1.5);
          newHeight = Math.min(prevSize.height * 1.2, canvasHeight * 1.5);
          break;
        case 'out':
          newWidth = Math.max(prevSize.width * 0.8, 50);
          newHeight = Math.max(prevSize.height * 0.8, 50);
          break;
        case 'reset':
          // targetFrame의 80% 크기로 리셋
          const imageAspectRatio = imageDimensions.width / imageDimensions.height;
          let resetWidth = targetFrame.width * 0.8;
          let resetHeight = targetFrame.height * 0.8;
          
          const targetAspectRatio = resetWidth / resetHeight;
          if (imageAspectRatio > targetAspectRatio) {
            resetHeight = resetWidth / imageAspectRatio;
          } else {
            resetWidth = resetHeight * imageAspectRatio;
          }
          
          newWidth = resetWidth;
          newHeight = resetHeight;
          
          // 위치도 중앙으로 리셋
          setPosition({
            x: (canvasWidth - newWidth) / 2,
            y: (canvasHeight - newHeight) / 2
          });
          break;
      }
      
      return { width: newWidth, height: newHeight };
    });
  }, [zoomTrigger, imageLoaded, canvasWidth, canvasHeight, targetFrame, imageDimensions]);

  // transform 변경사항을 부모로 전달
  useEffect(() => {
    if (!imageLoaded) return;
    
    // position과 size를 transform으로 변환
    const scaleX = size.width / (imageDimensions.width || 1);
    const scaleY = size.height / (imageDimensions.height || 1);
    const avgScale = (scaleX + scaleY) / 2; // 평균 스케일 사용
    
    onTransformChange({
      scale: avgScale,
      rotation: transform.rotation, // 회전은 별도 관리
      translateX: position.x,
      translateY: position.y,
    });
  }, [position, size, transform.rotation, imageDimensions, imageLoaded, onTransformChange]);

  // 드래그 핸들러
  const handleDrag = useCallback((e: any, d: { x: number; y: number }) => {
    setPosition({ x: d.x, y: d.y });
  }, []);

  // 리사이즈 핸들러
  const handleResize = useCallback((
    e: any,
    direction: any,
    ref: HTMLElement,
    delta: any,
    position: { x: number; y: number }
  ) => {
    const newWidth = parseInt(ref.style.width, 10);
    const newHeight = parseInt(ref.style.height, 10);
    
    setSize({ width: newWidth, height: newHeight });
    setPosition(position);
  }, []);

  if (!imageLoaded) {
    return (
      <div 
        className="flex items-center justify-center border-2 border-dashed border-gray-300 bg-gray-50"
        style={{ width: canvasWidth, height: canvasHeight }}
      >
        <div className="text-gray-500">이미지 로딩 중...</div>
      </div>
    );
  }

  return (
    <div 
      className="relative border border-gray-300 bg-white overflow-hidden"
      style={{ width: canvasWidth, height: canvasHeight }}
    >
      {/* 타겟 프레임 표시 (참고용) */}
      <div
        className="absolute border-2 border-blue-400 border-dashed opacity-30 pointer-events-none"
        style={{
          left: (canvasWidth - targetFrame.width) / 2,
          top: (canvasHeight - targetFrame.height) / 2,
          width: targetFrame.width,
          height: targetFrame.height,
        }}
      />
      
      {/* Rnd로 감싼 이미지 */}
      <Rnd
        position={position}
        size={size}
        onDrag={handleDrag}
        onResize={handleResize}
        bounds="parent"
        minWidth={20}
        minHeight={20}
        maxWidth={canvasWidth * 2}
        maxHeight={canvasHeight * 2}
        lockAspectRatio={true}
        enableResizing={{
          top: true,
          right: true,
          bottom: true,
          left: true,
          topRight: true,
          bottomRight: true,
          bottomLeft: true,
          topLeft: true,
        }}
        style={{
          border: "2px solid #3b82f6",
          borderRadius: "4px",
        }}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="편집할 이미지"
          className="w-full h-full object-cover"
          style={{
            transform: `rotate(${transform.rotation}deg)`,
            transformOrigin: "center center",
          }}
          draggable={false}
        />
      </Rnd>
      
      {/* 캔버스 정보 표시 */}
      <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
        {Math.round(size.width)} × {Math.round(size.height)}
      </div>
    </div>
  );
} 