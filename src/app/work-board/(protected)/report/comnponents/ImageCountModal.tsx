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
import { Input } from "@/components/ui/input";

interface ImageCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (count: number) => void;
  targetGridId?: string;
  type?: string | null;
  title?: string;
  description?: string;
}

export default function ImageCountModal({
  isOpen,
  onClose,
  onApply,
  targetGridId,
  type,
  title = "이미지 개수 선택",
  description = "사용할 이미지 개수를 선택해주세요.",
}: ImageCountModalProps) {
  const [inputValue, setInputValue] = useState<string>("1");
  const [error, setError] = useState<string>("");
  const modalRef = useRef<HTMLDivElement>(null);

  // type에 따른 허용 범위 설정
  const getValidRange = () => {
    if (type === "B") {
      return { min: 1, max: 2, text: "1~2" };
    }
    return { min: 1, max: 4, text: "1~4" };
  };

  // 유효성 검사 함수
  const validateInput = (value: string): boolean => {
    const { min, max, text } = getValidRange();
    const num = Number(value);
    if (isNaN(num) || !Number.isInteger(num) || num < min || num > max) {
      setError(`${text}까지의 숫자를 입력해주세요`);
      return false;
    }
    setError("");
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // 실시간 유효성 검사
    if (value.trim() !== "") {
      validateInput(value);
    } else {
      setError("");
    }
  };

  const handleApply = () => {
    if (!validateInput(inputValue)) {
      return;
    }
    
    const count = Number(inputValue);
    console.log(`그리드 ${targetGridId}에 ${count}개 이미지 적용`);
    onApply(count);
    setInputValue("1"); // 적용 후 초기화
    setError("");
    onClose();
  };

  const handleCancel = () => {
    setInputValue("1");
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
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              이미지 개수 ({getValidRange().text})
            </label>
            <Input
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              placeholder={`${getValidRange().text} 사이의 숫자를 입력하세요`}
              min={getValidRange().min.toString()}
              max={getValidRange().max.toString()}
              className={`w-full ${
                error 
                  ? "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500" 
                  : ""
              }`}
            />
            {error && (
              <p className="text-sm text-red-500 mt-1">
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
              disabled={!!error || inputValue.trim() === ""}
            >
              확인
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 