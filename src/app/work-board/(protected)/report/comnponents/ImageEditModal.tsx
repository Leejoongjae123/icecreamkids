"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Canvas, Image as FabricImage, Object as FabricObject } from "fabric";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCw, RotateCcw, ZoomIn, ZoomOut, RotateCcw as Reset } from "lucide-react";
import { ImageEditModalProps } from "./types";

export default function ImageEditModal({
  isOpen,
  onClose,
  imageUrl,
  onApply,
  targetFrame = { width: 400, height: 300, x: 100, y: 100 }
}: ImageEditModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<Canvas | null>(null);
  const [currentImage, setCurrentImage] = useState<FabricImage | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fabric.js 초기화
  const initializeFabricCanvas = useCallback(() => {
    if (!canvasRef.current || fabricCanvas) return;

    try {
      const canvas = new Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: '#f8f9fa',
        selection: true,
        preserveObjectStacking: true,
      });

      // 기본 오브젝트 설정
      FabricObject.prototype.set({
        transparentCorners: false,
        borderColor: '#3b82f6',
        borderScaleFactor: 2,
        cornerColor: '#ffffff',
        cornerStrokeColor: '#3b82f6',
        cornerStyle: 'circle',
        cornerSize: 12,
        padding: 5,
      });

      setFabricCanvas(canvas);
      console.log('Fabric canvas initialized successfully');
    } catch (error) {
      console.error('Failed to initialize fabric canvas:', error);
    }
  }, [fabricCanvas]);

  // 캔버스 정리
  const cleanupCanvas = useCallback(() => {
    if (fabricCanvas) {
      try {
        fabricCanvas.clear();
        fabricCanvas.dispose();
        setFabricCanvas(null);
        setCurrentImage(null);
        console.log('Fabric canvas cleaned up');
      } catch (error) {
        console.error('Error cleaning up canvas:', error);
      }
    }
  }, [fabricCanvas]);

  // 이미지 로드 및 캔버스에 추가
  const loadImageToCanvas = useCallback(async () => {
    if (!fabricCanvas || !imageUrl || !isOpen) return;

    setIsLoading(true);
    
    try {
      // 기존 이미지 제거
      if (currentImage) {
        fabricCanvas.remove(currentImage);
      }

      // 새 이미지 로드
      const imgElement = new Image();
      imgElement.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        imgElement.onload = resolve;
        imgElement.onerror = reject;
        imgElement.src = imageUrl;
      });

      const fabricImage = new FabricImage(imgElement, {
        left: fabricCanvas.width! / 2,
        top: fabricCanvas.height! / 2,
        originX: 'center',
        originY: 'center',
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        lockUniScaling: false,
        centeredScaling: false,
        centeredRotation: true,
      });

      // 이미지 크기 조정 (캔버스에 맞게)
      const maxWidth = fabricCanvas.width! * 0.8;
      const maxHeight = fabricCanvas.height! * 0.8;
      const imageAspect = imgElement.width / imgElement.height;
      const canvasAspect = maxWidth / maxHeight;

      let scale: number;
      if (imageAspect > canvasAspect) {
        scale = maxWidth / imgElement.width;
      } else {
        scale = maxHeight / imgElement.height;
      }

      fabricImage.scale(scale);

      // 캔버스에 추가 및 활성화
      fabricCanvas.add(fabricImage);
      fabricCanvas.setActiveObject(fabricImage);
      fabricCanvas.renderAll();
      
      setCurrentImage(fabricImage);
      console.log('Image loaded successfully:', {
        originalSize: { width: imgElement.width, height: imgElement.height },
        scale,
        finalSize: { 
          width: imgElement.width * scale, 
          height: imgElement.height * scale 
        }
      });
      
    } catch (error) {
      console.error('Failed to load image:', error);
      alert('이미지를 불러오는데 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, [fabricCanvas, imageUrl, isOpen, currentImage]);

  // 모달이 열릴 때 캔버스 초기화
  useEffect(() => {
    if (isOpen) {
      initializeFabricCanvas();
    } else {
      cleanupCanvas();
    }
  }, [isOpen, initializeFabricCanvas, cleanupCanvas]);

  // 이미지 로드
  useEffect(() => {
    if (fabricCanvas && imageUrl && isOpen) {
      loadImageToCanvas();
    }
  }, [fabricCanvas, imageUrl, isOpen, loadImageToCanvas]);

  // 편집 기능들
  const handleZoomIn = useCallback(() => {
    if (currentImage && fabricCanvas) {
      const currentScale = currentImage.scaleX || 1;
      const newScale = Math.min(currentScale * 1.2, 5);
      currentImage.set({ scaleX: newScale, scaleY: newScale });
      fabricCanvas.renderAll();
    }
  }, [currentImage, fabricCanvas]);

  const handleZoomOut = useCallback(() => {
    if (currentImage && fabricCanvas) {
      const currentScale = currentImage.scaleX || 1;
      const newScale = Math.max(currentScale * 0.8, 0.1);
      currentImage.set({ scaleX: newScale, scaleY: newScale });
      fabricCanvas.renderAll();
    }
  }, [currentImage, fabricCanvas]);

  const handleRotateLeft = useCallback(() => {
    if (currentImage && fabricCanvas) {
      const currentAngle = currentImage.angle || 0;
      currentImage.set({ angle: currentAngle - 15 });
      fabricCanvas.renderAll();
    }
  }, [currentImage, fabricCanvas]);

  const handleRotateRight = useCallback(() => {
    if (currentImage && fabricCanvas) {
      const currentAngle = currentImage.angle || 0;
      currentImage.set({ angle: currentAngle + 15 });
      fabricCanvas.renderAll();
    }
  }, [currentImage, fabricCanvas]);

  const handleReset = useCallback(() => {
    if (currentImage && fabricCanvas) {
      currentImage.set({
        scaleX: 1,
        scaleY: 1,
        angle: 0,
        left: fabricCanvas.width! / 2,
        top: fabricCanvas.height! / 2,
      });
      fabricCanvas.renderAll();
    }
  }, [currentImage, fabricCanvas]);

  // 적용 버튼 핸들러
  const handleApply = useCallback(() => {
    if (!fabricCanvas) {
      alert('캔버스가 초기화되지 않았습니다.');
      return;
    }

    try {
      // 현재 캔버스를 이미지로 변환
      const dataURL = fabricCanvas.getElement().toDataURL('image/png', 1.0);
      onApply(dataURL);
      onClose();
    } catch (error) {
      console.error('Failed to apply changes:', error);
      alert('변경사항을 적용하는데 실패했습니다.');
    }
  }, [fabricCanvas, onApply, onClose]);

  // 이벤트 전파 차단
  const handleStopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[900px] p-6 z-[70]" 
        style={{ zIndex: 70 }}
        onClick={handleStopPropagation}
      >
        <DialogHeader>
          <DialogTitle>이미지 편집</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 툴바 */}
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleZoomOut}
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              <ZoomOut className="w-4 h-4" />
              축소
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleZoomIn}
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              <ZoomIn className="w-4 h-4" />
              확대
            </Button>
            
            <div className="w-px h-6 bg-gray-300 mx-2" />
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRotateLeft}
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              왼쪽 회전
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRotateRight}
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              <RotateCw className="w-4 h-4" />
              오른쪽 회전
            </Button>
            
            <div className="w-px h-6 bg-gray-300 mx-2" />
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleReset}
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              <Reset className="w-4 h-4" />
              초기화
            </Button>
          </div>

          {/* 안내 텍스트 */}
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded border border-blue-200">
            <div className="flex items-start gap-2">
              <span className="text-blue-600">💡</span>
              <div>
                <div className="font-medium text-blue-800 mb-1">사용법:</div>
                <ul className="space-y-1 text-blue-700">
                  <li>• 이미지를 드래그하여 위치 이동</li>
                  <li>• 모서리 핸들을 드래그하여 크기 조절</li>
                  <li>• 회전 핸들을 드래그하여 회전</li>
                  <li>• 툴바 버튼으로 정밀 조정</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 로딩 상태 */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">이미지를 불러오는 중...</div>
            </div>
          )}

          {/* 캔버스 */}
          <div className="flex justify-center">
            <div className="border border-gray-300 shadow-lg rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                className="block"
                style={{ 
                  maxWidth: '100%', 
                  height: 'auto',
                  backgroundColor: '#f8f9fa'
                }}
              />
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button 
              onClick={handleApply} 
              disabled={isLoading || !currentImage}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              적용
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 