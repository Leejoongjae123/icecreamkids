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
import Loader from "@/components/common/Loader";
import useGridCStore from "@/hooks/store/useGridCStore";
import FilterButton from "@/components/ui/filter-button";
import { useLoadingState } from "@/hooks/useLoadingState";

function RightSideBarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentType = searchParams.get("type") || "A";
  const {
    hasAnyContent,
    clearGridsByType,
    clearAllGridContents,
    hasAnyAiGeneratedContent,
    getAllReportCaptions,
    getReportCaptionsByType,
  } = useGridContentStore();
  const { userInfo } = useUserStore();
  const addToast = useToast((state) => state.add);
  const { showAlert } = useAlertStore();
  const { setPlayRecordResult, hasPlayRecordResult, clearPlayRecordResult } =
    usePlayRecordStore();

  const [selectedAge, setSelectedAge] = useState("6세");
  const [isAgePopoverOpen, setIsAgePopoverOpen] = useState(false);
  const [ageCount, setAgeCount] = useState(3);

  // searchParams에서 초기값 읽어오기 - 타입에 따라 기본값 다르게 설정
  const getDefaultSubject = (type: string) => {
    return type === "B" ? "12개" : "4개";
  };

  const [selectedSubject, setSelectedSubject] = useState(
    searchParams.get("subject")
      ? `${searchParams.get("subject")}개`
      : getDefaultSubject(currentType)
  );
  const [isSubjectPopoverOpen, setIsSubjectPopoverOpen] = useState(false);
  const [subjectCount, setSubjectCount] = useState(
    parseInt(searchParams.get("subject") || (currentType === "B" ? "12" : "4"))
  );

  // typeC일 때만 photo 초기값 설정
  const [selectedPhoto, setSelectedPhoto] = useState(
    currentType === "C"
      ? searchParams.get("photo")
        ? `${searchParams.get("photo")}개`
        : "9개"
      : "9개"
  );
  const [isPhotoPopoverOpen, setIsPhotoPopoverOpen] = useState(false);
  const [photoCount, setPhotoCount] = useState(
    currentType === "C" ? parseInt(searchParams.get("photo") || "9") : 9
  );

  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);

  // ApplyModal 관련 상태
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: "TYPE_CHANGE" | "SUBJECT_CHANGE";
    data: any;
  } | null>(null);

  // 놀이기록 생성 로딩 상태
  const [isCreatingPlayRecord, setIsCreatingPlayRecord] = useState(false);
  const { getImagesPayload, getImagesForValidation } = useGridCStore();
  // 상태 변경에 반응하도록 byGridId를 구독 (버튼 활성화 즉시 반영)
  const gridCMap = useGridCStore((s) => s.byGridId);

  // useLoadingState로 로딩 메시지/표시 관리
  const { isLoading: isLoadingCreate, message: loadingMessage } = useLoadingState([
    {
      name: "CreatePlayRecord",
      isLoading: isCreatingPlayRecord,
      message: "놀이기록 생성중입니다. 잠시만 기다려주세요.",
      priority: 1,
    },
  ]);

  // 초기 렌더링 시 searchParams에서 age 값 읽어오기
  useEffect(() => {
    const ageParam = searchParams.get("age");
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

    // B타입과 C타입일 때는 subject 관련 상태를 설정하지 않음
    if (currentType === "B" || currentType === "C") {
      return;
    }

    const subjectParam = searchParams.get("subject");
    console.log("subjectParam:", subjectParam);

    if (!subjectParam) {
      // URL에 subject 파라미터가 없으면 타입에 따른 기본값 설정
      const defaultSubject = getDefaultSubject(currentType);
      console.log("기본값 설정:", defaultSubject);
      setSelectedSubject(defaultSubject);
      setSubjectCount(parseInt(defaultSubject.replace("개", "")));
    } else {
      // URL에 subject 파라미터가 있으면 그 값 사용
      console.log("URL 파라미터 사용:", `${subjectParam}개`);
      setSelectedSubject(`${subjectParam}개`);
      setSubjectCount(parseInt(subjectParam));
    }
  }, [currentType, searchParams]);

  // 타입이 변경될 때 photo 관련 상태 업데이트
  useEffect(() => {
    console.log(
      "useEffect 실행 - photo 상태 업데이트, 현재 타입:",
      currentType
    );

    // C타입이 아닐 때는 photo 관련 상태를 초기화
    if (currentType !== "C") {
      return;
    }

    const photoParam = searchParams.get("photo");
    console.log("photoParam:", photoParam);

    if (!photoParam) {
      // URL에 photo 파라미터가 없으면 기본값 설정
      console.log("기본값 설정: 9개");
      setSelectedPhoto("9개");
      setPhotoCount(9);
    } else {
      // URL에 photo 파라미터가 있으면 그 값 사용
      console.log("URL 파라미터 사용:", `${photoParam}개`);
      setSelectedPhoto(`${photoParam}개`);
      setPhotoCount(parseInt(photoParam));
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
        type: "SUBJECT_CHANGE",
        data: { subject, count },
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

    // searchParams 업데이트
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("photo", count.toString());
    router.push(`?${newSearchParams.toString()}`);

    console.log(`사진 개수 선택: ${photo}`);
  };

  const handleTypeSelect = (type: "A" | "B" | "C") => {
    // 기존에 작업한 내용이 있는지 확인
    if (hasAnyContent()) {
      // 확인 모달 띄우기
      setPendingAction({
        type: "TYPE_CHANGE",
        data: { type },
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

    // B타입과 C타입일 때는 subject 파라미터 제거
    if (type === "B" || type === "C") {
      newSearchParams.delete("subject");
    }

    // C타입이 아닐 때는 photo 파라미터 제거, C타입일 때는 photo 기본값 설정
    if (type !== "C") {
      newSearchParams.delete("photo");
    } else {
      // C타입일 때 photo 기본값을 9로 설정
      newSearchParams.set("photo", "9");
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

    if (pendingAction.type === "TYPE_CHANGE") {
      // 모든 Grid 내용 초기화
      clearAllGridContents();
      applyTypeChange(pendingAction.data.type);
    } else if (pendingAction.type === "SUBJECT_CHANGE") {
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

    if (pendingAction.type === "TYPE_CHANGE") {
      return "타입을 변경할떄 기존에 입력한 내용이 모두  초기화 됩니다. 진행하시겠습니까?";
    } else if (pendingAction.type === "SUBJECT_CHANGE") {
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
      addToast({ message: "로그인 후 사용해주세요." });
      return;
    }

    // 타입별 유효성 체크
    const reportCaptions = getReportCaptionsByType(currentType);
    if (currentType === "C") {
      const images = getImagesPayload(); // 서버 이미지만 가져오기
      const allImages = getImagesForValidation(); // 로컬 이미지 포함
      const hasText = allImages.some(
        (it) => (it.userTextForImage || "").trim().length > 0
      );

      // 로컬 이미지만 있고 서버 이미지가 없는 경우 경고
      if (allImages.length > 0 && images.length === 0) {
        showAlert({
          message:
            "로컬 이미지는 놀이기록 생성에 사용할 수 없습니다. 클라우드에 업로드된 이미지를 사용해주세요.",
        });
        return;
      }

      if (!images.length || !hasText) {
        showAlert({ message: "이미지와 키워드를 입력해주세요." });
        return;
      }
    } else {
      if (reportCaptions.length === 0) {
        showAlert({ message: "먼저 타이틀을 입력해주세요." });
        return;
      }
      if (!hasAnyAiGeneratedContent()) {
        showAlert({
          message: "AI로 생성된 내용이 없습니다. 먼저 AI 생성을 해주세요.",
        });
        return;
      }
    }

    // 로딩 시작
    setIsCreatingPlayRecord(true);

    // 재생성인 경우 기존 데이터를 먼저 클리어
    const isRegeneration = hasPlayRecordResult();
    if (isRegeneration) {
      clearPlayRecordResult();
    }

    const ageParam = searchParams.get("age");
    const age = ageParam ? parseInt(ageParam, 10) : 2; // 기본값: 2 (6세)

    // 오늘 날짜를 YYYY-MM-DD 형식으로 생성
    const today = new Date().toISOString().split("T")[0];

    const requestData =
      currentType === "C"
        ? {
            profileId: userInfo.id,
            age,
            images: getImagesPayload(),
          }
        : {
            profileId: userInfo.id,
            subject: currentType === "B" ? "놀이 활동" : "놀이기록",
            age,
            startsAt: today,
            endsAt: today,
            reportCaptions,
          };

    console.log(
      `놀이기록 ${isRegeneration ? "재생성" : "생성"} 요청 데이터:`,
      requestData
    );

    try {
      const endpoint =
        currentType === "B"
          ? "/api/ai/v2/report/type-b/create-record"
          : currentType === "C"
            ? "/api/ai/v2/report/type-c/create-record"
            : "/api/ai/v2/report/type-a/create-record";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          `놀이기록 ${isRegeneration ? "재생성" : "생성"} 실패:`,
          errorData
        );
        showAlert({
          message: `놀이기록 ${isRegeneration ? "재생성" : "생성"}에 실패했습니다. 다시 시도해주세요.`,
        });
        return;
      }

      const result = await response.json();
      console.log(
        `놀이기록 ${isRegeneration ? "재생성" : "생성"} 성공:`,
        result
      );
      console.log("result 구조 확인:", JSON.stringify(result, null, 2));
      console.log("외부 API 응답 구조 확인:", result);

      // API 응답에서 실제 데이터는 result 객체 안에 있음
      const actualResult = result.result || result;
      console.log("실제 데이터:", actualResult);

      // zustand에 놀이기록 결과 저장
      const playRecordData = {
        subject: actualResult.subject || actualResult.playActivity || "",
        objective: actualResult.objective || actualResult.homeConnection || "",
        support:
          actualResult.support ||
          actualResult.teacherSupport ||
          actualResult.playLearning ||
          "",
      };

      console.log("playRecordData 매핑 결과:", playRecordData);
      setPlayRecordResult(playRecordData);

      addToast({
        message: `놀이기록이 성공적으로 ${isRegeneration ? "재생성" : "생성"}되었습니다.`,
      });
    } catch (error) {
      console.error(
        `놀이기록 ${isRegeneration ? "재생성" : "생성"} 중 오류:`,
        error
      );
      showAlert({
        message: `놀이기록 ${isRegeneration ? "재생성" : "생성"} 중 오류가 발생했습니다.`,
      });
    } finally {
      // 로딩 종료 (성공/실패 상관없이)
      setIsCreatingPlayRecord(false);
    }
  };

  // 놀이기록 생성 버튼 활성화 조건 체크 (타입별 캡션 생성 규칙 반영)
  const reportCaptions = getReportCaptionsByType(currentType);
  // gridCMap이 바뀌면 재계산되도록 의도적으로 참조
  const hasValidContent =
    currentType === "C"
      ? (() => {
          const _ = gridCMap; // subscribe only
          const imgs = getImagesForValidation(); // 로컬 이미지도 포함하여 검증
          // 체크된 모든 그리드에 이미지와 키워드가 입력되어야 함
          return (
            imgs.length > 0 &&
            imgs.every((it) => (it.userTextForImage || "").trim().length > 0) &&
            !isLoadingCreate
          );
        })()
      : reportCaptions.length > 0 &&
        hasAnyAiGeneratedContent() &&
        !isLoadingCreate;

  return (
    <div className="flex flex-col gap-2.5 max-h-[calc(100vh-120px)] overflow-y-auto overflow-x-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      <button
        className={`flex relative flex-col gap-1 justify-center items-center w-32 h-32 rounded-xl max-md:h-[120px] max-md:w-[120px] max-sm:gap-0.5 max-sm:h-[100px] max-sm:w-[100px] ${
          hasValidContent
            ? "bg-gradient-to-b from-[#FFC636] to-[#F88716] hover:from-[#FFC636]/80 hover:to-[#F88716]/80"
            : "bg-gradient-to-b from-[#E0E0E0] to-[#CCCCCC] hover:from-[#E0E0E0]/80 hover:to-[#CCCCCC]/80 cursor-not-allowed"
        }`}
        onClick={() => {
          if (hasValidContent) {
            handleCreatePlayRecord();
          }
        }}
        disabled={!hasValidContent}
        type="button"
      >
        <div>
          <Image
            src="/report/lines-sparkle.svg"
            alt="magic"
            width={40}
            height={40}
            className="flex-shrink-0"
          />
        </div>
        <div className="relative text-base font-medium tracking-tight leading-6 text-center text-white max-md:text-base max-md:leading-6 max-sm:text-sm max-sm:tracking-tight max-sm:leading-5">
          <span
            className={`text-base max-md:text-base max-sm:text-sm whitespace-pre-line ${
              hasValidContent ? "text-white" : "text-gray-200"
            }`}
          >
            {hasPlayRecordResult() ? "놀이기록\n재생성" : "놀이기록\n생성하기"}
          </span>
        </div>
      </button>

      <Button
        variant="ghost"
        className="box-border flex gap-1 items-center py-3 pr-3 pl-2 bg-white border-solid border-[1px] border-[#CCCCCC] hover:bg-gray-100 rounded-xl h-[42px] w-[128px] max-sm:w-full max-sm:max-w-[280px]"
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
        <div className="text-[14px] font-medium leading-3 text-black whitespace-nowrap flex items-center gap-1 ">
          타입 설정<div className="text-amber-400">({currentType})</div>
        </div>
      </Button>

      {/* A타입일 때만 놀이주제 표시 (B타입에서는 숨김) */}
      {currentType === "A" && (
        <Popover
          open={isSubjectPopoverOpen}
          onOpenChange={setIsSubjectPopoverOpen}
        >
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="box-border flex gap-1 items-center py-3 pr-3 pl-2 bg-white border-solid border-[1px] border-[#CCCCCC] hover:bg-gray-100 rounded-xl h-[42px] w-[128px] max-sm:w-full max-sm:max-w-[280px]"
            >
              <Image
                src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/subject.svg"
                alt="theme"
                width={18}
                height={18}
                className="rounded-full object-cover flex-shrink-0"
              />
              <div className="text-[14px] font-medium leading-3 text-black whitespace-nowrap flex items-center gap-1">
                놀이 주제<div className="text-amber-400">({subjectCount})</div>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 border-0 shadow-lg"
            side="right"
            align="start"
            sideOffset={10}
          >
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
              className="box-border flex gap-1 items-center py-3 pr-3 pl-2 bg-white border-solid border-[1px] border-[#CCCCCC] hover:bg-gray-100 rounded-xl h-[42px] w-[128px] max-sm:w-full max-sm:max-w-[280px]"
            >
              <Image
                src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/photo.svg"
                alt="theme"
                width={18}
                height={18}
                className="rounded-full object-cover flex-shrink-0"
              />
              <div className="text-[14px] font-medium leading-3 text-black whitespace-nowrap flex items-center gap-1 ">
                사진 개수<div className="text-amber-400">({photoCount})</div>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 border-0 shadow-lg"
            side="right"
            align="start"
            sideOffset={10}
          >
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
            className="box-border flex gap-1 items-center py-3 pr-3 pl-2 bg-white border-solid border-[1px] border-[#CCCCCC] hover:bg-gray-100 rounded-xl h-[42px] w-[128px] max-sm:w-full max-sm:max-w-[280px]"
          >
            <Image
              src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/baby.svg"
              alt="baby"
              width={20}
              height={20}
              className="rounded-full object-cover flex-shrink-0"
            />
            <div className="text-[14px] font-medium leading-3 text-black whitespace-nowrap flex items-center gap-1">
              연령 선택
              <div className="text-amber-400">
                ({getAgeDisplay(selectedAge)})
              </div>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 border-0 shadow-lg"
          side="right"
          align="start"
          sideOffset={10}
        >
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
      {isLoadingCreate && (
        <Loader hasOverlay loadingMessage={loadingMessage || "놀이기록 생성중입니다. 잠시만 기다려주세요."} />
      )}
    </div>
  );
}

export default function RightSideBar() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-2.5 animate-pulse">
          <div className="h-[42px] w-[110px] bg-gray-200 rounded-xl"></div>
          <div className="h-[42px] w-[110px] bg-gray-200 rounded-xl"></div>
          <div className="h-[42px] w-[110px] bg-gray-200 rounded-xl"></div>
          <div className="h-[47px] w-[110px] bg-gray-200 rounded-xl"></div>
        </div>
      }
    >
      <RightSideBarContent />
    </Suspense>
  );
}
