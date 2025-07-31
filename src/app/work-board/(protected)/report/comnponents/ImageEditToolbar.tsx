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
}: ImageEditToolbarProps) {
  return (
    <div className="flex items-center justify-center  bg-white rounded-lg">
      {/* <Button
        variant="outline"
        size="sm"
        onClick={onZoomOut}
        disabled={isLoading || !hasCurrentImage}
        className="flex items-center gap-1 border-solid border-zinc-100 bg-white"
      >
        <ZoomOut className="w-4 h-4" />
        축소
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onZoomIn}
        disabled={isLoading || !hasCurrentImage}
        className="flex items-center gap-1 border-solid border-zinc-100 bg-white"
      >
        <ZoomIn className="w-4 h-4" />
        확대
      </Button> */}

      {/* <div className="w-px h-6 bg-gray-300 mx-2" />

      <Button
        variant="outline"
        size="sm"
        onClick={onRotateLeft}
        disabled={isLoading || !hasCurrentImage}
        className="flex items-center gap-1 border-solid border-zinc-100 bg-white"
      >
        <RotateCcw className="w-4 h-4" />
        왼쪽 회전
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onRotateRight}
        disabled={isLoading || !hasCurrentImage}
        className="flex items-center gap-1 border-solid border-zinc-100 bg-white"
      >
        <RotateCw className="w-4 h-4" />
        오른쪽 회전
      </Button> */}

      {/* <div className="w-px h-6 bg-gray-300 mx-2" /> */}

      

    </div>
  );
} 