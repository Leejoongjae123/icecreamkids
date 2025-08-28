"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import DecorationStickerModal from "./DecorationStickerModal";
import { useStickerStore } from "@/hooks/store/useStickerStore";
import { StickerItem } from "./types";

interface StickerEditToolbarProps {
  show: boolean;
  isExpanded: boolean;
  position?: {
    left: string;
    top: string;
  };
  selectedStickerId: string;
  onStickerChange?: () => void;
  onStickerDelete?: () => void;
}

const StickerEditToolbar: React.FC<StickerEditToolbarProps> = ({
  show,
  isExpanded,
  position = { left: "8px", top: "calc(100% + 8px)" },
  selectedStickerId,
  onStickerChange,
  onStickerDelete,
}) => {
  const [isDecorationStickerModalOpen, setIsDecorationStickerModalOpen] = useState(false);
  const [internalExpanded, setInternalExpanded] = useState(false);
  
  const { removeSticker, updateStickerPosition, addSticker, stickers } = useStickerStore();

  // 디버깅용 useEffect
  useEffect(() => {
    console.log("StickerEditToolbar 렌더링됨, show:", show);
  }, [show]);

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

  // 아이콘 클릭 핸들러
  const handleIconClick = (index: number) => {
    console.log("스티커 편집 아이콘 클릭됨:", index);
    
    if (index === 0) {
      // 스티커 변경 클릭 시 모달 열기
      console.log("스티커 변경 클릭, 모달 열기");
      setIsDecorationStickerModalOpen(true);
    } else if (index === 1) {
      // 스티커 삭제 클릭
      console.log("스티커 삭제 클릭");
      handleStickerDelete();
    }
  };

  // 스티커 삭제 핸들러
  const handleStickerDelete = () => {
    if (selectedStickerId) {
      removeSticker(selectedStickerId);
      onStickerDelete?.();
    }
  };

  // 스티커 변경 모달 핸들러들
  const handleDecorationStickerModalClose = () => {
    setIsDecorationStickerModalOpen(false);
  };

  const handleDecorationStickerApply = (selectedSticker: any) => {
    if (!selectedStickerId) {
      setIsDecorationStickerModalOpen(false);
      return;
    }

    const currentSticker = stickers.find((s: StickerItem) => s.id === selectedStickerId);
    if (!currentSticker) {
      setIsDecorationStickerModalOpen(false);
      return;
    }

    const { position, size, rotation, zIndex } = currentSticker;
    removeSticker(selectedStickerId);

    addSticker({
      stickerIndex: 0,
      url: selectedSticker.imageUrl || selectedSticker.thumbUrl,
      meta: selectedSticker,
      position,
      size,
      rotation,
      zIndex,
    });

    // 방금 추가한 스티커는 같은 위치/크기로 들어가므로 추가 이동 불필요
    onStickerChange?.();
    setIsDecorationStickerModalOpen(false);
  };

  const tooltipTexts = ["스티커 변경", "스티커 삭제"];
  const iconUrls = [
    "/report/fix3.svg", // 스티커 변경
    "/report/fix5.svg", // 스티커 삭제
  ];

  const iconCount = 2;
  const containerWidth = `${iconCount * (38 + 12) - 12}px`; // 2개 아이콘 너비

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
          style={{ width: containerWidth, height: "38px" }}
        >
          {[...Array(iconCount)].map((_, index) => (
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
                    src={iconUrls[index]}
                    alt={`sticker-edit-icon-${index}`}
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

      {/* Decoration Sticker Modal */}
      <DecorationStickerModal
        isOpen={isDecorationStickerModalOpen}
        onClose={handleDecorationStickerModalClose}
        onApply={handleDecorationStickerApply}
      />
    </>
  );
};

export default StickerEditToolbar; 