"use client";
import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
import GridA from "./GridA";

// searchParams를 사용하는 컴포넌트 분리
function ReportAContent() {
  const searchParams = useSearchParams();
  const [showCircles, setShowCircles] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  // searchParams에서 subject 값 가져오기 (1-4 범위, 기본값 3)
  const subjectParam = searchParams.get('subject');
  const subject = React.useMemo(() => {
    const parsed = parseInt(subjectParam || '3', 10);
    return parsed >= 1 && parsed <= 4 ? parsed : 3;
  }, [subjectParam]);

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
                className="bg-primary hover:bg-primary/80 text-white font-semibold h-[34px]"
              >
                완료
              </Button>
            </div>
          </div>

          <div className="flex flex-col w-full h-[1130px] justify-between gap-y-3">
            <ReportTitleSection />

            {/* 이미지 그리드 */}
            <div className="flex-1 w-full h-full min-h-[600px]">
              <GridA subject={subject} />
            </div>

            {/* 하단 텍스트 부위 */}
            <ReportBottomSection type="A" />


          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Suspense로 감싼 메인 컴포넌트
function ReportA() {
  return (
    <Suspense fallback={<div className="w-full h-96 flex items-center justify-center">로딩 중...</div>}>
      <ReportAContent />
    </Suspense>
  );
}

export default ReportA;
