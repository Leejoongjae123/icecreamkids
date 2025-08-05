"use client";

import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import type { Stage as StageType, Layer as LayerType, Image as ImageType, Group as GroupType } from "react-konva";
import type Konva from "konva";

// 동적 임포트를 위한 변수
let Stage: typeof StageType | null = null;
let Layer: typeof LayerType | null = null;
let KonvaImage: typeof ImageType | null = null;
let Group: typeof GroupType | null = null;
let KonvaLib: typeof Konva | null = null;

// 클라이언트 사이드에서만 Konva 로드
if (typeof window !== 'undefined') {
  try {
    const ReactKonva = require('react-konva');
    Stage = ReactKonva.Stage;
    Layer = ReactKonva.Layer;
    KonvaImage = ReactKonva.Image;
    Group = ReactKonva.Group;
    KonvaLib = require('konva').default;
  } catch (error) {
    console.error("❌ Konva 라이브러리 로드 실패:", error);
  }
}

interface KonvaImageCanvasProps {
  imageUrl: string;
  containerWidth: number;
  containerHeight: number;
  isClippingEnabled: boolean;
  onImageMove?: (x: number, y: number) => void;
  onImageTransformUpdate?: (transformData: { x: number; y: number; scale: number; width: number; height: number }) => void;
  clipPath?: string;
  gridId?: string;
}

export interface KonvaImageCanvasRef {
  resetImagePosition: () => void;
  getImageData: () => { x: number; y: number; scale: number; width: number; height: number } | null;
}

const KonvaImageCanvas = forwardRef<KonvaImageCanvasRef, KonvaImageCanvasProps>(
  ({ imageUrl, containerWidth, containerHeight, isClippingEnabled, onImageMove, onImageTransformUpdate, clipPath, gridId }, ref) => {
    const stageRef = useRef<any>(null);
    const imageRef = useRef<any>(null);
    
    const [konvaImage, setKonvaImage] = useState<HTMLImageElement | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isKonvaLoaded, setIsKonvaLoaded] = useState(false);
    const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
    const [imageScale, setImageScale] = useState(1);
    const [canvasSize, setCanvasSize] = useState({ width: containerWidth, height: containerHeight });

    // placeholder 이미지 여부 판별
    const NO_IMAGE_URL = "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg";
    const isPlaceholder = imageUrl === NO_IMAGE_URL;


    // 이미지 초기 위치와 스케일
    const [initialImageData, setInitialImageData] = useState<{
      x: number;
      y: number;
      scale: number;
      width: number;
      height: number;
    } | null>(null);

    // Konva 라이브러리 로딩 상태 확인
    useEffect(() => {
      let timeoutId: NodeJS.Timeout | null = null;
      let attempts = 0;
      const maxAttempts = 50;

      const checkKonvaLoading = () => {
        if (typeof window !== 'undefined' && Stage && Layer && KonvaImage && Group) {
          setIsKonvaLoaded(true);
        } else if (attempts < maxAttempts) {
          attempts++;
          timeoutId = setTimeout(checkKonvaLoading, 100);
        } else {
          setIsKonvaLoaded(true);
        }
      };

      checkKonvaLoading();

      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    }, []);

    // 컨테이너 크기 업데이트
    useEffect(() => {
      setCanvasSize({ width: containerWidth, height: containerHeight });
    }, [containerWidth, containerHeight]);

    // 이미지 로드
    useEffect(() => {
      if (!imageUrl || !isKonvaLoaded) {
        return;
      }

      setIsLoading(true);

      const imageObj = new window.Image();
      imageObj.crossOrigin = "anonymous";
      
      imageObj.onload = () => {
        const imgWidth = imageObj.width;
        const imgHeight = imageObj.height;
        
        // 캔버스 크기에 맞게 이미지 스케일 계산
        const scaleX = canvasSize.width / imgWidth;
        const scaleY = canvasSize.height / imgHeight;
        const scale = Math.min(scaleX, scaleY, 1); // 최대 1배까지만 확대
        
        // 이미지를 캔버스 중앙에 배치
        const x = canvasSize.width / 2;
        const y = canvasSize.height / 2;
        
        const imageData = {
          x,
          y,
          scale,
          width: imgWidth,
          height: imgHeight
        };
        
        setInitialImageData(imageData);
        setImagePosition({ x, y });
        setImageScale(scale);
        setKonvaImage(imageObj);
        setIsLoading(false);
        
        // 초기 이미지 변환 데이터를 부모에게 전달
        if (onImageTransformUpdate) {
          onImageTransformUpdate({
            x,
            y,
            scale,
            width: imgWidth,
            height: imgHeight
          });
        }
      };

      imageObj.onerror = () => {
        setIsLoading(false);
      };

      imageObj.src = imageUrl;
    }, [imageUrl, isKonvaLoaded, canvasSize]);

    // 이미지 드래그 핸들러
    const handleImageDrag = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
      
      const newX = e.target.x();
      const newY = e.target.y();
      
      // 이미지가 캔버스 경계를 벗어나지 않도록 제한
      const imageWidth = (initialImageData?.width || 0) * imageScale;
      const imageHeight = (initialImageData?.height || 0) * imageScale;
      
      const minX = imageWidth / 2;
      const maxX = canvasSize.width - imageWidth / 2;
      const minY = imageHeight / 2;
      const maxY = canvasSize.height - imageHeight / 2;
      
      const boundedX = Math.max(minX, Math.min(maxX, newX));
      const boundedY = Math.max(minY, Math.min(maxY, newY));
      
      setImagePosition({ x: boundedX, y: boundedY });
      
      // 위치 변경을 부모 컴포넌트에 알림
      if (onImageMove) {
        onImageMove(boundedX, boundedY);
      }
      
      // 변환 데이터 업데이트를 부모에게 전달
      if (onImageTransformUpdate && initialImageData) {
        onImageTransformUpdate({
          x: boundedX,
          y: boundedY,
          scale: imageScale,
          width: initialImageData.width,
          height: initialImageData.height
        });
      }
      
      // Konva 객체의 실제 위치도 업데이트
      e.target.x(boundedX);
      e.target.y(boundedY);
    }, [isClippingEnabled, imageScale, initialImageData, canvasSize, onImageMove, onImageTransformUpdate]);

    // 이미지 위치 초기화
    const resetImagePosition = useCallback(() => {
      if (initialImageData) {
        setImagePosition({ x: initialImageData.x, y: initialImageData.y });
        setImageScale(initialImageData.scale);
        
        if (imageRef.current) {
          imageRef.current.x(initialImageData.x);
          imageRef.current.y(initialImageData.y);
          imageRef.current.scaleX(initialImageData.scale);
          imageRef.current.scaleY(initialImageData.scale);
        }
      }
    }, [initialImageData]);

    // 이미지 데이터 반환
    const getImageData = useCallback(() => {
      if (!initialImageData) {
        return null;
      }
      
      return {
        x: imagePosition.x,
        y: imagePosition.y,
        scale: imageScale,
        width: initialImageData.width,
        height: initialImageData.height
      };
    }, [imagePosition, imageScale, initialImageData]);

    // ref 함수들 노출
    useImperativeHandle(ref, () => ({
      resetImagePosition,
      getImageData
    }), [resetImagePosition, getImageData]);

    // Konva가 로드되지 않았거나 서버 사이드인 경우
    if (typeof window === 'undefined' || !isKonvaLoaded || !Stage || !Layer || !KonvaImage) {
      return (
        <div 
          className="w-full h-full flex items-center justify-center bg-gray-100"
          style={{ width: "100%", height: "100%" }}
        >
          <div className="text-gray-500">캔버스 로딩 중...</div>
        </div>
      );
    }

    return (
      <div 
        className="relative"
        style={{
          clipPath: isClippingEnabled && clipPath && gridId ? `url(#clip-${gridId})` : 'none'
        }}
      >
        {isClippingEnabled && clipPath && gridId && (
          <svg width="0" height="0" className="absolute">
            <defs>
              <clipPath id={`clip-${gridId}`} clipPathUnits="objectBoundingBox">
                <path d={clipPath} />
              </clipPath>
            </defs>
          </svg>
        )}
        {isLoading && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10"
            style={{ width: canvasSize.width, height: canvasSize.height }}
          >
            <div className="text-gray-500">이미지 로딩 중...</div>
          </div>
        )}
        
        <Stage 
          width={canvasSize.width} 
          height={canvasSize.height} 
          ref={stageRef}
          style={{
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`,
            minWidth: `${canvasSize.width}px`,
            minHeight: `${canvasSize.height}px`
          }}
        >
          <Layer>
            {konvaImage && initialImageData && Group && KonvaImage && (
              <Group>
                <KonvaImage
                  ref={imageRef}
                  image={konvaImage}
                  x={imagePosition.x}
                  y={imagePosition.y}
                  width={initialImageData.width}
                  height={initialImageData.height}
                  scaleX={imageScale}
                  scaleY={imageScale}
                  offsetX={initialImageData.width / 2}
                  offsetY={initialImageData.height / 2}
                  draggable={!isPlaceholder} // placeholder 이미지는 이동 비활성화
                  onDragMove={handleImageDrag}
                  style={{
                    cursor: isPlaceholder ? 'default' : 'move'
                  }}
                />
              </Group>
            )}
          </Layer>
        </Stage>
        
        {/* 클리핑 상태 표시 */}
        {isClippingEnabled && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
            클리핑 활성화
          </div>
        )}
        
        {/* 이미지 조작 불가 상태 표시 */}
        {!isClippingEnabled && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
            이미지 이동 가능
          </div>
        )}
      </div>
    );
  }
);

KonvaImageCanvas.displayName = 'KonvaImageCanvas';

export default KonvaImageCanvas;