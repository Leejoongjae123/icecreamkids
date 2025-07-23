"use client";
import * as React from "react";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import AddPicture from "./AddPicture";
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
  const [imageLoadError, setImageLoadError] = React.useState(false);
  const [activityKeyword, setActivityKeyword] = React.useState("");

  // 툴바 상태 관리
  const [toolbarState, setToolbarState] = React.useState({
    show: false,
    isExpanded: false,
  });

  // 이미지 로드 에러 핸들러
  const handleImageError = () => {
    setImageLoadError(true);
  };

  const handleImageLoad = () => {
    setImageLoadError(false);
  };

  // 이미지 클릭 핸들러 (이벤트 전파 방지)
  const handleImageClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  // 이미지가 아닌 영역 클릭 핸들러 - 툴바 표시
  const handleNonImageClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // 이벤트 전파 방지

    // 툴바 표시
    setToolbarState({
      show: true,
      isExpanded: true,
    });
  };

  // 체크박스 변경 핸들러
  const handleCheckboxChange = (checked: boolean) => {
    if (onSelectChange) {
      onSelectChange(checked);
    }
  };

  // 삭제 핸들러
  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  // 파일 업로드 핸들러 (기존 파일 업로드도 유지)
  const handleFileUpload = (file: File) => {
    const imageUrl = URL.createObjectURL(file);
    onImageUpload(gridId, imageUrl);
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

    // 여기에 각 아이콘별 로직 구현
  };

  // 전역 클릭 이벤트로 툴바 숨기기
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // 현재 GridCElement 외부 클릭 시 툴바 숨기기
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

  // 드래그 상태에 따른 스타일
  const containerClass = isDragging
    ? "" // DragOverlay에서는 별도 스타일 적용하지 않음
    : "";

  // 툴바 표시 상태 또는 선택 상태에 따른 border 스타일 결정
  const borderClass = (toolbarState.show || isSelected)
    ? 'border-solid border-primary border-2 rounded-xl border-2'
    : 'border-none';

  return (
    <div className="relative w-full h-full">
      <div
        className={`relative w-full h-full min-h-[250px] ${!isClippingEnabled ? 'bg-white rounded-xl' : 'bg-transparent'} overflow-hidden ${containerClass} ${isDragging ? 'opacity-100' : ''} transition-all duration-200 ${!isDragging ? 'cursor-grab active:cursor-grabbing' : ''} ${borderClass}`}
        data-grid-id={gridId}
        {...(!isDragging ? dragAttributes : {})}
        {...(!isDragging ? dragListeners : {})}
        onClick={handleNonImageClick}
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
            className="w-5 h-5 bg-white border-2 border-gray-300 rounded-full data-[state=checked]:bg-primary data-[state=checked]:border-primary cursor-pointer"
          />
        </div>

        {/* 삭제 버튼 - 우측 상단 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onDelete) {
              handleDelete();
            }
          }}
          className="absolute top-2 right-2 w-7 h-7 bg-white border border-[#F0F0F0] rounded-md flex items-center justify-center z-30 shadow-sm hover:shadow-md transition-shadow"
        >
          <Image
            src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/trash.svg"
            width={14}
            height={14}
            className="object-contain hover:opacity-80"
            alt="Delete"
          />
        </button>

        {/* SVG 클리핑 마스크 정의 */}
        <svg width="0" height="0" className="absolute">
          <defs>
            <clipPath id={`clip-${clipPathData.id}-${gridId}`} clipPathUnits="objectBoundingBox">
              <path d={clipPathData.pathData} />
            </clipPath>
          </defs>
        </svg>

        {/* 클리핑된 이미지 컨테이너 - AddPicture로 감싸기 */}
        <AddPicture>
          <div
            className="w-full h-full relative overflow-hidden transition-all duration-200 hover:scale-105"
            style={{
              clipPath: isClippingEnabled ? `url(#clip-${clipPathData.id}-${gridId})` : 'none'
            }}
            onClick={handleImageClick}
          >
            {/* 기존 파일 입력은 숨겨진 상태로 유지 (백업용) */}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(file);
                }
              }}
              className="hidden"
              id={`file-input-${gridId}`}
            />

            <div className="relative w-full h-full group">
              <Image
                src={imageLoadError ? "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg" : imageUrl}
                alt={`클리핑된 이미지 - ${clipPathData.name}`}
                fill
                className="object-cover w-full h-full"
                onError={handleImageError}
                onLoad={handleImageLoad}
              />

              {/* 호버 시 오버레이 */}
              <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                {/* Upload icon */}
                <Image
                  src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/imageupload3.svg"
                  width={24}
                  height={24}
                  className="object-contain mb-2"
                  alt="Upload icon"
                />
                {/* Upload text */}
                <div className="text-white text-xs font-medium text-center mb-2 px-2">
                  이미지를 드래그하거나<br />클릭하여 업로드
                </div>
                {/* File select button - AddPicture로 감싸기 */}
                <AddPicture>
                  <button
                    className="bg-primary text-white text-xs px-3 py-1.5 rounded hover:bg-primary/80 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    파일선택
                  </button>
                </AddPicture>
              </div>
            </div>
          </div>
        </AddPicture>

        {/* 클리핑 형태 이름 라벨 */}

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

      {/* Input Design Component at the bottom - 이미지 위에 표시 */}
      <div className="absolute bottom-0 left-0 right-0 z-50 p-2">
        <div className="flex overflow-hidden flex-col px-5 py-2.5 text-xs tracking-tight leading-none bg-white rounded-lg border border-dashed border-zinc-400 max-w-[225px] text-slate-300 shadow-lg">
          <div className="flex overflow-hidden flex-col justify-center items-start p-2 w-full bg-white rounded-lg border border-solid border-zinc-100 text-zinc-400">
            <input
              type="text"
              value={activityKeyword}
              onChange={(e) => setActivityKeyword(e.target.value)}
              placeholder="활동주제나 관련 키워드를 입력하세요"
              className="text-[9px] w-full outline-none border-none bg-transparent placeholder-zinc-400 text-zinc-800"
              style={{ letterSpacing: "-0.03em" }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="mt-2 text-[9px] " style={{ letterSpacing: "-0.03em" }}>
            활동에 맞는 키워드를 입력하거나 메모를 드래그 또는
          </div>
          <div className="flex gap-1 self-center max-w-full w-[110px]">
            <img
              src="https://api.builder.io/api/v1/image/assets/304aa4871c104446b0f8164e96d049f4/08267f9c2a1decb54bf0e85f2a616d2c8d62c634?placeholderIfAbsent=true"
              className="object-contain shrink-0 w-3 aspect-[0.92]"
            />
            <div className="my-auto text-[9px]" style={{ letterSpacing: "-0.03em" }}>
              를 눌러서 업로드 해 주세요.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GridCElement;
