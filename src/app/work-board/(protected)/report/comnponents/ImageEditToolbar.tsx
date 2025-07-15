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

interface ImageEditToolbarProps {
  show: boolean;
  isExpanded: boolean;
  position?: {
    left: string;
    top: string;
  };
  onIconClick: (index: number) => void;
  targetGridId?: string; // 특정 그리드 식별을 위한 ID
}

const ImageEditToolbar: React.FC<ImageEditToolbarProps> = ({
  show,
  isExpanded,
  position = { left: "calc(50% - 150px)", top: "calc(50% + 100px + 8px)" },
  onIconClick,
  targetGridId,
}) => {
  const [isPhotoFrameModalOpen, setIsPhotoFrameModalOpen] = useState(false);
  const [isTextStickerModalOpen, setIsTextStickerModalOpen] = useState(false);

  // 디버깅용 useEffect
  useEffect(() => {
    console.log("ImageEditToolbar 렌더링됨, show:", show);
  }, [show]);

  useEffect(() => {
    console.log("PhotoFrameModal 상태 변경:", isPhotoFrameModalOpen);
  }, [isPhotoFrameModalOpen]);

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
          style={{ width: "230px", height: "38px" }}
        >
          {[...Array(6)].map((_, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div
                  className="w-[38px] h-[38px] bg-black hover:bg-primary rounded-full absolute flex items-center justify-center cursor-pointer transition-colors duration-200"
                  style={{
                    left: isExpanded ? `${index * 48}px` : "0px",
                    transition: "left 0.5s ease-in-out",
                    zIndex: 5 - index,
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
    </>
  );
};

export default ImageEditToolbar;
