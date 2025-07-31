"use client";

import { useRef, useEffect, useImperativeHandle, forwardRef, useState } from "react";
import { FaArrowsRotate } from "react-icons/fa6";

import * as fabric from "fabric";

interface FabricCanvasProps {
  imageUrl: string;
  targetFrame: { width: number; height: number; x: number; y: number };
  onImageLoad?: () => void;
  onImageError?: (error: string) => void;
}

export interface FabricCanvasRef {
  zoomIn: () => void;
  zoomOut: () => void;
  rotateLeft: () => void;
  rotateRight: () => void;
  reset: () => void;
  getCanvasData: () => any;
  getCroppedImageData: () => string | null; // 추출 영역만 잘라낸 이미지 데이터
}

const FabricCanvas = forwardRef<FabricCanvasRef, FabricCanvasProps>(
  ({ imageUrl, targetFrame, onImageLoad, onImageError }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const imageObjectRef = useRef<fabric.Image | null>(null);
    const rotateIconImageRef = useRef<HTMLImageElement | null>(null);
    const [isCanvasReady, setIsCanvasReady] = useState(false);
    
    // 초기 이미지 상태 저장
    const initialStateRef = useRef<{
      scaleX: number;
      scaleY: number;
      left: number;
      top: number;
      angle: number;
    } | null>(null);

    // 회전 아이콘 이미지 로드
    useEffect(() => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        rotateIconImageRef.current = img;
        console.log("✅ 회전 아이콘 이미지 로드 완료");
      };
      img.onerror = () => {
        console.error("❌ 회전 아이콘 이미지 로드 실패");
      };
      img.src = 'https://cdn.jsdelivr.net/gh/feathericons/feather@4.28.0/icons/refresh-cw.svg';
    }, []);

    // Fabric.js 캔버스 초기화
    useEffect(() => {
      if (!canvasRef.current || fabricCanvasRef.current) return;

      console.log("🎨 Fabric Canvas 초기화 시작");
      
      // Fabric 캔버스 생성
      const canvas = new fabric.Canvas(canvasRef.current, {
        backgroundColor: '#ffffff',
        preserveObjectStacking: true,
        selection: false, // 다중 선택 비활성화
      });

      fabricCanvasRef.current = canvas;
      
      // 커스텀 컨트롤 설정 제거 - 모든 핸들 비활성화
      setIsCanvasReady(true);

      // 캔버스 크기를 고정 크기로 설정 (800x600)
      canvas.setDimensions({
        width: 600,
        height: 400
      });
      canvas.renderAll();

      // 마우스 휠로 줌 기능
      canvas.on('mouse:wheel', (opt: any) => {
        const delta = opt.e.deltaY;
        let zoom = canvas.getZoom();
        zoom *= 0.999 ** delta;
        if (zoom > 5) zoom = 5;
        if (zoom < 0.1) zoom = 0.1;
        canvas.setZoom(zoom);
        opt.e.preventDefault();
        opt.e.stopPropagation();
      });

      return () => {
        canvas.dispose();
        fabricCanvasRef.current = null;
      };
    }, []);

    // 이미지 로드
    useEffect(() => {
      if (!fabricCanvasRef.current || !imageUrl || !isCanvasReady) return;

      console.log("🖼️ 이미지 로드 시작:", imageUrl);
      const canvas = fabricCanvasRef.current;

      // 기존 이미지 제거
      if (imageObjectRef.current) {
        canvas.remove(imageObjectRef.current);
        imageObjectRef.current = null;
      }

      // 커스텀 원형 핸들 렌더링 함수 (모서리용)
      const renderCircleIcon = (ctx: CanvasRenderingContext2D, left: number, top: number, styleOverride: any, fabricObject: fabric.Object) => {
        const size = 16;
        const radius = size / 2;
        
        ctx.save();
        ctx.translate(left, top);
        
        // 객체의 회전 각도만큼 컨트롤도 회전 (원형이지만 일관성을 위해)
        const angle = fabricObject.angle || 0;
        ctx.rotate((angle * Math.PI) / 180);
        
        // 외곽 원 (테두리)
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#3D8BFF';
        ctx.fill();
        
        // 내부 원 (흰색 배경)
        ctx.beginPath();
        ctx.arc(0, 0, radius - 2, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        
        ctx.restore();
      };

      // 커스텀 가로 바 형태 핸들 렌더링 함수 (위아래용)
      const renderHorizontalBarIcon = (ctx: CanvasRenderingContext2D, left: number, top: number, styleOverride: any, fabricObject: fabric.Object) => {
        const width = 32;
        const height = 12;
        const radius = 6;
        
        ctx.save();
        ctx.translate(left, top);
        
        // 객체의 회전 각도만큼 컨트롤도 회전
        const angle = fabricObject.angle || 0;
        ctx.rotate((angle * Math.PI) / 180);
        
        // 둥근 사각형 외곽 (테두리)
        ctx.beginPath();
        ctx.roundRect(-width/2, -height/2, width, height, radius);
        ctx.fillStyle = '#3D8BFF';
        ctx.fill();
        
        // 둥근 사각형 내부 (흰색 배경)
        ctx.beginPath();
        ctx.roundRect(-width/2 + 2, -height/2 + 2, width - 4, height - 4, radius - 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        
        ctx.restore();
      };

      // 커스텀 세로 바 형태 핸들 렌더링 함수 (좌우용)
      const renderVerticalBarIcon = (ctx: CanvasRenderingContext2D, left: number, top: number, styleOverride: any, fabricObject: fabric.Object) => {
        const width = 12;
        const height = 32;
        const radius = 6;
        
        ctx.save();
        ctx.translate(left, top);
        
        // 객체의 회전 각도만큼 컨트롤도 회전
        const angle = fabricObject.angle || 0;
        ctx.rotate((angle * Math.PI) / 180);
        
        // 둥근 사각형 외곽 (테두리)
        ctx.beginPath();
        ctx.roundRect(-width/2, -height/2, width, height, radius);
        ctx.fillStyle = '#3D8BFF';
        ctx.fill();
        
        // 둥근 사각형 내부 (흰색 배경)
        ctx.beginPath();
        ctx.roundRect(-width/2 + 2, -height/2 + 2, width - 4, height - 4, radius - 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        
        ctx.restore();
      };

      // 커스텀 회전 핸들 렌더링 함수
      const renderRotateIcon = (ctx: CanvasRenderingContext2D, left: number, top: number, styleOverride: any, fabricObject: fabric.Object) => {
        const size = 32;
        const radius = size / 2;
        
        ctx.save();
        ctx.translate(left, top);
        
        // 객체의 회전 각도만큼 컨트롤도 회전
        const angle = fabricObject.angle || 0;
        ctx.rotate((angle * Math.PI) / 180);
        
        // 외곽 원 (테두리)
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#3D8BFF';
        ctx.fill();
        
        // 내부 원 (흰색 배경)
        ctx.beginPath();
        ctx.arc(0, 0, radius - 2, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        
        // SVG 이미지가 로드되었으면 그리기
        if (rotateIconImageRef.current) {
          const iconSize = 20; // 아이콘 크기
          ctx.drawImage(
            rotateIconImageRef.current,
            -iconSize / 2,
            -iconSize / 2,
            iconSize,
            iconSize
          );
        } else {
          // 이미지가 로드되지 않았으면 기본 회전 아이콘 그리기
          ctx.strokeStyle = '#3D8BFF';
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          // 원형 화살표 그리기
          const centerX = 0;
          const centerY = 0;
          const arrowRadius = 8;
          
          // 주 원호 (시계방향으로 270도)
          ctx.beginPath();
          ctx.arc(centerX, centerY, arrowRadius, -Math.PI / 2, Math.PI, false);
          ctx.stroke();
          
          // 화살표 머리 (상단 우측)
          const arrowHeadX = centerX + arrowRadius * Math.cos(Math.PI);
          const arrowHeadY = centerY + arrowRadius * Math.sin(Math.PI);
          
          ctx.beginPath();
          ctx.moveTo(arrowHeadX - 4, arrowHeadY - 2);
          ctx.lineTo(arrowHeadX, arrowHeadY);
          ctx.lineTo(arrowHeadX - 2, arrowHeadY + 4);
          ctx.stroke();
          
          // 두 번째 화살표 (반대 방향)
          ctx.beginPath();
          ctx.arc(centerX, centerY, arrowRadius, Math.PI / 2, -Math.PI, false);
          ctx.stroke();
          
          // 두 번째 화살표 머리 (하단 좌측)
          const arrowHeadX2 = centerX + arrowRadius * Math.cos(-Math.PI);
          const arrowHeadY2 = centerY + arrowRadius * Math.sin(-Math.PI);
          
          ctx.beginPath();
          ctx.moveTo(arrowHeadX2 + 4, arrowHeadY2 + 2);
          ctx.lineTo(arrowHeadX2, arrowHeadY2);
          ctx.lineTo(arrowHeadX2 + 2, arrowHeadY2 - 4);
          ctx.stroke();
        }
        
        ctx.restore();
      };

      // Fabric.js 내장 회전 핸들러 사용 (더 부드러운 회전)
      const rotateActionHandler = fabric.controlsUtils.rotationWithSnapping;

      // 새 이미지 로드
      fabric.Image.fromURL(imageUrl).then((img: any) => {
        if (!canvas) return;

        // 캔버스 크기에 맞게 이미지 스케일 조정
        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();
        const imgWidth = img.width || 1;
        const imgHeight = img.height || 1;

        // 이미지가 캔버스에 맞도록 스케일 계산
        const scaleX = canvasWidth / imgWidth * 0.8;
        const scaleY = canvasHeight / imgHeight * 0.8;
        const scale = Math.min(scaleX, scaleY);

        img.set({
          left: canvasWidth / 2,
          top: canvasHeight / 2,
          originX: 'center',
          originY: 'center',
          scaleX: scale,
          scaleY: scale,
          cornerSize: 16,
          borderColor: '#3D8BFF',
          cornerColor: '#FFFFFF',
          transparentCorners: false,
          cornerStrokeColor: '#3D8BFF',
          borderDashArray: [5, 5], // 점선으로 변경
          lockRotation: false,
          lockScalingFlip: true,
          // 사이즈 조정 핸들 활성화
          hasControls: true,
          hasBorders: true,
          // 회전 핸들 숨기기
          hasRotatingPoint: false,
        });

        // 커스텀 원형 컨트롤 설정
        img.controls.tl = new fabric.Control({
          x: -0.5,
          y: -0.5,
          actionHandler: fabric.controlsUtils.scalingEqually,
          cursorStyle: 'nw-resize',
          actionName: 'scaling',
          render: renderCircleIcon
        });

        img.controls.tr = new fabric.Control({
          x: 0.5,
          y: -0.5,
          actionHandler: fabric.controlsUtils.scalingEqually,
          cursorStyle: 'ne-resize',
          actionName: 'scaling',
          render: renderCircleIcon
        });

        img.controls.bl = new fabric.Control({
          x: -0.5,
          y: 0.5,
          actionHandler: fabric.controlsUtils.scalingEqually,
          cursorStyle: 'sw-resize',
          actionName: 'scaling',
          render: renderCircleIcon
        });

        img.controls.br = new fabric.Control({
          x: 0.5,
          y: 0.5,
          actionHandler: fabric.controlsUtils.scalingEqually,
          cursorStyle: 'se-resize',
          actionName: 'scaling',
          render: renderCircleIcon
        });

        // 위아래 가로 바 형태 핸들 추가
        img.controls.mt = new fabric.Control({
          x: 0,
          y: -0.5,
          actionHandler: fabric.controlsUtils.scalingYOrSkewingX,
          cursorStyle: 'n-resize',
          actionName: 'scaling',
          render: renderHorizontalBarIcon
        });

        img.controls.mb = new fabric.Control({
          x: 0,
          y: 0.5,
          actionHandler: fabric.controlsUtils.scalingYOrSkewingX,
          cursorStyle: 's-resize',
          actionName: 'scaling',
          render: renderHorizontalBarIcon
        });

        // 좌우 세로 바 형태 핸들 추가
        img.controls.ml = new fabric.Control({
          x: -0.5,
          y: 0,
          actionHandler: fabric.controlsUtils.scalingXOrSkewingY,
          cursorStyle: 'w-resize',
          actionName: 'scaling',
          render: renderVerticalBarIcon
        });

        img.controls.mr = new fabric.Control({
          x: 0.5,
          y: 0,
          actionHandler: fabric.controlsUtils.scalingXOrSkewingY,
          cursorStyle: 'e-resize',
          actionName: 'scaling',
          render: renderVerticalBarIcon
        });

        // 회전 핸들 제거
        img.controls.mtr = new fabric.Control({ visible: false });

        // 커스텀 회전 핸들을 하단에 추가
        img.controls.mtr = new fabric.Control({
          x: 0,
          y: 0.6, // 이미지 하단에서 약간 떨어진 위치
          actionHandler: rotateActionHandler,
          cursorStyle: 'crosshair', // 회전을 나타내는 커서
          actionName: 'rotate',
          render: renderRotateIcon,
          offsetY: 5 // 추가 오프셋
        });

        // 이미지 이동 제한 (캔버스 밖으로 나가지 않도록)
        img.on('moving', function(this: any) {
          const obj = this;
          const objBounds = obj.getBoundingRect();
          
          // 캔버스 경계 체크
          if (objBounds.left < 0) {
            obj.left = Math.max(obj.left - objBounds.left, 0);
          }
          if (objBounds.top < 0) {
            obj.top = Math.max(obj.top - objBounds.top, 0);
          }
          if (objBounds.left + objBounds.width > canvas.getWidth()) {
            obj.left = Math.min(obj.left, canvas.getWidth() - objBounds.width + (obj.left - objBounds.left));
          }
          if (objBounds.top + objBounds.height > canvas.getHeight()) {
            obj.top = Math.min(obj.top, canvas.getHeight() - objBounds.height + (obj.top - objBounds.top));
          }
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();

        imageObjectRef.current = img;

        // 초기 상태 저장
        initialStateRef.current = {
          scaleX: img.scaleX || scale,
          scaleY: img.scaleY || scale,
          left: img.left || canvasWidth / 2,
          top: img.top || canvasHeight / 2,
          angle: img.angle || 0,
        };

        onImageLoad?.();
        console.log("✅ 이미지 로드 완료");
      }).catch((error) => {
        console.error("이미지 로드 실패:", error);
        onImageError?.("이미지를 불러올 수 없습니다.");
      });
    }, [imageUrl, isCanvasReady, onImageLoad]);

    // 외부로 노출할 메서드들
    useImperativeHandle(ref, () => ({
      zoomIn: () => {
        if (!imageObjectRef.current) return;
        const img = imageObjectRef.current;
        const currentScaleX = img.scaleX || 1;
        const currentScaleY = img.scaleY || 1;
        img.set({
          scaleX: currentScaleX * 1.1,
          scaleY: currentScaleY * 1.1
        });
        fabricCanvasRef.current?.renderAll();
      },
      zoomOut: () => {
        if (!imageObjectRef.current) return;
        const img = imageObjectRef.current;
        const currentScaleX = img.scaleX || 1;
        const currentScaleY = img.scaleY || 1;
        img.set({
          scaleX: currentScaleX * 0.9,
          scaleY: currentScaleY * 0.9
        });
        fabricCanvasRef.current?.renderAll();
      },
      rotateLeft: () => {
        if (!imageObjectRef.current) return;
        const img = imageObjectRef.current;
        const currentAngle = img.angle || 0;
        img.rotate(currentAngle - 90);
        fabricCanvasRef.current?.renderAll();
      },
      rotateRight: () => {
        if (!imageObjectRef.current) return;
        const img = imageObjectRef.current;
        const currentAngle = img.angle || 0;
        img.rotate(currentAngle + 90);
        fabricCanvasRef.current?.renderAll();
      },
      reset: () => {
        if (!imageObjectRef.current || !initialStateRef.current) return;
        const img = imageObjectRef.current;
        img.set(initialStateRef.current);
        fabricCanvasRef.current?.renderAll();
      },
      getCanvasData: () => {
        if (!fabricCanvasRef.current) return null;
        return fabricCanvasRef.current.toDataURL({
          format: 'png',
          quality: 1,
          multiplier: 2
        });
      },
      getCroppedImageData: () => {
        if (!fabricCanvasRef.current) return null;
        
        const canvas = fabricCanvasRef.current;
        
        // 실제 캔버스 크기 가져오기
        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();
        const targetWidth = Math.min(300, canvasWidth * 0.7);
        const targetHeight = targetWidth * (targetFrame.height / targetFrame.width);
        
        const cropX = (canvasWidth - targetWidth) / 2;
        const cropY = (canvasHeight - targetHeight) / 2;
        
        // 추출 영역을 새로운 캔버스에 복사
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = targetWidth;
        tempCanvas.height = targetHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (!tempCtx) return null;
        
        // 원본 캔버스의 지정된 영역을 임시 캔버스에 복사
        const canvasElement = canvas.getElement();
        tempCtx.drawImage(
          canvasElement,
          cropX, cropY, targetWidth, targetHeight,  // 소스 영역
          0, 0, targetWidth, targetHeight           // 대상 영역
        );
        
        return tempCanvas.toDataURL('image/png');
      }
    }), []);

    return (
      <canvas 
        ref={canvasRef}
        width={600}
        height={400}
        style={{
          width: '100%',
          height: '100%',
          maxWidth: '600px',
          maxHeight: '400px',
          display: 'block'
        }}
      />
    );
  }
);

FabricCanvas.displayName = 'FabricCanvas';

export default FabricCanvas; 