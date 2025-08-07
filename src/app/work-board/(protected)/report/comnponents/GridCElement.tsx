"use client";
import * as React from "react";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import AddPictureClipping from "./AddPictureClipping";
import KonvaImageCanvas, { KonvaImageCanvasRef } from "./KonvaImageCanvas";
import GridEditToolbar from "./GridEditToolbar";
import { ClipPathItem } from "../dummy/types";

interface GridCElementProps {
  index: number;
  gridId: string;
  clipPathData: ClipPathItem;
  imageUrl: string;
  isClippingEnabled: boolean;
  isDragging?: boolean;
  dragAttributes?: any;
  dragListeners?: any;
  isSelected?: boolean;
  onSelectChange?: (isSelected: boolean) => void;
  onDelete?: () => void;
  onImageUpload: (gridId: string, imageUrl: string) => void;
}

function GridCElement({
  index,
  gridId,
  clipPathData,
  imageUrl,
  isClippingEnabled,
  isDragging = false,
  dragAttributes,
  dragListeners,
  isSelected = false,
  onSelectChange,
  onDelete,
  onImageUpload,
}: GridCElementProps) {
  const [activityKeyword, setActivityKeyword] = React.useState("");
  const [isKeywordExpanded, setIsKeywordExpanded] = React.useState(false);
  const [isInputFocused, setIsInputFocused] = React.useState(false);
  const [selectedKeyword, setSelectedKeyword] = React.useState<string>("");
  const [currentImageUrl, setCurrentImageUrl] = React.useState<string>(imageUrl);
  const [isHovered, setIsHovered] = React.useState(false);
  
  // placeholder 이미지 URL
  const NO_IMAGE_URL = "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg";

  // KonvaImageCanvas ref
  const konvaCanvasRef = React.useRef<KonvaImageCanvasRef>(null);
  
  // canvas-container ref 및 크기 상태
  const canvasContainerRef = React.useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = React.useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // 이미지 변환 정보 상태 (위치, 스케일 동기화용)
  const [imageTransformData, setImageTransformData] = React.useState<{
    x: number;
    y: number;
    scale: number;
    width: number;
    height: number;
  } | null>(null);

  // 툴바 상태 관리
  const [toolbarState, setToolbarState] = React.useState({
    show: false,
    isExpanded: false,
  });

  // 이미지가 있는지 확인하는 헬퍼 함수
  const hasImage = currentImageUrl && currentImageUrl !== NO_IMAGE_URL;

  // 컨테이너 클릭 핸들러 - 툴바 표시
  const handleContainerClick = (event: React.MouseEvent) => {
    event.stopPropagation(); 

    // 클리핑이 활성화되어 있을 때만 툴바 표시
    if (isClippingEnabled) {
      // 툴바 표시 전에 현재 이미지 상태를 저장
      if (konvaCanvasRef.current) {
        const currentImageData = konvaCanvasRef.current.getImageData();
        if (currentImageData) {
          console.log("툴바 표시 전 현재 이미지 상태 저장:", currentImageData);
          setImageTransformData({
            x: currentImageData.x,
            y: currentImageData.y,
            scale: currentImageData.scale,
            width: currentImageData.width,
            height: currentImageData.height
          });
        }
      }

      setToolbarState({
        show: true,
        isExpanded: true,
      });
    }
  };

  // 체크박스 변경 핸들러
  const handleCheckboxChange = (checked: boolean | "indeterminate") => {
    if (onSelectChange && typeof checked === "boolean") {
      onSelectChange(checked);
    }
  };

  // 삭제 핸들러
  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  // 이미지 URL 변경 감지
  React.useEffect(() => {
    setCurrentImageUrl(imageUrl);
  }, [imageUrl]);

  // canvas-container 크기 감지
  React.useEffect(() => {
    const updateContainerSize = () => {
      if (canvasContainerRef.current) {
        const rect = canvasContainerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setContainerSize({ width: rect.width, height: rect.height });
        }
      }
    };

    // 초기 크기 설정
    updateContainerSize();

    // ResizeObserver를 사용하여 크기 변화 감지
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerSize({ width, height });
        }
      }
    });

    if (canvasContainerRef.current) {
      resizeObserver.observe(canvasContainerRef.current);
    }

    // window resize 이벤트도 처리
    window.addEventListener('resize', updateContainerSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateContainerSize);
    };
  }, []);

  // AddPictureClipping용 이미지 추가 핸들러
  const handleImageAdded = (hasImage: boolean, imageUrl?: string) => {
    if (hasImage && imageUrl) {
      // 이미지가 추가되면 현재 이미지 URL 업데이트
      setCurrentImageUrl(imageUrl);
      
      // 부모 컴포넌트에 이미지 업로드 알림
      if (onImageUpload) {
        onImageUpload(gridId, imageUrl);
      }
      
      // hover 상태 해제
      setIsHovered(false);
    }
  };

  // 이미지 이동 핸들러 (KonvaImageCanvas에서 호출)
  const handleImageMove = React.useCallback((x: number, y: number) => {
    console.log("이미지 이동:", { x, y, gridId });
    
    // 현재 이미지 데이터 업데이트
    if (konvaCanvasRef.current) {
      const currentImageData = konvaCanvasRef.current.getImageData();
      if (currentImageData) {
        setImageTransformData({
          x: currentImageData.x,
          y: currentImageData.y,
          scale: currentImageData.scale,
          width: currentImageData.width || 0,
          height: currentImageData.height || 0
        });
      }
    }
  }, [gridId]);

  // 이미지 변환 데이터 업데이트 핸들러
  const handleImageTransformUpdate = React.useCallback((transformData: {
    x: number;
    y: number;
    scale: number;
    width: number;
    height: number;
  }) => {
    console.log("이미지 변환 데이터 업데이트:", transformData);
    setImageTransformData(transformData);
  }, []);

  // 이미지 위치 초기화
  const handleResetImagePosition = React.useCallback(() => {
    if (konvaCanvasRef.current) {
      konvaCanvasRef.current.resetImagePosition();
    }
  }, []);

  // 툴바 숨기기 핸들러
  const handleHideToolbar = () => {
    // 툴바 숨기기 전에 현재 이미지 상태를 저장
    if (konvaCanvasRef.current) {
      const currentImageData = konvaCanvasRef.current.getImageData();
      if (currentImageData) {
        console.log("툴바 숨기기 전 현재 이미지 상태 저장:", currentImageData);
        setImageTransformData({
          x: currentImageData.x,
          y: currentImageData.y,
          scale: currentImageData.scale,
          width: currentImageData.width,
          height: currentImageData.height
        });
      }
    }

    setToolbarState({
      show: false,
      isExpanded: false,
    });
  };

  // 툴바 아이콘 클릭 핸들러
  const handleToolbarIconClick = (iconIndex: number, data?: any) => {
    console.log(`툴바 아이콘 ${iconIndex} 클릭됨, Grid ${index}`, data);

    // 사진 배경 제거 처리 (인덱스 3)
    if (iconIndex === 3) {
      console.log(`그리드 ${index}의 이미지 제거 (사진 배경 제거)`);
      
      // 현재 이미지 URL 초기화
      setCurrentImageUrl("");
      
      // 이미지 변환 데이터 초기화
      setImageTransformData(null);
      
      // 부모 컴포넌트에 이미지 제거 알림
      if (onImageUpload) {
        onImageUpload(gridId, "");
      }
      
      // 툴바 숨기기
      handleHideToolbar();
      
      console.log("🗑️ GridC 이미지 제거 완료:", {
        gridId,
        이전이미지: currentImageUrl,
        새이미지: ""
      });
    }
    
    // 사진 틀 삭제 처리 (인덱스 4)
    if (iconIndex === 4) {
      console.log(`그리드 ${index}의 사진 틀 삭제`);
      if (onDelete) {
        onDelete();
      }
      
      // 툴바 숨기기
      handleHideToolbar();
    }

    // 여기에 다른 아이콘별 로직 구현
  };

  // 전역 클릭 이벤트로 툴바 숨기기
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // 현재 GridCElement 외부 클릭 시 툴바 숨기기
      if (
        !target.closest(`[data-grid-id="${gridId}"]`) &&
        !target.closest(".grid-edit-toolbar")
      ) {
        handleHideToolbar();
      }
    };

    if (toolbarState.show) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [toolbarState.show, gridId]);

  // 드래그 상태에 따른 스타일
  const containerClass = isDragging
    ? "" // DragOverlay에서는 별도 스타일 적용하지 않음
    : "";

  // 툴바 표시 상태 또는 선택 상태에 따른 border 스타일 결정
  const borderClass =
    toolbarState.show || isSelected
      ? "border-solid border-primary border-2 rounded-xl border-2"
      : "border-none";

  // 키워드 버튼 클릭 핸들러
  const handleKeywordClick = (keyword: string) => {
    // 이미 선택된 키워드인지 확인
    if (selectedKeyword === keyword) {
      // 이미 선택된 경우 제거
      setSelectedKeyword("");
      setActivityKeyword("");
    } else {
      // 새로 선택하는 경우 기존 선택을 덮어쓰기
      setSelectedKeyword(keyword);
      setActivityKeyword(keyword);
    }
  };

  // input 변경시 선택된 키워드 상태도 업데이트
  const handleKeywordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setActivityKeyword(value);
    
    // 현재 input의 키워드를 selectedKeyword에 설정
    setSelectedKeyword(value.trim());
  };

  return (
    <div className="relative w-full h-full">
      <div
        className={`relative w-full h-full ${!isClippingEnabled ? "bg-white rounded-xl" : "bg-transparent"} overflow-hidden ${containerClass} ${isDragging ? "opacity-100" : ""} transition-all duration-200 ${!isDragging && isClippingEnabled ? "cursor-grab active:cursor-grabbing" : ""} ${borderClass}`}
        data-grid-id={gridId}
        {...(isDragging || !isClippingEnabled ? {} : dragAttributes)}
        {...(isDragging || !isClippingEnabled ? {} : dragListeners)}
        onClick={handleContainerClick}
      >
        {/* 체크박스 - 좌측 상단 */}
        <div
          className="absolute top-2 left-2 z-30"
          onClick={(e) => {
            e.stopPropagation();
            handleCheckboxChange(!isSelected);
          }}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleCheckboxChange}
            className="w-5 h-5 bg-white border-2 border-gray-300 rounded-full data-[state=checked]:bg-white data-[state=checked]:border-primary cursor-pointer"
          />
        </div>



        {/* 삭제 버튼 - 우측 상단 */}
       

        {/* SVG 클리핑 마스크 정의 */}
        <svg width="0" height="0" className="absolute">
          <defs>
            <clipPath
              id={`clip-${clipPathData.id}-${gridId}`}
              clipPathUnits="objectBoundingBox"
            >
              <path d={clipPathData.pathData} />
            </clipPath>
          </defs>
        </svg>

        {/* 항상 표시되는 Canvas 영역 */}
        <div 
          ref={canvasContainerRef}
          className="relative w-full h-full canvas-container"
          onMouseEnter={() => !hasImage && setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* KonvaImageCanvas - 항상 표시 */}
          <KonvaImageCanvas
            ref={konvaCanvasRef}
            imageUrl={hasImage ? currentImageUrl : NO_IMAGE_URL}
            containerWidth={containerSize.width}
            containerHeight={containerSize.height}
            isClippingEnabled={isClippingEnabled}
            onImageMove={handleImageMove}
            onImageTransformUpdate={handleImageTransformUpdate}
            clipPath={isClippingEnabled ? clipPathData.pathData : undefined}
            gridId={gridId}
            imageTransformData={imageTransformData}
          />

          {/* 이미지가 없을 때 hover시 업로드 UI 표시 */}
          {!hasImage && isHovered && (
            <div className="absolute inset-0 z-20">
              <AddPictureClipping 
                onImageAdded={handleImageAdded}
                clipPathData={clipPathData}
                gridId={gridId}
                isClippingEnabled={isClippingEnabled}
                imageTransformData={imageTransformData}
              >
                <div 
                  className="absolute inset-0 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* 업로드 오버레이 */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-md flex flex-col items-center justify-center transition-opacity duration-200 z-10">
                    {/* Upload icon */}
                    <Image
                      src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/imageupload3.svg"
                      width={24}
                      height={24}
                      className="object-contain mb-2"
                      alt="Upload icon"
                    />
                    {/* Upload text */}
                    <div className="text-white text-[10px] font-medium text-center mb-2 px-2">
                      이미지를 드래그하거나<br />클릭하여 업로드
                    </div>
                    {/* File select button */}
                    <button 
                      className="bg-primary text-white text-[10px] px-3 py-1.5 rounded hover:bg-primary/80 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      파일선택
                    </button>
                  </div>
                </div>
              </AddPictureClipping>
            </div>
          )}
        </div>

        {/* 클리핑 형태 이름 라벨 */}
      </div>

      {/* GridEditToolbar - element 하단 좌측에 위치 (클리핑 활성화 시에만) */}
      {toolbarState.show && isClippingEnabled && (
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

      {/* Keyword Input Component at the bottom - 클리핑 활성화 시에만 표시 */}
      {isClippingEnabled && (
        <div className="absolute bottom-0 left-0 right-0 z-50 p-2 photo-description-input">
          <div className="flex overflow-hidden flex-col px-3 py-2 text-xs tracking-tight leading-none text-gray-700 bg-white rounded-lg w-full shadow-[1px_1px_10px_rgba(0,0,0,0.1)]">
            {/* 검색 입력 */}
            <Collapsible
              open={isKeywordExpanded}
              onOpenChange={setIsKeywordExpanded}
            >
            <div className="flex gap-2.5 text-zinc-400 w-full">
              <div className={`flex-1 flex overflow-hidden flex-col justify-center items-start px-2 py-1 bg-white rounded-md border border-solid transition-colors ${isInputFocused ? 'border-primary' : 'border-zinc-100'}`}>
                <input
                  type="text"
                  value={activityKeyword}
                  onChange={handleKeywordInputChange}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  placeholder="활동주제나 관련 키워드를 입력하세요."
                  className="w-full outline-none border-none bg-transparent placeholder-zinc-400 text-zinc-800"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <CollapsibleTrigger asChild>
                <button
                  className="flex-shrink-0 p-2 hover:bg-gray-100 rounded transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      isKeywordExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </CollapsibleTrigger>
            </div>

            {/* 모든 키워드들 (펼쳤을 때만 표시) */}
            <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
              {/* 추천 키워드 섹션 */}
              <div className="flex items-center mt-3.5">
                <div className="font-semibold">추천 키워드</div>
              </div>
              {/* 첫 번째 키워드 행 */}
              <div className="mt-2 w-full bg-white">
                <div className="flex gap-1.5 font-medium overflow-x-auto scrollbar-hide">
                  <div className="flex gap-1.5 min-w-max">
                    <div 
                      className={`flex overflow-hidden flex-col justify-center px-2.5 py-1.5 whitespace-nowrap rounded-[50px] cursor-pointer transition-colors ${
                        selectedKeyword === '촉감놀이' 
                          ? 'bg-primary text-white hover:bg-primary/80' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleKeywordClick('촉감놀이');
                      }}
                    >
                      <div>촉감놀이</div>
                    </div>
                    <div 
                      className={`flex overflow-hidden flex-col justify-center px-2.5 py-1.5 whitespace-nowrap rounded-[50px] cursor-pointer transition-colors ${
                        selectedKeyword === '친구와 촉감놀이' 
                          ? 'bg-primary text-white hover:bg-primary/80' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleKeywordClick('친구와 촉감놀이');
                      }}
                    >
                      <div>친구와 촉감놀이</div>
                    </div>
                    <div 
                      className={`flex overflow-hidden flex-col justify-center px-2.5 py-1.5 whitespace-nowrap rounded-[50px] cursor-pointer transition-colors ${
                        selectedKeyword === '선생님과 촉감놀이' 
                          ? 'bg-primary text-white hover:bg-primary/80' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleKeywordClick('선생님과 촉감놀이');
                      }}
                    >
                      <div>선생님과 촉감놀이</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent mt-1.5">
                <div className="flex gap-1.5 mb-1.5 w-full overflow-x-auto scrollbar-hide">
                  <div className="flex gap-1.5 min-w-max">
                    <div 
                      className={`flex overflow-hidden gap-2.5 justify-center items-center px-2.5 py-1.5 whitespace-nowrap rounded-[50px] cursor-pointer transition-colors ${
                        selectedKeyword === '촉감' 
                          ? 'bg-primary text-white hover:bg-primary/80' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleKeywordClick('촉감');
                      }}
                    >
                      <div className="self-stretch my-auto">촉감</div>
                    </div>
                    <div 
                      className={`flex overflow-hidden gap-2.5 justify-center items-center px-2.5 py-1.5 whitespace-nowrap rounded-[50px] cursor-pointer transition-colors ${
                        selectedKeyword === '눅눅한' 
                          ? 'bg-primary text-white hover:bg-primary/80' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleKeywordClick('눅눅한');
                      }}
                    >
                      <div className="self-stretch my-auto">눅눅한</div>
                    </div>
                    <div 
                      className={`flex overflow-hidden gap-2.5 justify-center items-center px-2.5 py-1.5 rounded-[50px] cursor-pointer transition-colors ${
                        selectedKeyword === '촉촉촉촉 촉촉촉촉' 
                          ? 'bg-primary text-white hover:bg-primary/80' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleKeywordClick('촉촉촉촉 촉촉촉촉');
                      }}
                    >
                      <div className="self-stretch my-auto">
                        촉촉촉촉 촉촉촉촉
                      </div>
                    </div>
                    <div 
                      className={`flex overflow-hidden gap-2.5 justify-center items-center px-2.5 py-1.5 whitespace-nowrap rounded-[50px] cursor-pointer transition-colors ${
                        selectedKeyword === '사후르' 
                          ? 'bg-primary text-white hover:bg-primary/80' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleKeywordClick('사후르');
                      }}
                    >
                      <div className="self-stretch my-auto">사후르</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-1.5 mb-1.5 w-full whitespace-nowrap overflow-x-auto scrollbar-hide">
                  <div className="flex gap-1.5 min-w-max">
                    <div 
                      className={`flex overflow-hidden gap-2.5 justify-center items-center px-2.5 py-1.5 rounded-[50px] cursor-pointer transition-colors ${
                        selectedKeyword === '발레리나카푸치나' 
                          ? 'bg-primary text-white hover:bg-primary/80' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleKeywordClick('발레리나카푸치나');
                      }}
                    >
                      <div className="self-stretch my-auto">
                        발레리나카푸치나
                      </div>
                    </div>
                    <div 
                      className={`flex overflow-hidden gap-2.5 justify-center items-center px-2.5 py-1.5 rounded-[50px] cursor-pointer transition-colors ${
                        selectedKeyword === '트랄라레오트랄랄라' 
                          ? 'bg-primary text-white hover:bg-primary/80' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleKeywordClick('트랄라레오트랄랄라');
                      }}
                    >
                      <div className="self-stretch my-auto">
                        트랄라레오트랄랄라
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-1.5 mb-1.5 w-full whitespace-nowrap overflow-x-auto scrollbar-hide">
                  <div className="flex gap-1.5 min-w-max">
                    <div 
                      className={`flex overflow-hidden gap-2.5 justify-center items-center px-2.5 py-1.5 rounded-[50px] cursor-pointer transition-colors ${
                        selectedKeyword === '봄바르딜로크로코딜로' 
                          ? 'bg-primary text-white hover:bg-primary/80' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleKeywordClick('봄바르딜로크로코딜로');
                      }}
                    >
                      <div className="self-stretch my-auto">
                        봄바르딜로크로코딜로
                      </div>
                    </div>
                    <div 
                      className={`flex overflow-hidden gap-2.5 justify-center items-center px-2.5 py-1.5 rounded-[50px] cursor-pointer transition-colors ${
                        selectedKeyword === '촉감' 
                          ? 'bg-primary text-white hover:bg-primary/80' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleKeywordClick('촉감');
                      }}
                    >
                      <div className="self-stretch my-auto">촉감</div>
                    </div>
                    <div 
                      className={`flex overflow-hidden gap-2.5 justify-center items-center px-2.5 py-1.5 rounded-[50px] cursor-pointer transition-colors ${
                        selectedKeyword === '눅눅한' 
                          ? 'bg-primary text-white hover:bg-primary/80' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleKeywordClick('눅눅한');
                      }}
                    >
                      <div className="self-stretch my-auto">눅눅한</div>
                    </div>
                    <div 
                      className={`flex overflow-hidden gap-2.5 justify-center items-center px-2.5 py-1.5 rounded-[50px] cursor-pointer transition-colors ${
                        selectedKeyword === '사후르' 
                          ? 'bg-primary text-white hover:bg-primary/80' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleKeywordClick('사후르');
                      }}
                    >
                      <div className="self-stretch my-auto">사후르</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 하단 안내 텍스트 */}
              <div className="self-center mt-3 text-xs font-semibold tracking-tight text-slate-300 text-center">
                활동에 맞는 키워드를 입력하거나 메모를 드래그 또는
              </div>
              <div className="flex items-center gap-1.5 self-center mt-1 w-full text-xs font-semibold tracking-tight text-slate-300 text-center justify-center">
                <div className="flex items-center gap-1.5">
                  <img
                    src="https://api.builder.io/api/v1/image/assets/TEMP/a8776df634680d6cea6086a76446c2b3a2d48eb2?placeholderIfAbsent=true&apiKey=304aa4871c104446b0f8164e96d049f4"
                    className="object-contain shrink-0 aspect-square w-[15px] my-auto"
                    alt="Upload icon"
                  />
                  <div className="grow shrink w-full ">
                    를 눌러서 업로드 해 주세요.
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
      )}
    </div>
  );
}

export default GridCElement;
