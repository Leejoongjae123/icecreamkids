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
import AgeSelector from "./AgeSelector";
import SubjectSelector from "./SubjectSelector";
import PhotoSelector from "./PhotoSelector";
import InputDesign from "./InputDesign";

function RightSideBarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentType = searchParams.get("type") || "A";

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
    setSelectedSubject(subject);
    setIsSubjectPopoverOpen(false);
    // Update the count logic as needed
    const count = parseInt(subject.replace("개", ""));
    setSubjectCount(count);
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

  return (
    <div className="flex flex-col gap-2.5 max-h-[calc(100vh-120px)] overflow-y-auto overflow-x-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      <Button
        className="box-border flex flex-col gap-1 justify-center items-center py-3 pr-2 pl-2 bg-primary hover:bg-primary/80 rounded-xl h-[72px] w-[110px] max-sm:w-full max-sm:text-sm max-sm:max-w-[280px]"
        onClick={() => {
          // 놀이기록 생성 로직
          console.log("놀이기록 생성");
        }}
      >
        <Image
          src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/create.svg"
          alt="magic"
          width={17.5}
          height={17.5}
          className="rounded-full object-cover flex-shrink-0"
        />
        <div className="text-xs font-semibold leading-3 text-white whitespace-nowrap flex items-center gap-1 max-sm:text-sm">
          놀이기록 생성
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

      {/* InputDesign styling panel at the bottom */}
      {/* <div className="mt-4 overflow-visible">
        <InputDesign />
      </div> */}
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
