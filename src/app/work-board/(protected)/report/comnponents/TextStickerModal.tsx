"use client";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useTextStickerStore } from "@/hooks/store/useTextStickerStore";
import { Button } from "@/components/common/Button";

interface TextStickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply?: (selectedFrame: number) => void; // 선택 사항으로 변경
}

const TextStickerModal: React.FC<TextStickerModalProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  const [activeTab, setActiveTab] = useState<"category1" | "category2">(
    "category1",
  );
  const [selectedFrame, setSelectedFrame] = useState<number>(0); // bubble.png가 첫 번째
  const [selectedTextType, setSelectedTextType] = useState<"title" | "subtitle" | "body">("title");

  const { addTextSticker } = useTextStickerStore();

  // 말풍선 이미지 URL들 - bubble.png를 첫 번째로
  const bubbleUrls = [
    {
      url: "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/bubble.png",
      isImage: true,
    },
    // 나머지 15개는 빈 슬롯
    ...Array.from({ length: 15 }, () => ({
      url: "",
      isImage: false,
    })),
  ];

  const handleApply = () => {
    if (activeTab === "category1") {
      // 기본 텍스트 스티커 추가
      const defaults =
        selectedTextType === 'title'
          ? { fontSize: 32, fontFamily: 'MaplestoryOTFBold' }
          : selectedTextType === 'subtitle'
          ? { fontSize: 28, fontFamily: 'Uiyeun' }
          : { fontSize: 24, fontFamily: 'Arial' };

      addTextSticker({
        type: 'basic',
        textType: selectedTextType,
        text: '',
        position: { x: 50, y: 50 },
        size: { width: 150, height: 50 },
        rotation: 0,
        fontSize: defaults.fontSize,
        fontColor: '#000000',
        fontFamily: defaults.fontFamily,
      });
    } else {
      // 말풍선 텍스트 스티커 추가
      const bubbleUrl = bubbleUrls[selectedFrame];
      if (bubbleUrl.isImage) {
        addTextSticker({
          type: 'bubble',
          bubbleIndex: selectedFrame,
          text: '',
          position: { x: 50, y: 50 },
          size: { width: 120, height: 120 },
          rotation: 0,
          backgroundUrl: bubbleUrl.url,
          fontSize: 16,
          fontColor: '#000000',
          fontFamily: 'Arial',
        });
      }
    }
    
    // 기존 onApply 콜백도 호출 (있을 경우)
    if (onApply) {
      onApply(activeTab === "category1" ? 
        { title: 0, subtitle: 1, body: 2 }[selectedTextType] : 
        selectedFrame
      );
    }
    
    // 약간의 지연 후 모달 닫기
    setTimeout(() => {
      onClose();
    }, 100);
  };

  const handleFrameSelect = (frameIndex: number) => {
    setSelectedFrame(frameIndex);
  };

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
          <h2 className="text-xl font-bold text-gray-700">텍스트 스티커</h2>
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
                  : "text-zinc-400",
              )}
              onClick={() => setActiveTab("category1")}
            >
              기본
              {activeTab === "category1" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-700" />
              )}
            </button>
            <button
              className={cn(
                "relative pb-2 text-base tracking-tight transition-colors",
                activeTab === "category2"
                  ? "text-gray-700 font-medium"
                  : "text-zinc-400",
              )}
              onClick={() => setActiveTab("category2")}
            >
              말풍선
              {activeTab === "category2" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 px-10 py-6 max-md:px-5 max-sm:px-4 overflow-y-auto min-h-0">
          {activeTab === "category1" ? (
            /* Text Type Selection */
            <div className="space-y-4">
              <RadioGroup
                value={selectedTextType}
                onValueChange={(value: "title" | "subtitle" | "body") => setSelectedTextType(value)}
                className="space-y-4"
              >
                {/* 제목텍스트추가 */}
                <div
                  className={cn(
                    "flex items-center space-x-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors",
                    selectedTextType === "title" && "border-2 border-primary border-solid bg-primary/10",
                  )}
                  onClick={() => setSelectedTextType("title")}
                >
                  <RadioGroupItem value="title" id="title" />
                  <Label
                    htmlFor="title"
                    className="text-base font-medium text-gray-700 cursor-pointer"
                    style={{ fontFamily: 'MaplestoryOTFBold', fontSize: 32 }}
                  >
                    제목 텍스트추가
                  </Label>
                </div>
                
                {/* 부제목 텍스트추가 */}
                <div
                  className={cn(
                    "flex items-center space-x-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors",
                    selectedTextType === "subtitle" && "border-2 border-primary border-solid bg-primary/10",
                  )}
                  onClick={() => setSelectedTextType("subtitle")}
                >
                  <RadioGroupItem value="subtitle" id="subtitle" />
                  <Label
                    htmlFor="subtitle"
                    className="text-base font-medium text-gray-700 cursor-pointer"
                    style={{ fontFamily: 'Uiyeun', fontSize: 28 }}
                  >
                    부제목 텍스트추가
                  </Label>
                </div>
                
                {/* 본문 텍스트추가 */}
                <div
                  className={cn(
                    "flex items-center space-x-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors",
                    selectedTextType === "body" && "border-2 border-primary border-solid bg-primary/10",
                  )}
                  onClick={() => setSelectedTextType("body")}
                >
                  <RadioGroupItem value="body" id="body" />
                  <Label
                    htmlFor="body"
                    className="text-base font-medium text-gray-700 cursor-pointer"
                    style={{ fontFamily: 'Arial', fontSize: 24 }}
                  >
                    본문 텍스트추가
                  </Label>
                </div>
              </RadioGroup>
            </div>
          ) : (
            /* Bubble Grid for 말풍선 tab */
            <div className="grid grid-cols-4 gap-3 min-h-[400px]">
              {Array.from({ length: 16 }, (_, index) => {
                const bubble = bubbleUrls[index];
                
                return (
                  <div
                    key={index}
                    className={cn(
                      "bg-gray-50 rounded-lg aspect-square cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-center overflow-hidden",
                      selectedFrame === index &&
                        "border-2 border-amber-400 border-solid",
                      !bubble?.isImage && "opacity-50"
                    )}
                    onClick={() => bubble?.isImage && handleFrameSelect(index)}
                  >
                    {bubble?.isImage ? (
                      <img
                        src={bubble.url}
                        alt={`말풍선 ${index + 1}`}
                        className="w-full h-full object-fill rounded-lg p-2"
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
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-2 px-10 pb-10 max-md:px-5 max-sm:px-4 flex-shrink-0 ">
          <Button color="gray" className="min-w-[100px]" onClick={onClose}>
            닫기
          </Button>
          <Button color="primary" className="min-w-[100px]" onClick={handleApply}>
            적용
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TextStickerModal;
