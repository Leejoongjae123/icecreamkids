"use client";
import React from "react";

interface AgeSelectorProps {
  selectedAge?: string;
  onAgeSelect: (age: string) => void;
}

export default function AgeSelector({
  selectedAge = "6세",
  onAgeSelect,
}: AgeSelectorProps) {
  const ages = ["7세", "6세", "5세", "0~2세"];

  return (
    <div className="flex overflow-hidden flex-col px-4 py-5 text-sm font-medium leading-none text-center text-gray-700 bg-white max-w-[78px] rounded-xl">
      <div className="self-start text-xs leading-none text-amber-400">
        연령 선택
      </div>
      <div className="flex flex-col mt-5 w-full">
        {ages.map((age, index) => (
          <button
            key={age}
            onClick={() => onAgeSelect(age)}
            className={`
              flex overflow-hidden flex-col justify-center items-center w-full whitespace-nowrap h-[46px] rounded-[50px] transition-colors
              ${index === 0 ? "" : "mt-2.5"}
              ${age === "0~2세" ? "px-1" : "px-3"}
              ${
                selectedAge === age
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
