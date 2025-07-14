"use client";
import React, { Suspense } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

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
  const router = useRouter();

  const photos = ["9개", "8개", "7개", "6개", "5개", "4개", "3개", "2개", "1개"];

  const handlePhotoSelect = (photo: string) => {
    // "9개" -> "9"로 변환
    const photoNumber = photo.replace("개", "");
    
    // 새로운 searchParams 생성
    const params = new URLSearchParams(searchParams);
    params.set("photo", photoNumber);
    
    // URL 업데이트
    router.push(`${pathname}?${params.toString()}`);
    
    // 부모 컴포넌트에 콜백 호출 (있는 경우)
    if (onPhotoSelect) {
      onPhotoSelect(photo);
    }
  };

  return (
    <div className="flex overflow-hidden flex-col px-4 py-5 text-sm font-medium leading-none text-center text-gray-700 bg-white max-w-[78px] rounded-xl">
      <div className="self-start text-xs leading-none text-amber-400">
        사진 개수를<br />
        선택해주세요
      </div>
      <div className="flex flex-col mt-5 w-full">
        {photos.map((photo, index) => (
          <button
            key={photo}
            onClick={() => handlePhotoSelect(photo)}
            className={`
              flex overflow-hidden flex-col justify-center items-center w-full whitespace-nowrap h-[46px] rounded-[50px] transition-colors
              ${index === 0 ? "" : "mt-2.5"}
              ${photo === "0~2세" ? "px-1" : "px-3"}
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
