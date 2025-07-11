"use client";
import React, { useState } from "react";
import Image from "next/image";
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

export default function RightSideBar() {
  const [selectedAge, setSelectedAge] = useState("6세");
  const [isAgePopoverOpen, setIsAgePopoverOpen] = useState(false);
  const [ageCount, setAgeCount] = useState(3);
  
  const [selectedSubject, setSelectedSubject] = useState("4개");
  const [isSubjectPopoverOpen, setIsSubjectPopoverOpen] = useState(false);
  const [subjectCount, setSubjectCount] = useState(4);

  const [selectedPhoto, setSelectedPhoto] = useState("4개");
  const [isPhotoPopoverOpen, setIsPhotoPopoverOpen] = useState(false);
  const [photoCount, setPhotoCount] = useState(4);

  const [selectedType, setSelectedType] = useState("A");
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);

  const handleAgeSelect = (age: string) => {
    setSelectedAge(age);
    setIsAgePopoverOpen(false);
    // Update the count logic based on selected age
    const ageCountMap: { [key: string]: number } = {
      "7세": 5,
      "6세": 3,
      "5세": 4,
      "0~2세": 2,
    };
    setAgeCount(ageCountMap[age] || 0);
    console.log(`연령 선택: ${age}`);
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
    setSelectedType(type);
    setIsTypeModalOpen(false);
    console.log(`타입 선택: ${type}`);
  };

  const handleTypeModalCancel = () => {
    setIsTypeModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-2.5 ">
      <Button
        className="box-border flex gap-1 justify-center items-center py-3 pr-2 pl-2 bg-amber-400 hover:bg-amber-500 rounded-xl h-[42px] w-[110px] max-sm:w-full max-sm:text-sm max-sm:max-w-[280px]"
        onClick={() => {
          // 놀이기록 생성 로직
          console.log("놀이기록 생성");
        }}
      >
        <Image
          src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/create.svg"
          alt="magic"
          width={20}
          height={20}
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
        />
        <div className="text-xs font-medium leading-3 text-gray-700 whitespace-nowrap flex items-center gap-1">
          타입 설정<div className="text-amber-400">({selectedType})</div>
        </div>
      </Button>

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
            />
            <div className="text-xs font-medium leading-3 text-gray-700 whitespace-nowrap flex items-center gap-1">
              놀이 주제<div className="text-amber-400">({subjectCount})</div>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-0 shadow-lg" side="right" align="start" sideOffset={10}>
          <SubjectSelector
            selectedAge={selectedSubject}
            onAgeSelect={handleSubjectSelect}
          />
        </PopoverContent>
      </Popover>

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
            />
            <div className="text-xs font-medium leading-3 text-gray-700 whitespace-nowrap flex items-center gap-1">
              연령선택<div className="text-amber-400">({selectedAge.replace('세', '')})</div>
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
    </div>
  );
}
