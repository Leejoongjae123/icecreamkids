"use client";
import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ReportBottomSection from "./ReportBottomSection";
import ReportTitleSection from "./ReportTitleSection";
import GridC from "./GridC";

// searchParams를 사용하는 컴포넌트 분리
function ReportCContent() {
  const searchParams = useSearchParams();
  const [isClippingEnabled, setIsClippingEnabled] = React.useState(true);

  // searchParams에서 photo 값 가져오기 (1-9 범위, 기본값 9)
  const photoParam = searchParams.get("photo");
  const photoCount = React.useMemo(() => {
    const parsed = parseInt(photoParam || "9", 10);
    return parsed >= 1 && parsed <= 9 ? parsed : 9;
  }, [photoParam]);

  // 이미지 로드 상태 확인을 위한 핸들러
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // 이미지 로드 실패 처리
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // 이미지 로드 성공 처리
  };

  // 클리핑 토글 핸들러
  const toggleClipping = () => {
    setIsClippingEnabled(!isClippingEnabled);
  };

  return (
    <TooltipProvider>
      <div className="w-full relative">
        {/* Header with A4 Template */}
        <div className="bg-image w-full shadow-custom border border-gray-200 rounded-xl pt-4 bg-cover bg-center bg-no-repeat">
          <div className="flex flex-row justify-between mb-4 px-4 ">
            <div className="flex gap-1 my-auto text-base tracking-tight text-white">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/4f51a14975a94c7325e6dc9e46203e3be3439720?placeholderIfAbsent=true&apiKey=304aa4871c104446b0f8164e96d049f4"
                className="object-contain shrink-0 w-5 aspect-square"
              />
              <div className="my-auto text-black">놀이보고서</div>
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
              <Button
                onClick={toggleClipping}
                size="sm"
                className="gap-1 bg-blue-500 hover:bg-blue-600 text-[14px] text-white shadow-none font-semibold h-[34px]"
              >
                {isClippingEnabled ? "클리핑 해제(임시)" : "클리핑 적용(임시)"}
              </Button>
            </div>
          </div>

          <div
            className="flex flex-col w-full min-h-[1130px] justify-between gap-y-3 px-4 py-8 rounded-br-xl rounded-bl-xl"
            style={{
              backgroundImage:
                "url(https://icecreamkids.s3.ap-northeast-2.amazonaws.com/bg.jpg)",
            }}
          >
            <ReportTitleSection />

            {/* GridC 컴포넌트 */}
            <div className="flex-1 flex-row w-full">
              <GridC isClippingEnabled={isClippingEnabled} photoCount={photoCount} />
            </div>

            <ReportBottomSection type="C" />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

function ReportC() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReportCContent />
    </Suspense>
  );
}

export default ReportC;
