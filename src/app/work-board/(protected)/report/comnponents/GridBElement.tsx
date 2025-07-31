"use client";
import * as React from "react";
import Image from "next/image";
import AddPicture from "./AddPicture";
import { Input } from "@/components/ui/input";
import GridEditToolbar from "./GridEditToolbar";
import { Loader2 } from "lucide-react";

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
  isHidden?: boolean; // 숨김 처리 여부 (쓰레기통으로 삭제된 경우)
  imageCount?: number; // 초기 이미지 개수
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
  isHidden = false,
  imageCount: initialImageCount = 1, // 초기 이미지 개수
}: GridBElementProps) {
  // 이미지 개수 상태 관리
  const [imageCount, setImageCount] = React.useState(initialImageCount);
  
  // description-area 확장 상태 관리
  const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);
  
  // AI 생성 로딩 상태 관리
  const [isLoading, setIsLoading] = React.useState(false);
  
  // AI 생성 버튼을 클릭한 적이 있는지 추적
  const [hasClickedAIGenerate, setHasClickedAIGenerate] = React.useState(false);
  
  // textarea focus 상태 관리 추가
  const [isTextareaFocused, setIsTextareaFocused] = React.useState(false);
  
  // 텍스트 토글 상태 관리 (true: 애국가 1절, false: 애국가 2절)
  const [isFirstVerse, setIsFirstVerse] = React.useState(true);
  
  // 이미지 배열을 imageCount에 맞게 조정
  const [currentImages, setCurrentImages] = React.useState<string[]>(() => {
    const newImages = [...images];
    // 이미지 개수에 맞게 배열 크기 조정
    while (newImages.length < imageCount) {
      newImages.push("");
    }
    return newImages.slice(0, imageCount);
  });

  // imageCount 변경 시 currentImages 업데이트
  React.useEffect(() => {
    setCurrentImages(prev => {
      const newImages = [...prev];
      // 이미지 개수에 맞게 배열 크기 조정
      while (newImages.length < imageCount) {
        newImages.push("");
      }
      return newImages.slice(0, imageCount);
    });
  }, [imageCount]);

  // 이미지 그리드 레이아웃 클래스 결정
  const getImageGridClass = (count: number) => {
    switch (count) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-3";
      case 4:
        return "grid-cols-2";
      case 6:
        return "grid-cols-3";
      case 9:
        return "grid-cols-3";
      default:
        return "grid-cols-1";
    }
  };

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleAIGenerate = () => {
    console.log("AI 생성 버튼 클릭됨");
    console.log("현재 isDescriptionExpanded:", isDescriptionExpanded);
    
    // AI 생성 버튼을 클릭했다고 표시
    setHasClickedAIGenerate(true);
    
    // 로딩 상태 시작
    setIsLoading(true);
    
    // 2초 후에 로딩 완료 및 내용 변경
    setTimeout(() => {
      // 설명 내용 변경 (애국가 1절로 초기화)
      setInputValue("동해물과 백두산이\n마르고 닳도록\n하느님이 보우하사\n우리나라 만세");
      setIsFirstVerse(true); // 1절 상태로 설정
      
      // description-area를 확장된 textarea로 변경
      setIsDescriptionExpanded(true);
      console.log("setIsDescriptionExpanded(true) 호출됨");
      
      // 로딩 상태 종료
      setIsLoading(false);
      
      if (onAIGenerate) {
        onAIGenerate();
      }
    }, 2000);
  };

  const handleImageUpload = () => {
    if (onImageUpload) {
      onImageUpload();
    }
  };

  // 텍스트 새로고침(토글) 핸들러
  const handleTextRefresh = (event: React.MouseEvent) => {
    event.stopPropagation(); // 이벤트 전파 방지
    
    // 로딩 상태 시작
    setIsLoading(true);
    
    // 2초 후에 로딩 완료 및 내용 변경
    setTimeout(() => {
      if (isFirstVerse) {
        // 애국가 2절로 변경
        setInputValue("남산 위의 저 소나무\n철갑을 두른 듯\n바람서리 불변함은\n우리 기상일세");
        setIsFirstVerse(false);
      } else {
        // 애국가 1절로 변경
        setInputValue("동해물과 백두산이\n마르고 닳도록\n하느님이 보우하사\n우리나라 만세");
        setIsFirstVerse(true);
      }
      
      // 로딩 상태 종료
      setIsLoading(false);
    }, 2000);
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
  const handleToolbarIconClick = (iconIndex: number, data?: any) => {
    console.log(`툴바 아이콘 ${iconIndex} 클릭됨, Grid ${index}`, data);
    
    // 이미지 개수 변경 처리
    if (data && data.action === 'changeImageCount') {
      console.log(`그리드 ${data.gridId}의 이미지 개수를 ${data.count}개로 변경`);
      setImageCount(data.count);
    }
    
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
    <div className="relative w-full h-full">
      <div
        className={`relative overflow-hidden px-2.5 py-2.5 bg-white rounded-2xl border ${borderClass} w-full h-full flex flex-col ${className} gap-y-1.5 cursor-pointer`}
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

        {/* 이미지 그리드 - 계산된 높이로 설정하여 공간 최적화 */}
        <div 
          className={`grid gap-1 w-full ${getImageGridClass(imageCount)}`}
          style={{ 
            height: 'calc(100% - 70px)' // 전체 높이에서 하단 입력 영역(70px) 제외
          }}
        >
          {currentImages.map((imageSrc, index) => (
            <AddPicture key={index}>
              <div 
                className="flex relative cursor-pointer hover:opacity-80 transition-opacity group h-full"
                onClick={handleImageClick}
              >
                {imageSrc ? (
                  <Image
                    src={imageSrc}
                    alt={`Image ${index + 1}`}
                    fill
                    className="object-cover rounded-md"
                  />
                ) : (
                  <Image
                    src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg"
                    alt="No image"
                    fill
                    className="object-cover rounded-md"
                  />
                )}
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
          ))}
        </div>

        {/* 하단 입력 영역 - 고정 높이 70px로 최적화 */}
        {isLoading ? (
          // 로딩 중일 때
          <div className="flex flex-col items-center justify-center px-2 py-2 w-full leading-none bg-white rounded-md border border-dashed border-zinc-400 h-[70px] flex-shrink-0">
            <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
            <div className="text-[#B4B4B4] text-xs">내용을 생성중입니다...</div>
          </div>
        ) : isDescriptionExpanded ? (
          // 확장된 textarea 모드
          <div className={`flex overflow-hidden flex-col px-2 py-2 w-full leading-none bg-white rounded-md h-[70px] justify-center flex-shrink-0 relative transition-colors ${
            isTextareaFocused ? 'border border-solid border-primary' : 'border border-dashed border-zinc-400'
          }`}>
            {/* 새로고침 버튼 - 우측 상단 */}
            <button
              onClick={handleTextRefresh}
              className="absolute top-2 right-3 w-5 h-5 flex items-center justify-center hover:bg-gray-100 rounded-sm transition-colors z-10"
              title="텍스트 새로고침"
            >
              <Image
                src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/refresh.svg"
                width={20}
                height={20}
                alt="Refresh"
                className="object-contain"
              />
            </button>
            
            <textarea
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => setIsTextareaFocused(true)}
              onBlur={() => setIsTextareaFocused(false)}
              placeholder={placeholderText}
              className="w-full h-full px-2 py-1 pr-8 text-xs tracking-tight bg-white border-0 text-zinc-600 placeholder-zinc-400 shadow-none rounded-md focus:ring-0 focus:outline-none resize-none flex-1 scrollbar-hide"
              style={{ 
                borderRadius: '6px', 
                fontSize: '12px', 
                lineHeight: '1.4', 
                scrollbarWidth: 'none', /* Firefox */
                msOverflowStyle: 'none' /* IE and Edge */
              }}
              onClick={handleImageClick}
            />
            
            {/* 글자수 카운팅 - 우측하단 */}
            {hasClickedAIGenerate && (
              <div className="absolute bottom-2 right-3 text-[9px] font-medium text-primary">
                ({inputValue.length}/200)
              </div>
            )}
          </div>
        ) : (
          // 기본 모드
          <div className="flex overflow-hidden flex-col items-center px-2 py-2 w-full leading-none bg-white rounded-md border border-dashed border-zinc-400 h-[70px] justify-center flex-shrink-0 relative">
            <div className="flex gap-1.5 w-full mb-1.5"> 
              <Input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder={placeholderText}
                className="h-[26px] min-h-[26px] max-h-[26px] px-2 py-1 text-xs tracking-tight bg-white border border-dashed border-zinc-400 text-zinc-600 placeholder-zinc-400 flex-1 shadow-none rounded-md focus:ring-0 focus:outline-none focus:border-primary resize-none"
                style={{ borderRadius: '6px', fontSize: '10px', lineHeight: '1.2' }}
                onClick={handleImageClick} // Input 클릭 시에도 이벤트 전파 방지
              />
              <button
                onClick={(e) => {
                  e.stopPropagation(); // 이벤트 전파 방지
                  handleImageUpload();
                }}
                className="flex overflow-hidden justify-center items-center w-[26px] h-[26px] bg-[#979797] border border-dashed border-zinc-400 rounded-md hover:bg-[#979797]/80 transition-colors"
                title="파일 업로드"
              >
                <Image
                  src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/upload.svg"
                  className="object-contain"
                  width={14}
                  height={14}
                  alt="Upload icon"
                />
              </button>
            </div>
            
            {/* AI 생성 버튼 - 별도 줄에 배치 */}
            <div className="flex w-full mb-1.5 justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // 이벤트 전파 방지
                  if (!isLoading) {
                    handleAIGenerate();
                  }
                }}
                disabled={isLoading}
                className={`flex overflow-hidden gap-0.5 text-xs font-semibold tracking-tight text-white rounded-md bg-gradient-to-r from-[#FA8C3D] via-[#FF8560] to-[#FAB83D] hover:opacity-90 flex justify-center items-center w-[54px] h-[26px] self-start transition-opacity ${isLoading ? 'cursor-not-allowed opacity-75' : ''}`}
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin text-white" />
                ) : (
                  <>
                    <Image
                      src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/leaf.svg"
                      className="object-contain"
                      width={11}
                      height={11}
                      alt="AI icon"
                    />
                    <div className="text-[10px] tracking-[-0.03em]">AI 생성</div>
                  </>
                )}
              </button>
            </div>

            {/* 글자수 카운팅 - 우측하단 */}
            {hasClickedAIGenerate && (
              <div className="absolute bottom-2 right-3 text-[9px] font-medium text-primary">
                ({inputValue.length}/200)
              </div>
            )}



            
          </div>
        )}

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