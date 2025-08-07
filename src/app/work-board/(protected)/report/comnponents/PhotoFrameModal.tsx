"use client";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { clipPathItems } from "../dummy/svgData";

interface PhotoFrameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (selectedFrame: number) => void;
}

const PhotoFrameModal: React.FC<PhotoFrameModalProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  const [activeTab, setActiveTab] = useState<"category1" | "category2">(
    "category2",
  );
  const [selectedFrame, setSelectedFrame] = useState<number>(3); // Default to frame 3

  const handleApply = () => {
    onApply(selectedFrame);
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
          <h2 className="text-xl font-bold text-gray-700">사진틀 변경</h2>
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
                  : "text-zinc-400",
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

        {/* Frame Grid */}
        <div className="flex-1 px-10 py-6 max-md:px-5 max-sm:px-4 overflow-y-auto min-h-0">
          <div className="grid grid-cols-4 gap-3 min-h-[400px]">
            {/* All frames (16 total) */}
            {[...Array(16)].map((_, frameIndex) => {
              // 첫 번째(0)와 두 번째(1) 위치에 실제 사진틀 표시
              const clipPathData = frameIndex === 0 
                ? clipPathItems[0] // 원형
                : frameIndex === 1 
                ? clipPathItems[1] // 둥근 사각형
                : null;

              return (
                <div
                  key={frameIndex}
                  className={cn(
                    "bg-gray-50 rounded-lg aspect-square cursor-pointer hover:bg-gray-100 transition-colors relative overflow-hidden",
                    selectedFrame === frameIndex && "border-2 border-amber-400 border-solid",
                  )}
                  onClick={() => handleFrameSelect(frameIndex)}
                >
                  {clipPathData && (
                    <div className="absolute inset-0 p-2">
                      <div className="w-full h-full relative">
                        <svg 
                          width="100%" 
                          height="100%" 
                          viewBox="0 0 1 1" 
                          className="absolute inset-0"
                        >
                          <defs>
                            <clipPath id={`preview-clip-${clipPathData.id}`} clipPathUnits="objectBoundingBox">
                              <path d={clipPathData.pathData} />
                            </clipPath>
                          </defs>
                          {/* 배경 이미지 영역 */}
                          <rect
                            x="0"
                            y="0"
                            width="1"
                            height="1"
                            fill="#e5e7eb"
                            clipPath={`url(#preview-clip-${clipPathData.id})`}
                          />
                          {/* 테두리 표시 */}
                          <path
                            d={clipPathData.pathData}
                            fill="none"
                            stroke="#9ca3af"
                            strokeWidth="0.02"
                            vectorEffect="non-scaling-stroke"
                          />
                        </svg>
                        {/* 프레임 이름 표시 */}
                        <div className="absolute bottom-1 left-1 text-xs text-gray-600 bg-white/80 px-1 py-0.5 rounded text-[10px]">
                          {frameIndex === 0 ? "원형" : "사각형"}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* 빈 프레임에는 인덱스 번호만 표시 */}
                  {!clipPathData && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                      {frameIndex + 1}
                    </div>
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

export default PhotoFrameModal;
