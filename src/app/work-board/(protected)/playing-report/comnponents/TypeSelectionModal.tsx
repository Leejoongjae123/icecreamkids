"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ITypeSelectionModal, ReportType, TypeOption } from "./types";

const typeOptions: TypeOption[] = [
  {
    type: "A",
    imageUrl: "/report/typeA.png",
    description: "1~4개 놀이 주제 생성이 가능합니다.",
    buttonText: "A타입",
  },
  {
    type: "B",
    imageUrl: "/report/typeB.png",
    description: "최대 12개의 놀이 주제 생성이 가능합니다.",
    buttonText: "B타입",
  },
  {
    type: "C",
    imageUrl: "/report/typeC.png",
    description: "최대 9장의 사진으로 1개의\n놀이 주제 생성이 가능합니다.",
    buttonText: "C타입",
  },
];

export function TypeSelectionModal({
  isOpen,
  onSelect,
  onCancel,
}: ITypeSelectionModal) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [selectedType, setSelectedType] = useState<ReportType>("A");

  // searchParams에서 type 값을 읽어서 초기값 설정
  useEffect(() => {
    if (isOpen) {
      const typeParam = searchParams.get('type') as ReportType | null;
      if (typeParam && ['A', 'B', 'C'].includes(typeParam)) {
        setSelectedType(typeParam);
      }
    }
  }, [isOpen, searchParams]);

  const handleTypeSelect = (type: ReportType) => {
    setSelectedType(type);
  };

  const handleConfirm = () => {
    // 여기서는 URL을 변경하지 않는다.
    // 실제 적용(검색파라미터 변경)은 상위에서 확인 모달(ApplyModal) 확인 시 처리한다.
    onSelect(selectedType);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-[735px] h-[586px] p-0">
        <DialogHeader className="p-10 pb-0">
          <DialogTitle className="text-xl font-semibold text-gray-700">
            타입 선택
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
                          className="absolute right-4 top-4 h-6 w-6 rounded-full border border-gray-300 hover:bg-gray-50"
            onClick={handleCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="px-10 flex-1 flex flex-col">
          {/* 타입별로 컬럼 정렬 */}
          <div className="flex gap-x-4 mb-[30px]">
            {typeOptions.map((option) => (
              <div key={option.type} className="flex flex-col items-center gap-y-4">
                {/* 타입 선택 버튼 */}
                <Button
                  variant={selectedType === option.type ? "default" : "secondary"}
                  className={`h-[42px] w-[78px] rounded-full text-base font-medium ${
                    selectedType === option.type
                      ? "bg-amber-400 hover:bg-amber-500 text-white"
                      : "bg-gray-50 hover:bg-gray-100 text-zinc-400"
                  }`}
                  onClick={() => handleTypeSelect(option.type)}
                >
                  {option.buttonText}
                </Button>

                {/* 타입 이미지 */}
                <Card
                  className={`w-[205px] h-[266px] cursor-pointer transition-all ${
                    selectedType === option.type
                      ? "border-4 border-amber-400"
                      : "border border-gray-300 hover:border-gray-400"
                  }`}
                  onClick={() => handleTypeSelect(option.type)}
                >
                  <CardContent className="p-0 h-full">
                    <Image
                      src={option.imageUrl || ''}
                      alt={`${option.type}타입 미리보기`}
                      width={205}
                      height={266}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </CardContent>
                </Card>

                {/* 설명 텍스트 */}
                <Card className="w-[205px] h-12 bg-gray-50 shadow-none">
                  <CardContent className="p-0 h-full flex items-center justify-center">
                    <p className="text-xs text-gray-700 text-center leading-3 px-2">
                      {option.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* 버튼들 */}
          <div className="flex gap-[10px] justify-center">
            <Button
              variant="outline"
              className="w-[100px] h-[42px] bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
              onClick={handleCancel}
            >
              닫기
            </Button>
            <Button
              className="w-[100px] h-[42px] bg-amber-400 hover:bg-amber-500 text-white"
              onClick={handleConfirm}
            >
              적용
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 