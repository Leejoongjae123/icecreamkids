"use client";
import * as React from "react";
import { Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import useCaptureImage from "@/hooks/useCaptureImage";
import useS3FileUpload from "@/hooks/useS3FileUpload";
import useSimpleCaptureImage from "@/hooks/useSimpleCaptureImage";


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
import ReportBottomSection, { ReportBottomSectionRef } from "./ReportBottomSection";
import ReportTitleSection, { ReportTitleSectionRef } from "./ReportTitleSection";
import GridA, { GridARef } from "./GridA";
import Image from "next/image";
import { useStickerStore } from "@/hooks/store/useStickerStore";
import { useTextStickerStore } from "@/hooks/store/useTextStickerStore";
import { useReportStore } from "@/hooks/store/useReportStore";
import { useGlobalThemeStore } from "@/hooks/store/useGlobalThemeStore";
import { useSavedDataStore } from "@/hooks/store/useSavedDataStore";
import useGridContentStore from "@/hooks/store/useGridContentStore";
import DraggableSticker from "./DraggableSticker";
import DraggableTextSticker from "./DraggableTextSticker";
import useMousePositionTracker from "@/hooks/useMousePositionTracker";
import { StickerItem, TextStickerItem } from "./types";
import Loader from "@/components/common/Loader";
import { useLoadingState } from "@/hooks/useLoadingState";
// searchParams를 사용하는 컴포넌트 분리
function ReportAContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showCircles, setShowCircles] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  // 스티커 관련
  const { stickers, setStickers } = useStickerStore();
  const { textStickers, setTextStickers } = useTextStickerStore();
  const { getDefaultSubject } = useReportStore();
  const { backgroundImageUrlByType } = useGlobalThemeStore();
  const { saveCurrentReport, currentSavedData, isSaved, setSaved, exportToArticleDataFile } = useSavedDataStore();
  const { gridContents, setAllGridContents } = useGridContentStore();
  const { downloadImage, getImageFile } = useCaptureImage();
  const { postFile } = useS3FileUpload();
  const { downloadSimpleImage, previewSimpleImage, checkElement, getSimpleImageDataUrl } = useSimpleCaptureImage();
  const backgroundImageUrl = backgroundImageUrlByType["A"];
  const stickerContainerRef = useRef<HTMLDivElement>(null);
  const gridARef = useRef<GridARef>(null);
  const reportBottomRef = useRef<ReportBottomSectionRef>(null);
  const reportTitleRef = useRef<ReportTitleSectionRef>(null);

  // 마우스 위치 추적 기능
  const { startTracking, stopTracking, toggleTracking, isTracking } = useMousePositionTracker({
    enabled: true,
    throttleMs: 50, // 50ms 간격으로 출력 (더 부드러운 추적)
    containerRef: stickerContainerRef
  });

  // ApplyModal 상태
  const [isApplyModalOpen, setIsApplyModalOpen] = React.useState(false);
  // 저장 로딩 상태
  const [isSaving, setIsSaving] = React.useState(false);
  const { isLoading: isSavingLoading, message: savingMessage } = useLoadingState([
    {
      name: "SaveReport",
      isLoading: isSaving,
      message: "저장중입니다. 잠시만 기다려주세요.",
      priority: 1,
    },
  ]);

  // searchParams에서 subject 값 가져오기 (1-4 범위, 타입 A의 기본값은 4)
  const subjectParam = searchParams.get("subject");
  const subject = React.useMemo(() => {
    const defaultValue = getDefaultSubject("A"); // 타입 A의 기본값 사용
    const parsed = parseInt(subjectParam || defaultValue.toString(), 10);
    return parsed >= 1 && parsed <= 4 ? parsed : defaultValue;
  }, [subjectParam, getDefaultSubject]);

  // 기본적으로 저장 버튼은 항상 활성화 상태로 시작
  // 저장 버튼을 클릭했을 때만 비활성화됨

  // 처음 진입 시 편집 모드로 설정
  React.useEffect(() => {
    setSaved(false);
  }, [setSaved]);

  // 배경 이미지 로드 상태
  const [imageLoadError, setImageLoadError] = React.useState(false);
  // articleId가 있으면 API에서 취득한 데이터로 상태 초기화
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
          // 배경 이미지
          if (data.backgroundImageUrl) {
            // A타입 기준으로 저장
            // 별도 스토어에 setter가 있으나 현재 사용 중 API 없음. 필요 시 추가 가능
          }
          // ReportBottomSection 초기 데이터 저장
          setInitialReportBottomData(data.reportBottomData || undefined);
          // ReportTitleSection 초기 데이터 저장
          setInitialReportTitleData(data.reportTitleData || undefined);
          // Grid 레이아웃/이미지 포지션 먼저 설정
          setInitialGridLayout(data.gridLayout || undefined);
          setInitialImagePositionsMap(data.imagePositionsMap || undefined);
          // 그리드 컨텐츠는 마지막에 설정 (API 이미지 데이터 우선 적용을 위해)
          if (data.gridContents && typeof data.gridContents === 'object') {
            setAllGridContents(data.gridContents);
          }
          // subject 덮어쓰기: URL subject 우선, 없으면 데이터 subject 사용
          if (!searchParams.get('subject') && typeof data.subject === 'number') {
            const currentParams = new URLSearchParams(searchParams.toString());
            currentParams.set('subject', String(data.subject));
            router.replace(`?${currentParams.toString()}`);
          }
        }
      } catch {}
    };
    load();
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [initialReportBottomData, setInitialReportBottomData] = React.useState<any | undefined>(undefined);
  const [initialGridLayout, setInitialGridLayout] = React.useState<any[] | undefined>(undefined);
  const [initialImagePositionsMap, setInitialImagePositionsMap] = React.useState<Record<string, any[]> | undefined>(undefined);
  const [initialReportTitleData, setInitialReportTitleData] = React.useState<any | undefined>(undefined);


  // 배경 이미지 URL 유효성 검증
  React.useEffect(() => {
    if (backgroundImageUrl) {
      const validateImageUrl = async () => {
        try {
          const img = document.createElement("img");
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
      currentParams.set("subject", (subject - 1).toString());
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

  // 실제 저장을 수행하는 함수
  const performSave = async () => {
    setIsSaving(true);
    try {
      // 그리드 내부 인라인 편집이 진행 중이면 우선 커밋 이벤트 전파
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('reportA:commit-edits'));
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      } catch {}

      // 모든 데이터 수집
      const gridData = gridARef.current?.getGridData();
      const reportBottomData = reportBottomRef.current?.getReportBottomData();
      const reportTitleData = reportTitleRef.current?.getReportTitleData();
      
      // searchParams를 객체로 변환
      const searchParamsObj: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        searchParamsObj[key] = value;
      });
      
      // 현재 상태를 zustand 스토어에 저장 (확장된 정보 포함)
      const savedId = saveCurrentReport(
        "A", // 리포트 타입
        subject, // 현재 subject 값
        stickers, // 현재 스티커들
        textStickers, // 현재 텍스트 스티커들
        `A형 리포트 - ${new Date().toLocaleDateString()}`, // 제목
        "자동 저장된 리포트입니다.", // 설명
        searchParamsObj, // searchParams 값들
        gridData?.gridLayout, // 그리드 배치 정보
        gridContents, // 그리드 내용 정보
        reportBottomData, // ReportBottom 텍스트 정보
        backgroundImageUrl || undefined, // 배경 이미지 URL
        gridData?.imagePositionsMap, // 이미지 위치 정보
        reportTitleData // 제목 영역 데이터
      );
      
      // 저장된 데이터로 전송할 JSON 구성
      const completeReportData: any = {
        id: savedId,
        reportType: "A" as const,
        subject,
        stickers: [...stickers],
        textStickers: [...textStickers],
        savedAt: new Date().toISOString(),
        title: `A형 리포트 - ${new Date().toLocaleDateString()}`,
        description: "자동 저장된 리포트입니다.",
        searchParams: searchParamsObj,
        gridLayout: gridData?.gridLayout,
        gridContents,
        reportBottomData,
        backgroundImageUrl: backgroundImageUrl || undefined,
        imagePositionsMap: gridData?.imagePositionsMap,
        reportTitleData,
      };

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
      // 나이 파라미터 수집 (기본값 6)
      const ageParam = searchParams.get('age');
      const studentAge = ageParam ? parseInt(ageParam, 10) : 6;

      // 외부 API로 전달할 페이로드 구성
      const payload = {
        type: 'TypeA',
        subjectCount: subject,
        studentAge,
        // accountId/profileId는 로컬 API 라우트에서 쿠키 기반으로 주입됨
        stringData: JSON.stringify(completeReportData),
      } as const;

      const existingArticleId = searchParams.get('articleId');
      const response = await fetch('/api/file/v1/play-record', {
        method: existingArticleId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          accept: '*/*',
        },
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
      try {
        const json = await response.json().catch(() => null);
        const newId = (json && (json.result?.id ?? json.id)) || null;
        if (!existingArticleId && newId) {
          const params = new URLSearchParams(searchParams.toString());
          params.set('articleId', String(newId));
          router.replace(`?${params.toString()}`);
        }
      } catch { /* noop */ }
      // alert('리포트가 저장되었습니다.');
    } catch (error) {
      console.log('저장 중 오류가 발생했습니다:', error);
      alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  // 저장 버튼 클릭 핸들러
  const handleSave = () => {
    // 그리드 유효성 검사
    if (gridARef.current) {
      const isValid = gridARef.current.checkGridValidation();
      
      if (!isValid) {
        // 유효성 검사 실패 시 ApplyModal 표시
        setIsApplyModalOpen(true);
        return;
      }
    }
    
    // 유효성 검사 통과 시 바로 저장
    performSave();
  };

  // ApplyModal 확인 핸들러
  const handleApplyModalConfirm = () => {
    setIsApplyModalOpen(false);
    void performSave();
  };

  // ApplyModal 취소 핸들러
  const handleApplyModalCancel = () => {
    setIsApplyModalOpen(false);
  };

  // 편집 버튼 클릭 핸들러
  const handleEdit = () => {
    // useSavedDataStore의 isSaved 상태를 false로 설정
    setSaved(false);
  };

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

  // 다운로드 버튼 클릭 핸들러 (단순하고 확실한 이미지 다운로드)
  const handleDownload = async () => {
    try {
      // 먼저 캡처할 요소가 제대로 있는지 확인
      const elementInfo = checkElement('report-download-area');
      
      if (!elementInfo || !elementInfo.visible) {
        alert('캡처할 영역이 화면에 보이지 않습니다. 페이지를 새로고침 후 다시 시도해주세요.');
        return;
      }

      // 파일명 생성
      const today = new Date();
      const dateString = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}_${today.getHours().toString().padStart(2, '0')}${today.getMinutes().toString().padStart(2, '0')}`;
      const fileName = `놀이기록_${dateString}.png`;

      console.log('다운로드 시작:', elementInfo);

      // 단순하고 확실한 캡처 실행
      await downloadSimpleImage('report-download-area', fileName);
      
    } catch (error) {
      console.error('Download error:', error);
      alert('다운로드 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  // 테스트용 미리보기 함수 (개발 중에 확인용)
  const handlePreview = async () => {
    try {
      await previewSimpleImage('report-download-area');
    } catch (error) {
      console.error('Preview error:', error);
    }
  };




  console.log("backgroundImageUrl:", backgroundImageUrl);
  return (
    <TooltipProvider>
      <div className="w-full h-full relative flex flex-col">
        {/* Header with A4 Template */}
        <div className="w-full flex-1 shadow-custom border border-gray-200 rounded-xl pt-4 flex flex-col print-container">
          <div className="flex flex-row justify-between mb-4 px-4 print-hide">
            <div className="flex gap-1 my-auto text-base tracking-tight">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/4f51a14975a94c7325e6dc9e46203e3be3439720?placeholderIfAbsent=true&apiKey=304aa4871c104446b0f8164e96d049f4"
                className="object-contain shrink-0 w-5 aspect-square"
              />
              <div className="my-auto">놀이기록</div>
            </div>
            <div className="flex gap-1.5 text-sm tracking-tight">
              {isSaved && (
                <Button
                  size="sm"
                  className="gap-1 bg-[#F9FAFB] hover:bg-gray-100 text-[13px] text-black shadow-none font-semibold h-[34px] w-[80px] border-solid border-[1px] border-[#CCCCCC]"
                  onClick={handleEdit}
                >
                  <Image
                    src="/report/edit.svg"
                    alt="edit"
                    width={14}
                    height={14}
                  />
                  편집
                </Button>
              )}
              <Button
                size="sm"
                className="gap-1 bg-[#F9FAFB] hover:bg-gray-100 text-[13px] text-black shadow-none font-semibold h-[34px] w-[80px] border-solid border-[1px] border-[#CCCCCC]"
                onClick={handlePrint}
                disabled={!isSaved}
              >
                <Image
                  src="/report/print.svg"
                  alt="print"
                  width={14}
                  height={14}
                />
                인쇄
              </Button>

              <Button
                size="sm"
                className="gap-1 bg-[#F9FAFB] hover:bg-gray-100 text-[13px] text-black shadow-none font-semibold h-[34px] w-[80px] border-solid border-[1px] border-[#CCCCCC]"
              >
                <Image
                  src="/report/share.svg"
                  alt="share"
                  width={14}
                  height={14}
                />
                공유
              </Button>
              <Button
                size="sm"
                className="gap-1 bg-[#F9FAFB] hover:bg-gray-100 text-[13px] text-black shadow-none font-semibold h-[34px] w-[80px] border-solid border-[1px] border-[#CCCCCC]"
                onClick={handleDownload}
                disabled={!isSaved}
              >
                <Image
                  src="/report/download.svg"
                  alt="download"
                  width={14}
                  height={14}
                />
                다운로드
              </Button>
              {/* 임시 테스트 버튼 */}


              <Button
                className={`gap-1 font-semibold w-[80px] h-[34px] text-[13px] shadow-none ${
                  isSaved || isSaving
                    ? "bg-gray-300 hover:bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-primary hover:bg-primary/80 text-white"
                }`}
                onClick={isSaved || isSaving ? undefined : handleSave}
                disabled={isSaved || isSaving}
              >
                저장
              </Button>
            </div>
          </div>

          <div
            ref={stickerContainerRef}
            id="report-download-area"
            className="relative aspect-[210/297] flex flex-col w-full h-full justify-between gap-y-3 px-4 py-4 rounded-br-xl rounded-bl-xl overflow-hidden print-area"
          >
            {/* 배경 이미지 */}
            {backgroundImageUrl && (
              <Image
                key={backgroundImageUrl} // URL이 바뀔 때마다 재렌더링 강제
                src={backgroundImageUrl}
                alt="Report background"
                fill
                className="object-cover rounded-br-xl rounded-bl-xl -z-1"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                unoptimized={true}
              />
            )}
            {/* 이미지 로드 실패 시 표시할 안내 */}
            {imageLoadError && (
              <div className="absolute top-2 right-2 text-xs text-red-500 bg-white px-2 py-1 rounded shadow">
                배경 이미지를 불러올 수 없습니다
              </div>
            )}
            <ReportTitleSection ref={reportTitleRef} initialData={initialReportTitleData} />

            {/* 이미지 그리드 */}
            <div className="flex-1 w-full h-full">
              <GridA
                ref={gridARef}
                subject={subject}
                onDecreaseSubject={decreaseSubject}
                initialGridLayout={initialGridLayout}
                initialImagePositionsMap={initialImagePositionsMap}
              />
            </div>

            {/* 하단 텍스트 부위 */}
            <ReportBottomSection ref={reportBottomRef} type="A" initialData={initialReportBottomData} />

            {/* 일반 스티커 렌더링 */}
            {stickers.map((sticker: StickerItem) => (
              <DraggableSticker
                key={sticker.id}
                sticker={sticker}
                containerRef={stickerContainerRef}
              />
            ))}

            {/* 텍스트 스티커 렌더링 */}
            {textStickers.map((textSticker: TextStickerItem) => (
              <DraggableTextSticker
                key={textSticker.id}
                sticker={textSticker}
                containerRef={stickerContainerRef}
              />
            ))}
          </div>
        </div>

        {/* ApplyModal */}
        <ApplyModal
          open={isApplyModalOpen}
          onOpenChange={setIsApplyModalOpen}
          description="입력하지 않은 내용이 있습니다. 그대로 저장하시겠습니까?"
          onConfirm={handleApplyModalConfirm}
          onCancel={handleApplyModalCancel}
          confirmText="저장"
          cancelText="취소"
        >
          <div></div>
        </ApplyModal>

        {/* 저장 로딩 오버레이 */}
        {isSavingLoading && (
          <Loader hasOverlay loadingMessage={savingMessage || "저장중입니다. 잠시만 기다려주세요."} />
        )}
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
