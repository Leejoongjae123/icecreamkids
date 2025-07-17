"use client";
import * as React from "react";
import Image from "next/image";

interface GridAElementProps {
  index: number;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  category?: string;
  images?: string[];
  onAIGenerate?: () => void;
  onImageUpload?: () => void;
  placeholderText?: string;
}

function GridAElement({
  index,
  className = "",
  children,
  onClick,
  style,
  checked,
  onCheckedChange,
  category = "촉감놀이",
  images = [],
  onAIGenerate,
  onImageUpload,
  placeholderText = "ex) 아이들과 촉감놀이를 했어요",
}: GridAElementProps) {
  const [inputValue, setInputValue] = React.useState("");

  // Default images if none provided
  const defaultImages = [
    "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg",
    "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg",
    "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg",
    "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg",
    "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg",
    "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg",
  ];

  const displayImages = images.length > 0 ? images : defaultImages;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleAIGenerate = () => {
    if (onAIGenerate) {
      onAIGenerate();
    }
  };

  const handleImageUpload = () => {
    if (onImageUpload) {
      onImageUpload();
    }
  };

  return (
    <div
      className={`overflow-hidden px-2.5 py-2 bg-white rounded-2xl border border-dashed border-zinc-400 w-full h-full flex flex-col ${className} gap-y-2`}
      style={style}
      onClick={onClick}
    >
      {/* 카테고리 섹션 - 고정 높이 */}
      <div className="flex gap-2.5 text-sm font-bold tracking-tight leading-none text-amber-400 whitespace-nowrap flex-shrink-0">
        <div className="flex overflow-hidden flex-col grow shrink-0 justify-center items-start px-2 py-1.5 rounded-md border border-solid basis-0 border-zinc-100 w-fit">
          <div>{category}</div>
        </div>
      </div>

      {/* 이미지 그리드 - 제한된 높이 */}
      <div className="grid grid-cols-2 gap-1 h-[215px]">
        {(() => {
          // 최소 1개, 최대 4개의 이미지 표시
          const imageCount = Math.max(1, Math.min(4, displayImages.length));
          const imagesToShow = displayImages.slice(0, imageCount);
          
          // 이미지가 없으면 기본 noimage를 최소 1개 표시
          if (imagesToShow.length === 0) {
            return (
              <div className="flex relative">
                <Image
                  src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg"
                  alt="No image"
                  fill
                  className="object-cover rounded-md"
                />
              </div>
            );
          }
          
          return imagesToShow.map((imageSrc, index) => (
            <div key={index} className="flex relative">
              <Image
                src={imageSrc}
                alt={`Image ${index + 1}`}
                fill
                className="object-cover rounded-md"
              />
            </div>
          ));
        })()}
      </div>

      {/* 하단 입력 영역 - 남은 공간 사용 */}
      <div className="flex overflow-hidden flex-col items-center px-3 py-2 flex-1 w-full leading-none bg-white rounded-md border border-dashed border-zinc-400 min-h-0 justify-center">
        <div className="flex gap-1.5 w-4/5 mb-2"> 
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholderText}
            className="flex overflow-hidden flex-col justify-center items-start px-2 py-1.5 text-xs tracking-tight bg-white rounded-md border border-solid border-zinc-100 text-zinc-400 placeholder-zinc-400 flex-1 outline-none"
          />
          <button
            onClick={handleAIGenerate}
            className="flex overflow-hidden gap-1 px-1.5 py-1.5 text-xs font-semibold tracking-tight text-white rounded-md bg-gradient-to-r from-[#FA8C3D] via-[#FF8560] to-[#FAB83D] hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <img
              src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/leaf.svg"
              className="object-contain shrink-0 w-3 aspect-square"
              alt="AI icon"
            />
            <span>AI 생성</span>
          </button>
        </div>

        <div className="text-[11px] font-semibold tracking-tight text-slate-300 text-center mb-1 leading-tight">
          활동에 맞는 키워드를 입력하거나 메모를 드래그 또는
        </div>

        <div className="flex gap-1.5 text-xs font-semibold tracking-tight text-slate-300 items-center">
          <button
            onClick={handleImageUpload}
            className="flex items-center gap-0.5 hover:text-slate-400 transition-colors cursor-pointer justify-center"
          >
            <Image
              src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/upload.svg"
              width={11}
              height={11}
              className="object-contain"
              alt="Upload icon"
            />
            <div className="text-slate-300 text-[11px]">를 눌러서 업로드 해 주세요.</div>
          </button>
        </div>
      </div>

      {children && <div className="mt-1 flex-shrink-0">{children}</div>}
    </div>
  );
}

export default GridAElement;
