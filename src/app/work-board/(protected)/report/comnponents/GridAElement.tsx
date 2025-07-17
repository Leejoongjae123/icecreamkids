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
    "https://api.builder.io/api/v1/image/assets/304aa4871c104446b0f8164e96d049f4/62fd88dd186d877ba1c1b31e95426f2a8c55dd17?placeholderIfAbsent=true",
    "https://api.builder.io/api/v1/image/assets/304aa4871c104446b0f8164e96d049f4/b6eb3eda5e288ff738e53390136ef19371535316?placeholderIfAbsent=true",
    "https://api.builder.io/api/v1/image/assets/304aa4871c104446b0f8164e96d049f4/5d1aaa8af210526307392bcfdf99bc81abc48f26?placeholderIfAbsent=true",
    "https://api.builder.io/api/v1/image/assets/304aa4871c104446b0f8164e96d049f4/0d3503091a7eac3b441c4d51177d9c3a303fb964?placeholderIfAbsent=true",
    "https://api.builder.io/api/v1/image/assets/304aa4871c104446b0f8164e96d049f4/ab6917aa5f7ea3dd5ccb7586e1e34271b5b28856?placeholderIfAbsent=true",
    "https://api.builder.io/api/v1/image/assets/304aa4871c104446b0f8164e96d049f4/a405b03a19bc82c823a464adfe9fd8e8eac2df30?placeholderIfAbsent=true",
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
      className={`overflow-hidden px-2.5 py-3 bg-white rounded-2xl border border-dashed border-zinc-400 w-full ${className}`}
      style={style}
      onClick={onClick}
    >
      <div className="flex gap-2.5 text-lg font-bold tracking-tight leading-none text-amber-400 whitespace-nowrap">

        <div className="flex overflow-hidden flex-col grow shrink-0 justify-center items-start px-3 py-3 rounded-md border border-solid basis-0 border-zinc-100 w-fit">
          <div>{category}</div>
        </div>
      </div>

      <div className="flex gap-1.5 mt-4">
        {displayImages.slice(0, 3).map((src, index) => (
          <img
            key={index}
            src={src}
            className={`object-contain shrink-0 max-w-full rounded-md ${
              index === 0
                ? "aspect-square w-[105px]"
                : index === 1
                  ? "aspect-[1.35] w-[142px]"
                  : "aspect-[0.97] w-[102px]"
            }`}
            alt={`Image ${index + 1}`}
          />
        ))}
      </div>

      <div className="flex gap-1.5 mt-1.5">
        {displayImages.slice(3, 6).map((src, index) => (
          <img
            key={index + 3}
            src={src}
            className={`object-contain shrink-0 max-w-full rounded-md ${
              index === 0
                ? "aspect-[1.35] w-[142px]"
                : index === 1
                  ? "aspect-square w-[105px]"
                  : "aspect-[0.97] w-[102px]"
            }`}
            alt={`Image ${index + 4}`}
          />
        ))}
      </div>

      <div className="flex overflow-hidden flex-col items-center px-12 py-3.5 mt-1.5 w-full leading-none bg-white rounded-md border border-dashed border-zinc-400">
        <div className="flex gap-1.5 self-stretch w-full">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholderText}
            className="w-full h-[27px] text-[11px] border border-1 border-[#F0F0F0] text-zinc-400 placeholder-zinc-400 outline-none rounded-md"
          />
          <button
            onClick={handleAIGenerate}
            className="flex  w-[56px] h-[27px] flex items-center justify-center gap-1 rounded-md items-center "
            style={{
              background: 'linear-gradient(to right, #FA8C3D 0%, #FF8560 50%, #FAB83D 100%)'
            }}
          >
            <Image
              src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/leaf.svg"
              className="object-contain aspect-square"
              width={12}
              height={12}
              alt="AI icon"
            />
            <div className="text-white text-[11px]">AI 생성</div>
          </button>
        </div>

        <div className="mt-3 text-xs font-semibold tracking-tight text-slate-300">
          활동에 맞는 키워드를 입력하거나 메모를 드래그 또는
        </div>

        <div className="flex gap-1.5 mt-1 max-w-full text-xs font-semibold tracking-tight text-slate-300 w-[135px]">
          <button
            onClick={handleImageUpload}
            className="flex items-center gap-1.5 hover:text-slate-400 transition-colors cursor-pointer"
          >
            <img
              src="https://api.builder.io/api/v1/image/assets/304aa4871c104446b0f8164e96d049f4/4130790501b0a7bc5b842afc4d832301a04ee225?placeholderIfAbsent=true"
              className="object-contain shrink-0 aspect-square w-[15px]"
              alt="Upload icon"
            />
            <div className="grow shrink w-[111px]">
              를 눌러서 업로드 해 주세요.
            </div>
          </button>
        </div>
      </div>

      {children}
    </div>
  );
}

export default GridAElement;
