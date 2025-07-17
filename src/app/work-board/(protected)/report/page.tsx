"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
// import { RegisterThumbnail } from './_components/RegisterThumbnail';
import LeftSideBar from "./comnponents/LeftSideBar";
import MainEditContainer from "./comnponents/MainEditContainer";
import RightSideBar from "./comnponents/RightSideBar";
import { TypeSelectionModal } from "@/components/modal";
import { useReportStore, type ReportType } from "@/hooks/store/useReportStore";
import ReportA from "./comnponents/ReportA";
import ReportB from "./comnponents/ReportB";
import ReportC from "./comnponents/ReportC";

//새로 작업될 리포트 페이지
function ReportPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    isFirstVisit,
    showTypeSelectionModal,
    selectedReportType,
    setFirstVisit,
    setShowTypeSelectionModal,
    setSelectedReportType,
  } = useReportStore();

  // searchParams에 type이 없을 때만 모달 표시
  useEffect(() => {
    const typeParam = searchParams.get('type') as ReportType | null;
    
    if (typeParam && ['A', 'B', 'C'].includes(typeParam)) {
      // URL에 type 파라미터가 있으면 바로 설정
      setSelectedReportType(typeParam);
      setFirstVisit(false);
      setShowTypeSelectionModal(false);
    } else if (isFirstVisit && !selectedReportType) {
      // URL에 type 파라미터가 없고 첫 방문이면 모달 표시
      setShowTypeSelectionModal(true);
    }
  }, [searchParams, isFirstVisit, selectedReportType, setShowTypeSelectionModal, setSelectedReportType, setFirstVisit]);

  const handleTypeSelect = (type: ReportType) => {
    setSelectedReportType(type);
    setFirstVisit(false);
    setShowTypeSelectionModal(false);
    
    // URL에 searchParams 추가
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set('type', type);
    router.push(`?${currentParams.toString()}`);
  };

  const handleModalCancel = () => {
    setShowTypeSelectionModal(false);
    // 취소 시에도 첫 방문 상태는 해제 (다시 보지 않기 위해)
    setFirstVisit(false);
  };

  return (
    <>
      <div className="flex w-full max-w-[1440px] justify-between min-h-screen mb-12 ">
        <div className="w-full max-w-[342px] h-full">
          <LeftSideBar />
        </div>
        <div className="w-full max-w-[800px]">
          {selectedReportType === "A" && (
            <Suspense fallback={<div>Loading...</div>}>
              <ReportA />
            </Suspense>
          )}
          {selectedReportType === "B" && <ReportB />}
          {selectedReportType === "C" && <ReportC />}
        </div>
        <div className="w-full max-w-[166px]">
          <RightSideBar />
        </div>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <TypeSelectionModal
          isOpen={showTypeSelectionModal}
          onSelect={handleTypeSelect}
          onCancel={handleModalCancel}
        />
      </Suspense>
    </>
  );
}

function ReportPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReportPageContent />
    </Suspense>
  );
}

export default ReportPage;
