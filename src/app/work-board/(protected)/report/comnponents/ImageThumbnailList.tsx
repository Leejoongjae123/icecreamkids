"use client";

import { ImageThumbnailListProps } from "./types";
import ImageThumbnail from "./ImageThumbnail";

export default function ImageThumbnailList({
  imageUrls,
  activeImageIndex,
  onImageSelect,
  onImageOrderChange,
  isLoading,
  hasCurrentImage,
}: ImageThumbnailListProps) {
  const handleMoveLeft = (currentIndex: number) => {
    if (currentIndex > 0) {
      onImageOrderChange(currentIndex, currentIndex - 1);
    }
  };

  const handleMoveRight = (currentIndex: number) => {
    if (currentIndex < imageUrls.length - 1) {
      onImageOrderChange(currentIndex, currentIndex + 1);
    }
  };

  if (imageUrls.length <= 1 || isLoading || !hasCurrentImage) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* 안내 텍스트 */}


      {/* 썸네일 목록 */}
      <div className="flex gap-3 justify-center flex-wrap py-4 px-2">
        {imageUrls.map((url, index) => (
          <ImageThumbnail
            key={`thumbnail-${index}-${url}`}
            imageUrl={url}
            index={index}
            isActive={activeImageIndex === index}
            onSelect={onImageSelect}
            onMoveLeft={() => handleMoveLeft(index)}
            onMoveRight={() => handleMoveRight(index)}
            canMoveLeft={index > 0}
            canMoveRight={index < imageUrls.length - 1}
            totalCount={imageUrls.length}
          />
        ))}
      </div>

      {/* 추가 안내 */}
      
    </div>
  );
} 