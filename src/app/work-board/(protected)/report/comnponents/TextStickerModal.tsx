"use client";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface TextStickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (selectedFrame: number) => void;
}

const TextStickerModal: React.FC<TextStickerModalProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  const [activeTab, setActiveTab] = useState<"category1" | "category2">(
    "category1",
  );
  const [selectedFrame, setSelectedFrame] = useState<number>(3); // Default to frame 3
  const [selectedTextType, setSelectedTextType] = useState<"title" | "subtitle" | "body">("title");

  const handleApply = () => {
    if (activeTab === "category1") {
      // 텍스트 타입을 숫자로 변환 (임시)
      const textTypeToNumber = {
        title: 0,
        subtitle: 1,
        body: 2,
      };
      onApply(textTypeToNumber[selectedTextType]);
    } else {
      onApply(selectedFrame);
    }
    onClose();
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
                >
                  <RadioGroupItem value="title" id="title" />
                  <Label htmlFor="title" className="text-base font-medium text-gray-700 cursor-pointer">
                    제목 텍스트추가
                  </Label>
                </div>
                
                {/* 부제목 텍스트추가 */}
                <div
                  className={cn(
                    "flex items-center space-x-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors",
                    selectedTextType === "subtitle" && "border-2 border-primary border-solid bg-primary/10",
                  )}
                >
                  <RadioGroupItem value="subtitle" id="subtitle" />
                  <Label htmlFor="subtitle" className="text-base font-medium text-gray-700 cursor-pointer">
                    부제목 텍스트추가
                  </Label>
                </div>
                
                {/* 본문 텍스트추가 */}
                <div
                  className={cn(
                    "flex items-center space-x-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors",
                    selectedTextType === "body" && "border-2 border-primary border-solid bg-primary/10",
                  )}
                >
                  <RadioGroupItem value="body" id="body" />
                  <Label htmlFor="body" className="text-base font-medium text-gray-700 cursor-pointer">
                    본문 텍스트추가
                  </Label>
                </div>
              </RadioGroup>
            </div>
          ) : (
            /* Frame Grid for 말풍선 tab */
            <div className="grid grid-cols-4 gap-3">
              {/* First Row */}
              {[0, 1, 2, 3].map((frameIndex) => (
                <div
                  key={frameIndex}
                  className={cn(
                    "bg-gray-50 rounded-lg aspect-square cursor-pointer hover:bg-gray-100 transition-colors",
                    selectedFrame === frameIndex && "border-2 border-amber-400 border-solid",
                  )}
                  onClick={() => handleFrameSelect(frameIndex)}
                />
              ))}
              
              {/* Second Row */}
              {[4, 5, 6, 7].map((frameIndex) => (
                <div
                  key={frameIndex}
                  className={cn(
                    "bg-gray-50 rounded-lg aspect-square cursor-pointer hover:bg-gray-100 transition-colors",
                    selectedFrame === frameIndex && "border-2 border-amber-400 border-solid",
                  )}
                  onClick={() => handleFrameSelect(frameIndex)}
                />
              ))}
              
              {/* Third Row */}
              {[8, 9, 10, 11].map((frameIndex) => (
                <div
                  key={frameIndex}
                  className={cn(
                    "bg-gray-50 rounded-lg aspect-square cursor-pointer hover:bg-gray-100 transition-colors",
                    selectedFrame === frameIndex && "border-2 border-amber-400 border-solid",
                  )}
                  onClick={() => handleFrameSelect(frameIndex)}
                />
              ))}
              
              {/* Fourth Row */}
              {[12, 13, 14, 15].map((frameIndex) => (
                <div
                  key={frameIndex}
                  className={cn(
                    "bg-gray-50 rounded-lg aspect-square cursor-pointer hover:bg-gray-100 transition-colors",
                    selectedFrame === frameIndex && "border-2 border-amber-400 border-solid",
                  )}
                  onClick={() => handleFrameSelect(frameIndex)}
                />
              ))}
            </div>
          )}
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

export default TextStickerModal;
