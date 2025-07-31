"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImageEditModalProps } from "./types";
import { useImageRatioStore } from "@/hooks/store/useImageRatioStore";
import { useImageEditModalStore } from "@/hooks/store/useImageEditModalStore";
// import { useDndContext } from "@/context/DnDContext"; // DnD 관련 코드 제거
import ImageEditToolbar from "./ImageEditToolbar";
import ImageThumbnailList from "./ImageThumbnailList";
import dynamic from "next/dynamic";
import type { KonvaCanvasRef } from "./KonvaCanvas";

// KonvaCanvas를 동적 임포트로 변경 - SSR 비활성화
const KonvaCanvas = dynamic(() => import("./KonvaCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-gray-500">이미지 편집기 로딩 중...</div>
    </div>
  ),
});

export default function ImageEditModal({
  isOpen,
  onClose,
  imageUrls: initialImageUrls,
  selectedImageIndex = 0,
  onApply,
  onImageOrderChange,
  targetFrame = { width: 400, height: 300, x: 100, y: 100 },
}: ImageEditModalProps) {
  const [imageUrls, setImageUrls] = useState(initialImageUrls);
  const [activeImageIndex, setActiveImageIndex] = useState(selectedImageIndex);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const canvasRef = useRef<KonvaCanvasRef>(null);
  
  const { setTargetImageRatio, targetImageRatio } = useImageRatioStore();
  const { setImageEditModalOpen } = useImageEditModalStore();
  // const { enableDnd, disableDnd } = useDndContext(); // DnD 관련 코드 제거
  console.log("useImageEditModalStore", useImageEditModalStore);
  // imageUrls가 변경될 때 상태 업데이트
  useEffect(() => {
    setImageUrls(initialImageUrls);
  }, [initialImageUrls]);

  // 디버깅: 컴포넌트 렌더링 확인 - 개발 환경에서만 실행
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("🎨 ImageEditModal 렌더링 상태:", {
        isOpen,
        imageUrlsLength: imageUrls?.length,
        selectedImageIndex,
        targetFrame
      });
    }
  }, [isOpen]); // 의존성 최소화

  // 모달 열림/닫힘 상태를 전역 store에 반영 - 무한 루프 방지
  useEffect(() => {
    setImageEditModalOpen(isOpen);
  }, [isOpen, setImageEditModalOpen]);
  
  // targetFrame을 기반으로 targetImageRatio 계산 및 설정 - 무한 루프 방지
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
      
      // 이미 같은 값이 설정되어 있는지 확인하여 무한 루프 방지
      if (!targetImageRatio || 
          Math.abs(targetImageRatio.width - calculatedRatio.width) > 0.01 || 
          Math.abs(targetImageRatio.height - calculatedRatio.height) > 0.01) {
        setTargetImageRatio(calculatedRatio);
      }
    }
  }, [targetFrame.width, targetFrame.height, isOpen, setTargetImageRatio]); // targetImageRatio 의존성 제거
  
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
  }, [selectedImageIndex]);

  // 모달이 열릴 때 초기 상태 설정
  useEffect(() => {
    if (isOpen) {
      setActiveImageIndex(selectedImageIndex);
      if (imageUrls && imageUrls[selectedImageIndex]) {
        setIsLoading(true);
        setImageError(null);
      } else {
        setIsLoading(false);
        setImageError("이미지를 찾을 수 없습니다.");
      }
    }
  }, [isOpen, selectedImageIndex]); // imageUrls 의존성 추가

  // 편집 기능들
  const handleZoomIn = useCallback(() => {
    canvasRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    canvasRef.current?.zoomOut();
  }, []);

  const handleRotateLeft = useCallback(() => {
    canvasRef.current?.rotateLeft();
  }, []);

  const handleRotateRight = useCallback(() => {
    canvasRef.current?.rotateRight();
  }, []);

  const handleReset = useCallback(() => {
    canvasRef.current?.reset();
  }, []);

  const handleRemoveBackground = useCallback(() => {
    alert("배경 제거 기능은 준비 중입니다.");
  }, []);

  const handleCrop = useCallback(() => {
    alert("크롭 기능은 준비 중입니다.");
  }, []);

  // 이미지 순서 변경 핸들러
  const handleImageOrderChange = useCallback((fromIndex: number, toIndex: number) => {
    const newImageUrls = [...imageUrls];
    const [movedImage] = newImageUrls.splice(fromIndex, 1);
    newImageUrls.splice(toIndex, 0, movedImage);
    
    setImageUrls(newImageUrls);
    
    // 현재 활성 이미지 인덱스 조정
    let newActiveIndex = activeImageIndex;
    if (activeImageIndex === fromIndex) {
      newActiveIndex = toIndex;
    } else if (activeImageIndex > fromIndex && activeImageIndex <= toIndex) {
      newActiveIndex = activeImageIndex - 1;
    } else if (activeImageIndex < fromIndex && activeImageIndex >= toIndex) {
      newActiveIndex = activeImageIndex + 1;
    }
    
    setActiveImageIndex(newActiveIndex);
    
    // 부모 컴포넌트에 순서 변경 알림
    if (onImageOrderChange) {
      onImageOrderChange(newImageUrls);
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log("📋 이미지 순서 변경:", {
        from: fromIndex,
        to: toIndex,
        oldActiveIndex: activeImageIndex,
        newActiveIndex,
        newUrls: newImageUrls.map((url, idx) => `${idx}: ${url.slice(-20)}`)
      });
    }
  }, [imageUrls, activeImageIndex, onImageOrderChange]);

  // 적용 버튼 핸들러
  const handleApply = useCallback(() => {
    if (!imageUrls[activeImageIndex]) {
      alert("선택된 이미지가 없습니다.");
      return;
    }

    // 편집된 이미지 데이터 추출
    const croppedImageData = canvasRef.current?.getCroppedImageData();
    if (croppedImageData) {
      // 편집된 이미지를 적용
      onApply(croppedImageData);
    } else {
      // 편집 데이터가 없으면 원본 이미지 적용
      onApply(imageUrls[activeImageIndex]);
    }
    onClose();
  }, [activeImageIndex, imageUrls, onApply, onClose]);

  // 이벤트 전파 차단
  const handleStopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const currentImageUrl = imageUrls[activeImageIndex];
  const hasCurrentImage = !!currentImageUrl;

  // 디버깅용 로그 - 개발 환경에서만
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("🔄 상태 변화:", {
        isLoading,
        imageError,
        hasCurrentImage,
        activeImageIndex,
        currentImageUrl: currentImageUrl ? "있음" : "없음",
        totalImages: imageUrls.length
      });
    }
  }, [isLoading, imageError, hasCurrentImage, activeImageIndex, currentImageUrl, imageUrls.length]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
      <DialogContent
        className="gap-y-4 max-w-[900px] p-6 z-[9999]"
        style={{ zIndex: 9999 }}
        onClick={handleStopPropagation}
        onPointerDownOutside={(e) => e.preventDefault()} // 외부 클릭 시 닫히지 않도록
        onDragStart={(e) => e.stopPropagation()} // 드래그 이벤트 전파 차단
        onDragOver={(e) => e.stopPropagation()}
        onDrop={(e) => e.stopPropagation()}
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
            <div className="flex justify-center items-center min-h-[400px] px-2">
              <div className="relative">
                {/* Canvas 컨테이너 - 고정 크기지만 반응형으로 조정 */}
                <div 
                  className="relative  rounded-lg overflow-hidden "
                  style={{ 
                    width: 'min(800px, 90vw)', 
                    height: 'min(600px, 67.5vw)', 
                    maxWidth: '600px',
                    maxHeight: '400px',
                    aspectRatio: '4/3'
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <KonvaCanvas
                      ref={canvasRef}
                      imageUrl={currentImageUrl}
                      targetFrame={targetFrame}
                      onImageLoad={() => setIsLoading(false)}
                      onImageError={(error: string) => {
                        setImageError(error);
                        setIsLoading(false);
                      }}
                    />
                  </div>
                  
                  {/* 타겟 프레임 오버레이 - 중앙에 배치된 추출 영역 */}
                  <div 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
                    style={{
                      width: 'min(400px, 70%)',
                      aspectRatio: `${targetFrame.width} / ${targetFrame.height}`,
                    }}
                  >
                    <div className="w-full h-full border-2 border-dashed border-primary bg-transparent rounded-lg relative">
                      {/* 코너 마커 */}
                      
                      
                      {/* 중앙 레이블 */}
                      <div className="absolute top-2 left-2 bg-primary text-white px-2 py-1 rounded text-xs font-medium shadow-sm">
                        추출 영역
                      </div>
                    </div>
                  </div>
                  

                </div>
                
                {/* 안내 텍스트 */}

              </div>
            </div>

          {/* 이미지 썸네일 선택 */}
          <ImageThumbnailList
            imageUrls={imageUrls}
            activeImageIndex={activeImageIndex}
            onImageSelect={setActiveImageIndex}
            onImageOrderChange={handleImageOrderChange}
            isLoading={isLoading}
            hasCurrentImage={hasCurrentImage}
          />

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
