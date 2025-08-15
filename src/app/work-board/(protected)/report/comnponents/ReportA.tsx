"use client";
import * as React from "react";
import { Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { HiOutlineViewColumns } from "react-icons/hi2";
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
import GridEditToolbar from "./GridEditToolbar";
import ReportBottomSection from "./ReportBottomSection";
import ReportTitleSection from "./ReportTitleSection";
import GridA from "./GridA";
import Image from "next/image";
import { useStickerStore } from "@/hooks/store/useStickerStore";
import { useTextStickerStore } from "@/hooks/store/useTextStickerStore";
import { useReportStore } from "@/hooks/store/useReportStore";
import { useGlobalThemeStore } from "@/hooks/store/useGlobalThemeStore";
import DraggableSticker from "./DraggableSticker";
import DraggableTextSticker from "./DraggableTextSticker";
// searchParams를 사용하는 컴포넌트 분리
function ReportAContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showCircles, setShowCircles] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  // 스티커 관련
  const { stickers } = useStickerStore();
  const { textStickers } = useTextStickerStore();
  const { getDefaultSubject } = useReportStore();
  const { backgroundImageUrlByType } = useGlobalThemeStore();
  const backgroundImageUrl = backgroundImageUrlByType['A'];
  const stickerContainerRef = useRef<HTMLDivElement>(null);

  // searchParams에서 subject 값 가져오기 (1-4 범위, 타입 A의 기본값은 4)
  const subjectParam = searchParams.get("subject");
  const subject = React.useMemo(() => {
    const defaultValue = getDefaultSubject("A"); // 타입 A의 기본값 사용
    const parsed = parseInt(subjectParam || defaultValue.toString(), 10);
    return parsed >= 1 && parsed <= 4 ? parsed : defaultValue;
  }, [subjectParam, getDefaultSubject]);

  // 배경 이미지 로드 상태
  const [imageLoadError, setImageLoadError] = React.useState(false);

  // 배경 이미지 URL 유효성 검증
  React.useEffect(() => {
    if (backgroundImageUrl) {
      const validateImageUrl = async () => {
        try {
          const img = document.createElement('img');
          img.onload = () => {
            setImageLoadError(false);
          };
          img.onerror = () => {
            setImageLoadError(true);
          };
          img.src = backgroundImageUrl;
        } catch (error) {
          setImageLoadError(true);
        }
      };
      validateImageUrl();
    }
  }, [backgroundImageUrl]);

  // subject 값을 감소시키는 함수
  const decreaseSubject = React.useCallback(() => {
    if (subject > 1) {
      const currentParams = new URLSearchParams(searchParams.toString());
      currentParams.set('subject', (subject - 1).toString());
      router.push(`?${currentParams.toString()}`);
    }
  }, [subject, searchParams, router]);

  // 툴바 아이콘 클릭 핸들러
  const handleIconClick = (index: number) => {
    const tooltipTexts = [
      "사진틀 변경",
      "텍스트 스티커",
      "꾸미기 스티커",
      "사진 배경 제거",
      "사진 틀 삭제",
      "표 추가",
    ];
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

  console.log("backgroundImageUrl:", backgroundImageUrl);
  return (
    <TooltipProvider>
      <div className="w-full h-full relative flex flex-col">
        
        {/* Header with A4 Template */}
        <div className="w-full flex-1 shadow-custom border border-gray-200 rounded-xl pt-4 flex flex-col">
          <div className="flex flex-row justify-between mb-4 px-4">
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

          <div
            ref={stickerContainerRef}
            className="relative flex flex-col w-full h-full justify-between gap-y-3 px-4 py-4 rounded-br-xl rounded-bl-xl overflow-hidden"
          >
            {/* 배경 이미지 */}
            {backgroundImageUrl && (
              <Image
                key={backgroundImageUrl} // URL이 바뀔 때마다 재렌더링 강제
                src={backgroundImageUrl}
                alt="Report background"
                fill
                className="object-cover rounded-br-xl rounded-bl-xl -z-10"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
              />
            )}
            {/* 이미지 로드 실패 시 표시할 안내 */}
            {imageLoadError && (
              <div className="absolute top-2 right-2 text-xs text-red-500 bg-white px-2 py-1 rounded shadow">
                배경 이미지를 불러올 수 없습니다
              </div>
            )}
            <ReportTitleSection />
            
            {/* 이미지 그리드 */}
            <div className="flex-1 w-full h-full">
              <GridA subject={subject} onDecreaseSubject={decreaseSubject} />
            </div>

            {/* 하단 텍스트 부위 */}
            <ReportBottomSection type="A" />
            
            {/* 일반 스티커 렌더링 */}
            {stickers.map((sticker) => (
              <DraggableSticker
                key={sticker.id}
                sticker={sticker}
                containerRef={stickerContainerRef}
              />
            ))}
            
            {/* 텍스트 스티커 렌더링 */}
            {textStickers.map((textSticker) => (
              <DraggableTextSticker
                key={textSticker.id}
                sticker={textSticker}
                containerRef={stickerContainerRef}
              />
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Suspense로 감싼 메인 컴포넌트
function ReportA() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-96 flex items-center justify-center">
          로딩 중...
        </div>
      }
    >
      <ReportAContent />
    </Suspense>
  );
}

export default ReportA;
