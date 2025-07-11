"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import ThemeSelectionModal from "./ThemeSelectionModal";

export default function LeftSideBar() {
  const [selectedTab, setSelectedTab] = useState<"theme" | "background">(
    "theme",
  );
  const [selectedTheme, setSelectedTheme] = useState<number>(2);
  const [selectedBackground, setSelectedBackground] = useState<number>(0);

  return (
    <div className="rounded-xl bg-white shadow-custom flex w-full max-w-[480px] flex-col overflow-hidden mx-auto p-[30px_20px] border border-gray-200">
      <div className="flex flex-col">
        <div className="flex font-pretendard leading-none">
          <div className="text-gray-700 text-xl font-semibold tracking-tight self-start">
            테마 선택
          </div>
        </div>

        <div className="w-full mt-4">
          <div className="flex w-full border-b border-[#F0F0F0]">
            <button
              onClick={() => setSelectedTab("theme")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all relative ${
                selectedTab === "theme"
                  ? "text-[#333D4B]"
                  : "text-[#B4B4B4] hover:text-[#333D4B]"
              }`}
            >
              테마선택
              {selectedTab === "theme" && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"></div>
              )}
            </button>
            <button
              onClick={() => setSelectedTab("background")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all relative ${
                selectedTab === "background"
                  ? "text-[#333D4B]"
                  : "text-[#B4B4B4] hover:text-[#333D4B]"
              }`}
            >
              배경색
              {selectedTab === "background" && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"></div>
              )}
            </button>
          </div>

          <div className="mt-3">
            {selectedTab === "theme" && (
              <div className="flex flex-col gap-2.5">
                <div className="grid grid-cols-2 grid-rows-4 gap-2.5">
                  {Array.from({ length: 8 }, (_, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedTheme(index)}
                      className={`rounded bg-gray-50 flex flex-col overflow-hidden items-center justify-center aspect-[0.75] cursor-pointer transition-all duration-200 ${
                        selectedTheme === index
                          ? "border-2 border-primary p-0 bg-transparent hover:bg-transparent"
                          : "p-4 border border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <img
                        src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage.svg"
                        className="w-6 h-6 object-contain aspect-square"
                        alt="추가 아이콘"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-center w-full">
                  <ThemeSelectionModal>
                    <Button
                      variant="default"
                      className="mt-5 w-[132px] h-[42px] rounded-full self-center text-sm font-semibold font-pretendard text-white"
                    >
                      더보기
                    </Button>
                  </ThemeSelectionModal>
                </div>
              </div>
            )}

            {selectedTab === "background" && (
              <div className="flex flex-col gap-2.5">
                <div className="flex gap-2.5">
                  <div
                    onClick={() => setSelectedBackground(0)}
                    className={`rounded bg-red-100 flex flex-col overflow-hidden items-center justify-center flex-1 p-[86px_29px] cursor-pointer transition-all duration-200 hover:bg-red-200 ${
                      selectedBackground === 0
                        ? "border-2 border-primary"
                        : "border border-gray-200"
                    }`}
                  >
                    <div className="w-6 h-6 bg-red-500 rounded-full"></div>
                  </div>
                  <div
                    onClick={() => setSelectedBackground(1)}
                    className={`rounded bg-blue-100 flex flex-col overflow-hidden items-center justify-center flex-1 p-[86px_29px] cursor-pointer transition-all duration-200 hover:bg-blue-200 ${
                      selectedBackground === 1
                        ? "border-2 border-primary"
                        : "border border-gray-200"
                    }`}
                  >
                    <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <div
                    onClick={() => setSelectedBackground(2)}
                    className={`rounded bg-green-100 flex flex-col overflow-hidden items-center justify-center flex-1 p-[86px_29px] cursor-pointer transition-all duration-200 hover:bg-green-200 ${
                      selectedBackground === 2
                        ? "border-2 border-primary"
                        : "border border-gray-200"
                    }`}
                  >
                    <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                  </div>
                  <div
                    onClick={() => setSelectedBackground(3)}
                    className={`rounded bg-yellow-100 flex flex-col overflow-hidden items-center justify-center flex-1 p-[86px_29px] cursor-pointer transition-all duration-200 hover:bg-yellow-200 ${
                      selectedBackground === 3
                        ? "border-2 border-primary"
                        : "border border-gray-200"
                    }`}
                  >
                    <div className="w-6 h-6 bg-yellow-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
