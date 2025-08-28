"use client";

import { useEffect, Suspense, useMemo } from "react";
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
import useUserStore from '@/hooks/store/useUserStore';

//새로 작업될 리포트 페이지
function ReportPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userInfo } = useUserStore();
  const {
    isFirstVisit,
    showTypeSelectionModal,
    selectedReportType,
    setFirstVisit,
    setShowTypeSelectionModal,
    setSelectedReportType,
    getDefaultSubject,
  } = useReportStore();

  // store에서 profileId와 accountId 직접 추출
  const profileId = useMemo(() => userInfo?.id || null, [userInfo?.id]);
  const accountId = useMemo(() => userInfo?.accountId || null, [userInfo?.accountId]);
  console.log('profileId', profileId);
  console.log('accountId', accountId);

  // searchParams에 type이 없을 때만 모달 표시
  useEffect(() => {
    const typeParam = searchParams.get('type') as ReportType | null;
    const subjectParam = searchParams.get('subject');
    
    if (typeParam && ['A', 'B', 'C'].includes(typeParam)) {
      // URL에 type 파라미터가 있으면 바로 설정
      setSelectedReportType(typeParam);
      setFirstVisit(false);
      setShowTypeSelectionModal(false);
      
      // 타입 A일 때만 subject 파라미터가 없으면 기본값으로 설정
      if (typeParam === "A" && !subjectParam) {
        const defaultSubject = getDefaultSubject(typeParam);
        const currentParams = new URLSearchParams(searchParams.toString());
        currentParams.set('subject', defaultSubject.toString());
        router.push(`?${currentParams.toString()}`);
      }
    } else if (isFirstVisit && !selectedReportType) {
      // URL에 type 파라미터가 없고 첫 방문이면 모달 표시
      setShowTypeSelectionModal(true);
    }
  }, [searchParams, isFirstVisit, selectedReportType, setShowTypeSelectionModal, setSelectedReportType, setFirstVisit, getDefaultSubject, router]);

  const handleTypeSelect = (type: ReportType) => {
    setSelectedReportType(type);
    setFirstVisit(false);
    setShowTypeSelectionModal(false);
    
    // URL에 searchParams 추가
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set('type', type);
    
    // 타입 A일 때만 subject 파라미터가 없으면 기본값으로 설정
    if (type === "A" && !currentParams.get('subject')) {
      const defaultSubject = getDefaultSubject(type);
      currentParams.set('subject', defaultSubject.toString());
    }
    
    router.push(`?${currentParams.toString()}`);
  };

  const handleModalCancel = () => {
    setShowTypeSelectionModal(false);
    // 취소 시에도 첫 방문 상태는 해제 (다시 보지 않기 위해)
    setFirstVisit(false);
  };

  return (
    <>
      <div className="flex w-full max-w-[1440px] justify-between min-h-screen mb-12">
        <div className="w-full max-w-[342px] h-full">
          <LeftSideBar />
        </div>
        <div className="total-report w-[794px] h-[1123px] overflow-visible flex flex-col mb-12">
          {selectedReportType === "A" && (
            <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}>
              <div className="flex-1 h-full">
                <ReportA />
              </div>
            </Suspense>
          )}
          {selectedReportType === "B" && (
            <div className="flex-1 h-full">
              <ReportB />
            </div>
          )}
          {selectedReportType === "C" && (
            <div className="flex-1 h-full">
              <ReportC />
            </div>
          )}
        </div>
        <div className="min-w-[166px] overflow-visible">
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
