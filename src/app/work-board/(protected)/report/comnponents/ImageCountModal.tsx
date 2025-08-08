"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ImageCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (count: number) => void;
  targetGridId?: string;
  type?: string | null;
  title?: string;
  description?: string;
  isExpanded?: boolean; // Grid가 확장되었는지 여부 (B타입에서 사용)
}

export default function ImageCountModal({
  isOpen,
  onClose,
  onApply,
  targetGridId,
  type,
  title = "이미지 개수 선택",
  description = "사용할 이미지 개수를 선택해주세요.",
  isExpanded = false,
}: ImageCountModalProps) {
  const [selectedCount, setSelectedCount] = useState<number>(1);
  const [error, setError] = useState<string>("");
  const modalRef = useRef<HTMLDivElement>(null);

  // type에 따른 허용 범위 설정
  const getValidRange = () => {
    if (type === "B") {
      // B타입일 때: 확장된 상태면 최대 4개, 아니면 최대 2개
      if (isExpanded) {
        return { min: 1, max: 4, text: "1~4" };
      } else {
        return { min: 1, max: 2, text: "1~2" };
      }
    }
    // A타입일 때: 기본 1~4개
    return { min: 1, max: 4, text: "1~4" };
  };

  // 동그라미 버튼 생성 함수
  const generateCountOptions = () => {
    const { min, max } = getValidRange();
    const options = [];
    for (let i = min; i <= max; i++) {
      options.push(i);
    }
    return options;
  };

  // 숫자 선택 핸들러
  const handleCountSelect = (count: number) => {
    setSelectedCount(count);
    setError("");
  };

  const handleApply = () => {
    console.log(`그리드 ${targetGridId}에 ${selectedCount}개 이미지 적용`);
    onApply(selectedCount);
    setSelectedCount(1); // 적용 후 초기화
    setError("");
    onClose();
  };

  const handleCancel = () => {
    setSelectedCount(1);
    setError("");
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleCancel();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        ref={modalRef}
        className="gap-y-4 w-full max-w-[350px]"
        onClick={(e) => e.stopPropagation()}
        onInteractOutside={(e) => {
          // 모달 외부 클릭시만 닫기
          handleCancel();
        }}
        onEscapeKeyDown={(e) => {
          // ESC 키 동작은 허용
          handleCancel();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center py-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4">
          <div className="space-y-4">

            
            {/* 동그라미 숫자 선택 버튼들 */}
            <div className="flex justify-center gap-3">
              {generateCountOptions().map((count) => (
                <button
                  key={count}
                  onClick={() => handleCountSelect(count)}
                  className={`
                    w-12 h-12  rounded-full border-2 transition-all duration-200 flex items-center justify-center font-semibold text-lg
                    ${selectedCount === count
                      ? 'bg-primary border-primary text-white'
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-primary hover:border-primary hover:text-white'
                    }
                  `}
                >
                  {count}
                </button>
              ))}
            </div>
            
            {error && (
              <p className="text-sm text-red-500 mt-1 text-center">
                {error}
              </p>
            )}
          </div>
          
          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              className="px-6 py-2"
              onClick={handleCancel}
            >
              취소
            </Button>
            <Button
              className="px-6 py-2 bg-primary hover:bg-primary/80 text-white"
              onClick={handleApply}
              disabled={!!error}
            >
              확인
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 