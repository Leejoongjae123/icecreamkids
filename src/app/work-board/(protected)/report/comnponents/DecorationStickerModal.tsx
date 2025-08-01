"use client";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useStickerStore } from "@/hooks/store/useStickerStore";

interface DecorationStickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply?: (selectedSticker: number) => void; // 선택 사항으로 변경
}

const DecorationStickerModal: React.FC<DecorationStickerModalProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  const [activeTab, setActiveTab] = useState<"category1" | "category2">(
    "category2"
  );
  const [selectedSticker, setSelectedSticker] = useState<number>(3); // Default to sticker 3

  const { addSticker } = useStickerStore();

  const handleApply = () => {
    const sticker = stickerUrls[selectedSticker];
    if (sticker) {
      // 스토어에 스티커 추가
      addSticker(selectedSticker, sticker.url);
      
      // 기존 onApply 콜백도 호출 (있을 경우)
      if (onApply) {
        onApply(selectedSticker);
      }
    }
    
    // 약간의 지연 후 모달 닫기 (스티커가 추가되는 것을 확인할 수 있도록)
    setTimeout(() => {
      onClose();
    }, 100);
  };

  const handleStickerSelect = (stickerIndex: number) => {
    setSelectedSticker(stickerIndex);
  };

  const stickerUrls = [
    {
      url: "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/sticker1_1.png",
      isImage: true,
    },
    {
      url: "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/sticker1_2.png",
      isImage: true,
    },
    {
      url: "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/sticker1_3.png",
      isImage: true,
    },
    {
      url: "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/sticker1_4.png",
      isImage: true,
    },
    {
      url: "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/sticker1_5.png",
      isImage: true,
    },
    {
      url: "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/sticker1_6.png",
      isImage: true,
    },
    {
      url:"https://icecreamkids.s3.ap-northeast-2.amazonaws.com/sticker2_1.png",
      isImage:true
    },
    {
      url:"https://icecreamkids.s3.ap-northeast-2.amazonaws.com/sticker2_2.png",
      isImage:true
    },
    {
      url:"https://icecreamkids.s3.ap-northeast-2.amazonaws.com/sticker2_3.png",
      isImage:true
    },
    {
      url:"https://icecreamkids.s3.ap-northeast-2.amazonaws.com/sticker2_4.png",
      isImage:true
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded-3xl max-h-[90vh] w-[541px] p-0 border-0 z-50",
          "max-md:max-w-[541px] max-md:w-[90vw]",
          "max-sm:rounded-2xl max-sm:w-[95vw]",
          "flex flex-col overflow-hidden"
        )}
        onClick={(e) => e.stopPropagation()}
        onInteractOutside={(e) => {
          // 모달 외부 클릭시만 닫기
          onClose();
        }}
        onEscapeKeyDown={(e) => {
          // ESC 키 동작은 허용
          onClose();
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-10 pb-6 max-md:px-5 max-sm:px-4 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-700">꾸미기 스티커</h2>
          <DialogClose
            className={cn(
              "flex shrink-0 justify-center items-center p-0.5 w-6 h-6 bg-white border border-solid border-zinc-100 rounded-[50px] hover:bg-gray-50"
            )}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.83398 5.8335L14.1673 14.1668M5.83398 14.1668L14.1673 5.8335"
                stroke="#333D4B"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </DialogClose>
        </div>

        {/* Tabs */}
        <div className="px-10 max-md:px-5 max-sm:px-4 flex-shrink-0">
          <div className="flex space-x-8 border-b border-gray-200">
            <button
              className={cn(
                "relative pb-2 text-base tracking-tight transition-colors",
                activeTab === "category1"
                  ? "text-gray-700 font-medium"
                  : "text-zinc-400"
              )}
              onClick={() => setActiveTab("category1")}
            >
              카테고리1
              {activeTab === "category1" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-700" />
              )}
            </button>
            <button
              className={cn(
                "relative pb-2 text-base tracking-tight transition-colors",
                activeTab === "category2"
                  ? "text-gray-700 font-medium"
                  : "text-zinc-400"
              )}
              onClick={() => setActiveTab("category2")}
            >
              카테고리2
              {activeTab === "category2" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Sticker Grid */}
        <div className="flex-1 px-10 py-6 max-md:px-5 max-sm:px-4 overflow-y-auto min-h-0">
          <div className="grid grid-cols-4 gap-3 min-h-[400px]">
            {Array.from({ length: 16 }, (_, index) => {
              const sticker = stickerUrls[index];
              
              return (
                <div
                  key={index}
                  className={cn(
                    "bg-gray-50 rounded-lg aspect-square cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-center overflow-hidden",
                    selectedSticker === index &&
                      "border-2 border-amber-400 border-solid",
                    !sticker && "opacity-50"
                  )}
                  onClick={() => sticker && handleStickerSelect(index)}
                >
                  {sticker ? (
                    <img
                      src={sticker.url}
                      alt={`스티커 ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        // 이미지 로드 실패시 처리
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 rounded-lg" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-2 px-10 pb-10 max-md:px-5 max-sm:px-4 flex-shrink-0 ">
          <button
            className={cn(
              "flex justify-center items-center px-6 py-3 bg-gray-50 rounded-md border border-solid border-zinc-100 hover:bg-gray-100 transition-colors min-w-[100px]"
            )}
            onClick={onClose}
          >
            <div className="text-base font-medium text-gray-700">닫기</div>
          </button>
          <button
            className={cn(
              "flex justify-center items-center px-6 py-3 bg-amber-400 rounded-md hover:bg-amber-500 transition-colors min-w-[100px]"
            )}
            onClick={handleApply}
          >
            <div className="text-base font-medium text-white">적용</div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DecorationStickerModal;
