"use client";
import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ThemeSelectionModal from "./ThemeSelectionModal";
import type { ThemeItem, ThemeItemListResponse } from "./types";

function LeftSideBarContent() {
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const [themes, setThemes] = useState<ThemeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedTab, setSelectedTab] = useState<"theme" | "background">("theme");
  const [selectedTheme, setSelectedTheme] = useState<number>(0);
  const [selectedBackground, setSelectedBackground] = useState<number>(0);

  // type 파라미터 추출 (메모화)
  const currentType = useMemo(() => {
    return (searchParams.get("type") || "A").toUpperCase();
  }, [searchParams.get("type")]);

  // API에서 추천 테마 가져오기 (type이 변경될 때만 호출)
  useEffect(() => {
    const fetchThemes = async () => {
      setIsLoading(true);
      const endpoint = `/api/report/theme-item-list?type=${encodeURIComponent(currentType)}&offsetWithLimit=0,8&sorts=createdAt.desc,name.asc`;
      try {
        const res = await fetch(endpoint, { method: "GET" });
        if (!res.ok) {
          setThemes([]);
          setIsLoading(false);
          return;
        }
        const data = (await res.json()) as ThemeItemListResponse;
        setThemes(Array.isArray(data?.result) ? data.result : []);
      } catch (e) {
        setThemes([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchThemes();
  }, [currentType]); // searchParams 대신 currentType만 dependency로 사용

  // theme 파라미터 추출 (메모화)
  const themeParam = useMemo(() => searchParams.get("theme"), [searchParams.get("theme")]);

  // 초기 렌더링 및 데이터 로드 후 searchParams에서 theme 값 읽어오기
  useEffect(() => {
    if (themeParam) {
      const themeIndex = parseInt(themeParam);
      if (!isNaN(themeIndex) && themeIndex >= 0 && themeIndex < (themes?.length || 0)) {
        setSelectedTheme(themeIndex);
      }
    }
  }, [themeParam, themes]);

  // 테마 선택 시 URL searchParams 업데이트
  const handleThemeSelect = (index: number) => {
    setSelectedTheme(index);

    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("theme", index.toString());

    const theme = themes[index];
    if (theme?.backgroundImage?.imageUrl) {
      current.set("bgUrl", theme.backgroundImage.imageUrl);
    } else {
      current.delete("bgUrl");
    }
    if (typeof theme?.backgroundImage?.id === 'number') {
      current.set("bgId", String(theme.backgroundImage.id));
    } else {
      current.delete("bgId");
    }

    const search = current.toString();
    const query = search ? `?${search}` : "";

    router.push(`${window.location.pathname}${query}`);
  };

  return (
    <div className="rounded-xl bg-white shadow-custom flex w-full max-w-[480px] flex-col overflow-hidden mx-auto p-[30px_20px] border border-gray-200">
      <div className="flex flex-col">
        <div className="flex font-pretendard leading-none justify-between items-center">
          <div className="text-gray-700 text-xl font-semibold tracking-tight">
            추천 테마
          </div>
          <div className="flex justify-center">
            <ThemeSelectionModal>
              <Button
                variant="default"
                className="w-[80px] h-[38px] rounded-md text-[14px] font-semibold font-pretendard text-white flex items-center justify-center gap-1"
              >
                <Plus size={16} />
                더보기
              </Button>
            </ThemeSelectionModal>
          </div>
        </div>

        <div className="w-full mt-4">
          {/* <div className="flex w-full border-b border-[#F0F0F0]">
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
          </div> */}

          <div className="mt-3">
            {selectedTab === "theme" && (
              <div className="flex flex-col gap-2.5">
                <div className="grid grid-cols-2 gap-2.5">
                  {isLoading && (
                    <>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={`skeleton-${i}`} className="rounded bg-gray-100 animate-pulse aspect-[0.75]" />
                      ))}
                    </>
                  )}
                  {!isLoading && themes.map((theme, index) => (
                    <div
                      key={theme.id}
                      onClick={() => handleThemeSelect(index)}
                      className={`rounded bg-gray-50 flex flex-col overflow-hidden items-center justify-center aspect-[0.75] cursor-pointer transition-all duration-200 ${
                        selectedTheme === index
                          ? "border-2 border-primary p-0 bg-transparent hover:bg-transparent"
                          : "p-2 border border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {theme?.backgroundImage?.imageUrl ? (
                        <img
                          src={theme?.backgroundImage?.imageUrl}
                          className="w-full h-full object-cover rounded"
                          alt={theme.name}
                          data-id={typeof theme?.backgroundImage?.id === 'number' ? theme.backgroundImage.id : undefined}
                        />
                      ) : (
                        <img
                          src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage.svg"
                          className="w-6 h-6"
                          alt="no image"
                        />
                      )}
                    </div>
                  ))}
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

export default function LeftSideBar() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LeftSideBarContent />
    </Suspense>
  );
}
