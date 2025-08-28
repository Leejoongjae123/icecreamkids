"use client";

import { Button } from "@/components/ui/button";
import {
  RotateCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  RotateCcw as Reset,
} from "lucide-react";
import { RiImageEditLine } from "react-icons/ri";
import { Crop } from "lucide-react";

interface ImageEditToolbarProps {
  isLoading: boolean;
  hasCurrentImage: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onReset: () => void;
  onRemoveBackground: () => void;
  onCrop: () => void;
  isClippingMode?: boolean;
  onClippingModeToggle?: () => void;
}

export default function ImageEditToolbar({
  isLoading,
  hasCurrentImage,
  onZoomIn,
  onZoomOut,
  onRotateLeft,
  onRotateRight,
  onReset,
  onRemoveBackground,
  onCrop,
  isClippingMode = false,
  onClippingModeToggle,
}: ImageEditToolbarProps) {
  return (
    <div className="flex items-center justify-center gap-2 bg-white rounded-lg p-2">
      {/* 클리핑 모드 토글 버튼 */}
      {onClippingModeToggle && (
        <Button
          variant={isClippingMode ? "default" : "outline"}
          size="sm"
          onClick={onClippingModeToggle}
          disabled={isLoading || !hasCurrentImage}
          className={`flex items-center gap-1 border-solid transition-all duration-200 ${
            isClippingMode 
              ? 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500' 
              : 'border-zinc-100 bg-white hover:bg-gray-50'
          }`}
        >
          <Crop className="w-4 h-4" />
          {isClippingMode ? '클리핑 중' : '클리핑'}
        </Button>
      )}

      {/* 리셋 버튼 */}
      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        disabled={isLoading || !hasCurrentImage}
        className="flex items-center gap-1 border-solid border-zinc-100 bg-white hover:bg-gray-50"
      >
        <Reset className="w-4 h-4" />
        리셋
      </Button>

      {/* 배경 제거 버튼 */}
      <Button
        variant="outline"
        size="sm"
        onClick={onRemoveBackground}
        disabled={isLoading || !hasCurrentImage}
        className="flex items-center gap-1 border-solid border-zinc-100 bg-white hover:bg-gray-50"
      >
        <RiImageEditLine className="w-4 h-4" />
        배경 제거
      </Button>
    </div>
  );
} 