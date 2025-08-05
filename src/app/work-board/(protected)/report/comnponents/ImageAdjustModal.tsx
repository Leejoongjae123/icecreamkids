'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ImageAdjustModalProps, ImagePosition } from '../types';
import Image from 'next/image';

export default function ImageAdjustModal({
  isOpen,
  onClose,
  imageUrl,
  currentPosition,
  onSave,
  imageIndex
}: ImageAdjustModalProps) {
  const [position, setPosition] = useState<ImagePosition>(currentPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPosition(currentPosition);
  }, [currentPosition, isOpen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    setPosition({
      ...position,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleScaleChange = (value: number[]) => {
    setPosition({
      ...position,
      scale: value[0]
    });
  };

  const handleReset = () => {
    setPosition({
      x: 0,
      y: 0,
      scale: 1
    });
  };

  const handleSave = () => {
    onSave(position);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>이미지 위치 조절</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col gap-4">
          {/* 이미지 미리보기 영역 */}
          <div 
            ref={containerRef}
            className="flex-1 relative overflow-hidden bg-gray-100 rounded-lg cursor-move"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full h-full max-w-[200px] max-h-[200px] border-2 border-dashed border-gray-400 rounded-md">
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center text-sm text-gray-600">
                  카드 영역
                </div>
              </div>
            </div>
            
            <div
              className="absolute inset-0"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${position.scale})`,
                transformOrigin: 'center',
                transition: isDragging ? 'none' : 'transform 0.2s'
              }}
              onMouseDown={handleMouseDown}
            >
              <Image
                src={imageUrl}
                alt={`Image ${imageIndex + 1}`}
                fill
                className="object-contain"
                draggable={false}
              />
            </div>
          </div>

          {/* 컨트롤 영역 */}
          <div className="space-y-4 px-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium min-w-[60px]">확대/축소</span>
              <Slider
                value={[position.scale]}
                onValueChange={handleScaleChange}
                min={0.5}
                max={3}
                step={0.1}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 min-w-[40px]">{(position.scale * 100).toFixed(0)}%</span>
            </div>
            
            <div className="text-sm text-gray-600">
              * 이미지를 드래그하여 위치를 조절할 수 있습니다.
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleReset}
            >
              초기화
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
              >
                취소
              </Button>
              <Button
                onClick={handleSave}
              >
                저장
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}