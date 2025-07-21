"use client";
import * as React from "react";
import Image from "next/image";
import AddPicture from "./AddPicture";
import { Input } from "@/components/ui/input";
import GridEditToolbar from "./GridEditToolbar";

interface GridBElementProps {
  index: number;
  gridId?: string;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  isSelected?: boolean;
  onSelectChange?: (isSelected: boolean) => void;
  images?: string[];
  onAIGenerate?: () => void;
  onImageUpload?: () => void;
  onDelete?: () => void;
  placeholderText?: string;
  isExpanded?: boolean; // col-span-2 적용 여부
}

function GridBElement({
  index,
  gridId,
  className = "",
  children,
  onClick,
  style,
  isSelected = false,
  onSelectChange,
  images = [],
  onAIGenerate,
  onImageUpload,
  onDelete,
  placeholderText = "ex) 아이들과 촉감놀이를 했어요",
  isExpanded = false,
}: GridBElementProps) {
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

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  // 이미지가 아닌 영역 클릭 핸들러 - 툴바 표시 및 기존 선택 로직
  const handleNonImageClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // 이벤트 전파 방지
    
    // 툴바 표시
    setToolbarState({
      show: true,
      isExpanded: true,
    });
    
    // 기존 선택 로직 유지
    if (onSelectChange) {
      onSelectChange(!isSelected);
    }
    if (onClick) {
      onClick();
    }
  };

  // 이미지 영역 클릭 핸들러 (이벤트 전파 방지)
  const handleImageClick = (event: React.MouseEvent) => {
    event.stopPropagation();
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
      // 현재 GridBElement 외부 클릭 시 툴바 숨기기
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

  // 툴바 표시 상태 또는 기존 선택 상태에 따른 border 스타일 결정
  const borderClass = (toolbarState.show || isSelected)
    ? 'border-solid border-primary border-2' 
    : 'border-dashed border-zinc-400';

  return (
    <div className={`relative ${isExpanded ? 'col-span-2' : ''}`}>
      <div
        className={`relative overflow-hidden px-3 py-3 bg-white rounded-2xl border ${borderClass} w-full h-full flex flex-col ${className} gap-y-2 cursor-pointer`}
        style={style}
        onClick={handleNonImageClick}
        data-grid-id={gridId}
      >
        {/* 삭제 버튼 - 우측 상단 */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="absolute top-2 right-2 w-7 h-7 bg-white border border-[#F0F0F0] rounded-md flex items-center justify-center z-20"
          >
            <Image
              src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/trash.svg"
              width={14}
              height={14}
              className="object-contain hover:opacity-80"
              alt="Delete"
            />
          </button>
        )}
        {/* 이미지 그리드 - 2개 이미지만 표시, 사이즈 1/2로 축소 */}
        <div className="grid grid-cols-2 gap-1 h-[calc(105/240*100%)]">
          {(() => {
            // 최소 1개, 최대 2개의 이미지 표시
            const imageCount = Math.max(1, Math.min(2, displayImages.length));
            const imagesToShow = displayImages.slice(0, imageCount);
            
            // 이미지가 없으면 기본 noimage를 최소 1개 표시
            if (imagesToShow.length === 0) {
              return (
                <AddPicture>
                  <div 
                    className="flex relative cursor-pointer hover:opacity-80 transition-opacity"
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
                  className="flex relative cursor-pointer hover:opacity-80 transition-opacity group"
                  onClick={handleImageClick}
                >
                  <Image
                    src={imageSrc}
                    alt={`Image ${index + 1}`}
                    fill
                    className="object-cover rounded-md"
                  />
                  {/* Black overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-40 rounded-md flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
                    <button className="bg-primary text-white text-[9px] px-2 py-1 rounded hover:bg-primary/80 transition-colors">
                      파일선택
                    </button>
                  </div>
                </div>
              </AddPicture>
            ));
          })()}
        </div>

        {/* 하단 입력 영역 - 남은 공간 사용 */}
        <div className="flex overflow-hidden flex-col items-center px-1 py-2 flex-1 w-full leading-none bg-white rounded-md border border-dashed border-zinc-400 min-h-0 justify-center">
          <div className="flex gap-1.5 px-1 mb-2 w-full"> 
            <Input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder={placeholderText}
              className="h-[27px] px-2 py-1.5 text-xs tracking-tight bg-white border border-gray-300 text-zinc-600 placeholder-zinc-400 flex-1 shadow-none !rounded-md focus:ring-0 focus-visible:ring-0 focus:outline-none focus:border-primary focus:border-2"
              style={{ borderRadius: '6px', fontSize: '11px' }}
              onClick={handleImageClick} // Input 클릭 시에도 이벤트 전파 방지
            />
            <button
              onClick={(e) => {
                e.stopPropagation(); // 이벤트 전파 방지
                handleAIGenerate();
              }}
              className="flex overflow-hidden gap-0.5 text-xs font-semibold tracking-tight text-white rounded-md bg-gradient-to-r from-[#FA8C3D] via-[#FF8560] to-[#FAB83D] hover:opacity-90 flex justify-center items-center w-[48px] h-[25px]"
            >
              <Image
                src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/leaf.svg"
                className="object-contain"
                width={10}
                height={10}
                alt="AI icon"
              />
              <div className="text-[8px] tracking-[-0.03em]">AI 생성</div>
            </button>
          </div>

          <div className="text-[8px] font-semibold tracking-tight text-slate-300 text-center mb-1 leading-tight">
            활동에 맞는 키워드를 입력하거나 메모를 드래그 또는
          </div>

          <div className="flex gap-1.5 text-xs font-semibold tracking-tight text-slate-300 items-center">
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
                  width={8}
                  height={8}
                  className="object-contain"
                  alt="Upload icon"
                />
                <div className="text-slate-300 text-[8px]">를 눌러서 업로드 해 주세요.</div>
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

export default GridBElement; 