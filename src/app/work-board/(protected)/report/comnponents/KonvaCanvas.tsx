"use client";

import { useRef, useEffect, useImperativeHandle, forwardRef, useState, useCallback, useMemo } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RotateCcw, Scissors, Download } from "lucide-react";
// 동적 임포트를 위해 타입만 import
import type { Stage as StageType, Layer as LayerType, Image as ImageType, Group as GroupType, Circle as CircleType, Rect as RectType, Transformer as TransformerType } from "react-konva";
import type Konva from "konva";

// 동적 임포트를 위한 변수
let Stage: typeof StageType | null = null;
let Layer: typeof LayerType | null = null;
let KonvaImage: typeof ImageType | null = null;
let Rect: typeof RectType | null = null;
let Group: typeof GroupType | null = null;
let Circle: typeof CircleType | null = null;
let Transformer: typeof TransformerType | null = null;
let Text: any = null;
let KonvaLib: typeof Konva | null = null;

// 클라이언트 사이드에서만 Konva 로드
if (typeof window !== 'undefined') {
  try {
    const ReactKonva = require('react-konva');
    Stage = ReactKonva.Stage;
    Layer = ReactKonva.Layer;
    KonvaImage = ReactKonva.Image;
    Rect = ReactKonva.Rect;
    Group = ReactKonva.Group;
    Circle = ReactKonva.Circle;
    Transformer = ReactKonva.Transformer;
    Text = ReactKonva.Text;
    KonvaLib = require('konva').default;
    console.log("✅ Konva 라이브러리 로드 성공");
  } catch (error) {
    console.error("❌ Konva 라이브러리 로드 실패:", error);
  }
}

interface KonvaCanvasProps {
  imageUrl: string;
  targetFrame: { width: number; height: number; x: number; y: number };
  onImageLoad?: () => void;
  onImageError?: (error: string) => void;
  onExtractComplete?: (imageData: string) => void;
  onCancel?: () => void; // 취소 버튼 핸들러 추가
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
  getTargetFrameImageData: () => string | null;
  triggerExtract: () => void; // 추출하기 버튼과 동일한 기능을 외부에서 호출할 수 있도록 노출
}

type EditMode = 'edit' | 'crop';

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

// 추출 영역 (targetFrame을 캔버스 좌표계로 변환)
interface ExtractArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

  const KonvaCanvas = forwardRef<KonvaCanvasRef, KonvaCanvasProps>(
    ({ imageUrl, targetFrame, onImageLoad, onImageError, onExtractComplete, onCancel }, ref) => {
      const stageRef = useRef<any>(null);
      const imageRef = useRef<any>(null);
      const transformerRef = useRef<any>(null);
      const [konvaImage, setKonvaImage] = useState<HTMLImageElement | null>(null);
      const [isLoading, setIsLoading] = useState(true);
      const [isKonvaLoaded, setIsKonvaLoaded] = useState(false);
      const [editMode, setEditMode] = useState<EditMode>('edit');
      const [isDragging, setIsDragging] = useState(false);
      const [isCropHandleDragging, setIsCropHandleDragging] = useState<string | null>(null);
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

  // 추출 영역 상태 (targetFrame을 캔버스 좌표계로 변환한 것)
  const [extractArea, setExtractArea] = useState<ExtractArea>({
    x: 100,
    y: 100,
    width: 200,
    height: 150,
  });

  // targetFrame을 캔버스 좌표계로 변환하는 함수
  const convertTargetFrameToExtractArea = useCallback(() => {
    if (targetFrame) {
      // targetFrame의 원본 비율 계산
      const aspectRatio = targetFrame.width / targetFrame.height;
      
      // 캔버스 안에 맞도록 스케일 계산 (여백 10px 확보)
      const maxWidth = CANVAS_WIDTH - 20;
      const maxHeight = CANVAS_HEIGHT - 20;
      
      let finalWidth = targetFrame.width;
      let finalHeight = targetFrame.height;
      
      // 캔버스보다 큰 경우 비율 유지하면서 축소
      if (finalWidth > maxWidth || finalHeight > maxHeight) {
        const scaleX = maxWidth / finalWidth;
        const scaleY = maxHeight / finalHeight;
        const scale = Math.min(scaleX, scaleY);
        
        finalWidth = finalWidth * scale;
        finalHeight = finalHeight * scale;
      }
      
      // 캔버스 중앙에 배치
      const canvasCenterX = CANVAS_WIDTH / 2;
      const canvasCenterY = CANVAS_HEIGHT / 2;
      
      const extractX = canvasCenterX - finalWidth / 2;
      const extractY = canvasCenterY - finalHeight / 2;
      
      // 캔버스 경계를 벗어나지 않도록 최종 조정
      const clampedX = Math.max(10, Math.min(extractX, CANVAS_WIDTH - finalWidth - 10));
      const clampedY = Math.max(10, Math.min(extractY, CANVAS_HEIGHT - finalHeight - 10));
      
      setExtractArea({
        x: clampedX,
        y: clampedY,
        width: finalWidth,
        height: finalHeight,
      });
      
      console.log("🎯 targetFrame을 extractArea로 변환:", {
        targetFrame,
        원본비율: aspectRatio,
        캔버스제한: { maxWidth, maxHeight },
        최종크기: { width: finalWidth, height: finalHeight },
        최종위치: { x: clampedX, y: clampedY },
        extractArea: {
          x: clampedX,
          y: clampedY,
          width: finalWidth,
          height: finalHeight,
        }
      });
    }
  }, [targetFrame]);

  // targetFrame이 변경될 때마다 extractArea 업데이트
  useEffect(() => {
    convertTargetFrameToExtractArea();
  }, [convertTargetFrameToExtractArea]);

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

      // getTargetFrameImageData 함수를 컴포넌트 내부에서 사용할 수 있도록 정의
      const getTargetFrameImageDataInternal = useCallback((): string | null => {
        console.log("🎯 getTargetFrameImageDataInternal 호출됨");
        
        const stage = stageRef.current;
        if (!stage) {
          console.log("❌ stage가 없습니다");
          return null;
        }
        if (!konvaImage) {
          console.log("❌ konvaImage가 없습니다");
          return null;
        }

        console.log("🎯 추출 영역에서 이미지 데이터 추출 시작:", extractArea);

        // 이미지의 현재 경계 계산 (getImageBounds 함수 내용을 직접 구현)
        const { x, y, width, height, scaleX, scaleY } = imageData;
        const scaledWidth = width * scaleX;
        const scaledHeight = height * scaleY;
        
        const imageBounds = {
          left: x - scaledWidth / 2,
          top: y - scaledHeight / 2,
          right: x + scaledWidth / 2,
          bottom: y + scaledHeight / 2,
          width: scaledWidth,
          height: scaledHeight
        };
        
        console.log("📐 이미지 경계:", imageBounds);
        console.log("📐 추출 영역:", extractArea);
        console.log("🎯 추출 영역 크기로 캔버스 생성 - UI 요소 제외하고 이미지만 캡처");

        try {
          // 추출 영역 전체를 기준으로 캔버스 생성
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            console.log("❌ canvas context를 생성할 수 없습니다");
            return null;
          }
          
          canvas.width = extractArea.width;
          canvas.height = extractArea.height;
          console.log("📏 캔버스 크기 설정:", { width: canvas.width, height: canvas.height });

          // 배경을 투명으로 설정
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // 이미지만 별도로 그리기 (UI 요소들 제외)
          if (konvaImage) {
            // 이미지의 변환 매트릭스 계산
            const imgCenterX = imageData.x;
            const imgCenterY = imageData.y;
            const imgWidth = imageData.width;
            const imgHeight = imageData.height;
            const scaleX = imageData.scaleX;
            const scaleY = imageData.scaleY;
            const rotation = imageData.rotation;

            console.log("🖼️ 이미지 변환 정보:", {
              중심점: { x: imgCenterX, y: imgCenterY },
              크기: { width: imgWidth, height: imgHeight },
              스케일: { scaleX, scaleY },
              회전: rotation
            });

            // 캔버스 컨텍스트에 변환 적용
            ctx.save();
            
            // 추출 영역 기준으로 좌표 조정
            ctx.translate(-extractArea.x, -extractArea.y);
            
            // 이미지 중심점으로 이동
            ctx.translate(imgCenterX, imgCenterY);
            
            // 회전 적용
            ctx.rotate((rotation * Math.PI) / 180);
            
            // 스케일 적용
            ctx.scale(scaleX, scaleY);
            
            // 이미지 그리기 (중심점 기준)
            ctx.drawImage(
              konvaImage,
              -imgWidth / 2,
              -imgHeight / 2,
              imgWidth,
              imgHeight
            );
            
            ctx.restore();
            console.log("✅ 이미지 그리기 완료");
          }

          const extractedDataURL = canvas.toDataURL('image/png');
          console.log("✅ 추출 완료 - UI 요소 제외한 순수 이미지, 데이터 URL 길이:", extractedDataURL.length);
          console.log("🔍 데이터 URL 시작 부분:", extractedDataURL.substring(0, 100));
          
          return extractedDataURL;
        } catch (error) {
          console.error("❌ 이미지 추출 중 오류:", error);
          return null;
        }
      }, [extractArea, imageData, konvaImage]);



      // 추출하기 버튼 핸들러
      const handleExtractToAddPicture = useCallback(() => {
        console.log("🎯 추출하기 버튼 클릭");
        console.log("🔍 현재 상태 확인:", {
          konvaImage: !!konvaImage,
          stageRef: !!stageRef.current,
          extractArea,
          imageData,
          onExtractComplete: !!onExtractComplete
        });
        
        try {
          const extractedImageData = getTargetFrameImageDataInternal();
          console.log("🔍 getTargetFrameImageDataInternal 결과:", {
            success: !!extractedImageData,
            dataLength: extractedImageData?.length || 0
          });
          
          if (extractedImageData && onExtractComplete) {
            console.log("✅ 추출된 이미지 데이터를 부모 컴포넌트로 전달");
            onExtractComplete(extractedImageData);
          } else {
            const errorMsg = !extractedImageData 
              ? "추출된 이미지 데이터가 없습니다" 
              : "onExtractComplete 콜백이 없습니다";
            console.log("❌ 추출 실패:", errorMsg);
            alert(`추출에 실패했습니다: ${errorMsg}`);
          }
        } catch (error) {
          console.error("❌ 추출 중 오류 발생:", error);
          alert("이미지 추출 중 오류가 발생했습니다.");
        }
      }, [getTargetFrameImageDataInternal, onExtractComplete, konvaImage, extractArea, imageData]);

    // 스테이지 좌표계 기준 크롭 영역
    const [cropArea, setCropArea] = useState<CropArea>({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });
    
    // 초기 상태 저장
    const initialStateRef = useRef<{ imageData: ImageData; cropArea: CropArea } | null>(null);

    // Canvas 크기를 동적으로 계산 (컨테이너 크기에 맞춤)
    const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });
    const containerRef = useRef<HTMLDivElement>(null);
    const CANVAS_WIDTH = canvasSize.width;
    const CANVAS_HEIGHT = canvasSize.height;

    // Konva 라이브러리 로딩 상태 확인
    useEffect(() => {
      let timeoutId: NodeJS.Timeout | null = null;
      let attempts = 0;
      const maxAttempts = 50; // 최대 5초 동안 시도

      const checkKonvaLoading = () => {
        if (typeof window !== 'undefined' && Stage && Layer && KonvaImage && Transformer && Rect && Group && Circle) {
          console.log("✅ Konva 모든 컴포넌트 로드 완료");
          setIsKonvaLoaded(true);
        } else if (attempts < maxAttempts) {
          attempts++;
          console.log(`⏳ Konva 라이브러리 로딩 중... (${attempts}/${maxAttempts})`, {
            window: typeof window !== 'undefined',
            Stage: !!Stage,
            Layer: !!Layer,
            KonvaImage: !!KonvaImage,
            Transformer: !!Transformer
          });
          // 100ms 후 다시 확인
          timeoutId = setTimeout(checkKonvaLoading, 100);
        } else {
          console.error("❌ Konva 라이브러리 로딩 실패 - 최대 시도 횟수 초과");
          // 실패 시에도 일단 true로 설정하여 에러 메시지 대신 빈 화면이라도 보여줌
          setIsKonvaLoaded(true);
        }
      };

      checkKonvaLoading();

      // cleanup 함수
      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    }, []);

    // 컨테이너 크기에 맞춰 캔버스 크기 동적 조정
    useEffect(() => {
      const updateCanvasSize = () => {
        if (containerRef.current) {
          const container = containerRef.current;
          const rect = container.getBoundingClientRect();
          
          // 컨테이너 크기에서 여백을 뺀 실제 사용 가능한 공간 계산
          const availableWidth = Math.max(500, rect.width - 40); // 최소 500px
          const availableHeight = Math.max(400, rect.height - 140); // 버튼과 썸네일을 위한 공간 확보
          
          // 적절한 비율 유지 (3:2 비율)
          let finalWidth = availableWidth;
          let finalHeight = (availableWidth * 2) / 3;
          
          // 높이가 제한을 초과하면 높이 기준으로 조정
          if (finalHeight > availableHeight) {
            finalHeight = availableHeight;
            finalWidth = (availableHeight * 3) / 2;
          }
          
          // 최대/최소 크기 제한
          finalWidth = Math.max(500, Math.min(800, finalWidth));
          finalHeight = Math.max(400, Math.min(600, finalHeight));
          
          setCanvasSize({ 
            width: Math.round(finalWidth), 
            height: Math.round(finalHeight) 
          });
        }
      };

      // 초기 크기 설정
      updateCanvasSize();

      // 윈도우 리사이즈 이벤트 리스너
      const handleResize = () => {
        requestAnimationFrame(updateCanvasSize);
      };

      window.addEventListener('resize', handleResize);
      
      // 컨테이너 크기 변화 감지를 위한 ResizeObserver
      let resizeObserver: ResizeObserver | null = null;
      if (containerRef.current) {
        resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(containerRef.current);
      }

      return () => {
        window.removeEventListener('resize', handleResize);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
      };
    }, []);

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

    // Transformer를 이미지에 연결
    useEffect(() => {
      if (editMode === 'edit' && transformerRef.current && imageRef.current) {
        transformerRef.current.nodes([imageRef.current]);
        transformerRef.current.getLayer()?.batchDraw();
      } else if (transformerRef.current) {
        transformerRef.current.nodes([]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    }, [editMode, konvaImage]);

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

    // Transformer 변환 이벤트 처리
    const handleTransformEnd = useCallback((e: Konva.KonvaEventObject<Event>) => {
      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      
      // 이미지 데이터 업데이트
      setImageData(prev => ({
        ...prev,
        x: node.x(),
        y: node.y(),
        scaleX: scaleX,
        scaleY: scaleY,
        rotation: node.rotation()
      }));

      // 크롭 영역을 이미지 경계에 맞춤
      const newImageData = {
        ...imageData,
        x: node.x(),
        y: node.y(),
        scaleX: scaleX,
        scaleY: scaleY,
        rotation: node.rotation()
      };
      
      const newBounds = getImageBounds(newImageData);
      setCropArea({
        x: newBounds.left,
        y: newBounds.top,
        width: newBounds.width,
        height: newBounds.height
      });

      console.log("🔧 Transformer 변환 완료:", {
        새위치: { x: node.x(), y: node.y() },
        새스케일: { scaleX, scaleY },
        새회전: node.rotation(),
        새경계: newBounds
      });
    }, [imageData, getImageBounds]);

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
      
      // 이미지 위치 변화량 계산
      const deltaX = newX - imageData.x;
      const deltaY = newY - imageData.y;
      
      setImageData(prev => ({ ...prev, x: newX, y: newY }));
      
      // 크롭 모드에서는 이미지와 함께 크롭 영역도 이동
      if (editMode === 'crop') {
        setCropArea(prev => ({
          ...prev,
          x: prev.x + deltaX,
          y: prev.y + deltaY
        }));
      }
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
        // 실시간으로 이동했으므로 경계 체크만 수행
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
          
          console.log("✅ 크롭모드 - 크롭 영역 경계 체크 및 조정:", adjustedCropArea);
          return adjustedCropArea;
        });
      }
    }, [imageData, cropArea, editMode, getImageBounds]);



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
      getTargetFrameImageData: getTargetFrameImageDataInternal,
      triggerExtract: handleExtractToAddPicture, // 추출하기 버튼과 동일한 기능을 외부에서 호출할 수 있도록 노출
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

    // 크롭 모드 핸들 위치 계산
    const getCropHandles = useCallback(() => {
      if (editMode !== 'crop') return [];
      
      const barThickness = 8;
      const barLength = 50;
      
      return [
        { 
          x: cropArea.x + cropArea.width / 2 - barLength / 2, 
          y: cropArea.y - barThickness / 2, 
          width: barLength, 
          height: barThickness, 
          id: 'top'
        },
        { 
          x: cropArea.x + cropArea.width / 2 - barLength / 2, 
          y: cropArea.y + cropArea.height - barThickness / 2, 
          width: barLength, 
          height: barThickness, 
          id: 'bottom'
        },
        { 
          x: cropArea.x - barThickness / 2, 
          y: cropArea.y + cropArea.height / 2 - barLength / 2, 
          width: barThickness, 
          height: barLength, 
          id: 'left'
        },
        { 
          x: cropArea.x + cropArea.width - barThickness / 2, 
          y: cropArea.y + cropArea.height / 2 - barLength / 2, 
          width: barThickness, 
          height: barLength, 
          id: 'right'
        }
      ];
    }, [editMode, cropArea]);

    // 서버 사이드이거나 Konva 라이브러리가 아직 로드되지 않은 경우
    if (typeof window === 'undefined' || !isKonvaLoaded || !Stage || !Layer || !KonvaImage || !Transformer) {
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
          minHeight: '600px',
          maxHeight: '800px',
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
              
              {/* 추출하기 버튼은 하단의 적용 버튼으로 대체됨 */}
            </div>
          </div>
        </div>

        <div 
          ref={containerRef}
          style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
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
              borderRadius: '8px',
              maxWidth: '100%',
              maxHeight: '100%',
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
                      ref={imageRef}
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
                      draggable={true} // 모든 모드에서 드래그 가능
                      onDragStart={handleImageDragStart}
                      onDragMove={handleImageDrag}
                      onDragEnd={handleImageDragEnd}
                      onTransformEnd={handleTransformEnd}
                    />
                  </Group>

                  {/* Transformer - 편집 모드에서만 표시 */}
                  {editMode === 'edit' && (
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
                      boundBoxFunc={(oldBox, newBox) => {
                        // 최소/최대 크기 제한
                        if (newBox.width < 10 || newBox.height < 10) {
                          return oldBox;
                        }
                        if (newBox.width > CANVAS_WIDTH * 2 || newBox.height > CANVAS_HEIGHT * 2) {
                          return oldBox;
                        }
                        return newBox;
                      }}
                    />
                  )}

                  {/* 경계선 표시 */}
                  {editMode === 'crop' && (
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

                  {/* 추출 영역 표시 (노랑색 테두리) */}
                  <Rect
                    x={extractArea.x}
                    y={extractArea.y}
                    width={extractArea.width}
                    height={extractArea.height}
                    stroke="#FCD34D"
                    strokeWidth={3}
                    dash={[10, 5]}
                    listening={false}
                  />

                  {/* 추출 영역 라벨 */}
                  {Text && (
                    <Text
                      x={extractArea.x}
                      y={extractArea.y - 25}
                      text="추출 영역"
                      fontSize={14}
                      fontFamily="Arial"
                      fill="#FCD34D"
                      listening={false}
                    />
                  )}

                  {/* 크롭 모드 핸들 */}
                  {editMode === 'crop' && getCropHandles().map((handle) => (
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
                      onMouseDown={() => handleCropHandleMouseDown(handle.id)}
                      style={{ cursor: 'grab' }}
                    />
                  ))}
                </>
              )}
            </Layer>
          </Stage>
        </div>



        {/* 취소/적용 버튼 */}
        <div className="flex justify-center max-w-full text-sm font-medium tracking-tight leading-none whitespace-nowrap gap-x-2 mt-2">
          <div
            className="flex overflow-hidden flex-col justify-center px-4 py-2.5 text-gray-700 bg-gray-50 rounded-md border border-solid border-gray-300 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={onCancel}
          >
            <div>취소</div>
          </div>
          <div
            className={`flex overflow-hidden flex-col justify-center px-4 py-2.5 text-white rounded-md cursor-pointer transition-colors ${
              isLoading || !konvaImage
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-primary hover:bg-primary/80'
            }`}
            onClick={isLoading || !konvaImage ? undefined : handleExtractToAddPicture}
          >
            <div>적용하기</div>
          </div>
        </div>

        
      </div>
    );
  }
);

KonvaCanvas.displayName = 'KonvaCanvas';

export default KonvaCanvas; 