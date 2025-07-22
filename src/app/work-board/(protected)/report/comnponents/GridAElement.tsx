"use client";
import * as React from "react";
import Image from "next/image";
import AddPicture from "./AddPicture";
import { Input } from "@/components/ui/input";
import GridEditToolbar from "./GridEditToolbar";

interface GridAElementProps {
  index: number;
  gridId?: string;
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
  isDragging?: boolean; // 드래그 상태 추가
  dragAttributes?: any; // 드래그 속성 추가
  dragListeners?: any; // 드래그 리스너 추가
  cardType?: 'large' | 'small'; // 카드 타입 추가
  isExpanded?: boolean; // 확장 상태 추가
}

function GridAElement({
  index,
  gridId,
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
  isDragging = false, // 드래그 상태 추가
  dragAttributes, // 드래그 속성 추가
  dragListeners, // 드래그 리스너 추가
  cardType, // 카드 타입 추가
  isExpanded = false, // 확장 상태 추가
}: GridAElementProps) {
  const [inputValue, setInputValue] = React.useState("");
  
  // 툴바 상태 관리
  const [toolbarState, setToolbarState] = React.useState({
    show: false,
    isExpanded: false,
  });

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

  // 이미지가 아닌 영역 클릭 핸들러 - 툴바 표시
  const handleNonImageClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // 이벤트 전파 방지
    
    // 툴바 표시
    setToolbarState({
      show: true,
      isExpanded: true,
    });
    
    if (onClick) {
      onClick();
    }
  };

  // 이미지 영역 클릭 핸들러 (이벤트 전파 방지)
  const handleImageClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    // 이미지 클릭 시 특별한 동작이 필요하면 여기에 추가
  };

  // 툴바 숨기기 핸들러
  const handleHideToolbar = () => {
    setToolbarState({
      show: false,
      isExpanded: false,
    });
  };

  // 툴바 아이콘 클릭 핸들러
  const handleToolbarIconClick = (iconIndex: number) => {
    console.log(`툴바 아이콘 ${iconIndex} 클릭됨, Grid ${index}`);
    // 여기에 각 아이콘별 로직 구현
  };

  // 전역 클릭 이벤트로 툴바 숨기기
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // 현재 GridAElement 외부 클릭 시 툴바 숨기기
      if (!target.closest(`[data-grid-id="${gridId}"]`) && !target.closest('.grid-edit-toolbar')) {
        handleHideToolbar();
      }
    };

    if (toolbarState.show) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [toolbarState.show, gridId]);

  // 툴바 표시 상태에 따른 border 스타일 결정
  const borderClass = toolbarState.show 
    ? "border-solid border-2 border-primary" 
    : "border-dashed border border-zinc-400";

  // 드래그 상태에 따른 스타일 추가
  const containerClass = isDragging 
    ? "border-solid border-2 border-primary shadow-2xl" 
    : borderClass;

  return (
    <div className="relative w-full h-full">
      <div
        className={`drag-contents overflow-hidden px-2.5 py-2.5 bg-white rounded-2xl ${containerClass} w-full h-full flex flex-col ${className} gap-y-1.5 ${isDragging ? 'opacity-90' : ''} transition-all duration-200 cursor-grab active:cursor-grabbing`}
        style={style}
        onClick={handleNonImageClick}
        data-grid-id={gridId}
        {...dragAttributes}
        {...dragListeners}
      >
        {/* 카테고리 섹션 - 고정 높이 */}
        <div className="flex gap-2.5 text-sm font-bold tracking-tight leading-none text-amber-400 whitespace-nowrap flex-shrink-0 mb-1">
          <div className="flex overflow-hidden flex-col grow shrink-0 justify-center items-start px-2 py-1 rounded-md border border-solid basis-0 border-gray-300 w-fit">
            <div className="text-[16px] pointer-events-none select-none leading-tight">{category}</div>
            
          </div>
        </div>

        {/* 이미지 그리드 - 카드 타입에 따라 다른 레이아웃 */}
        <div className={`grid gap-1 flex-1 ${
          cardType === 'large' 
            ? 'grid-cols-3 min-h-[160px]' // large 카드는 3열로 더 많은 이미지 표시
            : 'grid-cols-2 min-h-[215px]' // small 카드는 2열
        }`}>
          {(() => {
            // 카드 타입에 따라 표시할 이미지 개수 결정
            const maxImageCount = cardType === 'large' ? 6 : 4;
            const imageCount = Math.max(1, Math.min(maxImageCount, displayImages.length));
            const imagesToShow = displayImages.slice(0, imageCount);
            
            // 이미지가 없으면 기본 noimage를 최소 1개 표시
            if (imagesToShow.length === 0) {
              return (
                <AddPicture>
                  <div 
                    className="flex relative cursor-pointer hover:opacity-80 transition-opacity h-full"
                    onClick={handleImageClick}
                  >
                    <Image
                      src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg"
                      alt="No image"
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>
                </AddPicture>
              );
            }
            
            return imagesToShow.map((imageSrc, index) => (
              <AddPicture key={index}>
                <div 
                  className="flex relative cursor-pointer hover:opacity-80 transition-opacity group h-full"
                  onClick={handleImageClick}
                >
                  <Image
                    src={imageSrc}
                    alt={`Image ${index + 1}`}
                    fill
                    className="object-cover rounded-md"
                  />
                  {/* Black overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-40 rounded-md flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                    {/* Upload icon */}
                    <Image
                      src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/imageupload3.svg"
                      width={20}
                      height={20}
                      className="object-contain mb-2"
                      alt="Upload icon"
                    />
                    {/* Upload text */}
                    <div className="text-white text-[8px] font-medium text-center mb-2 px-1">
                      이미지를 드래그하거나<br />클릭하여 업로드
                    </div>
                    {/* File select button */}
                    <button 
                      className="bg-primary text-white text-[9px] px-2 py-1 rounded hover:bg-primary/80 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        // 파일 선택 로직
                      }}
                    >
                      파일선택
                    </button>
                  </div>
                </div>
              </AddPicture>
            ));
          })()}
        </div>

        {/* 하단 입력 영역 - 남은 공간을 더 효율적으로 사용 */}
        <div className="flex overflow-hidden flex-col items-center px-2 py-2 w-full leading-none bg-white rounded-md border border-dashed border-zinc-400 min-h-[90px] justify-center flex-shrink-0 mt-1">
          <div className="flex gap-1.5 w-full mb-1.5"> 
            <Input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder={placeholderText}
              className="h-[26px] px-2 py-1 text-xs tracking-tight bg-white border border-gray-300 text-zinc-600 placeholder-zinc-400 flex-1 shadow-none !rounded-md focus:ring-0 focus-visible:ring-0 focus:outline-none focus:border-primary focus:border-2"
              style={{ borderRadius: '6px', fontSize: '10px' }}
              onClick={handleImageClick} // Input 클릭 시에도 이벤트 전파 방지
            />
            <button
              onClick={(e) => {
                e.stopPropagation(); // 이벤트 전파 방지
                handleAIGenerate();
              }}
              className="flex overflow-hidden gap-0.5 text-xs font-semibold tracking-tight text-white rounded-md bg-gradient-to-r from-[#FA8C3D] via-[#FF8560] to-[#FAB83D] hover:opacity-90 flex justify-center items-center w-[54px] h-[26px]"
            >
              <Image
                src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/leaf.svg"
                className="object-contain"
                width={11}
                height={11}
                alt="AI icon"
              />
              <div className="text-[10px] tracking-[-0.03em]">AI 생성</div>
            </button>
          </div>

          <div className="text-[10px] font-semibold tracking-tight text-slate-300 text-center mb-1 leading-tight px-1">
            활동에 맞는 키워드를 입력하거나 메모를 드래그 또는
          </div>

          <div className="flex gap-1 text-xs font-semibold tracking-tight text-slate-300 items-center">
            <AddPicture>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // 이벤트 전파 방지
                  handleImageUpload();
                }}
                className="flex items-center gap-0.5 hover:text-slate-400 transition-colors cursor-pointer justify-center"
              >
                <Image
                  src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/upload.svg"
                  width={10}
                  height={10}
                  className="object-contain"
                  alt="Upload icon"
                />
                <div className="text-slate-300 text-[10px]">를 눌러서 업로드 해 주세요.</div>
              </button>
            </AddPicture>
          </div>
        </div>

        {children && <div className="mt-1 flex-shrink-0">{children}</div>}
      </div>
      
      {/* GridEditToolbar - element 하단 좌측에 위치 */}
      {toolbarState.show && (
        <div className="grid-edit-toolbar">
          <GridEditToolbar
            show={toolbarState.show}
            isExpanded={toolbarState.isExpanded}
            position={{ left: "8px", top: "calc(100% + 8px)" }}
            onIconClick={handleToolbarIconClick}
            targetGridId={gridId}
          />
        </div>
      )}
    </div>
  );
}

export default GridAElement;