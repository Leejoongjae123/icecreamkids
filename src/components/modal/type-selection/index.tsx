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
        <div className="flex overflow-hidden flex-col text-base font-semibold tracking-tight leading-none bg-white rounded-3xl max-w-[400px] shadow-[1px_1px_4px_rgba(140,194,215,0.1)]">
          <div className="flex overflow-hidden gap-5 justify-between py-3 px-5 w-full text-gray-700 whitespace-nowrap border-b border-zinc-100">
            <div className="my-auto">타입선택</div>
            <button
              onClick={handleCancel}
              className="flex items-center justify-center"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="object-contain shrink-0 w-5 aspect-square"
              >
                <path
                  d="M15 5L5 15M5 5L15 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <div className="flex gap-4 self-center mt-5 w-full text-lg tracking-tight max-w-[360px] px-5">
            <button
              onClick={() => handleTypeSelect("A")}
              className={`flex overflow-hidden flex-col justify-center items-center rounded-xl h-[110px] w-[110px] transition-colors ${
                selectedType === "A"
                  ? "text-white bg-amber-400"
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
              style={{
                color: selectedType === "A" ? "white" : "#C8D3E3"
              }}
            >
              <div>A Type</div>
            </button>
            <button
              onClick={() => handleTypeSelect("B")}
              className={`flex overflow-hidden flex-col justify-center items-center rounded-xl h-[110px] w-[110px] transition-colors ${
                selectedType === "B"
                  ? "text-white bg-amber-400"
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
              style={{
                color: selectedType === "B" ? "white" : "#C8D3E3"
              }}
            >
              <div>B Type</div>
            </button>
            <button
              onClick={() => handleTypeSelect("C")}
              className={`flex overflow-hidden flex-col justify-center items-center rounded-xl h-[110px] w-[110px] transition-colors ${
                selectedType === "C"
                  ? "text-white bg-amber-400"
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
              style={{
                color: selectedType === "C" ? "white" : "#C8D3E3"
              }}
            >
              <div>C Type</div>
            </button>
          </div>
          <div className="flex mt-5 w-full whitespace-nowrap">
            <button
              onClick={handleCancel}
              className="flex overflow-hidden flex-col justify-center items-center px-16 py-4 text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors flex-1"
            >
              <div>취소</div>
            </button>
            <button
              onClick={handleConfirm}
              className="flex overflow-hidden flex-col justify-center items-center px-16 py-4 text-white bg-amber-400 hover:bg-amber-500 transition-colors flex-1"
            >
              <div>적용</div>
            </button>
          </div>
        </div>
      </div>
    </>,
    document.getElementById("modal-root") as HTMLElement,
  );
}
