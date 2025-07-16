"use client";
import * as React from "react";
import { IoClose } from "react-icons/io5";
import { HiOutlinePrinter, HiOutlineDownload } from "react-icons/hi";
import { HiOutlineViewColumns } from "react-icons/hi2";
import Image from "next/image";
import HomeIcon from "@/components/common/Icons/HomeIcon";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AddPicture from "./AddPicture";
import ApplyModal from "./ApplyModal";
import ConfirmModal from "./ConfirmModal";
import ImageEditToolbar from "./ImageEditToolbar";
import ReportBottomSection from "./ReportBottomSection";
import ReportTitleSection from "./ReportTitleSection";

function ReportA() {
  const [showCircles, setShowCircles] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  // 툴바 아이콘 클릭 핸들러
  const handleIconClick = (index: number) => {
    const tooltipTexts = [
      "사진틀 변경",
      "텍스트 스티커", 
      "꾸미기 스티커",
      "사진 배경 제거",
      "사진 틀 삭제",
      "표 추가"
    ];
    console.log(`${tooltipTexts[index]} 클릭됨`);
    // 여기에 각 아이콘에 대한 로직 추가
  };

  // 이미지 로드 상태 확인을 위한 핸들러
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // 이미지 로드 실패 처리
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // 이미지 로드 성공 처리
  };

  // 영역 클릭 시 원 애니메이션 처리
  const handleAreaClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAnimating) {
      if (showCircles) {
        // 툴바가 이미 보이는 상태라면 숨기기
        setShowCircles(false);
        setIsExpanded(false);
      } else {
        // 툴바가 숨겨진 상태라면 보이기
        setIsAnimating(true);
        setShowCircles(true);
        
        // 약간의 지연 후 펼치기 애니메이션 시작
        setTimeout(() => {
          setIsExpanded(true);
        }, 50);
        
        // 애니메이션 완료 후 상태 초기화 (showCircles는 유지)
        setTimeout(() => {
          setIsAnimating(false);
        }, 2000);
      }
    }
  };

  return (
    <TooltipProvider>
      <div className="w-full relative">
        {/* Header with A4 Template */}
        <div className="w-full shadow-custom border border-gray-200 rounded-xl bg-white p-4">
          <div className="flex flex-row justify-between mb-4">
            <div className="flex gap-1 my-auto text-base tracking-tight">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/4f51a14975a94c7325e6dc9e46203e3be3439720?placeholderIfAbsent=true&apiKey=304aa4871c104446b0f8164e96d049f4"
                className="object-contain shrink-0 w-5 aspect-square"
              />
              <div className="my-auto">놀이보고서</div>
            </div>
            <div className="flex gap-1.5 text-sm tracking-tight">
              <Button
                size="sm"
                className="gap-1 bg-[#F9FAFB] hover:bg-gray-100 text-[14px] text-black shadow-none font-semibold h-[34px]"
              >
                <Image
                  src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/print.svg"
                  alt="print"
                  width={16}
                  height={16}
                />
                인쇄
              </Button>
              <Button
                size="sm"
                className="gap-1 bg-[#F9FAFB] hover:bg-gray-100 text-[14px] text-black shadow-none font-semibold h-[34px]"
              >
                <Image
                  src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/share.svg"
                  alt="share"
                  width={16}
                  height={16}
                />
                공유
              </Button>
              <Button
                size="sm"
                className="gap-1 bg-[#F9FAFB] hover:bg-gray-100 text-[14px] text-black shadow-none font-semibold h-[34px]"
              >
                <Image
                  src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/download.svg"
                  alt="download"
                  width={16}
                  height={16}
                />
                다운로드
              </Button>
              <Button
                size="sm"
                className="bg-amber-400 hover:bg-amber-500 text-[14px] text-white font-semibold shadow-none h-[34px]"
              >
                저장
              </Button>
            </div>
          </div>

          <div className="flex flex-col w-full min-h-[1130px] justify-between gap-y-3">
            <ReportTitleSection />

            {/* 이미지 추가 버튼 */}
            <div className="flex-1 flex-col w-full  justify-center items-center">
              <div className="flex items-center justify-center h-full relative">
                <div
                  className="grid-box relative flex flex-col items-center justify-center w-[300px] h-[200px] border-2 border-dashed border-[#B4B4B4] rounded-[15px] hover:border-blue-400 hover:bg-blue-50 transition-colors group cursor-pointer"
                  onClick={handleAreaClick}
                >
                  <div onClick={(e) => e.stopPropagation()}>
                    <AddPicture>
                      <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3 group-hover:bg-blue-100 cursor-pointer">
                        <svg
                          className="plus-button w-6 h-6 text-gray-400 group-hover:text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                      </div>
                    </AddPicture>
                  </div>
                  
                  <div onClick={(e) => e.stopPropagation()}>
                    <AddPicture>
                      <div className="text-gray-500 text-sm font-medium group-hover:text-blue-500 cursor-pointer hover:underline">
                        이미지 추가(테스트)
                      </div>
                    </AddPicture>
                  </div>
                  
                  <span className="text-gray-400 text-xs mt-1">
                    클릭하여 이미지를 업로드하세요
                  </span>
                </div>
                
                {/* 이미지 편집 툴바 */}
                <ImageEditToolbar
                  show={showCircles}
                  isExpanded={isExpanded}
                  onIconClick={handleIconClick}
                  targetGridId="main-image-grid"
                />
              </div>

              {/* 확인 및 적용 버튼 */}
              <div className="flex gap-3 mt-4 w-full justify-center items-center mt-24">
                <ConfirmModal
                  title="확인"
                  description="작업을 진행하시겠습니까?"
                  confirmText="확인"
                  onConfirm={() => {
                    // 확인 버튼 클릭 처리
                  }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-6 py-2 text-sm font-medium"
                  >
                    확인
                  </Button>
                </ConfirmModal>
                <ApplyModal
                  description="기존에 작업한 내용이 모두 초기화 됩니다.\n사진 개수를 3개로 변경하시겠습니까?"
                  cancelText="취소"
                  confirmText="적용"
                  onConfirm={() => {
                    // 적용 버튼 클릭 처리 - 사진 개수를 3개로 변경하고 기존 내용 초기화
                  }}
                  onCancel={() => {
                    // 취소 버튼 클릭 처리
                  }}
                >
                  <Button
                    size="sm"
                    className="px-6 py-2 text-sm font-medium bg-primary hover:bg-primary/80 text-white"
                  >
                    적용
                  </Button>
                </ApplyModal>
              </div>
            </div>

            {/* 하단 텍스트 부위 */}
            <ReportBottomSection type="A" />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default ReportA;
