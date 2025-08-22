"use client";
import * as React from "react";
import { Suspense, useRef } from "react";
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
import GridEditToolbar from "./GridEditToolbar";
import ReportBottomSection, { ReportBottomSectionRef } from "./ReportBottomSection";
import ReportTitleSection, { ReportTitleSectionRef } from "./ReportTitleSection";
import GridB from "./GridB";
import { useStickerStore } from "@/hooks/store/useStickerStore";
import { useGlobalThemeStore } from "@/hooks/store/useGlobalThemeStore";
import DraggableSticker from "./DraggableSticker";
import useMousePositionTracker from "@/hooks/useMousePositionTracker";
import { useTextStickerStore } from "@/hooks/store/useTextStickerStore";
import { useSavedDataStore } from "@/hooks/store/useSavedDataStore";
import useGridContentStore from "@/hooks/store/useGridContentStore";
import useSimpleCaptureImage from "@/hooks/useSimpleCaptureImage";

// searchParams를 사용하는 컴포넌트 분리
function ReportBContent() {
  const searchParams = useSearchParams();
  const [showCircles, setShowCircles] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  // 스티커 관련
  const { stickers } = useStickerStore();
  const { backgroundImageUrlByType } = useGlobalThemeStore();
  const backgroundImageUrl = backgroundImageUrlByType['B'];
  const stickerContainerRef = useRef<HTMLDivElement>(null);
  const reportBottomRef = useRef<ReportBottomSectionRef>(null);
  const reportTitleRef = useRef<ReportTitleSectionRef>(null);

  const { textStickers } = useTextStickerStore();
  const { gridContents } = useGridContentStore();
  const { saveCurrentReport, isSaved, setSaved, exportToArticleDataFile } = useSavedDataStore();
  const { downloadSimpleImage, previewSimpleImage, checkElement, getSimpleImageDataUrl } = useSimpleCaptureImage();

  // 마우스 위치 추적 기능
  const { startTracking, stopTracking, toggleTracking, isTracking } = useMousePositionTracker({
    enabled: true,
    throttleMs: 50, // 50ms 간격으로 출력 (더 부드러운 추적)
    containerRef: stickerContainerRef
  });

  // searchParams에서 gridCount 값 가져오기 (1-12 범위, 기본값 6)
  const gridCountParam = searchParams.get("gridCount");
  const gridCount = React.useMemo(() => {
    const parsed = parseInt(gridCountParam || "6", 10);
    return parsed >= 1 && parsed <= 12 ? parsed : 6;
  }, [gridCountParam]);

  // 처음 진입 시 편집 모드로 설정
  React.useEffect(() => {
    setSaved(false);
  }, [setSaved]);



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
  console.log("backgroundImageUrlB:", backgroundImageUrl);

  const handlePrint = async () => {
    try {
      const dataUrl = await getSimpleImageDataUrl('report-download-area');
      if (!dataUrl) {
        alert('인쇄할 이미지를 생성하지 못했습니다. 다시 시도해주세요.');
        return;
      }
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8" />
          <title>놀이기록 인쇄</title>
          <style>
            html,body{margin:0;padding:0;background:#fff}
            @page{size:A4;margin:0}
            *{color-adjust:exact!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
            .page{width:210mm; margin:0 auto; padding:0}
            img{width:210mm; max-width:100%; height:auto; display:block}
          </style>
        </head><body>
          <div class="page"><img src="${dataUrl}" /></div>
        </body></html>`;
        printWindow.document.write(html);
        printWindow.document.close();
        const img = printWindow.document.images[0];
        if (img) {
          if (img.complete) {
            setTimeout(() => { printWindow.print(); printWindow.close(); }, 200);
          } else {
            img.onload = () => { setTimeout(() => { printWindow.print(); printWindow.close(); }, 100); };
            img.onerror = () => { setTimeout(() => { printWindow.print(); printWindow.close(); }, 300); };
          }
        } else {
          setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
        }
      }
    } catch (_e) {
      alert('인쇄 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleDownload = async () => {
    try {
      const elementInfo = checkElement('report-download-area');
      if (!elementInfo || !elementInfo.visible) {
        alert('캡처할 영역이 화면에 보이지 않습니다. 페이지를 새로고침 후 다시 시도해주세요.');
        return;
      }
      const today = new Date();
      const dateString = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}_${today.getHours().toString().padStart(2, '0')}${today.getMinutes().toString().padStart(2, '0')}`;
      const fileName = `놀이기록_${dateString}.png`;
      await downloadSimpleImage('report-download-area', fileName);
    } catch (_error) {
      alert('다운로드 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handlePreview = async () => {
    try { await previewSimpleImage('report-download-area'); } catch (_error) {}
  };

  const handleEdit = () => { setSaved(false); };

  const performSave = () => {
    try {
      const reportBottomData = reportBottomRef.current?.getReportBottomData();
      const reportTitleData = reportTitleRef.current?.getReportTitleData();
      const searchParamsObj: Record<string, string> = {};
      searchParams.forEach((value, key) => { searchParamsObj[key] = value; });
      const savedId = saveCurrentReport(
        'B',
        gridCount,
        stickers,
        textStickers,
        `B형 리포트 - ${new Date().toLocaleDateString()}`,
        '자동 저장된 리포트입니다.',
        searchParamsObj,
        undefined,
        gridContents,
        reportBottomData,
        backgroundImageUrl || undefined,
        undefined,
        reportTitleData
      );

      const completeReportData = {
        id: savedId,
        reportType: 'B' as const,
        subject: gridCount,
        stickers: [...stickers],
        textStickers: [...textStickers],
        savedAt: new Date().toISOString(),
        title: `B형 리포트 - ${new Date().toLocaleDateString()}`,
        description: '자동 저장된 리포트입니다.',
        searchParams: searchParamsObj,
        gridLayout: undefined,
        gridContents,
        reportBottomData,
        backgroundImageUrl: backgroundImageUrl || undefined,
        imagePositionsMap: undefined,
        reportTitleData,
      } as const;

      exportToArticleDataFile(completeReportData as any);
      setSaved(true);
      alert('리포트가 저장되었습니다. articleData.ts 파일이 다운로드됩니다.');
    } catch (_error) {
      alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };
  return (
    <TooltipProvider>
      <div className="w-full h-full relative">
        {/* Header with A4 Template */}
        <div className="w-full h-full shadow-custom border border-gray-200 rounded-xl bg-white flex flex-col print-container">
          {/* 상단 버튼 영역 - 고정 높이 */}
          <div className="flex-shrink-0 flex flex-row justify-between mb-4 px-4 pt-4 print-hide">
            <div className="flex gap-1 my-auto text-base tracking-tight">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/4f51a14975a94c7325e6dc9e46203e3be3439720?placeholderIfAbsent=true&apiKey=304aa4871c104446b0f8164e96d049f4"
                className="object-contain shrink-0 w-5 aspect-square"
              />
              <div className="my-auto">놀이보고서</div>
            </div>
            <div className="flex gap-1.5 text-sm tracking-tight">
              {isSaved && (
                <Button
                  size="sm"
                  className="gap-1 bg-[#F9FAFB] hover:bg-gray-100 text-[14px] text-black shadow-none font-semibold h-[34px]"
                  onClick={handleEdit}
                >
                  <Image src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/edit.svg" alt="edit" width={16} height={16} />
                  편집
                </Button>
              )}
              <Button
                size="sm"
                className="gap-1 bg-[#F9FAFB] hover:bg-gray-100 text-[14px] text-black shadow-none font-semibold h-[34px]"
                onClick={handlePrint}
                disabled={!isSaved}
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
                onClick={handleDownload}
                disabled={!isSaved}
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
                className="gap-1 bg-orange-100 hover:bg-orange-200 text-[14px] text-orange-700 shadow-none font-semibold h-[34px]"
                onClick={handlePreview}
                disabled={!isSaved}
              >
                미리보기
              </Button>
              <Button
                size="sm"
                className={`gap-1 font-semibold h-[34px] ${
                  isTracking
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
                onClick={toggleTracking}
                title="마우스 위치 추적 (스티커 좌표계)"
              >
                🖱️ {isTracking ? '추적 중지' : '위치 추적'}
              </Button>
              <Button
                size="sm"
                className={`${isSaved ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-primary hover:bg-primary/80 text-white"} font-semibold h-[34px]`}
                onClick={isSaved ? undefined : performSave}
                disabled={isSaved}
              >
                저장
              </Button>
            </div>
          </div>

          {/* 메인 컨텐츠 영역 - 남은 공간 모두 차지 */}
          <div
            ref={stickerContainerRef}
            id="report-download-area"
            className="flex flex-col w-full h-full px-4 py-4 rounded-br-xl rounded-bl-xl relative overflow-hidden"
          >
            {/* 배경 이미지 */}
            
              <Image
                key={backgroundImageUrl||""} // URL이 바뀔 때마다 재렌더링 강제
                src={backgroundImageUrl||""}
                alt="Report background"
                fill
                className="object-cover rounded-br-xl rounded-bl-xl "
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
              />
            
            {/* 타이틀 섹션 - 고정 높이 84px */}
            <div className="flex-shrink-0 pb-4">
              <ReportTitleSection ref={reportTitleRef} />
            </div>

            {/* 이미지 그리드 - 계산된 정확한 높이 차지 */}
            <div 
              className="flex-shrink-0 w-full mb-3"
              style={{ 
                height: 'calc(100% - 84px - 16px - 174px - 12px)' // 전체 - 타이틀 - 타이틀패딩 - 하단 - 간격
              }}
            >
              <GridB gridCount={gridCount} />
            </div>

            {/* 하단 텍스트 부위 - 고정 높이 174px */}
            <div className="flex-shrink-0">
              <ReportBottomSection ref={reportBottomRef} type="B" />
            </div>
            
            {/* 스티커 렌더링 */}
            {stickers.map((sticker) => (
              <DraggableSticker
                key={sticker.id}
                sticker={sticker}
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
function ReportB() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-96 flex items-center justify-center">
          로딩 중...
        </div>
      }
    >
      <ReportBContent />
    </Suspense>
  );
}

export default ReportB;
