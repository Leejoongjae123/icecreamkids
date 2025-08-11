"use client";
import React, { Suspense } from "react";
import { useSearchParams, usePathname } from "next/navigation";

interface PhotoSelectorProps {
  selectedPhoto?: string;
  onPhotoSelect?: (photo: string) => void;
}

function PhotoSelectorContent({
  selectedPhoto = "4개",
  onPhotoSelect,
}: PhotoSelectorProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const photos = ["9개", "8개", "7개", "6개", "5개", "4개", "3개", "2개", "1개"];

  const handlePhotoSelect = (photo: string) => {
    // 확인 모달에서 최종 확정되기 전까지는 URL을 변경하지 않는다.
    if (onPhotoSelect) {
      onPhotoSelect(photo);
    }
  };

  return (
    <div className="flex overflow-hidden flex-col px-4 py-5 text-sm font-medium leading-none text-center text-gray-700 bg-white max-w-[90px] rounded-xl">
      <div className="self-start text-xs leading-none text-amber-400">
        사진 개수를<br />
        선택해주세요
      </div>
      <div className="flex flex-col mt-5 w-full items-center">
        {photos.map((photo, index) => (
          <button
            key={photo}
            onClick={() => handlePhotoSelect(photo)}
            className={`
              flex justify-center items-center w-[50px] h-[50px] rounded-full transition-colors
              ${index === 0 ? "" : "mt-2"}
              ${
                selectedPhoto === photo
                  ? "font-semibold text-white bg-amber-400 hover:bg-amber-500"
                  : "bg-gray-50 hover:bg-gray-100"
              }
            `}
          >
            <div>{photo}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PhotoSelector(props: PhotoSelectorProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PhotoSelectorContent {...props} />
    </Suspense>
  );
}
