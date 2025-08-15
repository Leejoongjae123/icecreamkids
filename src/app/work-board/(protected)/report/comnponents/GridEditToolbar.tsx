"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import PhotoFrameModal from "./PhotoFrameModal";
import TextStickerModal from "./TextStickerModal";
import DecorationStickerModal from "./DecorationStickerModal";
import ImageCountModal from "./ImageCountModal";
import { MdPhotoLibrary } from "react-icons/md";
import { clipPathItems } from "../dummy/svgData";

interface GridEditToolbarProps {
  show: boolean;
  isExpanded: boolean;
  position?: {
    left: string;
    top: string;
  };
  onIconClick: (index: number, data?: any) => void;
  targetGridId?: string; // 특정 그리드 식별을 위한 ID
  limitedMode?: boolean; // 제한된 모드 - 특정 아이콘만 표시
  allowedIcons?: number[]; // 표시할 아이콘 인덱스 배열
  targetIsExpanded?: boolean; // 대상 그리드의 확장 상태 (B타입에서 사용)
}

const GridEditToolbar: React.FC<GridEditToolbarProps> = ({
  show,
  isExpanded,
  position = { left: "8px", top: "calc(100% + 8px)" },
  onIconClick,
  targetGridId,
  limitedMode = false,
  allowedIcons = [0, 1, 2], // 기본값: 텍스트 스티커, 꾸미기 스티커, 표 추가
  targetIsExpanded = false,
}) => {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const [isPhotoFrameModalOpen, setIsPhotoFrameModalOpen] = useState(false);
  const [isTextStickerModalOpen, setIsTextStickerModalOpen] = useState(false);
  const [isDecorationStickerModalOpen, setIsDecorationStickerModalOpen] = useState(false);
  const [isImageCountModalOpen, setIsImageCountModalOpen] = useState(false);
  const [internalExpanded, setInternalExpanded] = useState(false);

  // 디버깅용 useEffect
  useEffect(() => {
    console.log("GridEditToolbar 렌더링됨, show:", show);
  }, [show]);

  useEffect(() => {
    console.log("PhotoFrameModal 상태 변경:", isPhotoFrameModalOpen);
  }, [isPhotoFrameModalOpen]);

  // show가 true가 되면 약간의 지연 후 펼치기
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        setInternalExpanded(true);
      }, 100); // 100ms 후 펼치기
      return () => clearTimeout(timer);
    } else {
      setInternalExpanded(false);
    }
  }, [show]);

  // 각 아이콘에 대한 툴팁 텍스트
  const tooltipTexts = [
    type === "A" || type === "B" ? "이미지 개수" : "사진틀 변경",
    "텍스트 스티커",
    "꾸미기 스티커",
    "사진 배경 제거",
    "사진 틀 삭제",
  ];

  // 제한된 모드용 툴팁 텍스트 (ReportBottomSection에서 사용)
  const limitedTooltipTexts = [
    "텍스트 스티커",
    "꾸미기 스티커", 
    "틀 추가",
  ];

  // 제한된 모드용 아이콘 URL
  const limitedIconUrls = [
    "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/fix2.svg", // 텍스트 스티커
    "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/fix3.svg", // 꾸미기 스티커
    "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/fix6.svg", // 표 추가
  ];

  // 현재 모드에 따른 설정
  const currentTooltipTexts = limitedMode ? limitedTooltipTexts : tooltipTexts;
  const iconCount = limitedMode ? allowedIcons.length : 5;
  const containerWidth = limitedMode ? `${allowedIcons.length * (38 + 12) - 12}px` : "290px";

  // 아이콘 클릭 핸들러
  const handleIconClick = (index: number) => {
    console.log("아이콘 클릭됨:", index);
    
    if (limitedMode) {
      // 제한된 모드에서는 부모 컴포넌트의 핸들러로 직접 전달
      onIconClick(index);
      return;
    }

    // 일반 모드의 기존 로직
    if (index === 0) {
      if (type === "A" || type === "B") {
        // 이미지 개수 선택 모달 열기
        console.log("이미지 개수 선택 클릭, 모달 열기");
        setIsImageCountModalOpen(true);
      } else {
        // 사진틀 변경 클릭 시 모달 열기
        console.log("사진틀 변경 클릭, 모달 열기");
        setIsPhotoFrameModalOpen(true);
      }
    } else if (index === 1) {
      // 텍스트 스티커 클릭 시 모달 열기
      console.log("텍스트 스티커 클릭, 모달 열기");
      setIsTextStickerModalOpen(true);
    } else if (index === 2) {
      // 꾸미기 스티커 클릭 시 모달 열기
      console.log("꾸미기 스티커 클릭, 모달 열기");
      setIsDecorationStickerModalOpen(true);
    } else {
      onIconClick(index);
    }
  };

  // 모달 핸들러들
  const handleModalClose = () => {
    setIsPhotoFrameModalOpen(false);
  };

  const handlePhotoFrameApply = (selectedFrame: number) => {
    console.log("Selected photo frame:", selectedFrame);
    
    // -1은 클리핑 해제를 의미
    if (selectedFrame === -1 && targetGridId) {
      console.log("클리핑 해제 요청");
      onIconClick(0, { 
        action: 'changePhotoFrame', 
        gridId: targetGridId, 
        clipPathData: null // null로 클리핑 해제
      });
      return;
    }
    
    // 선택된 프레임 인덱스에 따라 clipPath 데이터 가져오기
    let clipPathData = null;
    
    // clipPathItems 배열의 인덱스와 selectedFrame을 매핑
    if (selectedFrame >= 0 && selectedFrame < clipPathItems.length) {
      clipPathData = clipPathItems[selectedFrame];
      console.log("적용할 클립패스 데이터:", clipPathData);
    }
    
    // 선택된 사진틀 데이터를 부모 컴포넌트로 전달
    if (clipPathData && targetGridId) {
      onIconClick(0, { 
        action: 'changePhotoFrame', 
        gridId: targetGridId, 
        clipPathData: clipPathData 
      });
    } else {
      console.log("클립패스 데이터가 없거나 타겟 그리드 ID가 없음:", { clipPathData, targetGridId });
      onIconClick(0); // 기존 로직도 호출
    }
  };

  const handleTextStickerModalClose = () => {
    setIsTextStickerModalOpen(false);
  };

  const handleTextStickerApply = (selectedSticker: number) => {
    console.log("Selected text sticker:", selectedSticker);
    // 여기서 선택된 텍스트 스티커를 적용하는 로직을 구현할 수 있습니다
    onIconClick(1); // 기존 로직도 호출
  };

  const handleDecorationStickerModalClose = () => {
    setIsDecorationStickerModalOpen(false);
  };

  const handleDecorationStickerApply = (selectedSticker: number) => {
    console.log("Selected decoration sticker:", selectedSticker);
    // 여기서 선택된 꾸미기 스티커를 적용하는 로직을 구현할 수 있습니다
    onIconClick(2); // 기존 로직도 호출
  };

  const handleImageCountModalClose = () => {
    setIsImageCountModalOpen(false);
  };

  const handleImageCountApply = (count: number) => {
    console.log("Selected image count:", count);
    console.log("Target grid ID:", targetGridId);
    // 여기서 선택된 이미지 개수를 적용하는 로직을 구현할 수 있습니다
    // 부모 컴포넌트로 그리드 ID와 이미지 개수를 전달
    if (targetGridId) {
      // 부모 컴포넌트의 콜백 함수를 통해 그리드 이미지 개수 변경
      onIconClick(0, { action: 'changeImageCount', gridId: targetGridId, count });
    } else {
      onIconClick(0); // 기존 로직도 호출
    }
  };

  if (!show) {
    return null;
  }

  return (
    <>
      <div
        className="absolute z-[100]"
        style={{
          left: position.left,
          top: position.top,
        }}
      >
        <div
          className="relative flex items-center justify-center"
          style={{ width: containerWidth, height: "38px" }}
        >
          {[...Array(iconCount)].map((_, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div
                  className="w-[38px] h-[38px] bg-primary hover:opacity-80 rounded-full absolute flex items-center justify-center cursor-pointer hover:-translate-y-1 z-[101]"
                  style={{
                    left: `${index * (38 + 12)}px`,
                    opacity: internalExpanded ? 1 : 0,
                    transform: internalExpanded ? "scale(1) translateY(0)" : "scale(0.3) translateY(10px)",
                    transition: "opacity 0.4s ease-out, transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), background-color 0.2s ease-in-out",
                    transitionDelay: internalExpanded ? `${index * 100}ms` : "0ms",
                    zIndex: 101,
                  }}
                  onClick={() => handleIconClick(index)}
                >
                  {limitedMode ? (
                    <Image
                      src={limitedIconUrls[index]}
                      alt={`limited-icon-${index}`}
                      width={18}
                      height={18}
                      className="object-contain"
                    />
                  ) : index === 0 && (type === "A" || type === "B") ? (
                    <MdPhotoLibrary size={18} className="text-white" />
                  ) : (
                    <Image
                      src={`https://icecreamkids.s3.ap-northeast-2.amazonaws.com/fix${index + 1}.svg`}
                      alt={`fix${index + 1}`}
                      width={18}
                      height={18}
                      className="object-contain"
                    />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="bg-primary text-white text-sm px-2 py-1 z-[102]"
              >
                {currentTooltipTexts[index]}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* Photo Frame Modal */}
      <PhotoFrameModal
        isOpen={isPhotoFrameModalOpen}
        onClose={handleModalClose}
        onApply={handlePhotoFrameApply}
      />

      {/* Text Sticker Modal */}
      <TextStickerModal
        isOpen={isTextStickerModalOpen}
        onClose={handleTextStickerModalClose}
        onApply={handleTextStickerApply}
      />

      {/* Decoration Sticker Modal */}
      <DecorationStickerModal
        isOpen={isDecorationStickerModalOpen}
        onClose={handleDecorationStickerModalClose}
        onApply={handleDecorationStickerApply}
      />

      {/* Image Count Modal */}
      <ImageCountModal
        isOpen={isImageCountModalOpen}
        onClose={handleImageCountModalClose}
        onApply={handleImageCountApply}
        targetGridId={targetGridId}
        type={type}
        isExpanded={targetIsExpanded}
      />
    </>
  );
};

export default GridEditToolbar; 