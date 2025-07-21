"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import PhotoFrameModal from "./PhotoFrameModal";
import TextStickerModal from "./TextStickerModal";
import DecorationStickerModal from "./DecorationStickerModal";

interface GridEditToolbarProps {
  show: boolean;
  isExpanded: boolean;
  position?: {
    left: string;
    top: string;
  };
  onIconClick: (index: number) => void;
  targetGridId?: string; // 특정 그리드 식별을 위한 ID
}

const GridEditToolbar: React.FC<GridEditToolbarProps> = ({
  show,
  isExpanded,
  position = { left: "8px", top: "calc(100% + 8px)" },
  onIconClick,
  targetGridId,
}) => {
  const [isPhotoFrameModalOpen, setIsPhotoFrameModalOpen] = useState(false);
  const [isTextStickerModalOpen, setIsTextStickerModalOpen] = useState(false);
  const [isDecorationStickerModalOpen, setIsDecorationStickerModalOpen] = useState(false);
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
    "사진틀 변경",
    "텍스트 스티커",
    "꾸미기 스티커",
    "사진 배경 제거",
    "사진 틀 삭제",
    "표 추가",
  ];

  // 아이콘 클릭 핸들러
  const handleIconClick = (index: number) => {
    console.log("아이콘 클릭됨:", index);
    if (index === 0) {
      // 사진틀 변경 클릭 시 모달 열기
      console.log("사진틀 변경 클릭, 모달 열기");
      setIsPhotoFrameModalOpen(true);
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
    // 여기서 선택된 프레임을 적용하는 로직을 구현할 수 있습니다
    onIconClick(0); // 기존 로직도 호출
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

  if (!show) return null;

  return (
    <>
      <div
        className="absolute z-50"
        style={{
          left: position.left,
          top: position.top,
        }}
      >
        <div
          className="relative flex items-center justify-center"
          style={{ width: "290px", height: "38px" }}
        >
          {[...Array(6)].map((_, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div
                  className="w-[38px] h-[38px] bg-black hover:bg-primary rounded-full absolute flex items-center justify-center cursor-pointer hover:-translate-y-1"
                  style={{
                    left: `${index * (38 + 12)}px`,
                    opacity: internalExpanded ? 1 : 0,
                    transform: internalExpanded ? "scale(1) translateY(0)" : "scale(0.3) translateY(10px)",
                    transition: "opacity 0.4s ease-out, transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), background-color 0.2s ease-in-out",
                    transitionDelay: internalExpanded ? `${index * 100}ms` : "0ms",
                    zIndex: 6 - index,
                  }}
                  onClick={() => handleIconClick(index)}
                >
                  <Image
                    src={`https://icecreamkids.s3.ap-northeast-2.amazonaws.com/fix${index + 1}.svg`}
                    alt={`fix${index + 1}`}
                    width={18}
                    height={18}
                    className="object-contain"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="bg-primary text-white text-sm px-2 py-1"
              >
                {tooltipTexts[index]}
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
    </>
  );
};

export default GridEditToolbar; 