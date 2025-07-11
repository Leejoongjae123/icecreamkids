"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import type { ITypeSelectionModal } from "./types";

export function TypeSelectionModal({
  isOpen,
  onSelect,
  onCancel,
}: ITypeSelectionModal) {
  const [selectedType, setSelectedType] = useState<"A" | "B" | "C">("A");

  const handleTypeSelect = (type: "A" | "B" | "C") => {
    setSelectedType(type);
  };

  const handleConfirm = () => {
    onSelect(selectedType);
  };

  const handleCancel = () => {
    onCancel();
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <style>
        {/* 모달 켜짐 시 스크롤 비활성화 */}
        {`
          body {
            overflow: hidden;
          }
        `}
      </style>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="relative mx-auto my-0 bg-white rounded-3xl h-[586px] w-[735px]">
          <div className="absolute top-10 left-10 h-5 text-xl font-semibold tracking-tight leading-5 text-gray-700 w-[72px]">
            타입 선택
          </div>
          <div className="flex absolute shrink-0 justify-center items-center p-0.5 w-6 h-6 bg-white border border-solid border-zinc-100 left-[671px] rounded-[50px] top-[38px]">
            <button onClick={handleCancel}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="close-icon"
                style={{ width: "20px", height: "20px", flexShrink: 0 }}
              >
                <path
                  d="M5.83203 5.83337L14.1654 14.1667M5.83203 14.1667L14.1654 5.83337"
                  stroke="#333D4B"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <div className="absolute shrink-0 h-[42px] left-[263px] top-[504px] w-[210px]">
            <button
              onClick={handleConfirm}
              className="flex absolute top-0 shrink-0 justify-center items-center px-0 pt-3 pb-3.5 bg-amber-400 rounded-md h-[42px] left-[110px] w-[100px]"
            >
              <div className="absolute top-3 left-9 w-7 h-4 text-base font-medium tracking-tight leading-4 text-white">
                적용
              </div>
            </button>
            <button
              onClick={handleCancel}
              className="flex absolute top-0 left-0 shrink-0 justify-center items-center px-0 pt-3 pb-3.5 bg-gray-50 rounded-md border border-solid border-zinc-100 h-[42px] w-[100px]"
            >
              <div className="absolute top-3 left-9 w-7 h-4 text-base font-medium tracking-tight leading-4 text-gray-700">
                닫기
              </div>
            </button>
          </div>
          <img
            src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/typeA.png"
            alt=""
            onClick={() => handleTypeSelect("A")}
            className={`absolute left-10 shrink-0 rounded-lg h-[266px] top-[154px] w-[205px] max-sm:mb-5 max-sm:w-full max-sm:h-auto max-sm:max-w-[300px] cursor-pointer ${
              selectedType === "A"
                ? "border-4 border-amber-400 border-solid"
                : "border border-solid border-zinc-100"
            }`}
          />
          <img
            src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/typeB.png"
            alt=""
            onClick={() => handleTypeSelect("B")}
            className={`absolute shrink-0 rounded-lg h-[266px] left-[265px] top-[154px] w-[205px] max-sm:mb-5 max-sm:w-full max-sm:h-auto max-sm:max-w-[300px] cursor-pointer ${
              selectedType === "B"
                ? "border-4 border-amber-400 border-solid"
                : "border border-solid border-zinc-100"
            }`}
          />
          <img
            src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/typeC.png"
            alt=""
            onClick={() => handleTypeSelect("C")}
            className={`absolute shrink-0 rounded-lg h-[266px] left-[490px] top-[154px] w-[205px] max-sm:mb-5 max-sm:w-full max-sm:h-auto max-sm:max-w-[300px] cursor-pointer ${
              selectedType === "C"
                ? "border-4 border-amber-400 border-solid"
                : "border border-solid border-zinc-100"
            }`}
          />
          <button
            onClick={() => handleTypeSelect("A")}
            className={`inline-flex absolute justify-center items-center px-5 py-3.5 h-[42px] left-[104px] rounded-[50px] top-[100px] w-[78px] ${
              selectedType === "A" ? "bg-amber-400" : "bg-gray-50"
            }`}
          >
            <div
              className={`absolute left-5 h-4 text-base font-medium tracking-tight leading-4 top-[13px] w-[38px] ${
                selectedType === "A" ? "text-white" : "text-zinc-400"
              }`}
            >
              A타입
            </div>
          </button>
          <button
            onClick={() => handleTypeSelect("B")}
            className={`inline-flex absolute justify-center items-center py-3.5 pr-5 pl-5 h-[42px] left-[329px] rounded-[50px] top-[100px] w-[78px] ${
              selectedType === "B" ? "bg-amber-400" : "bg-gray-50"
            }`}
          >
            <div
              className={`absolute left-5 h-4 text-base font-medium tracking-tight leading-4 top-[13px] w-[37px] ${
                selectedType === "B" ? "text-white" : "text-zinc-400"
              }`}
            >
              B타입
            </div>
          </button>
          <button
            onClick={() => handleTypeSelect("C")}
            className={`inline-flex absolute justify-center items-center px-5 py-3.5 h-[42px] left-[554px] rounded-[50px] top-[100px] w-[78px] ${
              selectedType === "C" ? "bg-amber-400" : "bg-gray-50"
            }`}
          >
            <div
              className={`absolute left-5 h-4 text-base font-medium tracking-tight leading-4 top-[13px] w-[38px] ${
                selectedType === "C" ? "text-white" : "text-zinc-400"
              }`}
            >
              C타입
            </div>
          </button>
          <div className="inline-flex absolute left-10 shrink-0 justify-center items-center px-5 py-0 h-12 bg-gray-50 rounded-md top-[432px] w-[205px]">
            <div className="absolute h-3 text-xs tracking-tight leading-3 text-gray-700 left-[21px] top-[18px] w-[163px]">
              1~4개 놀이 주제 생성이 가능합니다.
            </div>
          </div>
          <div className="inline-flex absolute shrink-0 justify-center items-center px-2 py-0 h-12 bg-gray-50 rounded-md left-[265px] top-[432px] w-[205px]">
            <div className="absolute left-2 h-3 text-xs tracking-tight leading-3 text-gray-700 top-[18px] w-[189px]">
              최대 12개의 놀이 주제 생성이 가능합니다.
            </div>
          </div>
          <div className="inline-flex absolute justify-center items-center py-2 pr-9 pl-9 h-12 bg-gray-50 rounded-md left-[490px] top-[432px] w-[205px]">
            <div className="absolute top-2 h-8 text-xs tracking-tight leading-4 text-center text-gray-700 left-[37px] w-[132px]">
              최대 9장의 사진으로 1개의
              <br />
              놀이 주제 생성이 가능합니다.
            </div>
          </div>
        </div>
      </div>
    </>,
    document.getElementById("modal-root") as HTMLElement,
  );
}
