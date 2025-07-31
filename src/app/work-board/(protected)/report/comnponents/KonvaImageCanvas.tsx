"use client";

import { useRef, useEffect, useState, useCallback } from "react";
// 동적 임포트를 위해 타입만 import
import type { Stage as StageType, Layer as LayerType, Image as ImageType } from "react-konva";
import type Konva from "konva";
import { useImageRatioStore } from "@/hooks/store/useImageRatioStore";

// 동적 임포트를 위한 변수
let Stage: typeof StageType;
let Layer: typeof LayerType;
let KonvaImage: typeof ImageType;
let KonvaLib: typeof Konva;

// 클라이언트 사이드에서만 Konva 로드
if (typeof window !== 'undefined') {
  const ReactKonva = require('react-konva');
  Stage = ReactKonva.Stage;
  Layer = ReactKonva.Layer;
  KonvaImage = ReactKonva.Image;
  KonvaLib = require('konva').default;
}

interface KonvaImageCanvasProps {
  imageUrl: string;
  targetFrame: { width: number; height: number; x: number; y: number };
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
  onLoadingChange?: (loading: boolean) => void;
  onError?: (error: string) => void;
}

export default function KonvaImageCanvas({
  imageUrl,
  targetFrame,
  transform,
  onTransformChange,
  onLoadingChange,
  onError,
}: KonvaImageCanvasProps) {
  const stageRef = useRef<any>(null);
  const imageRef = useRef<any>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 600, height: 400 });

  // 이미지 로드
  useEffect(() => {
    if (onLoadingChange) onLoadingChange(true);
    
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImage(img);
      if (onLoadingChange) onLoadingChange(false);
      if (onError) onError(""); // 에러 클리어
    };
    img.onerror = () => {
      console.error("이미지 로딩 실패:", imageUrl);
      if (onLoadingChange) onLoadingChange(false);
      if (onError) onError("이미지를 불러올 수 없습니다.");
    };
    img.src = imageUrl;

    return () => {
      // 클린업
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl, onLoadingChange, onError]);

  // 스테이지 크기 계산
  useEffect(() => {
    if (targetFrame) {
      const maxWidth = 600;
      const maxHeight = 400;
      const aspectRatio = targetFrame.width / targetFrame.height;
      
      let width = maxWidth;
      let height = maxWidth / aspectRatio;
      
      if (height > maxHeight) {
        height = maxHeight;
        width = maxHeight * aspectRatio;
      }
      
      setStageSize({ width, height });
    }
  }, [targetFrame]);

  // 휠 이벤트로 확대/축소
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    const imageNode = imageRef.current;
    
    if (!stage || !imageNode) return;

    const oldScale = transform.scale;
    const pointer = stage.getPointerPosition();
    
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - imageNode.x()) / oldScale,
      y: (pointer.y - imageNode.y()) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const scaleBy = 1.1;
    const newScale = Math.max(0.1, Math.min(5, direction > 0 ? oldScale * scaleBy : oldScale / scaleBy));

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    onTransformChange({
      ...transform,
      scale: newScale,
      translateX: newPos.x - stageSize.width / 2,
      translateY: newPos.y - stageSize.height / 2,
    });
  }, [transform, onTransformChange, stageSize]);

  // 드래그 이벤트
  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const centerX = stageSize.width / 2;
    const centerY = stageSize.height / 2;
    
    onTransformChange({
      ...transform,
      translateX: node.x() - centerX,
      translateY: node.y() - centerY,
    });
  }, [transform, onTransformChange, stageSize]);

  // 이미지 위치 계산
  const getImagePosition = useCallback(() => {
    const centerX = stageSize.width / 2;
    const centerY = stageSize.height / 2;
    
    return {
      x: centerX + transform.translateX,
      y: centerY + transform.translateY,
    };
  }, [stageSize, transform]);

  // 이미지 크기 계산 (스테이지에 맞게)
  const getImageSize = useCallback(() => {
    if (!image) return { width: 0, height: 0 };

    const imageAspectRatio = image.width / image.height;
    const stageAspectRatio = stageSize.width / stageSize.height;
    
    let width, height;
    
    if (imageAspectRatio > stageAspectRatio) {
      width = stageSize.width * 0.8;
      height = width / imageAspectRatio;
    } else {
      height = stageSize.height * 0.8;
      width = height * imageAspectRatio;
    }
    
    return { width, height };
  }, [image, stageSize]);

  const imagePosition = getImagePosition();
  const imageSize = getImageSize();

  // 서버 사이드에서는 렌더링하지 않음
  if (typeof window === 'undefined' || !Stage || !Layer || !KonvaImage) {
    return (
      <div className="flex justify-center items-center w-full">
        <div 
          className="bg-white border-2 border-dashed border-primary rounded-lg overflow-hidden flex items-center justify-center"
          style={{
            width: stageSize.width,
            height: stageSize.height,
          }}
        >
          <div className="text-gray-400">이미지 편집기 로딩 중...</div>
        </div>
      </div>
    );
  }

  if (!image) {
    return (
      <div className="flex justify-center items-center w-full">
        <div 
          className="bg-white border-2 border-dashed border-primary rounded-lg overflow-hidden flex items-center justify-center"
          style={{
            width: stageSize.width,
            height: stageSize.height,
          }}
        >
          <div className="text-gray-400">이미지 로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center w-full">
      <div 
        className="bg-white border-2 border-dashed border-primary rounded-lg overflow-hidden"
        style={{
          width: stageSize.width,
          height: stageSize.height,
        }}
      >
        <Stage
          width={stageSize.width}
          height={stageSize.height}
          ref={stageRef}
          onWheel={handleWheel}
        >
          <Layer>
            <KonvaImage
              ref={imageRef}
              image={image}
              x={imagePosition.x}
              y={imagePosition.y}
              width={imageSize.width}
              height={imageSize.height}
              scaleX={transform.scale}
              scaleY={transform.scale}
              rotation={transform.rotation}
              offsetX={imageSize.width / 2}
              offsetY={imageSize.height / 2}
              draggable
              onDragEnd={handleDragEnd}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
} 