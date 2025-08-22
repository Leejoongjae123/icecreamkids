"use client";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { ClipPathItem } from "./types";

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
  const [items, setItems] = useState<ClipPathItem[]>([]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const controller = new AbortController();
    const load = async () => {
      try {
        const res = await fetch('/api/photo-frames', { cache: 'no-store', signal: controller.signal });
        const json = await res.json();
        const list: ClipPathItem[] = Array.isArray(json?.result) ? json.result : [];
        setItems(list);
      } catch {}
    };
    load();
    return () => controller.abort();
  }, [isOpen]);

  const handleApply = () => {
    // 선택된 프레임이 유효한 clipPath 데이터를 가지고 있는지 확인
    if (selectedFrame < items.length) {
      onApply(selectedFrame);
      onClose();
    } else {
      // 빈 프레임이 선택된 경우 - 클리핑 해제를 의미
      onApply(-1); // -1을 클리핑 해제의 신호로 사용
      onClose();
    }
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
        {/* <div className="px-10 max-md:px-5 max-sm:px-4 flex-shrink-0">
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
        </div> */}

        {/* Frame Grid */}
        <div className="flex-1 px-10 py-6 max-md:px-5 max-sm:px-4 overflow-y-auto min-h-0">
          <div className="grid grid-cols-4 gap-3 min-h-[400px]">
            {/* 4x4 그리드 유지 (16개 칸) */}
            {[...Array(16)].map((_, frameIndex) => {
              const clipPathData = frameIndex < items.length 
                ? items[frameIndex] 
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
                        {/* 프레임 이름 표시 (name 값 사용) */}
                        <div className="absolute bottom-1 left-1 text-xs text-gray-600 bg-white/80 px-1 py-0.5 rounded text-[10px]">
                          {clipPathData.name}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* 빈 프레임에는 클리핑 해제 표시 */}
                  {!clipPathData && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                      
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

