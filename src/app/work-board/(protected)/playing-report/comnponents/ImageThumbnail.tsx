"use client";

import { ImageThumbnailProps } from "./types";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ImageThumbnail({
  imageUrl,
  index,
  isActive,
  onSelect,
  onMoveLeft,
  onMoveRight,
  canMoveLeft,
  canMoveRight,
  totalCount,
}: ImageThumbnailProps) {
  return (
    <div className="relative group">
      {/* 썸네일 이미지 */}
      <div
        className={`relative cursor-pointer transition-all duration-200 ${
          isActive
            ? "ring-2 ring-primary shadow-lg scale-105 rounded-lg"
            : "hover:scale-105 hover:shadow-md rounded-lg"
        }`}
        onClick={() => onSelect(index)}
      >
        <img
          src={imageUrl}
          alt={`이미지 ${index + 1}`}
          className="w-16 h-16 object-cover rounded-lg border border-gray-200"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
        
        {/* 이미지 번호 표시 */}
        <div className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
          {index + 1}
        </div>
      </div>

      {/* 순서 변경 버튼들 - 호버 시에만 표시 */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
        {/* 왼쪽으로 이동 버튼 */}
        {canMoveLeft && onMoveLeft && (
          <Button
            size="sm"
            variant="secondary"
            className="h-6 w-6 p-0 bg-white shadow-md hover:bg-gray-50"
            onClick={(e) => {
              e.stopPropagation();
              onMoveLeft();
            }}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
        )}
        
        {/* 오른쪽으로 이동 버튼 */}
        {canMoveRight && onMoveRight && (
          <Button
            size="sm"
            variant="secondary"
            className="h-6 w-6 p-0 bg-white shadow-md hover:bg-gray-50"
            onClick={(e) => {
              e.stopPropagation();
              onMoveRight();
            }}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        )}
      </div>

      
    </div>
  );
} 