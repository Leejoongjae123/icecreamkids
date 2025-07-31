"use client";

import { useRef, useEffect, useImperativeHandle, forwardRef, useState, useCallback, useMemo } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RotateCcw, Scissors } from "lucide-react";
// 동적 임포트를 위해 타입만 import
import type { Stage as StageType, Layer as LayerType, Image as ImageType, Group as GroupType, Circle as CircleType, Rect as RectType } from "react-konva";
import type Konva from "konva";

// 동적 임포트를 위한 변수
let Stage: typeof StageType;
let Layer: typeof LayerType;
let KonvaImage: typeof ImageType;
let Rect: typeof RectType;
let Group: typeof GroupType;
let Circle: typeof CircleType;
let KonvaLib: typeof Konva;

// 클라이언트 사이드에서만 Konva 로드
if (typeof window !== 'undefined') {
  const ReactKonva = require('react-konva');
  Stage = ReactKonva.Stage;
  Layer = ReactKonva.Layer;
  KonvaImage = ReactKonva.Image;
  Rect = ReactKonva.Rect;
  Group = ReactKonva.Group;
  Circle = ReactKonva.Circle;
  KonvaLib = require('konva').default;
}

interface KonvaCanvasProps {
  imageUrl: string;
  targetFrame: { width: number; height: number; x: number; y: number };
  onImageLoad?: () => void;
  onImageError?: (error: string) => void;
}

export interface KonvaCanvasRef {
  zoomIn: () => void;
  zoomOut: () => void;
  rotateLeft: () => void;
  rotateRight: () => void;
  reset: () => void;
  getCanvasData: () => any;
  getCroppedImageData: () => string | null;
  applyCrop: () => void;
}

type EditMode = 'edit' | 'crop';

interface HandlePosition {
  x: number;
  y: number;
  width: number;
  height: number;
  id: string;
  type: 'circle' | 'bar';
}

interface ImageData {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  width: number;
  height: number;
  aspectRatio: number; // 원본 비율 (width / height)
}

// 스테이지 좌표계 기준 크롭 영역
interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

  const KonvaCanvas = forwardRef<KonvaCanvasRef, KonvaCanvasProps>(
    ({ imageUrl, targetFrame, onImageLoad, onImageError }, ref) => {
      const stageRef = useRef<any>(null);
      const [konvaImage, setKonvaImage] = useState<HTMLImageElement | null>(null);
      const [isLoading, setIsLoading] = useState(true);
      const [editMode, setEditMode] = useState<EditMode>('edit');
      const [isDragging, setIsDragging] = useState(false); // 드래그 상태 추가
      const [isCropHandleDragging, setIsCropHandleDragging] = useState<string | null>(null); // 크롭 핸들 드래그 상태
      const [imageData, setImageData] = useState<ImageData>({
        x: 300,
        y: 200,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        width: 0,
        height: 0,
        aspectRatio: 0, // 이미지 로드 전에는 0으로 설정
      });

      // 초기화 함수
      const handleReset = useCallback(() => {
        if (initialStateRef.current) {
          setImageData(initialStateRef.current.imageData);
          setCropArea(initialStateRef.current.cropArea);
          setEditMode('edit');
        }
      }, []);

      // 배경제거 함수 (향후 구현될 수 있는 기능)
      const handleRemoveBackground = useCallback(() => {
        // TODO: 배경제거 기능 구현
        console.log("배경제거 기능 호출됨");
        // 실제 구현시에는 AI 배경제거 API 호출 등의 작업이 필요함
      }, []);

    // 스테이지 좌표계 기준 크롭 영역
    const [cropArea, setCropArea] = useState<CropArea>({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });
    
    // 초기 상태 저장
    const initialStateRef = useRef<{ imageData: ImageData; cropArea: CropArea } | null>(null);

    // 캔버스 크기
    const CANVAS_WIDTH = 600;
    const CANVAS_HEIGHT = 400;

    // 이미지 경계 계산 헬퍼 함수 (메모이제이션)
    const getImageBounds = useCallback((imgData: ImageData) => {
      const { x, y, width, height, scaleX, scaleY } = imgData;
      const scaledWidth = width * scaleX;
      const scaledHeight = height * scaleY;
      
      const bounds = {
        left: x - scaledWidth / 2,
        top: y - scaledHeight / 2,
        right: x + scaledWidth / 2,
        bottom: y + scaledHeight / 2,
        width: scaledWidth,
        height: scaledHeight
      };
      
      console.log("🔍 이미지 경계 계산:", {
        원본크기: { width, height },
        스케일: { scaleX, scaleY },
        중심점: { x, y },
        경계: bounds
      });
      
      return bounds;
    }, []);

    // 스테이지 좌표를 이미지 내부 좌표로 변환
    const stageToImageCoords = useCallback((stageX: number, stageY: number, imgData: ImageData) => {
      const bounds = getImageBounds(imgData);
      const relativeX = (stageX - bounds.left) / imgData.scaleX;
      const relativeY = (stageY - bounds.top) / imgData.scaleY;
      
      return {
        x: Math.max(0, Math.min(imgData.width, relativeX)),
        y: Math.max(0, Math.min(imgData.height, relativeY))
      };
    }, [getImageBounds]);

    // 이미지 내부 좌표를 스테이지 좌표로 변환
    const imageToStageCoords = useCallback((imgX: number, imgY: number, imgData: ImageData) => {
      const bounds = getImageBounds(imgData);
      return {
        x: bounds.left + imgX * imgData.scaleX,
        y: bounds.top + imgY * imgData.scaleY
      };
    }, [getImageBounds]);

    // 이미지 로드
    useEffect(() => {
      if (!imageUrl) return;

      console.log("🖼️ 이미지 로드 시작:", imageUrl);
      setIsLoading(true);

      const imageObj = new window.Image();
      imageObj.crossOrigin = "anonymous";
      
      imageObj.onload = () => {
        // 이미지가 캔버스에 맞도록 스케일 계산
        const imgWidth = imageObj.width;
        const imgHeight = imageObj.height;
        
        const scaleX = CANVAS_WIDTH / imgWidth * 0.8;
        const scaleY = CANVAS_HEIGHT / imgHeight * 0.8;
        const scale = Math.min(scaleX, scaleY);

        const newImageData: ImageData = {
          x: CANVAS_WIDTH / 2,
          y: CANVAS_HEIGHT / 2,
          scaleX: scale,
          scaleY: scale,
          rotation: 0,
          width: imgWidth,
          height: imgHeight,
          aspectRatio: imgWidth / imgHeight, // 원본 비율 계산
        };

        // 초기 크롭 영역을 이미지 전체 경계로 설정 (스테이지 좌표)
        const bounds = getImageBounds(newImageData);
        const newCropArea: CropArea = {
          x: bounds.left,
          y: bounds.top,
          width: bounds.width,
          height: bounds.height,
        };

        setImageData(newImageData);
        setCropArea(newCropArea);
        setKonvaImage(imageObj);
        
        // 초기 상태 저장
        initialStateRef.current = {
          imageData: newImageData,
          cropArea: newCropArea
        };
        
        setIsLoading(false);
        onImageLoad?.();
        console.log("✅ 이미지 로드 완료");
      };

      imageObj.onerror = () => {
        console.error("이미지 로드 실패");
        setIsLoading(false);
        onImageError?.("이미지를 불러올 수 없습니다.");
      };

      imageObj.src = imageUrl;
    }, [imageUrl, onImageLoad, onImageError, getImageBounds]);

    // 모드 전환 시 상태 동기화
    const prevEditModeRef = useRef<EditMode>('edit');
    useEffect(() => {
      if (!konvaImage || editMode === prevEditModeRef.current) return;
      
      console.log("🔄 모드 전환 감지:", { 
        이전모드: prevEditModeRef.current, 
        현재모드: editMode,
        현재이미지상태: {
          크기: { width: imageData.width, height: imageData.height },
          위치: { x: imageData.x, y: imageData.y },
          스케일: { scaleX: imageData.scaleX, scaleY: imageData.scaleY },
          비율: imageData.aspectRatio
        }
      });
      
      // 크롭모드 → 편집모드: 자동으로 크롭 적용
      if (prevEditModeRef.current === 'crop' && editMode === 'edit') {
        console.log("✂️ 크롭모드에서 편집모드로 전환 - 자동 크롭 적용");
        
        // 크롭 적용 로직 (applyCrop과 동일)
        const bounds = getImageBounds(imageData);
        
        // 크롭 영역을 이미지 내부 좌표로 변환
        const cropInImageCoords = {
          x: (cropArea.x - bounds.left) / imageData.scaleX,
          y: (cropArea.y - bounds.top) / imageData.scaleY,
          width: cropArea.width / imageData.scaleX,
          height: cropArea.height / imageData.scaleY
        };

        // 크롭된 이미지 생성
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        canvas.width = cropInImageCoords.width;
        canvas.height = cropInImageCoords.height;

        // 원본 이미지에서 크롭 영역만 그리기
        ctx.drawImage(
          konvaImage,
          cropInImageCoords.x, cropInImageCoords.y, 
          cropInImageCoords.width, cropInImageCoords.height,
          0, 0, 
          cropInImageCoords.width, cropInImageCoords.height
        );

        const croppedDataURL = canvas.toDataURL();
        const newImg = new window.Image();
        
        newImg.onload = () => {
          // 현재 크롭 영역의 위치와 스케일을 그대로 유지
          const newImageData: ImageData = {
            x: cropArea.x + cropArea.width / 2,  // 크롭 영역 중심 유지
            y: cropArea.y + cropArea.height / 2, // 크롭 영역 중심 유지
            scaleX: imageData.scaleX,           // 현재 스케일 유지
            scaleY: imageData.scaleY,           // 현재 스케일 유지
            rotation: imageData.rotation,       // 현재 회전 유지
            width: cropInImageCoords.width,
            height: cropInImageCoords.height,
            aspectRatio: cropInImageCoords.width / cropInImageCoords.height,
          };
          
          // 새로운 크롭 영역 설정 (현재 크롭 영역과 동일한 위치와 크기)
          const newCropArea: CropArea = {
            x: cropArea.x,
            y: cropArea.y,
            width: cropArea.width,
            height: cropArea.height,
          };
          
          console.log("✂️ 자동 크롭 적용 완료:", {
            이미지크기: { width: newImageData.width, height: newImageData.height },
            새로운비율: newImageData.aspectRatio,
            스케일: { scaleX: newImageData.scaleX, scaleY: newImageData.scaleY },
            위치: { x: newImageData.x, y: newImageData.y },
            새크롭영역: newCropArea
          });
          
          // 상태 업데이트
          setKonvaImage(newImg);
          setImageData(newImageData);
          setCropArea(newCropArea);
          
          // 초기 상태 참조 업데이트
          initialStateRef.current = {
            imageData: newImageData,
            cropArea: newCropArea
          };
        };
        
        newImg.src = croppedDataURL;
        prevEditModeRef.current = editMode;
        return;
      }
      
      prevEditModeRef.current = editMode;

      // 현재 이미지 상태 기준으로 실시간 경계 계산
      const currentBounds = getImageBounds(imageData);
      
      if (editMode === 'crop') {
        // 편집모드 → 크롭모드: 기존 크롭 영역 최대한 유지
        console.log("📐 크롭모드로 전환 - 현재 이미지 경계:", currentBounds);
        
        setCropArea(prevCrop => {
          console.log("📐 기존 크롭 영역:", prevCrop);
          
          // 크롭 영역이 완전히 무효한 경우에만 재설정
          const isCompletelyInvalid = 
            prevCrop.width <= 0 ||
            prevCrop.height <= 0 ||
            prevCrop.x >= currentBounds.right ||
            prevCrop.y >= currentBounds.bottom ||
            prevCrop.x + prevCrop.width <= currentBounds.left ||
            prevCrop.y + prevCrop.height <= currentBounds.top;
          
          if (isCompletelyInvalid) {
            console.log("⚠️ 크롭 영역이 완전히 무효함 - 재설정 필요");
            const newCropArea = {
              x: currentBounds.left,
              y: currentBounds.top,
              width: currentBounds.width,
              height: currentBounds.height,
            };
            console.log("✅ 크롭 영역을 현재 이미지 경계로 재설정:", newCropArea);
            return newCropArea;
          } else {
            // 크롭 영역을 이미지 경계 내로 클램핑 (사용자 설정 최대한 유지)
            const clampedCropArea = {
              x: Math.max(currentBounds.left, Math.min(prevCrop.x, currentBounds.right - 20)),
              y: Math.max(currentBounds.top, Math.min(prevCrop.y, currentBounds.bottom - 20)),
              width: Math.min(prevCrop.width, currentBounds.width),
              height: Math.min(prevCrop.height, currentBounds.height)
            };
            
            // 크롭 영역이 경계를 넘지 않도록 최종 조정
            if (clampedCropArea.x + clampedCropArea.width > currentBounds.right) {
              clampedCropArea.width = currentBounds.right - clampedCropArea.x;
            }
            if (clampedCropArea.y + clampedCropArea.height > currentBounds.bottom) {
              clampedCropArea.height = currentBounds.bottom - clampedCropArea.y;
            }
            
            console.log("✅ 크롭 영역을 경계 내로 클램핑:", {
              이전: prevCrop,
              클램핑후: clampedCropArea
            });
            
            return clampedCropArea;
          }
        });
      } else {
        // 편집모드에서는 별도 처리 없음 (이미 크롭이 적용됨)
        console.log("📐 편집모드 - 크롭된 이미지 상태 유지");
      }
    }, [editMode, imageData, konvaImage, getImageBounds, cropArea]);

    // 핸들 위치 계산
    const getHandlePositions = useCallback((): HandlePosition[] => {
      if (!imageData || !konvaImage) return [];

      // 실시간으로 이미지 경계 계산 (상태 동기화 문제 방지)
      const realTimeBounds = getImageBounds(imageData);

      console.log("🎯 핸들 위치 계산 시작:", { 
        editMode, 
        imageData: { 
          x: imageData.x, 
          y: imageData.y, 
          width: imageData.width, 
          height: imageData.height,
          scaleX: imageData.scaleX,
          scaleY: imageData.scaleY
        },
        realTimeBounds,
        cropArea
      });

      if (editMode === 'crop') {
        // 크롭 모드: 바 형태 핸들
        const barThickness = 8;
        const barLength = 50;
        
        const handles = [
          // 상단 바 (가로)
          { 
            x: cropArea.x + cropArea.width / 2 - barLength / 2, 
            y: cropArea.y - barThickness / 2, 
            width: barLength, 
            height: barThickness, 
            id: 'top',
            type: 'bar' as const
          },
          // 하단 바 (가로)
          { 
            x: cropArea.x + cropArea.width / 2 - barLength / 2, 
            y: cropArea.y + cropArea.height - barThickness / 2, 
            width: barLength, 
            height: barThickness, 
            id: 'bottom',
            type: 'bar' as const
          },
          // 좌측 바 (세로)
          { 
            x: cropArea.x - barThickness / 2, 
            y: cropArea.y + cropArea.height / 2 - barLength / 2, 
            width: barThickness, 
            height: barLength, 
            id: 'left',
            type: 'bar' as const
          },
          // 우측 바 (세로)
          { 
            x: cropArea.x + cropArea.width - barThickness / 2, 
            y: cropArea.y + cropArea.height / 2 - barLength / 2, 
            width: barThickness, 
            height: barLength, 
            id: 'right',
            type: 'bar' as const
          }
        ];
        
        console.log("📐 크롭 모드 핸들:", handles);
        return handles;
      } else {
        // 편집 모드: 크롭된 영역 기준으로 원형 핸들 배치
        const effectiveBounds = {
          left: cropArea.x,
          top: cropArea.y,
          right: cropArea.x + cropArea.width,
          bottom: cropArea.y + cropArea.height
        };
        
        const handles = [
          { x: effectiveBounds.left, y: effectiveBounds.top, width: 16, height: 16, id: 'topLeft', type: 'circle' as const },
          { x: effectiveBounds.right, y: effectiveBounds.top, width: 16, height: 16, id: 'topRight', type: 'circle' as const },
          { x: effectiveBounds.left, y: effectiveBounds.bottom, width: 16, height: 16, id: 'bottomLeft', type: 'circle' as const },
          { x: effectiveBounds.right, y: effectiveBounds.bottom, width: 16, height: 16, id: 'bottomRight', type: 'circle' as const }
        ];
        
        console.log("📐 편집 모드 핸들 (크롭 영역 기준):", {
          크롭영역: cropArea,
          유효경계: effectiveBounds,
          핸들: handles
        });
        return handles;
      }
    }, [imageData, cropArea, editMode, konvaImage, getImageBounds]);

    // 이미지 드래그 시작 핸들러
    const handleImageDragStart = useCallback(() => {
      console.log("🚚 이미지 드래그 시작 - 핸들과 외곽선 숨김");
      setIsDragging(true);
    }, []);

    // 이미지 드래그 핸들러
    const handleImageDrag = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
      const newX = e.target.x();
      const newY = e.target.y();
      
      console.log("🚚 이미지 드래그:", {
        모드: editMode,
        이전위치: { x: imageData.x, y: imageData.y },
        새위치: { x: newX, y: newY }
      });
      
      setImageData(prev => ({ ...prev, x: newX, y: newY }));
      
      // 드래그 중에는 크롭 영역을 함께 이동시키지 않음 (드래그 완료 시 조정)
    }, [imageData, editMode]);

    // 이미지 드래그 완료 핸들러 - 크롭 영역과 이미지 경계 동기화
    const handleImageDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
      const newX = e.target.x();
      const newY = e.target.y();
      
      console.log("🎯 드래그 완료 - 핸들과 외곽선 다시 표시");
      setIsDragging(false); // 드래그 상태 해제
      
      // 최종 이미지 데이터 업데이트
      const finalImageData = { ...imageData, x: newX, y: newY };
      
      // 실제 이미지 경계 계산
      const realImageBounds = getImageBounds(finalImageData);
      
      console.log("🎯 드래그 완료 - 경계 동기화:", {
        최종이미지위치: { x: newX, y: newY },
        실제이미지경계: realImageBounds,
        현재크롭영역: cropArea
      });
      
      // 편집 모드에서는 크롭 영역을 이미지 경계에 맞춤
      if (editMode === 'edit') {
        setCropArea({
          x: realImageBounds.left,
          y: realImageBounds.top,
          width: realImageBounds.width,
          height: realImageBounds.height
        });
        console.log("✅ 편집모드 - 크롭 영역을 이미지 경계에 맞춤");
      } else {
        // 크롭 모드에서는 크롭 영역이 이미지 경계를 벗어나지 않도록 조정
        setCropArea(prev => {
          const adjustedCropArea = {
            x: Math.max(realImageBounds.left, Math.min(prev.x, realImageBounds.right - prev.width)),
            y: Math.max(realImageBounds.top, Math.min(prev.y, realImageBounds.bottom - prev.height)),
            width: Math.min(prev.width, realImageBounds.width),
            height: Math.min(prev.height, realImageBounds.height)
          };
          
          // 크롭 영역이 이미지 경계를 넘지 않도록 최종 조정
          if (adjustedCropArea.x + adjustedCropArea.width > realImageBounds.right) {
            adjustedCropArea.width = realImageBounds.right - adjustedCropArea.x;
          }
          if (adjustedCropArea.y + adjustedCropArea.height > realImageBounds.bottom) {
            adjustedCropArea.height = realImageBounds.bottom - adjustedCropArea.y;
          }
          
          console.log("✅ 크롭모드 - 크롭 영역을 이미지 경계 내로 조정:", adjustedCropArea);
          return adjustedCropArea;
        });
      }
    }, [imageData, cropArea, editMode, getImageBounds]);

    // 편집 모드 핸들 드래그 핸들러
    const handleEditHandleDrag = useCallback((e: Konva.KonvaEventObject<DragEvent>, handleId: string) => {
      // 실제 핸들의 현재 위치 사용 (포인터 위치 대신)
      const handleX = e.target.x();
      const handleY = e.target.y();

      // 이미지 중심점
      const imageCenterX = imageData.x;
      const imageCenterY = imageData.y;

      let newScale = imageData.scaleX; // 단일 스케일 값 사용

      // 핸들에 따라 이미지 중심에서의 거리를 기준으로 스케일 계산 (핸들 위치 기준)
      switch (handleId) {
        case 'topLeft': {
          const distanceX = Math.abs(imageCenterX - handleX);
          const distanceY = Math.abs(imageCenterY - handleY);
          
          const scaleX = Math.max(0.1, Math.min(5, distanceX / (imageData.width / 2 * imageData.scaleX) * imageData.scaleX));
          const scaleY = Math.max(0.1, Math.min(5, distanceY / (imageData.height / 2 * imageData.scaleY) * imageData.scaleY));
          newScale = Math.min(scaleX, scaleY);
          break;
        }
        case 'topRight': {
          const distanceX = Math.abs(handleX - imageCenterX);
          const distanceY = Math.abs(imageCenterY - handleY);
          
          const scaleX = Math.max(0.1, Math.min(5, distanceX / (imageData.width / 2 * imageData.scaleX) * imageData.scaleX));
          const scaleY = Math.max(0.1, Math.min(5, distanceY / (imageData.height / 2 * imageData.scaleY) * imageData.scaleY));
          newScale = Math.min(scaleX, scaleY);
          break;
        }
        case 'bottomLeft': {
          const distanceX = Math.abs(imageCenterX - handleX);
          const distanceY = Math.abs(handleY - imageCenterY);
          
          const scaleX = Math.max(0.1, Math.min(5, distanceX / (imageData.width / 2 * imageData.scaleX) * imageData.scaleX));
          const scaleY = Math.max(0.1, Math.min(5, distanceY / (imageData.height / 2 * imageData.scaleY) * imageData.scaleY));
          newScale = Math.min(scaleX, scaleY);
          break;
        }
        case 'bottomRight': {
          const distanceX = Math.abs(handleX - imageCenterX);
          const distanceY = Math.abs(handleY - imageCenterY);
          
          const scaleX = Math.max(0.1, Math.min(5, distanceX / (imageData.width / 2 * imageData.scaleX) * imageData.scaleX));
          const scaleY = Math.max(0.1, Math.min(5, distanceY / (imageData.height / 2 * imageData.scaleY) * imageData.scaleY));
          newScale = Math.min(scaleX, scaleY);
          break;
        }
      }

      console.log("🔧 편집모드 핸들 드래그 (핸들 위치 기준):", {
        handleId,
        핸들위치: { x: handleX, y: handleY },
        이미지중심: { x: imageCenterX, y: imageCenterY },
        이전스케일: imageData.scaleX,
        새로운스케일: newScale,
        스케일비율: newScale / imageData.scaleX
      });

      // 스케일 비율 계산
      const scaleRatio = newScale / imageData.scaleX;

      // 이미지 데이터 업데이트
      setImageData(prev => ({
        ...prev,
        scaleX: newScale,
        scaleY: newScale // 원본 비율 유지를 위해 동일한 값 사용
      }));

      // 크롭 영역을 이미지와 동일한 비율로 스케일링 (이미지 중심 기준)
      setCropArea(prev => {
        const cropCenterX = prev.x + prev.width / 2;
        const cropCenterY = prev.y + prev.height / 2;
        
        // 크롭 중심에서 이미지 중심까지의 거리
        const offsetX = cropCenterX - imageCenterX;
        const offsetY = cropCenterY - imageCenterY;
        
        // 새로운 크롭 크기와 위치 계산
        const newWidth = prev.width * scaleRatio;
        const newHeight = prev.height * scaleRatio;
        const newCropCenterX = imageCenterX + offsetX * scaleRatio;
        const newCropCenterY = imageCenterY + offsetY * scaleRatio;
        
        const newCropArea = {
          x: newCropCenterX - newWidth / 2,
          y: newCropCenterY - newHeight / 2,
          width: newWidth,
          height: newHeight
        };
        
        console.log("📐 크롭 영역 동기화 (이미지 중심 기준):", {
          이전크롭: prev,
          스케일비율: scaleRatio,
          새크롭: newCropArea,
          이미지중심: { x: imageCenterX, y: imageCenterY }
        });
        
        return newCropArea;
      });
    }, [imageData, cropArea]);

    // 크롭 핸들 마우스 다운 핸들러
    const handleCropHandleMouseDown = useCallback((handleId: string) => {
      console.log("🎯 크롭 핸들 마우스 다운:", handleId);
      setIsCropHandleDragging(handleId);
    }, []);

    // 스테이지 마우스 이동 핸들러 (크롭 핸들 드래그용)
    const handleStageMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isCropHandleDragging || editMode !== 'crop') return;

      const stage = e.target.getStage();
      const pointerPos = stage?.getPointerPosition();
      if (!pointerPos) return;

      // 실시간으로 이미지 경계 계산
      const bounds = getImageBounds(imageData);

      // 포인터 위치를 이미지 경계 내로 제한
      const boundedX = Math.max(bounds.left, Math.min(bounds.right, pointerPos.x));
      const boundedY = Math.max(bounds.top, Math.min(bounds.bottom, pointerPos.y));

      setCropArea(prev => {
        const currentCrop = { ...prev };

        // 핸들 종류에 따라 크롭 영역 업데이트 (핸들은 각 변의 중앙에 고정)
        switch (isCropHandleDragging) {
          case 'top':
            // 상단 핸들: 크롭 영역의 상단 경계만 조정
            const newTopY = Math.max(bounds.top, Math.min(boundedY, currentCrop.y + currentCrop.height - 20));
            currentCrop.height = currentCrop.y + currentCrop.height - newTopY;
            currentCrop.y = newTopY;
            break;
          case 'bottom':
            // 하단 핸들: 크롭 영역의 하단 경계만 조정
            const newBottomY = Math.max(currentCrop.y + 20, Math.min(bounds.bottom, boundedY));
            currentCrop.height = newBottomY - currentCrop.y;
            break;
          case 'left':
            // 좌측 핸들: 크롭 영역의 좌측 경계만 조정
            const newLeftX = Math.max(bounds.left, Math.min(boundedX, currentCrop.x + currentCrop.width - 20));
            currentCrop.width = currentCrop.x + currentCrop.width - newLeftX;
            currentCrop.x = newLeftX;
            break;
          case 'right':
            // 우측 핸들: 크롭 영역의 우측 경계만 조정
            const newRightX = Math.max(currentCrop.x + 20, Math.min(bounds.right, boundedX));
            currentCrop.width = newRightX - currentCrop.x;
            break;
        }

        // 크롭 영역이 이미지 경계를 벗어나지 않도록 최종 조정
        currentCrop.x = Math.max(bounds.left, currentCrop.x);
        currentCrop.y = Math.max(bounds.top, currentCrop.y);
        currentCrop.width = Math.min(currentCrop.width, bounds.right - currentCrop.x);
        currentCrop.height = Math.min(currentCrop.height, bounds.bottom - currentCrop.y);

        console.log("📐 크롭 영역 조정:", {
          핸들: isCropHandleDragging,
          포인터: pointerPos,
          제한된포인터: { x: boundedX, y: boundedY },
          이미지경계: bounds,
          새크롭영역: currentCrop
        });

        return currentCrop;
      });
    }, [isCropHandleDragging, editMode, imageData, getImageBounds]);

    // 스테이지 마우스 업 핸들러 (크롭 핸들 드래그 종료)
    const handleStageMouseUp = useCallback(() => {
      if (isCropHandleDragging) {
        console.log("🎯 크롭 핸들 드래그 종료:", isCropHandleDragging);
        setIsCropHandleDragging(null);
      }
    }, [isCropHandleDragging]);

    // 통합 핸들 드래그 핸들러
    const handleHandleDrag = useCallback((e: Konva.KonvaEventObject<DragEvent>, handleId: string) => {
      if (editMode === 'edit') {
        handleEditHandleDrag(e, handleId);
      } else {
        // 크롭 핸들 드래그는 스테이지 마우스 이벤트로 처리
      }
    }, [editMode, handleEditHandleDrag]);

    // 마우스 휠로 줌 기능
    const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      
      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const scaleBy = 1.05;
      const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

      // 줌 제한
      if (newScale < 0.1 || newScale > 5) return;

      stage.scale({ x: newScale, y: newScale });

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };
      stage.position(newPos);
    }, []);

    // 외부로 노출할 메서드들
    useImperativeHandle(ref, () => ({
      zoomIn: () => {
        setImageData(prev => {
          const newScale = prev.scaleX * 1.1;
          console.log("🔍 줌 인:", { 이전스케일: prev.scaleX, 새스케일: newScale });
          return {
            ...prev,
            scaleX: newScale,
            scaleY: newScale, // 원본 비율 유지
          };
        });
      },
      zoomOut: () => {
        setImageData(prev => {
          const newScale = prev.scaleX * 0.9;
          console.log("🔍 줌 아웃:", { 이전스케일: prev.scaleX, 새스케일: newScale });
          return {
            ...prev,
            scaleX: newScale,
            scaleY: newScale, // 원본 비율 유지
          };
        });
      },
      rotateLeft: () => {
        setImageData(prev => ({
          ...prev,
          rotation: prev.rotation - 90,
        }));
      },
      rotateRight: () => {
        setImageData(prev => ({
          ...prev,
          rotation: prev.rotation + 90,
        }));
      },
      reset: () => {
        if (initialStateRef.current) {
          setImageData(initialStateRef.current.imageData);
          setCropArea(initialStateRef.current.cropArea);
          setEditMode('edit');
        }
      },
      getCanvasData: () => {
        const stage = stageRef.current;
        if (!stage) return null;
        
        return stage.toDataURL({
          pixelRatio: 2,
          mimeType: 'image/png',
        });
      },
      getCroppedImageData: (): string | null => {
        const stage = stageRef.current;
        if (!stage || !konvaImage) return null;

        // 타겟 프레임 크기 계산
        const targetWidth = Math.min(300, CANVAS_WIDTH * 0.7);
        const targetHeight = targetWidth * (targetFrame.height / targetFrame.width);
        
        const cropX = (CANVAS_WIDTH - targetWidth) / 2;
        const cropY = (CANVAS_HEIGHT - targetHeight) / 2;

        return stage.toDataURL({
          x: cropX,
          y: cropY,
          width: targetWidth,
          height: targetHeight,
          pixelRatio: 1,
        });
      },
      applyCrop: () => {
        if (editMode !== 'crop' || !konvaImage) return;

        // 실시간으로 이미지 경계 계산
        const bounds = getImageBounds(imageData);

        // 크롭 영역을 이미지 내부 좌표로 변환
        const cropInImageCoords = {
          x: (cropArea.x - bounds.left) / imageData.scaleX,
          y: (cropArea.y - bounds.top) / imageData.scaleY,
          width: cropArea.width / imageData.scaleX,
          height: cropArea.height / imageData.scaleY
        };

        // 크롭된 이미지 생성
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        canvas.width = cropInImageCoords.width;
        canvas.height = cropInImageCoords.height;

        // 원본 이미지에서 크롭 영역만 그리기
        ctx.drawImage(
          konvaImage,
          cropInImageCoords.x, cropInImageCoords.y, 
          cropInImageCoords.width, cropInImageCoords.height,
          0, 0, 
          cropInImageCoords.width, cropInImageCoords.height
        );

        const croppedDataURL = canvas.toDataURL();
        const newImg = new window.Image();
        
        newImg.onload = () => {
          // 새로운 이미지 상태 계산
          const scale = Math.min(
            CANVAS_WIDTH / cropInImageCoords.width * 0.8,
            CANVAS_HEIGHT / cropInImageCoords.height * 0.8
          );
          
          const newImageData: ImageData = {
            x: CANVAS_WIDTH / 2,
            y: CANVAS_HEIGHT / 2,
            scaleX: scale,
            scaleY: scale,
            rotation: 0,
            width: cropInImageCoords.width,
            height: cropInImageCoords.height,
            aspectRatio: cropInImageCoords.width / cropInImageCoords.height, // 크롭된 이미지의 새로운 비율
          };
          
          // 새로운 크롭 영역 설정 (크롭된 이미지 전체 영역)
          const newBounds = getImageBounds(newImageData);
          const newCropArea: CropArea = {
            x: newBounds.left,
            y: newBounds.top,
            width: newBounds.width,
            height: newBounds.height,
          };
          
          console.log("🎯 크롭 적용 완료 - 새로운 상태:", {
            이미지크기: { width: newImageData.width, height: newImageData.height },
            새로운비율: newImageData.aspectRatio,
            스케일: { scaleX: newImageData.scaleX, scaleY: newImageData.scaleY },
            새로운경계: newBounds,
            새크롭영역: newCropArea
          });
          
          // 상태 업데이트
          setKonvaImage(newImg);
          setImageData(newImageData);
          setCropArea(newCropArea);
          
          // 초기 상태 참조 업데이트 (reset 기능을 위해)
          initialStateRef.current = {
            imageData: newImageData,
            cropArea: newCropArea
          };
          
          // 편집 모드로 전환
          setEditMode('edit');
          
          console.log("✅ 크롭 적용 완료 - 새로운 이미지 크기:", newImageData.width, "x", newImageData.height);
        };
        
        newImg.src = croppedDataURL;
      }
    }), [konvaImage, targetFrame, editMode, cropArea, imageData, getImageBounds]);

    const handlePositions = getHandlePositions();

    // 서버 사이드에서는 렌더링하지 않음
    if (typeof window === 'undefined' || !Stage || !Layer || !KonvaImage) {
      return <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">이미지 편집기 로딩 중...</div>
      </div>;
    }

    return (
      <div 
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {/* 편집 모드 선택 및 도구 버튼 */}
        <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
          <div className="flex items-center justify-between">
            <RadioGroup value={editMode} onValueChange={(value) => setEditMode(value as EditMode)}>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="edit" id="edit" />
                  <Label htmlFor="edit">편집 모드</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="crop" id="crop" />
                  <Label htmlFor="crop">크롭 모드</Label>
                </div>
              </div>
            </RadioGroup>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isLoading || !konvaImage}
                className="flex items-center gap-1"
              >
                <RotateCcw className="w-4 h-4" />
                초기화
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveBackground}
                disabled={isLoading || !konvaImage}
                className="flex items-center gap-1"
              >
                <Scissors className="w-4 h-4" />
                배경제거
              </Button>
            </div>
          </div>
        </div>

        <div 
          style={{
            flex: 1,
            maxWidth: '600px',
            maxHeight: '400px',
            position: 'relative',
          }}
        >
          {isLoading && (
            <div 
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                zIndex: 10,
              }}
            >
              <div style={{ color: '#666' }}>이미지 로딩 중...</div>
            </div>
          )}
          
          <Stage 
            width={CANVAS_WIDTH} 
            height={CANVAS_HEIGHT} 
            ref={stageRef}
            onWheel={handleWheel}
            onMouseMove={handleStageMouseMove}
            onMouseUp={handleStageMouseUp}
            style={{
              backgroundColor: '#ffffff',
              width: '100%',
              height: '100%',
            }}
          >
            <Layer>
              {/* 배경 */}
              <Rect
                x={0}
                y={0}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                fill="#ffffff"
              />

              {/* 이미지 */}
              {konvaImage && (
                <>
                  {/* 드래그 중이 아닐 때만 클리핑 적용 */}
                  <Group
                    clipX={isDragging ? 0 : cropArea.x}
                    clipY={isDragging ? 0 : cropArea.y}
                    clipWidth={isDragging ? CANVAS_WIDTH : cropArea.width}
                    clipHeight={isDragging ? CANVAS_HEIGHT : cropArea.height}
                  >
                    <KonvaImage
                      image={konvaImage}
                      x={imageData.x}
                      y={imageData.y}
                      width={imageData.width}
                      height={imageData.height}
                      scaleX={imageData.scaleX}
                      scaleY={imageData.scaleY}
                      rotation={imageData.rotation}
                      offsetX={imageData.width / 2}
                      offsetY={imageData.height / 2}
                      draggable
                      onDragStart={handleImageDragStart}
                      onDragMove={handleImageDrag}
                      onDragEnd={handleImageDragEnd}
                    />
                  </Group>

                  {/* 경계선 표시 - 드래그 중이 아닐 때만 표시 */}
                  {!isDragging && editMode === 'crop' && (
                    <Rect
                      x={cropArea.x}
                      y={cropArea.y}
                      width={cropArea.width}
                      height={cropArea.height}
                      stroke="#3D8BFF"
                      strokeWidth={2}
                      dash={[5, 5]}
                      listening={false}
                    />
                  )}

                  {!isDragging && editMode === 'edit' && (
                    <Rect
                      x={cropArea.x}
                      y={cropArea.y}
                      width={cropArea.width}
                      height={cropArea.height}
                      stroke="#3D8BFF"
                      strokeWidth={2}
                      dash={[5, 5]}
                      listening={false}
                    />
                  )}

                  {/* 핸들 - 드래그 중이 아닐 때만 표시 */}
                  {!isDragging && handlePositions.map((handle) => (
                    handle.type === 'circle' ? (
                      <Circle
                        key={handle.id}
                        x={handle.x}
                        y={handle.y}
                        radius={8}
                        fill="#ffffff"
                        stroke="#3D8BFF"
                        strokeWidth={2}
                        draggable={editMode === 'edit'} // 편집 모드에서만 드래그 가능
                        onDragMove={(e) => editMode === 'edit' && handleHandleDrag(e, handle.id)}
                      />
                    ) : (
                      <Rect
                        key={handle.id}
                        x={handle.x}
                        y={handle.y}
                        width={handle.width}
                        height={handle.height}
                        fill="#ffffff"
                        stroke="#3D8BFF"
                        strokeWidth={2}
                        cornerRadius={4}
                        draggable={false} // 크롭 핸들은 드래그 불가
                        onMouseDown={() => editMode === 'crop' && handleCropHandleMouseDown(handle.id)}
                        style={{ cursor: editMode === 'crop' ? 'grab' : 'default' }}
                      />
                    )
                  ))}
                </>
              )}
            </Layer>
          </Stage>
        </div>

        <div className="mt-4 text-sm text-gray-600 space-y-1">
          <p><strong>현재 모드:</strong> {editMode === 'crop' ? '크롭 모드' : '편집 모드'}</p>
          <p>• 이미지를 드래그해서 위치를 변경할 수 있습니다</p>
          {editMode === 'crop' ? (
            <>
              <p>• 파란색 바 핸들을 드래그하면 크롭 영역을 조정할 수 있습니다</p>
              <p>• 크롭 영역 밖의 이미지는 잘려서 보이지 않습니다</p>
              <p>• "크롭 적용" 버튼으로 최종 크롭된 이미지를 확정할 수 있습니다</p>
            </>
          ) : (
            <>
              <p>• 초록색 핸들을 드래그하면 이미지 크기가 조정됩니다</p>
              <p>• 각 모서리 핸들을 드래그하여 이미지를 확대/축소할 수 있습니다</p>
            </>
          )}
        </div>
      </div>
    );
  }
);

KonvaCanvas.displayName = 'KonvaCanvas';

export default KonvaCanvas; 