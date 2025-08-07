"use client";

import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import type { Stage as StageType, Layer as LayerType, Image as ImageType, Group as GroupType, Transformer as TransformerType, Rect as RectType, Line as LineType } from "react-konva";
import type Konva from "konva";
import { Button } from "@/components/ui/button";
import { Crop } from "lucide-react";

// 동적 임포트를 위한 변수
let Stage: typeof StageType | null = null;
let Layer: typeof LayerType | null = null;
let KonvaImage: typeof ImageType | null = null;
let Group: typeof GroupType | null = null;
let Transformer: typeof TransformerType | null = null;
let Rect: typeof RectType | null = null;
let Line: typeof LineType | null = null;
let KonvaLib: typeof Konva | null = null;

// 클라이언트 사이드에서만 Konva 로드
if (typeof window !== 'undefined') {
  try {
    const ReactKonva = require('react-konva');
    Stage = ReactKonva.Stage;
    Layer = ReactKonva.Layer;
    KonvaImage = ReactKonva.Image;
    Group = ReactKonva.Group;
    Transformer = ReactKonva.Transformer;
    Rect = ReactKonva.Rect;
    Line = ReactKonva.Line;
    KonvaLib = require('konva').default;
  } catch (error) {
    console.error("❌ Konva 라이브러리 로드 실패:", error);
  }
}

interface KonvaImageCanvasProps {
  imageUrl: string;
  containerWidth?: number;
  containerHeight?: number;
  isClippingEnabled: boolean;
  onImageMove?: (x: number, y: number) => void;
  onImageTransformUpdate?: (transformData: { x: number; y: number; scale: number; width: number; height: number }) => void;
  clipPath?: string;
  gridId?: string;
  imageTransformData?: {
    x: number;
    y: number;
    scale: number;
    width: number;
    height: number;
  } | null;
}

export interface KonvaImageCanvasRef {
  resetImagePosition: () => void;
  getImageData: () => { x: number; y: number; scale: number; width: number; height: number } | null;
  getClipData: () => { left: number; top: number; right: number; bottom: number };
  setClippingMode: (enabled: boolean) => void;
  getClippedImage: () => string | null;
  applyClipping: () => void;
}

const KonvaImageCanvas = forwardRef<KonvaImageCanvasRef, KonvaImageCanvasProps>(
  ({ imageUrl, containerWidth, containerHeight, isClippingEnabled, onImageMove, onImageTransformUpdate, clipPath, gridId, imageTransformData }, ref) => {
      const stageRef = useRef<any>(null);
  const imageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
    
    const [konvaImage, setKonvaImage] = useState<HTMLImageElement | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isKonvaLoaded, setIsKonvaLoaded] = useState(false);
    const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
    const [imageScale, setImageScale] = useState(1);
      const [canvasSize, setCanvasSize] = useState({ width: containerWidth || 300, height: containerHeight || 300 });
  const [isEditing, setIsEditing] = useState(false);
  const [isClippingMode, setIsClippingMode] = useState(false);
  const [clipBounds, setClipBounds] = useState({
    left: 0.1, // 10% from left
    top: 0.1, // 10% from top  
    right: 0.9, // 90% from left (10% from right)
    bottom: 0.9 // 90% from top (10% from bottom)
  });
  const [clippedImageUrl, setClippedImageUrl] = useState<string | null>(null);
  const [isClippingApplied, setIsClippingApplied] = useState(false);
  const [clippedImage, setClippedImage] = useState<HTMLImageElement | null>(null);

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
        if (typeof window !== 'undefined' && Stage && Layer && KonvaImage && Group && Transformer) {
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

    // 컨테이너 크기 자동 감지 (고정 크기가 제공되지 않은 경우)
    useEffect(() => {
      if (containerWidth && containerHeight) {
        setCanvasSize({ width: containerWidth, height: containerHeight });
        return;
      }

      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            setCanvasSize({ width, height });
          }
        }
      });

      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      return () => {
        resizeObserver.disconnect();
      };
    }, [containerWidth, containerHeight]);

    // 초기 크기 설정 (고정 크기가 제공되지 않은 경우)
    useEffect(() => {
      if ((!containerWidth || !containerHeight) && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setCanvasSize({ width: rect.width, height: rect.height });
        }
      }
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
        let scale: number;
        if (isPlaceholder) {
          // noimage일 때는 캔버스 전체 크기에 꽉 차게 cover 방식으로 설정
          const scaleX = canvasSize.width / imgWidth;
          const scaleY = canvasSize.height / imgHeight;
          scale = Math.max(scaleX, scaleY);
        } else {
          // 일반 이미지는 캔버스 80% 크기로 contain 방식으로 설정
          const scaleX = (canvasSize.width * 0.8) / imgWidth;
          const scaleY = (canvasSize.height * 0.8) / imgHeight;
          scale = Math.min(scaleX, scaleY);
        }
        
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

    // 부모로부터 전달받은 이미지 변환 데이터 복원
    useEffect(() => {
      if (imageTransformData && initialImageData && konvaImage && imageRef.current) {
        setImagePosition({ x: imageTransformData.x, y: imageTransformData.y });
        setImageScale(imageTransformData.scale);
        
        // Konva 객체의 위치도 업데이트
        imageRef.current.x(imageTransformData.x);
        imageRef.current.y(imageTransformData.y);
        imageRef.current.scaleX(imageTransformData.scale);
        imageRef.current.scaleY(imageTransformData.scale);
      }
    }, [imageTransformData, initialImageData, konvaImage]);

    // 클리핑 상태에 따른 편집 모드 설정
    useEffect(() => {
      setIsEditing(!isClippingEnabled && !isPlaceholder && !isClippingMode && !isClippingApplied);
    }, [isClippingEnabled, isPlaceholder, isClippingMode, isClippingApplied]);

    // Transformer를 이미지에 연결
    useEffect(() => {
      if (isEditing && transformerRef.current && imageRef.current) {
        transformerRef.current.nodes([imageRef.current]);
        transformerRef.current.getLayer()?.batchDraw();
      } else if (transformerRef.current) {
        transformerRef.current.nodes([]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    }, [isEditing, konvaImage]);

    // 이미지 드래그 핸들러
    const handleImageDrag = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
      
      const newX = e.target.x();
      const newY = e.target.y();
      
      // 이미지가 캔버스 경계를 벗어나지 않도록 제한
      const imageWidth = (initialImageData?.width || 0) * imageScale;
      const imageHeight = (initialImageData?.height || 0) * imageScale;
      
      // 드래그 가능한 영역을 캔버스 전체로 설정 (이미지 중심 기준)
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
    }, [imageScale, initialImageData, canvasSize, onImageMove, onImageTransformUpdate]);

    // Transform 이벤트 핸들러 (크기 조정, 회전)
    const handleTransformEnd = useCallback((e: Konva.KonvaEventObject<Event>) => {
      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      const rotation = node.rotation();
      
      // 원본 비율 유지를 위해 동일한 스케일 적용
      const scale = Math.min(scaleX, scaleY);
      
      // 위치와 스케일 업데이트
      const newX = node.x();
      const newY = node.y();
      
      setImagePosition({ x: newX, y: newY });
      setImageScale(scale);
      
      // 변환 데이터 업데이트를 부모에게 전달
      if (onImageTransformUpdate && initialImageData) {
        onImageTransformUpdate({
          x: newX,
          y: newY,
          scale: scale,
          width: initialImageData.width,
          height: initialImageData.height
        });
      }
      
      // node의 스케일을 동일하게 설정
      node.scaleX(scale);
      node.scaleY(scale);
    }, [onImageTransformUpdate, initialImageData]);

    // 이미지 경계 계산 함수
    const getImageBounds = useCallback(() => {
      if (!initialImageData) {
        return { left: 0, top: 0, right: 1, bottom: 1 };
      }
      
      const imageWidth = initialImageData.width * imageScale;
      const imageHeight = initialImageData.height * imageScale;
      
      const left = Math.max(0, (imagePosition.x - imageWidth / 2) / canvasSize.width);
      const top = Math.max(0, (imagePosition.y - imageHeight / 2) / canvasSize.height);
      const right = Math.min(1, (imagePosition.x + imageWidth / 2) / canvasSize.width);
      const bottom = Math.min(1, (imagePosition.y + imageHeight / 2) / canvasSize.height);
      
      return { left, top, right, bottom };
    }, [initialImageData, imageScale, imagePosition, canvasSize]);

    // 클리핑 핸들 드래그 핸들러들 (이미지 경계 제한 포함)
    const handleLeftClipDrag = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
      const imageBounds = getImageBounds();
      const newLeft = Math.max(imageBounds.left, Math.min(clipBounds.right - 0.05, e.target.x() / canvasSize.width));
      setClipBounds(prev => ({ ...prev, left: newLeft }));
    }, [clipBounds.right, canvasSize.width, getImageBounds]);

    const handleRightClipDrag = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
      const imageBounds = getImageBounds();
      const newRight = Math.max(clipBounds.left + 0.05, Math.min(imageBounds.right, e.target.x() / canvasSize.width));
      setClipBounds(prev => ({ ...prev, right: newRight }));
    }, [clipBounds.left, canvasSize.width, getImageBounds]);

    const handleTopClipDrag = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
      const imageBounds = getImageBounds();
      const newTop = Math.max(imageBounds.top, Math.min(clipBounds.bottom - 0.05, e.target.y() / canvasSize.height));
      setClipBounds(prev => ({ ...prev, top: newTop }));
    }, [clipBounds.bottom, canvasSize.height, getImageBounds]);

    const handleBottomClipDrag = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
      const imageBounds = getImageBounds();
      const newBottom = Math.max(clipBounds.top + 0.05, Math.min(imageBounds.bottom, e.target.y() / canvasSize.height));
      setClipBounds(prev => ({ ...prev, bottom: newBottom }));
    }, [clipBounds.top, canvasSize.height, getImageBounds]);

    // 클리핑 적용 함수
    const applyClipping = useCallback(() => {
      if (!konvaImage || !initialImageData || !stageRef.current || !KonvaLib) {
        return;
      }

      try {
        // 임시 캔버스 생성
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) {
          return;
        }

        // 클리핑 영역 계산 (픽셀 단위)
        const clipLeft = clipBounds.left * canvasSize.width;
        const clipTop = clipBounds.top * canvasSize.height;
        const clipWidth = (clipBounds.right - clipBounds.left) * canvasSize.width;
        const clipHeight = (clipBounds.bottom - clipBounds.top) * canvasSize.height;

        // 캔버스 크기를 클리핑 영역 크기로 설정
        tempCanvas.width = clipWidth;
        tempCanvas.height = clipHeight;

        // 이미지의 현재 위치와 스케일 계산
        const imageWidth = initialImageData.width * imageScale;
        const imageHeight = initialImageData.height * imageScale;
        const imageLeft = imagePosition.x - imageWidth / 2;
        const imageTop = imagePosition.y - imageHeight / 2;

        // 클리핑 영역에 해당하는 이미지 부분을 그리기
        ctx.drawImage(
          konvaImage,
          // 소스 이미지에서 잘라낼 영역 (원본 이미지 좌표계)
          Math.max(0, (clipLeft - imageLeft) / imageScale),
          Math.max(0, (clipTop - imageTop) / imageScale),
          Math.min(initialImageData.width, clipWidth / imageScale),
          Math.min(initialImageData.height, clipHeight / imageScale),
          // 캔버스에 그릴 위치와 크기
          0,
          0,
          clipWidth,
          clipHeight
        );

        // 클리핑된 이미지를 데이터 URL로 변환
        const clippedDataUrl = tempCanvas.toDataURL('image/png');
        setClippedImageUrl(clippedDataUrl);
        
        // 클리핑된 이미지 객체 생성
        const clippedImageObj = new window.Image();
        clippedImageObj.onload = () => {
          setClippedImage(clippedImageObj);
          setIsClippingApplied(true);
          setIsClippingMode(false);
        };
        clippedImageObj.src = clippedDataUrl;
        
      } catch (error) {
        console.error('클리핑 적용 실패:', error);
      }
    }, [konvaImage, initialImageData, clipBounds, canvasSize, imageScale, imagePosition, KonvaLib]);

    // 클리핑 모드 토글/완료
    const toggleClippingMode = useCallback(() => {
      if (isClippingMode) {
        // 클리핑 모드에서 완료 버튼을 누른 경우
        applyClipping();
      } else {
        // 클리핑 모드 시작
        setIsClippingMode(true);
        setIsClippingApplied(false);
        setClippedImageUrl(null);
        setClippedImage(null);
      }
    }, [isClippingMode, applyClipping]);

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

    // 클리핑 데이터 반환
    const getClipData = useCallback(() => {
      return clipBounds;
    }, [clipBounds]);

    // 클리핑 모드 설정
    const setClippingMode = useCallback((enabled: boolean) => {
      setIsClippingMode(enabled);
    }, []);

    // 클리핑된 이미지 반환
    const getClippedImage = useCallback(() => {
      return clippedImageUrl;
    }, [clippedImageUrl]);

    // ref 함수들 노출
    useImperativeHandle(ref, () => ({
      resetImagePosition,
      getImageData,
      getClipData,
      setClippingMode,
      getClippedImage,
      applyClipping
    }), [resetImagePosition, getImageData, getClipData, setClippingMode, getClippedImage, applyClipping]);

    // Konva가 로드되지 않았거나 서버 사이드인 경우
    if (typeof window === 'undefined' || !isKonvaLoaded || !Stage || !Layer || !KonvaImage || !Transformer || !Rect || !Line) {
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
        ref={containerRef}
        className="relative w-full h-full"
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
            backgroundColor: 'transparent',
            borderRadius: '12px',
            width: '100%',
            height: '100%'
          }}
        >
          <Layer>
            {konvaImage && initialImageData && Group && KonvaImage && Transformer && (
              <Group>
                {/* 클리핑이 적용된 경우 클리핑된 이미지 표시, 아니면 원본 이미지 표시 */}
                {isClippingApplied && clippedImage ? (
                  <KonvaImage
                    ref={imageRef}
                    image={clippedImage}
                    x={imagePosition.x}
                    y={imagePosition.y}
                    width={(clipBounds.right - clipBounds.left) * canvasSize.width}
                    height={(clipBounds.bottom - clipBounds.top) * canvasSize.height}
                    offsetX={(clipBounds.right - clipBounds.left) * canvasSize.width / 2}
                    offsetY={(clipBounds.bottom - clipBounds.top) * canvasSize.height / 2}
                    draggable={!isPlaceholder && (!isClippingEnabled || isClippingApplied)}
                    onDragMove={handleImageDrag}
                    onTransformEnd={handleTransformEnd}
                    style={{
                      cursor: (!isPlaceholder && (!isClippingEnabled || isClippingApplied)) ? 'move' : 'default'
                    }}
                  />
                ) : (
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
                    draggable={!isPlaceholder && (!isClippingEnabled || isClippingMode) && !isClippingApplied} // placeholder가 아니고 클리핑이 적용되지 않았으며 (클리핑이 비활성화되었거나 클리핑 모드인 경우)에 드래그 가능
                    onDragMove={handleImageDrag}
                    onTransformEnd={handleTransformEnd}
                    style={{
                      cursor: (!isPlaceholder && (!isClippingEnabled || isClippingMode) && !isClippingApplied) ? 'move' : 'default'
                    }}
                  />
                )}
                
                {/* Transformer - 편집 모드에서만 표시 (점선 테두리와 코너 핸들) */}
                {isEditing && (
                  <Transformer
                    ref={transformerRef}
                    flipEnabled={false}
                    rotateEnabled={true}
                    borderDash={[3, 3]}
                    borderStroke="#3D8BFF"
                    borderStrokeWidth={2}
                    anchorFill="#ffffff"
                    anchorStroke="#3D8BFF"
                    anchorStrokeWidth={2}
                    anchorSize={12}
                    anchorCornerRadius={12}
                    keepRatio={true}
                    boundBoxFunc={(oldBox, newBox) => {
                      // 최소/최대 크기 제한
                      if (newBox.width < 10 || newBox.height < 10) {
                        return oldBox;
                      }
                      if (newBox.width > canvasSize.width * 2 || newBox.height > canvasSize.height * 2) {
                        return oldBox;
                      }
                      return newBox;
                    }}
                  />
                )}
              </Group>
            )}

            {/* 클리핑 모드 오버레이 */}
            {isClippingMode && !isPlaceholder && !isClippingApplied && Group && Rect && (
              <Group>
                {/* 클리핑 영역 외부 오버레이 (반투명 검정) */}
                {/* 왼쪽 영역 */}
                <Rect
                  x={0}
                  y={0}
                  width={clipBounds.left * canvasSize.width}
                  height={canvasSize.height}
                  fill="rgba(0, 0, 0, 0.5)"
                />
                {/* 오른쪽 영역 */}
                <Rect
                  x={clipBounds.right * canvasSize.width}
                  y={0}
                  width={(1 - clipBounds.right) * canvasSize.width}
                  height={canvasSize.height}
                  fill="rgba(0, 0, 0, 0.5)"
                />
                {/* 위쪽 영역 */}
                <Rect
                  x={clipBounds.left * canvasSize.width}
                  y={0}
                  width={(clipBounds.right - clipBounds.left) * canvasSize.width}
                  height={clipBounds.top * canvasSize.height}
                  fill="rgba(0, 0, 0, 0.5)"
                />
                {/* 아래쪽 영역 */}
                <Rect
                  x={clipBounds.left * canvasSize.width}
                  y={clipBounds.bottom * canvasSize.height}
                  width={(clipBounds.right - clipBounds.left) * canvasSize.width}
                  height={(1 - clipBounds.bottom) * canvasSize.height}
                  fill="rgba(0, 0, 0, 0.5)"
                />

                {/* 클리핑 영역 테두리 */}
                <Rect
                  x={clipBounds.left * canvasSize.width}
                  y={clipBounds.top * canvasSize.height}
                  width={(clipBounds.right - clipBounds.left) * canvasSize.width}
                  height={(clipBounds.bottom - clipBounds.top) * canvasSize.height}
                  stroke="#3D8BFF"
                  strokeWidth={2}
                  dash={[5, 5]}
                  fill="transparent"
                />

                {/* 클리핑 핸들들 */}
                {(() => {
                  const imageBounds = getImageBounds();
                  return (
                    <>
                      {/* 왼쪽 핸들 */}
                      <Rect
                        x={clipBounds.left * canvasSize.width - 4}
                        y={clipBounds.top * canvasSize.height + (clipBounds.bottom - clipBounds.top) * canvasSize.height / 2 - 15}
                        width={8}
                        height={30}
                        fill="#ffffff"
                        stroke="#3D8BFF"
                        strokeWidth={2}
                        cornerRadius={4}
                        draggable={true}
                        dragBoundFunc={(pos) => ({
                          x: Math.max(imageBounds.left * canvasSize.width, Math.min((clipBounds.right - 0.05) * canvasSize.width, pos.x)),
                          y: clipBounds.top * canvasSize.height + (clipBounds.bottom - clipBounds.top) * canvasSize.height / 2 - 15
                        })}
                        onDragMove={handleLeftClipDrag}
                        style={{ cursor: 'ew-resize' }}
                      />

                      {/* 오른쪽 핸들 */}
                      <Rect
                        x={clipBounds.right * canvasSize.width - 4}
                        y={clipBounds.top * canvasSize.height + (clipBounds.bottom - clipBounds.top) * canvasSize.height / 2 - 15}
                        width={8}
                        height={30}
                        fill="#ffffff"
                        stroke="#3D8BFF"
                        strokeWidth={2}
                        cornerRadius={4}
                        draggable={true}
                        dragBoundFunc={(pos) => ({
                          x: Math.max((clipBounds.left + 0.05) * canvasSize.width, Math.min(imageBounds.right * canvasSize.width, pos.x)),
                          y: clipBounds.top * canvasSize.height + (clipBounds.bottom - clipBounds.top) * canvasSize.height / 2 - 15
                        })}
                        onDragMove={handleRightClipDrag}
                        style={{ cursor: 'ew-resize' }}
                      />

                      {/* 위쪽 핸들 */}
                      <Rect
                        x={clipBounds.left * canvasSize.width + (clipBounds.right - clipBounds.left) * canvasSize.width / 2 - 15}
                        y={clipBounds.top * canvasSize.height - 4}
                        width={30}
                        height={8}
                        fill="#ffffff"
                        stroke="#3D8BFF"
                        strokeWidth={2}
                        cornerRadius={4}
                        draggable={true}
                        dragBoundFunc={(pos) => ({
                          x: clipBounds.left * canvasSize.width + (clipBounds.right - clipBounds.left) * canvasSize.width / 2 - 15,
                          y: Math.max(imageBounds.top * canvasSize.height, Math.min((clipBounds.bottom - 0.05) * canvasSize.height, pos.y))
                        })}
                        onDragMove={handleTopClipDrag}
                        style={{ cursor: 'ns-resize' }}
                      />

                      {/* 아래쪽 핸들 */}
                      <Rect
                        x={clipBounds.left * canvasSize.width + (clipBounds.right - clipBounds.left) * canvasSize.width / 2 - 15}
                        y={clipBounds.bottom * canvasSize.height - 4}
                        width={30}
                        height={8}
                        fill="#ffffff"
                        stroke="#3D8BFF"
                        strokeWidth={2}
                        cornerRadius={4}
                        draggable={true}
                        dragBoundFunc={(pos) => ({
                          x: clipBounds.left * canvasSize.width + (clipBounds.right - clipBounds.left) * canvasSize.width / 2 - 15,
                          y: Math.max((clipBounds.top + 0.05) * canvasSize.height, Math.min(imageBounds.bottom * canvasSize.height, pos.y))
                        })}
                        onDragMove={handleBottomClipDrag}
                        style={{ cursor: 'ns-resize' }}
                      />
                    </>
                  );
                })()}
              </Group>
            )}
          </Layer>
        </Stage>
        
        {/* 클리핑 모드 토글 플로팅 버튼 */}
        {!isPlaceholder && !isClippingApplied && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-50">
            <Button
              onClick={toggleClippingMode}
              className={`h-10 px-4 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl text-lg ${
                isClippingMode 
                  ? 'bg-primary text-white' 
                  : 'bg-primary text-white'
              }`}
              size="sm"
            >
              {isClippingMode ? '크롭 완료' : '크롭 시작'}
            </Button>
          </div>
        )}

        {/* 클리핑 완료 후 다시 편집 버튼 */}
        {!isPlaceholder && isClippingApplied && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
            <Button
              onClick={() => {
                setIsClippingApplied(false);
                setClippedImageUrl(null);
                setClippedImage(null);
                setIsClippingMode(true);
              }}
              className="h-12 px-4 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl bg-green-500 hover:bg-green-600 text-white"
              size="sm"
            >
              <Crop className="w-4 h-4 mr-2" />
              다시 편집
            </Button>
          </div>
        )}

      </div>
    );
  }
);

KonvaImageCanvas.displayName = 'KonvaImageCanvas';

export default KonvaImageCanvas;