"use client";

import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle, useMemo } from "react";
import type { Stage as StageType, Layer as LayerType, Image as ImageType, Group as GroupType, Transformer as TransformerType, Rect as RectType, Line as LineType } from "react-konva";
import type Konva from "konva";
import { Button } from "@/components/ui/button";
import { Crop } from "lucide-react";

// throttle 함수 - 드래그 성능 최적화를 위함
const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T => {
  let inThrottle: boolean;
  return ((...args: any[]) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
};

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
  onCroppedImageUpdate?: (croppedImageUrl: string) => void;
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
  ({ imageUrl, containerWidth, containerHeight, isClippingEnabled, onImageMove, onImageTransformUpdate, onCroppedImageUpdate, clipPath, gridId, imageTransformData }, ref) => {
      const stageRef = useRef<any>(null);
  const imageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const overlayGroupRef = useRef<any>(null);
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

      // 크롭이 적용된 상태에서는 원본 이미지 재로딩 방지
      if (isClippingApplied && clippedImage) {
        console.log('🚫 크롭 적용된 상태 - 이미지 재로딩 건너뜀');
        return;
      }

      // console.log('📂 이미지 로딩 시작:', { imageUrl, isClippingApplied });
      setIsLoading(true);

      const imageObj = new window.Image();

      // CORS: 원격 이미지(toDataURL 사용) 크롭을 위해 anonymous 적용 후 실패 시 재시도
      const isDataUrl = imageUrl.startsWith('data:');
      const isHttpUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://');
      const isRelative = imageUrl.startsWith('/');
      if ((isHttpUrl || isRelative) && !isDataUrl) {
        imageObj.crossOrigin = 'anonymous';
      }
      
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
        setKonvaImage(imageObj);
        setIsLoading(false);
        
        // 부모로부터 전달받은 변환 데이터가 있으면 그것을 우선 적용
        if (imageTransformData && 
            imageTransformData.width === imgWidth && 
            imageTransformData.height === imgHeight) {
          // console.log("기존 변환 데이터 적용:", imageTransformData);
          setImagePosition({ x: imageTransformData.x, y: imageTransformData.y });
          setImageScale(imageTransformData.scale);
          
          // 초기 이미지 변환 데이터를 부모에게 전달 (기존 데이터 유지)
          if (onImageTransformUpdate) {
            onImageTransformUpdate(imageTransformData);
          }
        } else {
          // console.log("새로운 이미지 데이터 적용:", imageData);
          setImagePosition({ x, y });
          setImageScale(scale);
          
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
        }
      };

      imageObj.onerror = (error) => {
        console.log('❌ 이미지 로드 실패, CORS 없이 재시도:', { imageUrl, error });

        // crossOrigin 제거 후 재시도
        const retryImageObj = new window.Image();
        
        retryImageObj.onload = () => {
            console.log('✅ CORS 없이 이미지 로드 성공');
            const imgWidth = retryImageObj.width;
            const imgHeight = retryImageObj.height;
            
            // 동일한 로드 로직 적용
            let scale: number;
            if (isPlaceholder) {
              const scaleX = canvasSize.width / imgWidth;
              const scaleY = canvasSize.height / imgHeight;
              scale = Math.max(scaleX, scaleY);
            } else {
              const scaleX = (canvasSize.width * 0.8) / imgWidth;
              const scaleY = (canvasSize.height * 0.8) / imgHeight;
              scale = Math.min(scaleX, scaleY);
            }
            
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
            setKonvaImage(retryImageObj);
            setIsLoading(false);
            
            if (imageTransformData && 
                imageTransformData.width === imgWidth && 
                imageTransformData.height === imgHeight) {
              setImagePosition({ x: imageTransformData.x, y: imageTransformData.y });
              setImageScale(imageTransformData.scale);
              
              if (onImageTransformUpdate) {
                onImageTransformUpdate(imageTransformData);
              }
            } else {
              setImagePosition({ x, y });
              setImageScale(scale);
              
              if (onImageTransformUpdate) {
                onImageTransformUpdate({
                  x,
                  y,
                  scale,
                  width: imgWidth,
                  height: imgHeight
                });
              }
            }
        };
        
        retryImageObj.onerror = () => {
          console.log('❌ 재시도도 실패, 로딩 종료');
          setIsLoading(false);
        };
        
        retryImageObj.src = imageUrl;
      };

      imageObj.src = imageUrl;
    }, [imageUrl, isKonvaLoaded, canvasSize, imageTransformData, isClippingApplied, clippedImage]);

    // 이미지 위치와 스케일이 변경될 때 Konva 노드 동기화
    useEffect(() => {
      if (imageRef.current && konvaImage) {
        const currentX = imageRef.current.x();
        const currentY = imageRef.current.y();
        const currentScaleX = imageRef.current.scaleX();
        
        // 상태와 Konva 노드가 다르면 동기화
        const needsUpdate = 
          Math.abs(currentX - imagePosition.x) > 0.1 ||
          Math.abs(currentY - imagePosition.y) > 0.1 ||
          Math.abs(currentScaleX - imageScale) > 0.01;
        
        if (needsUpdate) {
          console.log("이미지 위치/스케일 변경 감지, Konva 노드 동기화:", {
            새상태: { x: imagePosition.x, y: imagePosition.y, scale: imageScale },
            기존노드: { x: currentX, y: currentY, scale: currentScaleX }
          });
          
          imageRef.current.x(imagePosition.x);
          imageRef.current.y(imagePosition.y);
          imageRef.current.scaleX(imageScale);
          imageRef.current.scaleY(imageScale);
          
          const layer = imageRef.current.getLayer();
          if (layer) {
            layer.batchDraw();
          }
        }
      }
    }, [imagePosition, imageScale, konvaImage]);

    // 부모로부터 전달받은 이미지 변환 데이터 복원
    useEffect(() => {
      if (imageTransformData && initialImageData && konvaImage && imageRef.current) {
        // console.log("이미지 변환 데이터 복원:", imageTransformData);
        
        // 현재 Konva 노드 상태와 비교하여 변경이 필요한지 확인
        const currentX = imageRef.current.x();
        const currentY = imageRef.current.y();
        const currentScale = imageRef.current.scaleX();
        
        const hasChanges = 
          Math.abs(currentX - imageTransformData.x) > 0.1 ||
          Math.abs(currentY - imageTransformData.y) > 0.1 ||
          Math.abs(currentScale - imageTransformData.scale) > 0.01;
        
        if (hasChanges) {
          console.log("이미지 상태 변경 감지, 복원 진행:", {
            current: { x: currentX, y: currentY, scale: currentScale },
            restore: { x: imageTransformData.x, y: imageTransformData.y, scale: imageTransformData.scale }
          });
          
          // React 상태 업데이트
          setImagePosition({ x: imageTransformData.x, y: imageTransformData.y });
          setImageScale(imageTransformData.scale);
          
          // Konva 객체의 위치도 즉시 업데이트
          imageRef.current.x(imageTransformData.x);
          imageRef.current.y(imageTransformData.y);
          imageRef.current.scaleX(imageTransformData.scale);
          imageRef.current.scaleY(imageTransformData.scale);
          
          // 레이어 강제 재그리기로 시각적 업데이트 보장
          const layer = imageRef.current.getLayer();
          if (layer) {
            layer.batchDraw();
          }
          
          // console.log("이미지 변환 데이터 복원 완료");
        } else {
          console.log("이미지 상태 변경 없음, 복원 건너뜀");
        }
      }
    }, [imageTransformData, initialImageData, konvaImage]);

    // 클리핑 상태에 따른 편집 모드 설정
    useEffect(() => {
      // placeholder가 아니고, 클리핑이 비활성화되어 있으며, 클리핑 모드가 아닐 때 편집 가능
      // 크롭이 적용된 후에도 편집 가능하도록 isClippingApplied 조건 제거
      setIsEditing(!isClippingEnabled && !isPlaceholder && !isClippingMode);
    }, [isClippingEnabled, isPlaceholder, isClippingMode]);

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

    // Transform 이벤트 핸들러 (크기 조정)
    const handleTransformEnd = useCallback((e: Konva.KonvaEventObject<Event>) => {
      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      
      // 원본 비율 유지를 위해 동일한 스케일 적용
      const scale = Math.min(scaleX, scaleY);
      
      // 위치와 스케일 업데이트
      let newX = node.x();
      let newY = node.y();
      
      // 그리드 경계를 벗어나지 않도록 위치 제한
      if (initialImageData) {
        const imageWidth = initialImageData.width * scale;
        const imageHeight = initialImageData.height * scale;
        
        // 이미지가 캔버스 경계를 벗어나지 않도록 위치 조정
        const minX = imageWidth / 2;
        const maxX = canvasSize.width - imageWidth / 2;
        const minY = imageHeight / 2;
        const maxY = canvasSize.height - imageHeight / 2;
        
        newX = Math.max(minX, Math.min(maxX, newX));
        newY = Math.max(minY, Math.min(maxY, newY));
        
        // 조정된 위치를 노드에 적용
        node.x(newX);
        node.y(newY);
      }
      
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
    }, [onImageTransformUpdate, initialImageData, canvasSize]);

    // 이미지 경계 계산 - useMemo로 최적화
    const imageBounds = useMemo(() => {
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

    // 클리핑 핸들 드래그 핸들러들 - throttling 적용으로 성능 최적화
    const updateClipBounds = useCallback(
      throttle((newBounds: Partial<typeof clipBounds>) => {
        setClipBounds(prev => ({ ...prev, ...newBounds }));
      }, 16) // 60fps (약 16ms마다 업데이트)
    , []);

    const handleLeftClipDrag = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
      const newX = e.target.x();
      const normalizedX = newX / canvasSize.width;
      const constrainedLeft = Math.max(
        imageBounds.left, 
        Math.min(clipBounds.right - 0.05, normalizedX)
      );
      
      // 즉시 핸들 위치 업데이트 (시각적 반응성)
      e.target.x(constrainedLeft * canvasSize.width);
      
      // throttled 상태 업데이트
      updateClipBounds({ left: constrainedLeft });
    }, [clipBounds.right, canvasSize.width, imageBounds, updateClipBounds]);

    const handleRightClipDrag = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
      const newX = e.target.x();
      const normalizedX = newX / canvasSize.width;
      const constrainedRight = Math.max(
        clipBounds.left + 0.05, 
        Math.min(imageBounds.right, normalizedX)
      );
      
      // 즉시 핸들 위치 업데이트 (시각적 반응성)
      e.target.x(constrainedRight * canvasSize.width);
      
      // throttled 상태 업데이트
      updateClipBounds({ right: constrainedRight });
    }, [clipBounds.left, canvasSize.width, imageBounds, updateClipBounds]);

    const handleTopClipDrag = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
      const newY = e.target.y();
      const normalizedY = newY / canvasSize.height;
      const constrainedTop = Math.max(
        imageBounds.top, 
        Math.min(clipBounds.bottom - 0.05, normalizedY)
      );
      
      // 즉시 핸들 위치 업데이트 (시각적 반응성)
      e.target.y(constrainedTop * canvasSize.height);
      
      // throttled 상태 업데이트
      updateClipBounds({ top: constrainedTop });
    }, [clipBounds.bottom, canvasSize.height, imageBounds, updateClipBounds]);

    const handleBottomClipDrag = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
      const newY = e.target.y();
      const normalizedY = newY / canvasSize.height;
      const constrainedBottom = Math.max(
        clipBounds.top + 0.05, 
        Math.min(imageBounds.bottom, normalizedY)
      );
      
      // 즉시 핸들 위치 업데이트 (시각적 반응성)
      e.target.y(constrainedBottom * canvasSize.height);
      
      // throttled 상태 업데이트
      updateClipBounds({ bottom: constrainedBottom });
    }, [clipBounds.top, canvasSize.height, imageBounds, updateClipBounds]);

    // 클리핑 적용 함수 - 완전히 새로 구현
    const applyClipping = useCallback(() => {
      console.log('🎯 크롭 완료 버튼 클릭! applyClipping 함수 호출됨');
      
      if (!konvaImage || !initialImageData || !stageRef.current) {
        console.log('❌ 클리핑 적용 실패: 필수 데이터 없음', { 
          konvaImage: !!konvaImage, 
          initialImageData: !!initialImageData,
          stage: !!stageRef.current
        });
        alert('이미지 데이터가 없습니다.');
        return;
      }

      console.log('✂️ 클리핑 적용 시작', {
        clipBounds,
        imagePosition,
        imageScale,
        initialImageData,
        canvasSize
      });

      try {
        // Stage에서 직접 데이터 추출 방식 사용 (더 안정적)
        const stage = stageRef.current;
        
        // 클리핑 영역을 픽셀 단위로 계산
        const clipLeft = clipBounds.left * canvasSize.width;
        const clipTop = clipBounds.top * canvasSize.height;
        const clipWidth = (clipBounds.right - clipBounds.left) * canvasSize.width;
        const clipHeight = (clipBounds.bottom - clipBounds.top) * canvasSize.height;

        console.log('📐 클리핑 영역:', {
          left: clipLeft, top: clipTop, width: clipWidth, height: clipHeight
        });

        // 유효성 검사
        if (clipWidth <= 10 || clipHeight <= 10) {
          console.log('❌ 크롭 영역이 너무 작습니다');
          alert('크롭 영역이 너무 작습니다. 더 큰 영역을 선택해주세요.');
          return;
        }

        // 임시 캔버스 생성
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) {
          console.log('❌ 캔버스 컨텍스트 생성 실패');
          alert('캔버스를 생성할 수 없습니다.');
          return;
        }

        // 캔버스 크기를 클리핑 영역 크기로 설정
        tempCanvas.width = clipWidth;
        tempCanvas.height = clipHeight;

        // Fallback 크롭 메서드 (원본 방식) - 선선언하여 이하에서 참조 가능하도록 함
        const fallbackCropMethod = () => {
          console.log('🔄 Fallback 크롭 방식 사용');
          
          const fallbackCanvas = document.createElement('canvas');
          const fallbackCtx = fallbackCanvas.getContext('2d');
          if (!fallbackCtx) {
            return;
          }
          
          fallbackCanvas.width = clipWidth;
          fallbackCanvas.height = clipHeight;
          
          // null 체크 추가
          if (!initialImageData || !konvaImage) {
            alert('이미지 데이터가 없습니다.');
            return;
          }
          
          // 이미지 위치 계산
          const imageWidth = initialImageData.width * imageScale;
          const imageHeight = initialImageData.height * imageScale;
          const imageLeft = imagePosition.x - imageWidth / 2;
          const imageTop = imagePosition.y - imageHeight / 2;
          
          // 소스 영역 계산
          const sourceX = Math.max(0, (clipLeft - imageLeft) / imageScale);
          const sourceY = Math.max(0, (clipTop - imageTop) / imageScale);
          const sourceWidth = Math.min(initialImageData.width - sourceX, clipWidth / imageScale);
          const sourceHeight = Math.min(initialImageData.height - sourceY, clipHeight / imageScale);
          
          // 타겟 위치 계산
          const targetX = Math.max(0, imageLeft - clipLeft);
          const targetY = Math.max(0, imageTop - clipTop);
          
          console.log('🔄 Fallback 크롭 계산:', {
            source: { x: sourceX, y: sourceY, width: sourceWidth, height: sourceHeight },
            target: { x: targetX, y: targetY }
          });
          
          // 이미지 그리기
          try {
            fallbackCtx.drawImage(
              konvaImage,
              sourceX, sourceY, sourceWidth, sourceHeight,
              targetX, targetY, sourceWidth * imageScale, sourceHeight * imageScale
            );
            
            const fallbackDataUrl = fallbackCanvas.toDataURL('image/png', 0.9);
            
            if (fallbackDataUrl !== 'data:,') {
              // Fallback 성공
              const fallbackImageObj = new window.Image();
              fallbackImageObj.onload = () => {
                const croppedImageWidth = fallbackImageObj.naturalWidth || fallbackImageObj.width;
                const croppedImageHeight = fallbackImageObj.naturalHeight || fallbackImageObj.height;
                
                const scaleX = (canvasSize.width * 0.8) / croppedImageWidth;
                const scaleY = (canvasSize.height * 0.8) / croppedImageHeight;
                const optimalScale = Math.min(scaleX, scaleY);
                
                const newImageData = {
                  x: canvasSize.width / 2,
                  y: canvasSize.height / 2,
                  scale: optimalScale,
                  width: croppedImageWidth,
                  height: croppedImageHeight
                };
                
                // 상태 업데이트
                setInitialImageData(newImageData);
                setImagePosition({ x: newImageData.x, y: newImageData.y });
                setImageScale(newImageData.scale);
                setKonvaImage(fallbackImageObj);
                setIsClippingMode(false);
                setIsClippingApplied(true);
                setClippedImage(fallbackImageObj);
                setClippedImageUrl(fallbackDataUrl);
                
                if (imageRef.current) {
                  imageRef.current.x(newImageData.x);
                  imageRef.current.y(newImageData.y);
                  imageRef.current.scaleX(newImageData.scale);
                  imageRef.current.scaleY(newImageData.scale);
                  
                  const layer = imageRef.current.getLayer();
                  if (layer) {
                    layer.batchDraw();
                  }
                }
                
                if (onImageTransformUpdate) {
                  onImageTransformUpdate(newImageData);
                }
                
                if (onCroppedImageUpdate) {
                  onCroppedImageUpdate(fallbackDataUrl);
                }
                
                console.log('🎉 Fallback 크롭 완료!');
              };
              
              fallbackImageObj.src = fallbackDataUrl;
            } else {
              alert('크롭 기능을 사용할 수 없습니다. 이미지를 다시 업로드해주세요.');
            }
          } catch (err) {
            console.log('❌ Fallback 크롭도 실패:', err);
            alert('크롭 기능을 사용할 수 없습니다.');
          }
        };

        // Stage를 전체적으로 그린 다음 필요한 부분만 잘라내기
        // 크롭 핸들과 오버레이가 결과물에 포함되지 않도록 캡처 직전 잠시 숨김
        const overlayGroup = overlayGroupRef.current;
        const prevVisible = overlayGroup ? overlayGroup.visible() : undefined;
        try {
          if (overlayGroup) {
            overlayGroup.visible(false);
            stage.draw();
          }

          const stageCanvas = stage.toCanvas({
            x: clipLeft,
            y: clipTop,
            width: clipWidth,
            height: clipHeight,
            pixelRatio: 1
          });

          // HTMLCanvasElement에는 onload 이벤트가 없으므로 즉시 처리
          // Stage에서 잘라낸 이미지를 임시 캔버스에 그리기
          tempCtx.drawImage(stageCanvas, 0, 0);
        } finally {
          if (overlayGroup && prevVisible !== undefined) {
            overlayGroup.visible(prevVisible);
            stage.draw();
          }
        }
        
        try {
          // 클리핑된 이미지를 데이터 URL로 변환
          const clippedDataUrl = tempCanvas.toDataURL('image/png', 0.9);
          console.log('📸 클리핑된 이미지 생성 완료, 길이:', clippedDataUrl.length);
          
          if (clippedDataUrl === 'data:,') {
            console.log('❌ 빈 이미지 데이터 - CORS 문제일 수 있음');
            // Fallback: Konva Image에서 직접 추출
            fallbackCropMethod();
            return;
          }
          
          // 클리핑된 이미지 객체 생성
          const clippedImageObj = new window.Image();
          clippedImageObj.crossOrigin = 'anonymous';
          
          clippedImageObj.onload = () => {
            console.log('✅ 클리핑된 이미지 로드 완료');
            
            const croppedImageWidth = clippedImageObj.naturalWidth || clippedImageObj.width;
            const croppedImageHeight = clippedImageObj.naturalHeight || clippedImageObj.height;
            
            console.log('📏 크롭된 이미지 크기:', {
              width: croppedImageWidth,
              height: croppedImageHeight
            });
            
            // 새로운 이미지 배치 계산 (80% 크기로 중앙 배치)
            const scaleX = (canvasSize.width * 0.8) / croppedImageWidth;
            const scaleY = (canvasSize.height * 0.8) / croppedImageHeight;
            const optimalScale = Math.min(scaleX, scaleY);
            
            const newImageData = {
              x: canvasSize.width / 2,
              y: canvasSize.height / 2,
              scale: optimalScale,
              width: croppedImageWidth,
              height: croppedImageHeight
            };
            
            console.log('🔄 크롭 후 이미지 재배치:', newImageData);
            
            // 상태 업데이트
            setInitialImageData(newImageData);
            setImagePosition({ x: newImageData.x, y: newImageData.y });
            setImageScale(newImageData.scale);
            setKonvaImage(clippedImageObj);
            setIsClippingMode(false);
            setIsClippingApplied(true);
            setClippedImage(clippedImageObj);
            setClippedImageUrl(clippedDataUrl);
            
            // Konva 노드 업데이트
            if (imageRef.current) {
              imageRef.current.x(newImageData.x);
              imageRef.current.y(newImageData.y);
              imageRef.current.scaleX(newImageData.scale);
              imageRef.current.scaleY(newImageData.scale);
              
              const layer = imageRef.current.getLayer();
              if (layer) {
                layer.batchDraw();
              }
            }
            
            // 클리핑 영역 재설정
            const displayWidth = croppedImageWidth * optimalScale;
            const displayHeight = croppedImageHeight * optimalScale;
            const resetClipBounds = {
              left: Math.max(0, (newImageData.x - displayWidth / 2) / canvasSize.width),
              top: Math.max(0, (newImageData.y - displayHeight / 2) / canvasSize.height),
              right: Math.min(1, (newImageData.x + displayWidth / 2) / canvasSize.width),
              bottom: Math.min(1, (newImageData.y + displayHeight / 2) / canvasSize.height)
            };
            setClipBounds(resetClipBounds);
            
            // 부모 컴포넌트에 데이터 전달
            if (onImageTransformUpdate) {
              onImageTransformUpdate(newImageData);
            }
            
            if (onCroppedImageUpdate) {
              onCroppedImageUpdate(clippedDataUrl);
              console.log('📤 크롭된 이미지를 부모에게 전달 완료');
            }
            
            console.log('🎉 크롭 완료!');
          };
          
          clippedImageObj.onerror = (error) => {
            console.error('❌ 클리핑된 이미지 로드 실패:', error);
            alert('크롭된 이미지를 로드할 수 없습니다.');
          };
          
          clippedImageObj.src = clippedDataUrl;
          
        } catch (error) {
          console.error('❌ toDataURL 실패 - Fallback 사용:', error);
          fallbackCropMethod();
        }

        
        
      } catch (error) {
        console.error('❌ 클리핑 적용 중 오류:', error);
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        alert('크롭 중 오류가 발생했습니다: ' + errorMessage);
      }
    }, [konvaImage, initialImageData, clipBounds, canvasSize, imageScale, imagePosition, onImageTransformUpdate, onCroppedImageUpdate]);

    // 클리핑 모드 토글/완료 - 디버깅 로그 추가
    const toggleClippingMode = useCallback(() => {
      console.log('🎯 toggleClippingMode 호출됨', { 
        isClippingMode, 
        isClippingApplied,
        버튼텍스트: isClippingMode ? '크롭 완료' : '크롭 시작'
      });
      
      if (isClippingMode) {
        // 클리핑 모드에서 완료 버튼을 누른 경우
        console.log('✂️ 크롭 완료 버튼 클릭 - applyClipping 호출');
        applyClipping();
      } else {
        // 클리핑 모드 시작 - 상태 초기화 및 정확한 이미지 경계 설정
        console.log('🎬 크롭 시작 버튼 클릭 - 상태 초기화 시작');
        
        if (initialImageData && imageRef.current) {
          // 1단계: 현재 Konva 노드의 실제 상태 가져오기
          const actualX = imageRef.current.x();
          const actualY = imageRef.current.y();
          const actualScaleX = imageRef.current.scaleX();
          const actualScaleY = imageRef.current.scaleY();
          
          console.log('📍 크롭 시작 - 실제 Konva 노드 상태:', {
            actual: { x: actualX, y: actualY, scaleX: actualScaleX, scaleY: actualScaleY },
            stored: { x: imagePosition.x, y: imagePosition.y, scale: imageScale },
            초기데이터: initialImageData
          });
          
          // 2단계: React 상태를 실제 노드 상태로 동기화
          setImagePosition({ x: actualX, y: actualY });
          setImageScale(actualScaleX);
          
          // 3단계: 현재 이미지의 실제 표시 영역 계산
          const scaledWidth = initialImageData.width * actualScaleX;
          const scaledHeight = initialImageData.height * actualScaleY;
          const imageLeft = actualX - scaledWidth / 2;
          const imageTop = actualY - scaledHeight / 2;
          const imageRight = actualX + scaledWidth / 2;
          const imageBottom = actualY + scaledHeight / 2;
          
          // 4단계: 클리핑 영역을 이미지 경계에 정확히 맞춤
          const newClipBounds = {
            left: Math.max(0, Math.min(1, imageLeft / canvasSize.width)),
            top: Math.max(0, Math.min(1, imageTop / canvasSize.height)), 
            right: Math.max(0, Math.min(1, imageRight / canvasSize.width)),
            bottom: Math.max(0, Math.min(1, imageBottom / canvasSize.height))
          };
          
          console.log('📐 크롭 시작 - 동기화 및 클립 영역 설정:', {
            원본크기: { width: initialImageData.width, height: initialImageData.height },
            스케일된크기: { width: scaledWidth, height: scaledHeight },
            이미지경계: { left: imageLeft, top: imageTop, right: imageRight, bottom: imageBottom },
            클립영역: newClipBounds,
            크롭상태: { isClippingApplied, hasClippedImage: !!clippedImage }
          });
          
          setClipBounds(newClipBounds);
        }
        
        setIsClippingMode(true);
        // 크롭된 상태에서 추가 크롭을 위해 기존 크롭 정보는 유지
        
        console.log('✅ 크롭 모드 시작됨 - 기존 크롭 정보 유지:', {
          isClippingApplied,
          hasClippedImage: !!clippedImage,
          hasClippedUrl: !!clippedImageUrl
        });
      }
    }, [isClippingMode, applyClipping, initialImageData, imageScale, imagePosition, canvasSize, isClippingApplied, clippedImage, clippedImageUrl]);

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

    // 이미지 데이터 반환 - 실제 Konva 노드의 현재 상태를 우선 반환
    const getImageData = useCallback(() => {
      if (!initialImageData) {
        return null;
      }
      
      // 실제 Konva 노드가 있으면 그 상태를 우선 반환
      if (imageRef.current) {
        const actualX = imageRef.current.x();
        const actualY = imageRef.current.y();
        const actualScaleX = imageRef.current.scaleX();
        const actualScaleY = imageRef.current.scaleY();
        
        console.log("실제 Konva 노드 상태 반환:", {
          x: actualX,
          y: actualY,
          scale: actualScaleX,
          width: initialImageData.width,
          height: initialImageData.height
        });
        
        return {
          x: actualX,
          y: actualY,
          scale: actualScaleX, // 일반적으로 X, Y 스케일이 동일하므로 X 스케일 사용
          width: initialImageData.width,
          height: initialImageData.height
        };
      }
      
      // Konva 노드가 없으면 React 상태 반환
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
                {/* 현재 이미지 표시 - 크롭 적용 시 konvaImage가 크롭된 이미지로 교체됨 */}
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
                  draggable={!isPlaceholder && (!isClippingEnabled || !isClippingMode)}
                  onDragMove={handleImageDrag}
                  onTransformEnd={handleTransformEnd}
                  style={{
                    cursor: (!isPlaceholder && (!isClippingEnabled || !isClippingMode)) ? 'move' : 'default'
                  }}
                />
                
                {/* Transformer - 편집 모드에서만 표시 (점선 테두리와 코너 핸들) */}
                {isEditing && (
                  <Transformer
                    ref={transformerRef}
                    flipEnabled={false}
                    rotateEnabled={false}
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
                      
                      // 그리드 경계를 벗어나지 않도록 제한
                      const halfWidth = newBox.width / 2;
                      const halfHeight = newBox.height / 2;
                      const centerX = newBox.x + halfWidth;
                      const centerY = newBox.y + halfHeight;
                      
                      // 이미지가 캔버스 경계를 벗어나지 않도록 제한
                      if (centerX - halfWidth < 0 || centerX + halfWidth > canvasSize.width ||
                          centerY - halfHeight < 0 || centerY + halfHeight > canvasSize.height) {
                        return oldBox;
                      }
                      
                      return newBox;
                    }}
                  />
                )}
              </Group>
            )}

            {/* 클리핑 모드 오버레이 */}
            {isClippingMode && !isPlaceholder && Group && Rect && (
              <Group ref={overlayGroupRef}>
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

                {/* 클리핑 핸들들 - 최적화된 위치 계산 */}
                {(() => {
                  // 핸들 위치 계산을 메모이제이션으로 최적화
                  const leftHandleX = clipBounds.left * canvasSize.width - 4;
                  const rightHandleX = clipBounds.right * canvasSize.width - 4;
                  const topHandleY = clipBounds.top * canvasSize.height - 4;
                  const bottomHandleY = clipBounds.bottom * canvasSize.height - 4;
                  
                  const centerX = clipBounds.left * canvasSize.width + (clipBounds.right - clipBounds.left) * canvasSize.width / 2 - 15;
                  const centerY = clipBounds.top * canvasSize.height + (clipBounds.bottom - clipBounds.top) * canvasSize.height / 2 - 15;
                  
                  return (
                    <>
                      {/* 왼쪽 핸들 */}
                      <Rect
                        x={leftHandleX}
                        y={centerY}
                        width={8}
                        height={30}
                        fill="#ffffff"
                        stroke="#3D8BFF"
                        strokeWidth={2}
                        cornerRadius={4}
                        draggable={true}
                        perfectDrawEnabled={false} // 성능 최적화
                        listening={true}
                        onDragMove={handleLeftClipDrag}
                        style={{ cursor: 'ew-resize' }}
                      />

                      {/* 오른쪽 핸들 */}
                      <Rect
                        x={rightHandleX}
                        y={centerY}
                        width={8}
                        height={30}
                        fill="#ffffff"
                        stroke="#3D8BFF"
                        strokeWidth={2}
                        cornerRadius={4}
                        draggable={true}
                        perfectDrawEnabled={false} // 성능 최적화
                        listening={true}
                        onDragMove={handleRightClipDrag}
                        style={{ cursor: 'ew-resize' }}
                      />

                      {/* 위쪽 핸들 */}
                      <Rect
                        x={centerX}
                        y={topHandleY}
                        width={30}
                        height={8}
                        fill="#ffffff"
                        stroke="#3D8BFF"
                        strokeWidth={2}
                        cornerRadius={4}
                        draggable={true}
                        perfectDrawEnabled={false} // 성능 최적화
                        listening={true}
                        onDragMove={handleTopClipDrag}
                        style={{ cursor: 'ns-resize' }}
                      />

                      {/* 아래쪽 핸들 */}
                      <Rect
                        x={centerX}
                        y={bottomHandleY}
                        width={30}
                        height={8}
                        fill="#ffffff"
                        stroke="#3D8BFF"
                        strokeWidth={2}
                        cornerRadius={4}
                        draggable={true}
                        perfectDrawEnabled={false} // 성능 최적화
                        listening={true}
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
        {!isPlaceholder && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-[10000]">
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



      </div>
    );
  }
);

KonvaImageCanvas.displayName = 'KonvaImageCanvas';

export default KonvaImageCanvas;