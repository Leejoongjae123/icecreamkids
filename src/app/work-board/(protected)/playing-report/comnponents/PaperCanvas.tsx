"use client";

import { useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import paper from "paper";

interface PaperCanvasProps {
  imageUrl: string;
  targetFrame: { width: number; height: number; x: number; y: number };
  onImageLoad?: () => void;
  onImageError?: (error: string) => void;
}

export interface PaperCanvasRef {
  zoomIn: () => void;
  zoomOut: () => void;
  rotateLeft: () => void;
  rotateRight: () => void;
  reset: () => void;
  getCanvasData: () => any;
}

const PaperCanvas = forwardRef<PaperCanvasRef, PaperCanvasProps>(
  ({ imageUrl, targetFrame, onImageLoad, onImageError }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const projectRef = useRef<paper.Project | null>(null);
    const imageRasterRef = useRef<paper.Raster | null>(null);
    const initialImageDataRef = useRef<{ position: paper.Point; scale: number; rotation: number } | null>(null);

    // Paper.js 초기화
    useEffect(() => {
      if (!canvasRef.current) return;

      // 기존 프로젝트가 있다면 정리
      if (projectRef.current) {
        projectRef.current.remove();
      }

      // 새 프로젝트 생성
      projectRef.current = new paper.Project(canvasRef.current);
      paper.project = projectRef.current;

      // 캔버스 크기 설정
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }

      paper.view.viewSize = new paper.Size(rect.width, rect.height);

      return () => {
        if (projectRef.current) {
          projectRef.current.remove();
          projectRef.current = null;
        }
      };
    }, []);

    // 이미지 로드 및 표시
    useEffect(() => {
      if (!projectRef.current || !imageUrl) return;

      paper.project = projectRef.current;

      // 기존 이미지 제거
      if (imageRasterRef.current) {
        imageRasterRef.current.remove();
        imageRasterRef.current = null;
      }

      // 새 이미지 로드
      const img = new Image();
      
      // CORS 에러 방지를 위해 crossOrigin 설정하지 않음
      // 이미지 조작(변형, 회전, 확대/축소)은 여전히 가능함
      
      img.onload = () => {
        if (!projectRef.current) return;
        
        paper.project = projectRef.current;
        
        // 이미지 래스터 생성
        const raster = new paper.Raster(img);
        imageRasterRef.current = raster;
        
        // 캔버스 중앙에 배치
        raster.position = paper.view.center;
        
        // targetFrame에 맞게 초기 크기 조정
        const canvasSize = paper.view.size;
        const imageSize = raster.size;
        
        // 캔버스에 맞는 최적 크기 계산 (여백 고려)
        const padding = 50;
        const maxWidth = canvasSize.width - padding;
        const maxHeight = canvasSize.height - padding;
        
        const scaleX = maxWidth / imageSize.width;
        const scaleY = maxHeight / imageSize.height;
        const scale = Math.min(scaleX, scaleY, 1); // 1을 넘지 않도록
        
        raster.scale(scale);
        
        // 초기 상태 저장
        initialImageDataRef.current = {
          position: raster.position.clone(),
          scale: scale,
          rotation: 0
        };
        
        // 이미지 상호작용 설정
        setupImageInteraction(raster);
        
        onImageLoad?.();
      };
      
      img.onerror = () => {
        onImageError?.("이미지를 불러올 수 없습니다.");
      };
      
      img.src = imageUrl;
    }, [imageUrl, onImageLoad, onImageError]);

    // 이미지 상호작용 설정
    const setupImageInteraction = (raster: paper.Raster) => {
      let isDragging = false;
      let lastPoint: paper.Point | null = null;

      raster.onMouseDown = (event: paper.MouseEvent) => {
        isDragging = true;
        lastPoint = event.point;
      };

      raster.onMouseDrag = (event: paper.MouseEvent) => {
        if (isDragging && lastPoint) {
          const delta = event.point.subtract(lastPoint);
          raster.position = raster.position.add(delta);
          lastPoint = event.point;
        }
      };

      raster.onMouseUp = () => {
        isDragging = false;
        lastPoint = null;
      };

      // 마우스 휠로 줌
      const canvas = canvasRef.current;
      if (canvas) {
        const handleWheel = (e: WheelEvent) => {
          e.preventDefault();
          const delta = e.deltaY > 0 ? 0.9 : 1.1;
          raster.scale(delta, raster.position);
        };
        
        canvas.addEventListener('wheel', handleWheel, { passive: false });
        
        return () => {
          canvas.removeEventListener('wheel', handleWheel);
        };
      }
    };

    // 외부에서 호출할 수 있는 메서드들
    useImperativeHandle(ref, () => ({
      zoomIn: () => {
        if (imageRasterRef.current) {
          imageRasterRef.current.scale(1.2, imageRasterRef.current.position);
        }
      },
      zoomOut: () => {
        if (imageRasterRef.current) {
          imageRasterRef.current.scale(0.8, imageRasterRef.current.position);
        }
      },
      rotateLeft: () => {
        if (imageRasterRef.current) {
          imageRasterRef.current.rotate(-15, imageRasterRef.current.position);
        }
      },
      rotateRight: () => {
        if (imageRasterRef.current) {
          imageRasterRef.current.rotate(15, imageRasterRef.current.position);
        }
      },
      reset: () => {
        if (imageRasterRef.current && initialImageDataRef.current) {
          const initial = initialImageDataRef.current;
          imageRasterRef.current.position = initial.position.clone();
          imageRasterRef.current.scaling = new paper.Point(initial.scale, initial.scale);
          imageRasterRef.current.rotation = initial.rotation;
        }
      },
      getCanvasData: () => {
        if (!canvasRef.current) return null;
        return canvasRef.current.toDataURL();
      }
    }));

    return (
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-move"
        style={{
          display: 'block',
          background: 'transparent'
        }}
      />
    );
  }
);

PaperCanvas.displayName = "PaperCanvas";

export default PaperCanvas; 