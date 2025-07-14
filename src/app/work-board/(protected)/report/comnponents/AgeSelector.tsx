"use client";
import React from "react";

interface AgeSelectorProps {
  selectedAge?: string | number;
  onAgeSelect: (age: string) => void;
}

export default function AgeSelector({
  selectedAge = "6세",
  onAgeSelect,
}: AgeSelectorProps) {
  const ages = ["7세", "6세", "5세", "0~2세"];
  
  // 연령 문자열을 숫자로 매핑
  const ageToNumber = (ageString: string): number => {
    switch (ageString) {
      case "7세":
        return 7;
      case "6세":
        return 6;
      case "5세":
        return 5;
      case "0~2세":
        return 0;
      default:
        return 6;
    }
  };
  
  // selectedAge를 안전하게 문자열로 변환
  const getSelectedAgeString = (age: string | number | undefined): string => {
    if (age === undefined || age === null) {
      return "6세";
    }
    
    if (typeof age === "number") {
      // 숫자를 문자열로 변환
      switch (age) {
        case 7:
          return "7세";
        case 6:
          return "6세";
        case 5:
          return "5세";
        case 0:
          return "0~2세";
        default:
          return "6세";
      }
    }
    
    if (typeof age === "string") {
      // 문자열인 경우 숫자 형태인지 확인
      const numericAge = parseInt(age);
      if (!isNaN(numericAge)) {
        // 숫자 형태의 문자열인 경우
        switch (numericAge) {
          case 7:
            return "7세";
          case 6:
            return "6세";
          case 5:
            return "5세";
          case 0:
            return "0~2세";
          default:
            return "6세";
        }
      }
      
      // 이미 "6세" 형태의 문자열인 경우 그대로 반환
      return age;
    }
    
    return "6세";
  };

  const currentSelectedAge = getSelectedAgeString(selectedAge);

  return (
    <div className="flex overflow-hidden flex-col px-4 py-5 text-sm font-medium leading-none text-center text-gray-700 bg-white max-w-[78px] rounded-xl">
      <div className="self-start text-xs leading-none text-amber-400">
        연령 선택
      </div>
      <div className="flex flex-col mt-5 w-full">
        {ages.map((age, index) => (
          <button
            key={age}
            onClick={() => onAgeSelect(String(ageToNumber(age)))}
            className={`
              flex overflow-hidden flex-col justify-center items-center w-full whitespace-nowrap h-[46px] rounded-[50px] transition-colors
              ${index === 0 ? "" : "mt-2.5"}
              ${age === "0~2세" ? "px-1" : "px-3"}
              ${
                currentSelectedAge === age
                  ? "font-semibold text-white bg-amber-400 hover:bg-amber-500"
                  : "bg-gray-50 hover:bg-gray-100"
              }
            `}
          >
            <div>{age}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
