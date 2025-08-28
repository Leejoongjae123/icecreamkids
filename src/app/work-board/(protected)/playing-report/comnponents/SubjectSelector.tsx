"use client";
import React from "react";
import { useSearchParams } from "next/navigation";

interface SubjectSelectorProps {
  selectedSubject?: string;
  onSubjectSelect: (subject: string) => void;
  type?: "A" | "B" | "C";
}

export default function SubjectSelector({
  selectedSubject = "4개",
  onSubjectSelect,
  type = "A",
}: SubjectSelectorProps) {
  const searchParams = useSearchParams();
  
  // 타입에 따라 다른 subjects 배열 사용
  const getSubjectsByType = (type: "A" | "B" | "C") => {
    switch (type) {
      case "A":
        return ["4개", "3개", "2개", "1개"];
      case "B":
        return ["12개", "11개", "10개", "9개", "8개", "7개", "6개", "5개", "4개", "3개", "2개", "1개"];
      default:
        return ["4개", "3개", "2개", "1개"];
    }
  };

  const subjects = getSubjectsByType(type);

  // URL에서 숫자만 읽어서 "개"를 붙여서 현재 선택된 subject 찾기
  const subjectParam = searchParams.get('subject');
  const currentSubject = subjectParam ? `${subjectParam}개` : selectedSubject;

  const handleSubjectSelect = (subject: string) => {
    // 확인 모달에서 최종 확정되기 전까지는 URL을 변경하지 않는다.
    // 상위 컴포넌트(RightSideBar)로 선택만 전달하고, URL 변경은 상위가 ApplyModal 확인 시 처리.
    onSubjectSelect(subject);
  };
  
  return (
    <div className="flex overflow-hidden flex-col text-sm font-medium leading-none text-center text-gray-700 bg-white max-w-[94px] rounded-xl justify-center items-center px-3 py-2 scrollbar-hide">
      <div className="self-start text-[11px] leading-none text-amber-400">
        놀이주제 수를
        <br />
        선택해주세요
      </div>
      <div className="flex flex-col mt-5 w-full h-full ">
        {subjects.map((subject, index) => (
          <button
            key={subject}
            onClick={() => handleSubjectSelect(subject)}
            className={`
              flex justify-center items-center w-[46px] h-[46px] rounded-full transition-colors flex-shrink-0
              ${index === 0 ? "" : "mt-2.5"}
              ${
                currentSubject === subject
                  ? "font-semibold text-white bg-amber-400 hover:bg-amber-500"
                  : "bg-gray-50 hover:bg-gray-100"
              }
            `}
          >
            <div className="text-xs">{subject}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
