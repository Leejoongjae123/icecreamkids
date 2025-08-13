"use client";
import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TypeSelectionModal } from "@/components/modal/type-selection";
import ApplyModal from "./ApplyModal";
import useGridContentStore from "@/hooks/store/useGridContentStore";
import useUserStore from "@/hooks/store/useUserStore";
import { useToast } from "@/hooks/store/useToastStore";
import { useAlertStore } from "@/hooks/store/useAlertStore";
import AgeSelector from "./AgeSelector";
import SubjectSelector from "./SubjectSelector";
import PhotoSelector from "./PhotoSelector";
import InputDesign from "./InputDesign";
import usePlayRecordStore from "@/hooks/store/usePlayRecordStore";
import { Loader } from "@/components/ui/loader";

function RightSideBarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentType = searchParams.get("type") || "A";
  const { hasAnyContent, clearGridsByType, clearAllGridContents, hasAnyAiGeneratedContent, getAllReportCaptions, getReportCaptionsByType } = useGridContentStore();
  const { userInfo } = useUserStore();
  const addToast = useToast((state) => state.add);
  const { showAlert } = useAlertStore();
  const { setPlayRecordResult, hasPlayRecordResult, clearPlayRecordResult } = usePlayRecordStore();

  const [selectedAge, setSelectedAge] = useState("6세");
  const [isAgePopoverOpen, setIsAgePopoverOpen] = useState(false);
  const [ageCount, setAgeCount] = useState(3);

  // searchParams에서 초기값 읽어오기 - 타입에 따라 기본값 다르게 설정
  const getDefaultSubject = (type: string) => {
    return type === "B" ? "12개" : "4개";
  };

  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') ? `${searchParams.get('subject')}개` : getDefaultSubject(currentType));
  const [isSubjectPopoverOpen, setIsSubjectPopoverOpen] = useState(false);
  const [subjectCount, setSubjectCount] = useState(parseInt(searchParams.get('subject') || (currentType === "B" ? '12' : '4')));

  const [selectedPhoto, setSelectedPhoto] = useState("4개");
  const [isPhotoPopoverOpen, setIsPhotoPopoverOpen] = useState(false);
  const [photoCount, setPhotoCount] = useState(4);

  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);

  // ApplyModal 관련 상태
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'TYPE_CHANGE' | 'SUBJECT_CHANGE';
    data: any;
  } | null>(null);

  // 놀이기록 생성 로딩 상태
  const [isCreatingPlayRecord, setIsCreatingPlayRecord] = useState(false);

  // 초기 렌더링 시 searchParams에서 age 값 읽어오기
  useEffect(() => {
    const ageParam = searchParams.get('age');
    if (ageParam) {
      // 숫자를 문자열로 변환
      const ageNumberToString = (ageNumber: string): string => {
        switch (ageNumber) {
          case "3":
            return "7세";
          case "2":
            return "6세";
          case "1":
            return "5세";
          case "0":
            return "0~2세";
          default:
            return "6세";
        }
      };

      const ageString = ageNumberToString(ageParam);
      setSelectedAge(ageString);

      // ageCount도 업데이트
      const ageCountMap: { [key: string]: number } = {
        "7세": 5,
        "6세": 3,
        "5세": 4,
        "0~2세": 2,
      };
      setAgeCount(ageCountMap[ageString] || 3);
    }
  }, [searchParams]);

  // 타입이 변경될 때 subject 관련 상태 업데이트
  useEffect(() => {
    console.log("useEffect 실행 - 현재 타입:", currentType);

    // B타입일 때는 subject 관련 상태를 설정하지 않음
    if (currentType === "B") {
      return;
    }

    const subjectParam = searchParams.get('subject');
    console.log("subjectParam:", subjectParam);

    if (!subjectParam) {
      // URL에 subject 파라미터가 없으면 타입에 따른 기본값 설정
      const defaultSubject = getDefaultSubject(currentType);
      console.log("기본값 설정:", defaultSubject);
      setSelectedSubject(defaultSubject);
      setSubjectCount(parseInt(defaultSubject.replace('개', '')));
    } else {
      // URL에 subject 파라미터가 있으면 그 값 사용
      console.log("URL 파라미터 사용:", `${subjectParam}개`);
      setSelectedSubject(`${subjectParam}개`);
      setSubjectCount(parseInt(subjectParam));
    }
  }, [currentType, searchParams]);

  const handleAgeSelect = (ageNumber: string) => {
    // 숫자를 문자열로 변환
    const ageNumberToString = (ageNum: string): string => {
      switch (ageNum) {
        case "3":
          return "7세";
        case "2":
          return "6세";
        case "1":
          return "5세";
        case "0":
          return "0~2세";
        default:
          return "6세";
      }
    };

    const ageString = ageNumberToString(ageNumber);
    setSelectedAge(ageString);
    setIsAgePopoverOpen(false);

    // searchParams 업데이트
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("age", ageNumber);
    router.push(`?${newSearchParams.toString()}`);

    // Update the count logic based on selected age
    const ageCountMap: { [key: string]: number } = {
      "7세": 5,
      "6세": 3,
      "5세": 4,
      "0~2세": 2,
    };
    setAgeCount(ageCountMap[ageString] || 3);
    console.log(`연령 선택: ${ageString} (${ageNumber})`);
  };

  const handleSubjectSelect = (subject: string) => {
    const count = parseInt(subject.replace("개", ""));
    
    // 기존에 작업한 내용이 있는지 확인
    if (hasAnyContent()) {
      // 확인 모달 띄우기
      setPendingAction({
        type: 'SUBJECT_CHANGE',
        data: { subject, count }
      });
      setIsApplyModalOpen(true);
      setIsSubjectPopoverOpen(false);
    } else {
      // 내용이 없으면 바로 적용
      applySubjectChange(subject, count);
    }
  };

  const applySubjectChange = (subject: string, count: number) => {
    setSelectedSubject(subject);
    setIsSubjectPopoverOpen(false);
    setSubjectCount(count);
    
    // URL 파라미터 업데이트
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("subject", count.toString());
    router.push(`?${newSearchParams.toString()}`);
    
    console.log(`놀이 주제 선택: ${subject}`);
  };

  const handlePhotoSelect = (photo: string) => {
    setSelectedPhoto(photo);
    setIsPhotoPopoverOpen(false);
    // Update the count logic as needed
    const count = parseInt(photo.replace("개", ""));
    setPhotoCount(count);
    console.log(`사진 개수 선택: ${photo}`);
  };

  const handleTypeSelect = (type: "A" | "B" | "C") => {
    // 기존에 작업한 내용이 있는지 확인
    if (hasAnyContent()) {
      // 확인 모달 띄우기
      setPendingAction({
        type: 'TYPE_CHANGE',
        data: { type }
      });
      setIsApplyModalOpen(true);
      setIsTypeModalOpen(false);
    } else {
      // 내용이 없으면 바로 적용
      applyTypeChange(type);
    }
  };

  const applyTypeChange = (type: "A" | "B" | "C") => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("type", type);

    // B타입일 때는 subject 파라미터 제거
    if (type === "B") {
      newSearchParams.delete("subject");
    }

    router.push(`?${newSearchParams.toString()}`);
    setIsTypeModalOpen(false);
    console.log(`타입 선택: ${type}`);
  };

  const handleTypeModalCancel = () => {
    setIsTypeModalOpen(false);
  };

  // ApplyModal 핸들러들
  const handleApplyModalConfirm = () => {
    if (!pendingAction) {
      return;
    }

    if (pendingAction.type === 'TYPE_CHANGE') {
      // 모든 Grid 내용 초기화
      clearAllGridContents();
      applyTypeChange(pendingAction.data.type);
    } else if (pendingAction.type === 'SUBJECT_CHANGE') {
      // 현재 타입의 Grid들만 초기화
      clearGridsByType(currentType, subjectCount);
      applySubjectChange(pendingAction.data.subject, pendingAction.data.count);
    }

    setIsApplyModalOpen(false);
    setPendingAction(null);
  };

  const handleApplyModalCancel = () => {
    setIsApplyModalOpen(false);
    setPendingAction(null);
  };

  // ApplyModal 메시지 생성
  const getApplyModalMessage = () => {
    if (!pendingAction) {
      return "";
    }

    if (pendingAction.type === 'TYPE_CHANGE') {
      return "기존에 작업한 내용이 모두 초기화 됩니다.\n타입을 변경하시겠습니까?";
    } else if (pendingAction.type === 'SUBJECT_CHANGE') {
      return `기존에 작업한 내용이 모두 초기화 됩니다.\n놀이 주제 개수를 ${pendingAction.data.count}개로 변경하시겠습니까?`;
    }

    return "";
  };

  // selectedAge를 안전하게 처리하는 함수
  const getAgeDisplay = (age: string | number): string => {
    if (typeof age === "string") {
      return age.replace("세", "");
    }
    if (typeof age === "number") {
      // 숫자인 경우 매핑
      const ageMap: { [key: number]: string } = {
        3: "7",
        2: "6",
        1: "5",
        0: "0~2",
      };
      return ageMap[age] || "6";
    }
    return "6";
  };

  // 놀이기록 생성/재생성 함수
  const handleCreatePlayRecord = async () => {
    // 1. 사용자 정보 확인
    if (!userInfo?.id) {
      addToast({ message: '로그인 후 사용해주세요.' });
      return;
    }

    // 2. 타이틀과 AI 생성된 내용이 있는지 확인
    const reportCaptions = getReportCaptionsByType(currentType);
    if (reportCaptions.length === 0) {
      showAlert({ message: '먼저 타이틀을 입력해주세요.' });
      return;
    }

    // 3. AI 생성된 내용이 있는지 확인
    if (!hasAnyAiGeneratedContent()) {
      showAlert({ message: 'AI로 생성된 내용이 없습니다. 먼저 AI 생성을 해주세요.' });
      return;
    }

    // 로딩 시작
    setIsCreatingPlayRecord(true);

    // 재생성인 경우 기존 데이터를 먼저 클리어
    const isRegeneration = hasPlayRecordResult();
    if (isRegeneration) {
      clearPlayRecordResult();
    }

    const ageParam = searchParams.get('age');
    const age = ageParam ? parseInt(ageParam, 10) : 2; // 기본값: 2 (6세)

    // 오늘 날짜를 YYYY-MM-DD 형식으로 생성
    const today = new Date().toISOString().split('T')[0];

    const requestData = {
      profileId: userInfo.id,
      subject: currentType === 'B' ? '놀이 활동' : '놀이기록',
      age,
      startsAt: today,
      endsAt: today,
      reportCaptions
    };

    console.log(`놀이기록 ${isRegeneration ? '재생성' : '생성'} 요청 데이터:`, requestData);

    try {
      const endpoint = currentType === 'B' 
        ? '/api/ai/v2/report/type-b/create-record' 
        : currentType === 'C' 
          ? '/api/ai/v2/report/type-c/create-record' 
          : '/api/ai/v2/report/type-a/create-record';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`놀이기록 ${isRegeneration ? '재생성' : '생성'} 실패:`, errorData);
        showAlert({ message: `놀이기록 ${isRegeneration ? '재생성' : '생성'}에 실패했습니다. 다시 시도해주세요.` });
        return;
      }

      const result = await response.json();
      console.log(`놀이기록 ${isRegeneration ? '재생성' : '생성'} 성공:`, result);
      console.log('result 구조 확인:', JSON.stringify(result, null, 2));
      console.log('외부 API 응답 구조 확인:', result);

      // API 응답에서 실제 데이터는 result 객체 안에 있음
      const actualResult = result.result || result;
      console.log('실제 데이터:', actualResult);

      // zustand에 놀이기록 결과 저장
      const playRecordData = {
        subject: actualResult.subject || actualResult.playActivity || '',
        objective: actualResult.objective || actualResult.homeConnection || '',
        support: actualResult.support || actualResult.teacherSupport || actualResult.playLearning || '',
      };
      
      console.log('playRecordData 매핑 결과:', playRecordData);
      setPlayRecordResult(playRecordData);
      
      addToast({ message: `놀이기록이 성공적으로 ${isRegeneration ? '재생성' : '생성'}되었습니다.` });

    } catch (error) {
      console.error(`놀이기록 ${isRegeneration ? '재생성' : '생성'} 중 오류:`, error);
      showAlert({ message: `놀이기록 ${isRegeneration ? '재생성' : '생성'} 중 오류가 발생했습니다.` });
    } finally {
      // 로딩 종료 (성공/실패 상관없이)
      setIsCreatingPlayRecord(false);
    }
  };

  // 놀이기록 생성 버튼 활성화 조건 체크 (타입별 캡션 생성 규칙 반영)
  const reportCaptions = getReportCaptionsByType(currentType);
  const hasValidContent = reportCaptions.length > 0 && hasAnyAiGeneratedContent() && !isCreatingPlayRecord;

  return (
    <div className="flex flex-col gap-2.5 max-h-[calc(100vh-120px)] overflow-y-auto overflow-x-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      <Button
        className={`box-border flex flex-col gap-1 justify-center items-center py-3 pr-2 pl-2 rounded-xl h-[72px] w-[110px] max-sm:w-full max-sm:text-sm max-sm:max-w-[280px] ${
          hasValidContent 
            ? "bg-primary hover:bg-primary/80" 
            : "bg-gray-400 hover:bg-gray-400/80 cursor-not-allowed"
        }`}
        onClick={() => {
          if (hasValidContent) {
            handleCreatePlayRecord();
          }
        }}
        disabled={!hasValidContent}
      >
        <Image
          src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/create.svg"
          alt="magic"
          width={17.5}
          height={17.5}
          className="rounded-full object-cover flex-shrink-0"
        />
        <div className={`text-xs font-semibold leading-3 whitespace-nowrap flex items-center gap-1 max-sm:text-sm ${
          hasValidContent ? "text-white" : "text-gray-200"
        }`}>
          {hasPlayRecordResult() ? "놀이기록 재생성" : "놀이기록 생성"}
        </div>
      </Button>

      <Button
        variant="ghost"
        className="box-border flex gap-1 items-center py-3 pr-3 pl-2 bg-gray-50 hover:bg-gray-100 rounded-xl h-[42px] w-[110px] max-sm:w-full max-sm:max-w-[280px]"
        onClick={() => {
          setIsTypeModalOpen(true);
        }}
      >
        <Image
          src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/type.svg"
          alt="tv"
          width={18}
          height={18}
          className="rounded-full object-cover flex-shrink-0"
        />
        <div className="text-xs font-medium leading-3 text-gray-700 whitespace-nowrap flex items-center gap-1">
          타입 설정<div className="text-amber-400">({currentType})</div>
        </div>
      </Button>

      {/* A타입일 때만 놀이주제 표시 (B타입에서는 숨김) */}
      {currentType === "A" && (
        <Popover open={isSubjectPopoverOpen} onOpenChange={setIsSubjectPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="box-border flex gap-1 justify-center items-center py-3 pr-3.5 pl-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl h-[42px] w-[110px] max-sm:w-full max-sm:max-w-[280px]"
            >
              <Image
                src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/subject.svg"
                alt="theme"
                width={18}
                height={18}
                className="rounded-full object-cover flex-shrink-0"
              />
              <div className="text-xs font-medium leading-3 text-gray-700 whitespace-nowrap flex items-center gap-1">
                놀이 주제<div className="text-amber-400">({subjectCount})</div>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-0 shadow-lg" side="right" align="start" sideOffset={10}>
            <SubjectSelector
              selectedSubject={selectedSubject}
              onSubjectSelect={handleSubjectSelect}
              type={currentType as "A" | "B" | "C"}
            />
          </PopoverContent>
        </Popover>
      )}

      {/* C타입일 때만 사진개수 표시 */}
      {currentType === "C" && (
        <Popover open={isPhotoPopoverOpen} onOpenChange={setIsPhotoPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="box-border flex gap-1 justify-center items-center py-3 pr-3.5 pl-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl h-[42px] w-[110px] max-sm:w-full max-sm:max-w-[280px]"
            >
              <Image
                src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/photo.svg"
                alt="theme"
                width={18}
                height={18}
                className="rounded-full object-cover flex-shrink-0"
              />
              <div className="text-xs font-medium leading-3 text-gray-700 whitespace-nowrap flex items-center gap-1">
                사진 개수<div className="text-amber-400">({photoCount})</div>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-0 shadow-lg" side="right" align="start" sideOffset={10}>
            <PhotoSelector
              selectedPhoto={selectedPhoto}
              onPhotoSelect={handlePhotoSelect}
            />
          </PopoverContent>
        </Popover>
      )}

      <Popover open={isAgePopoverOpen} onOpenChange={setIsAgePopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="box-border flex gap-1 items-center pt-3.5 pr-4 pb-3.5 pl-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl h-[47px] w-[110px] max-sm:w-full max-sm:max-w-[280px]"
          >
            <Image
              src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/baby.svg"
              alt="baby"
              width={20}
              height={20}
              className="rounded-full object-cover flex-shrink-0"
            />
            <div className="text-xs font-medium leading-3 text-gray-700 whitespace-nowrap flex items-center gap-1">
              연령선택<div className="text-amber-400">({getAgeDisplay(selectedAge)})</div>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-0 shadow-lg" side="right" align="start" sideOffset={10}>
          <AgeSelector
            selectedAge={selectedAge}
            onAgeSelect={handleAgeSelect}
          />
        </PopoverContent>
      </Popover>

      <TypeSelectionModal
        isOpen={isTypeModalOpen}
        onSelect={handleTypeSelect}
        onCancel={handleTypeModalCancel}
      />

      <ApplyModal
        open={isApplyModalOpen}
        onOpenChange={setIsApplyModalOpen}
        description={getApplyModalMessage()}
        onConfirm={handleApplyModalConfirm}
        onCancel={handleApplyModalCancel}
        confirmText="확인"
        cancelText="취소"
      >
        <div />
      </ApplyModal>

      {/* InputDesign styling panel at the bottom */}
      {/* <div className="mt-4 overflow-visible">
        <InputDesign />
      </div> */}

      {/* 놀이기록 생성 로딩 오버레이 */}
      {isCreatingPlayRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 배경 오버레이 (opacity 20%) */}
          <div className="absolute inset-0 bg-black opacity-20" />
          
          {/* 중앙 로더 */}
          <div className="relative z-10 p-8">
            <Loader 
              size="xl" 
              text="놀이기록을 생성하고 있습니다..."
              className="text-center"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function RightSideBar() {
  return (
    <Suspense fallback={
      <div className="flex flex-col gap-2.5 animate-pulse">
        <div className="h-[42px] w-[110px] bg-gray-200 rounded-xl"></div>
        <div className="h-[42px] w-[110px] bg-gray-200 rounded-xl"></div>
        <div className="h-[42px] w-[110px] bg-gray-200 rounded-xl"></div>
        <div className="h-[47px] w-[110px] bg-gray-200 rounded-xl"></div>
      </div>
    }>
      <RightSideBarContent />
    </Suspense>
  );
}
