"use client";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface SubjectSelectorProps {
  selectedSubject?: string;
  onSubjectSelect: (subject: string) => void;
}

export default function SubjectSelector({
  selectedSubject = "4개",
  onSubjectSelect,
}: SubjectSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subjects = ["4개", "3개", "2개", "1개"];

  // URL에서 숫자만 읽어서 "개"를 붙여서 현재 선택된 subject 찾기
  const subjectParam = searchParams.get('subject');
  const currentSubject = subjectParam ? `${subjectParam}개` : selectedSubject;

  const handleSubjectSelect = (subject: string) => {
    // 기존 onSubjectSelect 호출
    onSubjectSelect(subject);

    // URL searchParams에 숫자만 추가 ("개" 제거)
    const subjectNumber = subject.replace('개', '');
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set('subject', subjectNumber);
    
    // URL 업데이트 (페이지 리로드 없이)
    router.push(`?${currentParams.toString()}`);
  };

  return (
    <div className="flex overflow-hidden flex-col px-4 py-5 text-sm font-medium leading-none text-center text-gray-700 bg-white max-w-[78px] rounded-xl">
      <div className="self-start text-[11px] leading-none text-amber-400">
        놀이주제 수를
        <br />
        선택해주세요
      </div>
      <div className="flex flex-col mt-5 w-full">
        {subjects.map((subject, index) => (
          <button
            key={subject}
            onClick={() => handleSubjectSelect(subject)}
            className={`
              flex overflow-hidden flex-col justify-center items-center w-full whitespace-nowrap h-[46px] rounded-[50px] transition-colors
              ${index === 0 ? "" : "mt-2.5"}
              ${subject === "0~2세" ? "px-1" : "px-3"}
              ${
                currentSubject === subject
                  ? "font-semibold text-white bg-amber-400 hover:bg-amber-500"
                  : "bg-gray-50 hover:bg-gray-100"
              }
            `}
          >
            <div>{subject}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
