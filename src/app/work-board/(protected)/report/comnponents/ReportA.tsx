"use client";
import * as React from "react";
import { Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import useCaptureImage from "@/hooks/useCaptureImage";


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
import { useSavedDataStore } from "@/hooks/store/useSavedDataStore";
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
  const { saveCurrentReport, currentSavedData, isSaved, setSaved } = useSavedDataStore();
  const { downloadImage } = useCaptureImage();
  const backgroundImageUrl = backgroundImageUrlByType["A"];
  const stickerContainerRef = useRef<HTMLDivElement>(null);

  // searchParams에서 subject 값 가져오기 (1-4 범위, 타입 A의 기본값은 4)
  const subjectParam = searchParams.get("subject");
  const subject = React.useMemo(() => {
    const defaultValue = getDefaultSubject("A"); // 타입 A의 기본값 사용
    const parsed = parseInt(subjectParam || defaultValue.toString(), 10);
    return parsed >= 1 && parsed <= 4 ? parsed : defaultValue;
  }, [subjectParam, getDefaultSubject]);

  // 기본적으로 저장 버튼은 항상 활성화 상태로 시작
  // 저장 버튼을 클릭했을 때만 비활성화됨

  // 배경 이미지 로드 상태
  const [imageLoadError, setImageLoadError] = React.useState(false);

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

  // 저장 버튼 클릭 핸들러
  const handleSave = () => {
    try {
      // 현재 상태를 zustand 스토어에 저장
      const savedId = saveCurrentReport(
        "A", // 리포트 타입
        subject, // 현재 subject 값
        stickers, // 현재 스티커들
        textStickers, // 현재 텍스트 스티커들
        `A형 리포트 - ${new Date().toLocaleDateString()}`, // 제목
        "자동 저장된 리포트입니다." // 설명
      );
      
      // useSavedDataStore의 isSaved 상태를 true로 설정
      setSaved(true);
      
      // 저장 성공 알림 (선택사항)
      console.log('리포트가 성공적으로 저장되었습니다. ID:', savedId);
    } catch (error) {
      console.log('저장 중 오류가 발생했습니다:', error);
    }
  };

  // 편집 버튼 클릭 핸들러
  const handleEdit = () => {
    // useSavedDataStore의 isSaved 상태를 false로 설정
    setSaved(false);
  };

  const handlePrint = () => {
    try {
      const printContainer = document.querySelector('.print-container') as HTMLElement;
      if (!printContainer) {
        alert('인쇄할 내용을 찾을 수 없습니다.');
        return;
      }

      // 현재 문서의 모든 스타일시트를 수집
      const styles = Array.from(document.styleSheets)
        .map(styleSheet => {
          try {
            return Array.from(styleSheet.cssRules)
              .map(rule => rule.cssText)
              .join('\n');
          } catch (e) {
            // CORS 정책으로 인해 접근할 수 없는 외부 스타일시트는 무시
            return '';
          }
        })
        .join('\n');

      // 현재 페이지의 모든 폰트와 이미지를 포함한 완전한 HTML 복사
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const printContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>놀이기록 인쇄</title>
              <meta charset="utf-8">
              <style>
                ${styles}
                
                /* 인쇄 전용 스타일 */
                body {
                  margin: 0 !important;
                  padding: 0 !important;
                  background: white !important;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .print-container {
                  width: 100% !important;
                  height: auto !important;
                  margin: 0 !important;
                  padding: 20px !important;
                  background: white !important;
                  box-shadow: none !important;
                  border: none !important;
                  border-radius: 0 !important;
                  overflow: visible !important;
                }
                
                /* 버튼들 숨기기 */
                .print-hide {
                  display: none !important;
                }
                
                /* 이미지와 배경 이미지 보정 */
                img {
                  max-width: 100% !important;
                  height: auto !important;
                  display: block !important;
                }
                
                @media print {
                  body {
                    margin: 0 !important;
                    padding: 0 !important;
                  }
                  
                  .print-container {
                    padding: 10mm !important;
                  }
                  
                  @page {
                    margin: 0;
                    size: A4;
                  }
                  
                  * {
                    color-adjust: exact !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                }
              </style>
            </head>
            <body>
              ${printContainer.outerHTML}
            </body>
          </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();

        // 이미지 로딩 대기 후 인쇄
        let loadedImages = 0;
        const images = printWindow.document.querySelectorAll('img');
        const totalImages = images.length;

        if (totalImages === 0) {
          // 이미지가 없으면 바로 인쇄
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 1000);
        } else {
          // 모든 이미지 로딩 완료 후 인쇄
          images.forEach(img => {
            if (img.complete) {
              loadedImages++;
            } else {
              img.onload = () => {
                loadedImages++;
                if (loadedImages === totalImages) {
                  setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                  }, 500);
                }
              };
              img.onerror = () => {
                loadedImages++;
                if (loadedImages === totalImages) {
                  setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                  }, 500);
                }
              };
            }
          });

          // 이미지가 이미 로드된 경우
          if (loadedImages === totalImages) {
            setTimeout(() => {
              printWindow.print();
              printWindow.close();
            }, 1000);
          }
        }
      }
    } catch (error) {
      console.log('인쇄 중 오류가 발생했습니다:', error);
      alert('인쇄 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  // 다운로드 버튼 클릭 핸들러 (이미지 다운로드)
  const handleDownload = async () => {
    try {
      // 파일명 생성
      const today = new Date();
      const dateString = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}_${today.getHours().toString().padStart(2, '0')}${today.getMinutes().toString().padStart(2, '0')}`;
      const fileName = `놀이기록_${dateString}.png`;

      // 이미지 캡처 옵션
      const options = {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true
      };

      // useCaptureImage 훅 사용해서 이미지 다운로드
      await downloadImage('report-download-area', fileName, options);
      
    } catch (error) {
      alert('다운로드 중 오류가 발생했습니다. 다시 시도해주세요.');
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
                  className="gap-1 bg-[#F9FAFB] hover:bg-gray-100 text-[14px] text-black shadow-none font-semibold h-[34px]"
                  onClick={handleEdit}
                >
                  <Image
                    src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/edit.svg"
                    alt="edit"
                    width={16}
                    height={16}
                  />
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
                className={`font-semibold h-[34px] ${
                  isSaved
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-primary hover:bg-primary/80 text-white"
                }`}
                onClick={isSaved ? undefined : handleSave}
                disabled={isSaved}
              >
                저장
              </Button>
            </div>
          </div>

          <div
            ref={stickerContainerRef}
            id="report-download-area"
            className="relative flex flex-col w-full h-full justify-between gap-y-3 px-4 py-4 rounded-br-xl rounded-bl-xl overflow-hidden print-area"
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
