"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

interface GridOption {
  id: string;
  label: string;
  icon: string;
  description: string;
  isVisible: boolean;
}

interface TableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (targetGrid: string) => void;
  type: "A" | "B" | "C";
  visibleGrids: {
    playActivity: boolean;
    teacherSupport: boolean;
    homeConnection: boolean;
  };
}

const TableModal: React.FC<TableModalProps> = ({ 
  isOpen, 
  onClose, 
  onApply, 
  type, 
  visibleGrids 
}) => {
  const [selectedGrid, setSelectedGrid] = useState<string>("");

  // 타입별 그리드 옵션 정의
  const getGridOptions = (): GridOption[] => {
    const baseOptions: GridOption[] = [
      {
        id: "teacherSupport",
        label: "놀이속 배움 / 교사지원",
        icon: "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/bulb.svg",
        description: "놀이 중 발견한 배움과 교사의 지원 내용",
        isVisible: visibleGrids.teacherSupport
      },
      {
        id: "homeConnection",
        label: "가정연계",
        icon: "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/home.svg",
        description: "가정과의 연계 활동 및 소통 내용",
        isVisible: visibleGrids.homeConnection
      }
    ];

    if (type === "C") {
      return [
        {
          id: "playActivity",
          label: "이렇게 놀이 했어요",
          icon: "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/play.svg",
          description: "아이들의 놀이 활동과 과정",
          isVisible: visibleGrids.playActivity
        },
        ...baseOptions
      ];
    }

    return baseOptions;
  };

  // 현재 화면에 없는(숨겨진) 그리드만 필터링
  const availableGrids = getGridOptions().filter(option => !option.isVisible);

  const handleApply = () => {
    if (!selectedGrid) {
      return;
    }
    onApply(selectedGrid);
    onClose();
    setSelectedGrid("");
  };

  const handleClose = () => {
    onClose();
    setSelectedGrid("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            
            표 추가
          </DialogTitle>
          <DialogDescription>
            현재 화면에 표시되지 않은 영역을 추가할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {availableGrids.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  <p className="text-xs text-gray-400 mt-1">
                    현재 모든 영역이 화면에 표시되어 있습니다.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="grid-select" className="text-sm font-medium">
                  영역 선택
                </Label>
                <Select value={selectedGrid} onValueChange={setSelectedGrid}>
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue placeholder="영역을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableGrids.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        <div className="flex items-center gap-3">
                          <img 
                            src={option.icon} 
                            alt={option.label}
                            className="w-4 h-4"
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{option.label}</span>

                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-center space-x-2 px-10 max-md:px-5 max-sm:px-4 flex-shrink-0">
          <button
            onClick={handleClose}
            className="flex justify-center items-center px-6 py-3 bg-gray-50 rounded-md border border-solid border-zinc-100 hover:bg-gray-100 transition-colors min-w-[100px]"
          >
            <div className="text-base font-medium text-gray-700">취소</div>
          </button>
          <button
            onClick={handleApply}
            disabled={!selectedGrid || availableGrids.length === 0}
            className={`
              flex justify-center items-center px-6 py-3 rounded-md transition-colors min-w-[100px]
              ${!selectedGrid || availableGrids.length === 0
                ? "bg-gray-200 cursor-not-allowed"
                : "bg-amber-400 hover:bg-amber-500"
              }
            `}
          >
            <div className={`text-base font-medium ${
              !selectedGrid || availableGrids.length === 0 
                ? "text-gray-400" 
                : "text-white"
            }`}>
              추가
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TableModal; 