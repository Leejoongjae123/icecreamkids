"use client";
import * as React from "react";
import { Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ReportBottomSection, { ReportBottomSectionRef } from "./ReportBottomSection";
import ReportTitleSection, { ReportTitleSectionRef } from "./ReportTitleSection";
import GridC from "./GridC";
import { useStickerStore } from "@/hooks/store/useStickerStore";
import { useGlobalThemeStore } from "@/hooks/store/useGlobalThemeStore";
import DraggableSticker from "./DraggableSticker";
import useMousePositionTracker from "@/hooks/useMousePositionTracker";
import { useTextStickerStore } from "@/hooks/store/useTextStickerStore";
import { useSavedDataStore } from "@/hooks/store/useSavedDataStore";
import useGridContentStore from "@/hooks/store/useGridContentStore";
import useSimpleCaptureImage from "@/hooks/useSimpleCaptureImage";
import useCaptureImage from "@/hooks/useCaptureImage";
import useS3FileUpload from "@/hooks/useS3FileUpload";
import Loader from "@/components/common/Loader";
import { useLoadingState } from "@/hooks/useLoadingState";
import { StickerItem } from "./types";

// searchParams를 사용하는 컴포넌트 분리
function ReportCContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isClippingEnabled, setIsClippingEnabled] = React.useState(true);
  const [showOnlySelected, setShowOnlySelected] = React.useState(false);
  
  // 스티커 관련
  const { stickers, setStickers } = useStickerStore();
  const { backgroundImageUrlByType } = useGlobalThemeStore();
  const backgroundImageUrl = backgroundImageUrlByType['C'];
  const stickerContainerRef = useRef<HTMLDivElement>(null);
  const reportBottomRef = useRef<ReportBottomSectionRef>(null);
  const reportTitleRef = useRef<ReportTitleSectionRef>(null);

  const { textStickers, setTextStickers } = useTextStickerStore();
  const { gridContents, setAllGridContents } = useGridContentStore();
  const { saveCurrentReport, isSaved, setSaved, exportToArticleDataFile } = useSavedDataStore();
  const { downloadSimpleImage, previewSimpleImage, checkElement, getSimpleImageDataUrl } = useSimpleCaptureImage();
  const { getImageFile } = useCaptureImage();
  const { postFile } = useS3FileUpload();
  const [isSaving, setIsSaving] = React.useState(false);
  const { isLoading: isSavingLoading, message: savingMessage } = useLoadingState([
    {
      name: "SaveReport",
      isLoading: isSaving,
      message: "저장중입니다. 잠시만 기다려주세요.",
      priority: 1,
    },
  ]);

  // 마우스 위치 추적 기능
  const { startTracking, stopTracking, toggleTracking, isTracking } = useMousePositionTracker({
    enabled: true,
    throttleMs: 50, // 50ms 간격으로 출력 (더 부드러운 추적)
    containerRef: stickerContainerRef
  });

  // searchParams에서 photo 값 가져오기 (1-9 범위, 기본값 9)
  const photoParam = searchParams.get("photo");
  const photoCount = React.useMemo(() => {
    const parsed = parseInt(photoParam || "9", 10);
    return parsed >= 1 && parsed <= 9 ? parsed : 9;
  }, [photoParam]);

  // 처음 진입 시 편집 모드로 설정
  React.useEffect(() => {
    setSaved(false);
  }, [setSaved]);

  // 초기 데이터 상태 (타이틀/하단)
  const [initialReportBottomData, setInitialReportBottomData] = React.useState<any | undefined>(undefined);
  const [initialReportTitleData, setInitialReportTitleData] = React.useState<any | undefined>(undefined);

  // articleId가 있으면 API에서 취득한 데이터로 상태 초기화 (ReportB와 동일 패턴)
  React.useEffect(() => {
    const articleId = searchParams.get('articleId');
    if (!articleId) {
      return;
    }
    const controller = new AbortController();
    const load = async () => {
      try {
        const url = `/api/report/article?articleId=${encodeURIComponent(articleId)}`;
        const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        const json = await res.json();
        if (json && json.success && json.data) {
          const data = json.data as any;
          // 스티커/텍스트 스티커
          if (Array.isArray(data.stickers)) {
            setStickers(data.stickers);
          }
          if (Array.isArray(data.textStickers)) {
            setTextStickers(data.textStickers);
          }
          // 하단/타이틀 초기 데이터 저장
          setInitialReportBottomData(data.reportBottomData || undefined);
          setInitialReportTitleData(data.reportTitleData || undefined);
          // Grid 컨텐츠 초기화
          if (data.gridContents && typeof data.gridContents === 'object') {
            setAllGridContents(data.gridContents);
          }
          // photo 덮어쓰기: URL에 photo 없으면 데이터 subject를 사용 (1~9로 제한)
          if (!searchParams.get('photo') && typeof data.subject === 'number') {
            const next = Math.min(Math.max(parseInt(String(data.subject), 10), 1), 9);
            const currentParams = new URLSearchParams(searchParams.toString());
            currentParams.set('photo', String(next));
            router.replace(`?${currentParams.toString()}`);
          }
        }
      } catch {}
    };
    load();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePrint = async () => {
    try {
      const dataUrl = await getSimpleImageDataUrl('report-download-area');
      if (!dataUrl) {
        alert('인쇄할 이미지를 생성하지 못했습니다. 다시 시도해주세요.');
        return;
      }
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const html = `<!DOCTYPE html><html><head><meta charset=\"utf-8\" />
          <title>놀이기록 인쇄</title>
          <style>
            html,body{margin:0;padding:0;background:#fff}
            @page{size:A4;margin:0}
            *{color-adjust:exact!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
            .page{width:210mm; margin:0 auto; padding:0}
            img{width:210mm; max-width:100%; height:auto; display:block}
          </style>
        </head><body>
          <div class=\"page\"><img src=\"${dataUrl}\" /></div>
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

  const handleEdit = () => { setSaved(false); setShowOnlySelected(false); };

  const performSave = async () => {
    setIsSaving(true);
    try {
      const reportBottomData = reportBottomRef.current?.getReportBottomData();
      const reportTitleData = reportTitleRef.current?.getReportTitleData();
      const searchParamsObj: Record<string, string> = {};
      searchParams.forEach((value, key) => { searchParamsObj[key] = value; });
      const savedId = saveCurrentReport(
        'C',
        photoCount,
        stickers,
        textStickers,
        `C형 리포트 - ${new Date().toLocaleDateString()}`,
        '자동 저장된 리포트입니다.',
        searchParamsObj,
        undefined,
        gridContents,
        reportBottomData,
        backgroundImageUrl || undefined,
        undefined,
        reportTitleData
      );

      const completeReportData: any = {
        id: savedId,
        reportType: 'C' as const,
        subject: photoCount,
        stickers: [...stickers],
        textStickers: [...textStickers],
        savedAt: new Date().toISOString(),
        title: `C형 리포트 - ${new Date().toLocaleDateString()}`,
        description: '자동 저장된 리포트입니다.',
        searchParams: searchParamsObj,
        gridLayout: undefined,
        gridContents,
        reportBottomData,
        backgroundImageUrl: backgroundImageUrl || undefined,
        imagePositionsMap: undefined,
        reportTitleData,
      } as const;

      // 캡처 이미지 생성 및 업로드 → thumbUrl 획득 (실패해도 저장은 진행)
      try {
        const today = new Date();
        const dateString = `${today.getFullYear()}${(today.getMonth() + 1)
          .toString()
          .padStart(2, "0")}${today
          .getDate()
          .toString()
          .padStart(2, "0")}_${today
          .getHours()
          .toString()
          .padStart(2, "0")}${today
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;
        const fileName = `report_thumb_${dateString}.png`;
        const file = await getImageFile("report-download-area", fileName);
        if (file) {
          const uploadRes = await postFile({
            file,
            fileType: "IMAGE",
            taskType: "ETC",
            source: "FILE",
            thumbFile: file,
          });
          const anyRes = uploadRes as any;
          const url = anyRes?.thumbUrl || anyRes?.driveItemResult?.thumbUrl;
          if (url) {
            completeReportData.thumbUrl = url;
          }
        }
      } catch {}

      const ageParam = searchParams.get('age');
      const studentAge = ageParam ? parseInt(ageParam, 10) : 6;

      const payload = {
        type: 'TypeC',
        subjectCount: photoCount,
        studentAge,
        stringData: JSON.stringify(completeReportData),
      } as const;

      const existingArticleId = searchParams.get('articleId');
      const response = await fetch('/api/file/v1/play-record', {
        method: existingArticleId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', accept: '*/*' },
        body: JSON.stringify(
          existingArticleId
            ? { ...payload, playRecordId: parseInt(existingArticleId, 10) }
            : payload
        ),
      });

      if (!response.ok) {
        alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
        return;
      }

      setSaved(true);
      setShowOnlySelected(true);
      try {
        const json = await response.json().catch(() => null);
        const newId = (json && (json.result?.id ?? json.id)) || null;
        if (!existingArticleId && newId) {
          const params = new URLSearchParams(searchParams.toString());
          params.set('articleId', String(newId));
          window.history.replaceState(null, '', `?${params.toString()}`);
        }
      } catch { /* noop */ }
      // alert('리포트가 저장되었습니다.');
    } catch (_error) {
      alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };
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
      <div className="w-full relative flex flex-col" style={{ height: "1123px" }}>
        
        {/* Header with A4 Template */}
        <div className="bg-image w-full flex-1 shadow-custom border border-gray-200 rounded-xl pt-4 bg-cover bg-center bg-no-repeat flex flex-col print-container">
          <div className="flex flex-row justify-between mb-4 px-4 ">
            <div className="flex gap-1 my-auto text-base tracking-tight text-white">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/4f51a14975a94c7325e6dc9e46203e3be3439720?placeholderIfAbsent=true&apiKey=304aa4871c104446b0f8164e96d049f4"
                className="object-contain shrink-0 w-5 aspect-square"
              />
              <div className="my-auto text-black">놀이보고서</div>
            </div>
            <div className="flex gap-1.5 text-sm tracking-tight">
              {isSaved && (
                <Button
                  size="sm"
                  className="gap-1 bg-[#F9FAFB] hover:bg-gray-100 text-[13px] text-black shadow-none font-semibold h-[34px] w-[80px] border-solid border-[1px] border-[#CCCCCC]"
                  onClick={handleEdit}
                >
                  <Image src="/report/edit.svg" alt="edit" width={14} height={14} />
                  편집
                </Button>
              )}
              <Button
                size="sm"
                className="gap-1 bg-[#F9FAFB] hover:bg-gray-100 text-[13px] text-black shadow-none font-semibold h-[34px] w-[80px] border-solid border-[1px] border-[#CCCCCC]"
                onClick={handlePrint}
                disabled={!isSaved}
              >
                <Image src="/report/print.svg" alt="print" width={14} height={14} />
                인쇄
              </Button>
              <Button
                size="sm"
                className="gap-1 bg-[#F9FAFB] hover:bg-gray-100 text-[13px] text-black shadow-none font-semibold h-[34px] w-[80px] border-solid border-[1px] border-[#CCCCCC]"
              >
                <Image src="/report/share.svg" alt="share" width={14} height={14} />
                공유
              </Button>
              <Button
                size="sm"
                className="gap-1 bg-[#F9FAFB] hover:bg-gray-100 text-[13px] text-black shadow-none font-semibold h-[34px] w-[80px] border-solid border-[1px] border-[#CCCCCC]"
                onClick={handleDownload}
                disabled={!isSaved}
              >
                <Image src="/report/download.svg" alt="download" width={14} height={14} />
                다운로드
              </Button>
              <Button
                size="sm"
                className={`gap-1 font-semibold w-[80px] h-[34px] text-[13px] shadow-none ${
                  isSaved || isSaving
                    ? "bg-gray-300 hover:bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-primary hover:bg-primary/80 text-white"
                }`}
                onClick={isSaved || isSaving ? undefined : performSave}
                disabled={isSaved || isSaving}
              >
                저장
              </Button>
              {/* <Button
                onClick={toggleClipping}
                size="sm"
                className="gap-1 bg-blue-500 hover:bg-blue-600 text-[14px] text-white shadow-none font-semibold h-[34px]"
              >
                {isClippingEnabled ? "클리핑 해제(임시)" : "클리핑 적용(임시)"}
              </Button> */}
            </div>
          </div>

          <div
            ref={stickerContainerRef}
            id="report-download-area"
            className="flex flex-col aspect-[210/297] w-full px-4 py-4 rounded-br-xl rounded-bl-xl relative overflow-hidden"
            
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
            {/* Title Section - 고정 높이 */}
            <div style={{ height: "84px", flexShrink: 0 }}>
              <ReportTitleSection ref={reportTitleRef} initialData={initialReportTitleData} />
            </div>

            {/* GridC 컴포넌트 - flex로 나머지 공간 자동 할당 */}
            <div 
              className="w-full flex-1"
              style={{ 
                marginTop: "12px",
                marginBottom: "12px",
                minHeight: 0, // flex 아이템이 축소될 수 있도록
                overflow: "hidden"
              }}
            >
              <GridC isClippingEnabled={isClippingEnabled} photoCount={photoCount} showOnlySelected={showOnlySelected} isReadOnly={isSaved} />
            </div>

            {/* Bottom Section - 고정 높이 */}
            <div style={{ height: "287px", flexShrink: 0 }}>
              <ReportBottomSection ref={reportBottomRef} type="C" initialData={initialReportBottomData} />
            </div>
            
            {/* 스티커 렌더링 */}
            {stickers.map((sticker: StickerItem) => (
              <DraggableSticker
                key={sticker.id}
                sticker={sticker}
                containerRef={stickerContainerRef}
              />
            ))}
          </div>
        </div>
      </div>
      {/* 저장 로딩 오버레이 */}
      {isSavingLoading && (
        <Loader hasOverlay loadingMessage={savingMessage || "저장중입니다. 잠시만 기다려주세요."} />
      )}
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
