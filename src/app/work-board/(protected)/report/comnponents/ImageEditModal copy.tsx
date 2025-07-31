"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImageEditModalProps } from "./types";
import { useImageRatioStore } from "@/hooks/store/useImageRatioStore";
import ImageEditToolbar from "./ImageEditToolbar";

export default function ImageEditModal({
  isOpen,
  onClose,
  imageUrls,
  selectedImageIndex = 0,
  onApply,
  targetFrame = { width: 400, height: 300, x: 100, y: 100 },
}: ImageEditModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(selectedImageIndex);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageTransform, setImageTransform] = useState({
    scale: 1,
    rotation: 0,
    translateX: 0,
    translateY: 0,
  });
  
  const { setTargetImageRatio, targetImageRatio } = useImageRatioStore();
  
  // targetFrame을 기반으로 targetImageRatio 계산 및 설정
  useEffect(() => {
    if (targetFrame && isOpen) {
      const calculatedRatio = {
        width: targetFrame.width,
        height: targetFrame.height,
        aspectRatio: targetFrame.width / targetFrame.height
      };
      
      console.log("🎯 targetFrame 정보:", targetFrame);
      console.log("📐 계산된 targetImageRatio:", calculatedRatio);
      console.log("📊 aspect ratio:", calculatedRatio.aspectRatio);
      
      setTargetImageRatio(calculatedRatio);
    }
  }, [targetFrame, isOpen, setTargetImageRatio]);
  
  // TailwindCSS aspect 클래스 계산  
  const getAspectClass = useCallback(() => {
    if (targetImageRatio) {
      const { width, height } = targetImageRatio;
      console.log("🖼️ 사용할 width, height:", width, height);
      console.log("📏 계산된 비율:", width / height);
      
      // 일반적인 비율들에 대해 표준 클래스 사용
      if (width === 16 && height === 9) return "aspect-video";
      if (width === 4 && height === 3) return "aspect-[4/3]";
      if (width === 3 && height === 4) return "aspect-[3/4]";
      if (width === 1 && height === 1) return "aspect-square";
      if (width === 9 && height === 16) return "aspect-[9/16]";
      
      // 커스텀 비율 - 소수점이 있을 수 있으므로 정수로 변환
      const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
      const divisor = gcd(Math.round(width), Math.round(height));
      const simplifiedWidth = Math.round(width) / divisor;
      const simplifiedHeight = Math.round(height) / divisor;
      
      console.log("🔢 간소화된 비율:", `${simplifiedWidth}/${simplifiedHeight}`);
      
      return `aspect-[${simplifiedWidth}/${simplifiedHeight}]`;
    }
    // 기본값 - targetFrame 기반으로 계산
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(targetFrame.width, targetFrame.height);
    const simplifiedWidth = targetFrame.width / divisor;
    const simplifiedHeight = targetFrame.height / divisor;
    
    console.log("🏠 기본값 사용 - targetFrame 기반 비율:", `${simplifiedWidth}/${simplifiedHeight}`);
    
    return `aspect-[${simplifiedWidth}/${simplifiedHeight}]`;
  }, [targetImageRatio, targetFrame]);

  // activeImageIndex 변경 시 선택된 이미지 인덱스 동기화
  useEffect(() => {
    setActiveImageIndex(selectedImageIndex);
    // 이미지 변경 시 변형 초기화
    setImageTransform({
      scale: 1,
      rotation: 0,
      translateX: 0,
      translateY: 0,
    });
  }, [selectedImageIndex]);

  // 편집 기능들
  const handleZoomIn = useCallback(() => {
    setImageTransform(prev => ({
      ...prev,
      scale: Math.min(prev.scale * 1.2, 5)
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setImageTransform(prev => ({
      ...prev,
      scale: Math.max(prev.scale * 0.8, 0.1)
    }));
  }, []);

  const handleRotateLeft = useCallback(() => {
    setImageTransform(prev => ({
      ...prev,
      rotation: prev.rotation - 15
    }));
  }, []);

  const handleRotateRight = useCallback(() => {
    setImageTransform(prev => ({
      ...prev,
      rotation: prev.rotation + 15
    }));
  }, []);

  const handleReset = useCallback(() => {
    setImageTransform({
      scale: 1,
      rotation: 0,
      translateX: 0,
      translateY: 0,
    });
  }, []);

  const handleRemoveBackground = useCallback(() => {
    alert("배경 제거 기능은 준비 중입니다.");
  }, []);

  const handleCrop = useCallback(() => {
    alert("크롭 기능은 준비 중입니다.");
  }, []);

  // 적용 버튼 핸들러
  const handleApply = useCallback(() => {
    if (!imageUrls[activeImageIndex]) {
      alert("선택된 이미지가 없습니다.");
      return;
    }

    // 현재 이미지 URL을 그대로 적용 (추후 변형 적용된 이미지로 변경 가능)
    onApply(imageUrls[activeImageIndex]);
    onClose();
  }, [activeImageIndex, imageUrls, onApply, onClose]);

  // 이벤트 전파 차단
  const handleStopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const currentImageUrl = imageUrls[activeImageIndex];
  const hasCurrentImage = !!currentImageUrl;

  // 이미지 변형 스타일 생성
  const getImageTransformStyle = useCallback(() => {
    const { scale, rotation, translateX, translateY } = imageTransform;
    return {
      transform: `scale(${scale}) rotate(${rotation}deg) translate(${translateX}px, ${translateY}px)`,
      transition: 'transform 0.3s ease',
    };
  }, [imageTransform]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="gap-y-4 max-w-[900px] p-6 z-[70]"
        style={{ zIndex: 70 }}
        onClick={handleStopPropagation}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-start">
            이미지 편집
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 툴바 */}
          <ImageEditToolbar
            isLoading={isLoading}
            hasCurrentImage={hasCurrentImage}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onRotateLeft={handleRotateLeft}
            onRotateRight={handleRotateRight}
            onReset={handleReset}
            onRemoveBackground={handleRemoveBackground}
            onCrop={handleCrop}
          />

          {/* 로딩 상태 */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">이미지를 불러오는 중...</div>
            </div>
          )}

          {/* 에러 상태 */}
          

          {/* 메인 이미지 표시 영역 */}
          {!isLoading && !imageError && hasCurrentImage && (
            <div className="flex justify-center items-center min-h-[300px] max-h-[500px] px-4">
              <div 
                className="image-outline bg-white border-2 border-dashed border-primary rounded-lg overflow-hidden max-w-full max-h-full"
                style={{
                  aspectRatio: `${targetFrame.width} / ${targetFrame.height}`,
                  width: 'min(100%, 600px)',
                  height: 'auto'
                }}
              >
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  <img
                    src={currentImageUrl}
                    alt={`이미지 ${activeImageIndex + 1}`}
                    className="max-w-full max-h-full object-contain"
                    style={getImageTransformStyle()}
                    onError={() => setImageError("이미지를 불러올 수 없습니다.")}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 이미지 썸네일 선택 */}
          {imageUrls.length > 1 && !isLoading && hasCurrentImage && (
            <div className="space-y-3">
              <div className="text-center text-sm text-gray-600 mb-2">
                이미지 선택 ({activeImageIndex + 1}/{imageUrls.length})
              </div>
              <div className="flex gap-3 justify-center flex-wrap max-h-32 py-4">
                {imageUrls.map((url, index) => (
                  <div
                    key={index}
                    className={`relative cursor-pointer transition-all duration-200 ${
                      activeImageIndex === index
                        ? "ring-2 ring-primary shadow-lg scale-105 rounded-lg"
                        : "hover:scale-105 hover:shadow-md rounded-lg"
                    }`}
                    onClick={() => setActiveImageIndex(index)}
                  >
                    <img
                      src={url}
                      alt={`이미지 ${index + 1}`}
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        // 썸네일 로딩 실패 시 placeholder 표시
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    {activeImageIndex === index && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex justify-center max-w-full text-base font-medium tracking-tight leading-none whitespace-nowrap gap-x-2">
            <div
              className="flex overflow-hidden flex-col justify-center px-5 py-3.5 text-gray-700 bg-gray-50 rounded-md border border-solid border-gray-300 max-md:px-5 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={onClose}
            >
              <div>취소</div>
            </div>
            <div
              className={`flex overflow-hidden flex-col justify-center px-5 py-3.5 text-white rounded-md cursor-pointer transition-colors ${
                isLoading || !hasCurrentImage 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-primary hover:bg-primary/80'
              }`}
              onClick={isLoading || !hasCurrentImage ? undefined : handleApply}
            >
              <div>적용</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
