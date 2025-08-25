"use client";
import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight } from "lucide-react";
import ThemeSelectionModal from "./ThemeSelectionModal";
import type { ThemeItem, ThemeItemListResponse } from "./types";
import { useGlobalThemeStore, type ReportType } from "@/hooks/store/useGlobalThemeStore";
import { useStickerStore } from "@/hooks/store/useStickerStore";

function LeftSideBarContent() {
  
  const searchParams = useSearchParams();
  const [themes, setThemes] = useState<ThemeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { setTheme, setCurrentType } = useGlobalThemeStore();
  const { addSticker, setStickers } = useStickerStore();

  const [selectedTab, setSelectedTab] = useState<"theme" | "background">("theme");
  const [selectedTheme, setSelectedTheme] = useState<number>(0);
  const [selectedBackground, setSelectedBackground] = useState<number>(0);

  // type 파라미터 추출 (메모화)
  const currentType = useMemo(() => {
    return (searchParams.get("type") || "A").toUpperCase() as ReportType;
  }, [searchParams.get("type")]);

  // 현재 타입을 전역 상태에 설정
  useEffect(() => {
    setCurrentType(currentType);
  }, [currentType, setCurrentType]);

  // API에서 추천 테마 가져오기
  useEffect(() => {
    const fetchThemes = async () => {
      setIsLoading(true);
      const endpoint = `/api/report/theme-item-list?offsetWithLimit=0,8&sorts=createdAt.desc,name.asc&type=${encodeURIComponent(currentType)}`;
      try {
        const res = await fetch(endpoint, { method: "GET" });
        if (!res.ok) {
          setThemes([]);
          setIsLoading(false);
          return;
        }
        const data = (await res.json()) as ThemeItemListResponse;
        const themeList = Array.isArray(data?.result) ? data.result : [];
        setThemes(themeList);
        
        // 첫 번째 테마를 기본으로 설정
        if (themeList.length > 0) {
          const firstTheme = themeList[0];
          setTheme({
            id: typeof firstTheme.id === 'string' ? parseInt(firstTheme.id) : firstTheme.id,
            name: firstTheme.name,
            backgroundImage: firstTheme.backgroundImage ? {
              id: 0,
              imageUrl: typeof firstTheme.backgroundImage === 'string' 
                ? firstTheme.backgroundImage 
                : firstTheme.backgroundImage.imageUrl || ''
            } : null
          }, currentType);
        }
      } catch (e) {
        setThemes([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchThemes();
  }, [currentType, setTheme]); // currentType이 변경될 때마다 재실행

  // 테마 선택 핸들러
  const handleThemeSelect = (index: number) => {
    setSelectedTheme(index);

    const theme = themes[index];
    if (theme) {
      // 테마 전환 시 기존 스티커 초기화
      setStickers([]);

      setTheme({
        id: typeof theme.id === 'string' ? parseInt(theme.id) : theme.id,
        name: theme.name,
        backgroundImage: theme.backgroundImage ? {
          id: 0,
          imageUrl: typeof theme.backgroundImage === 'string'
            ? theme.backgroundImage
            : theme.backgroundImage.imageUrl || ''
        } : null
      }, currentType);

      const items = Array.isArray((theme as any).decorationItems) ? (theme as any).decorationItems : [];
      if (items.length > 0) {
        items.forEach((item: any, idx: number) => {
          const url = item.imageUrl || item.thumbUrl || "";
          if (!url) {
            return;
          }
          addSticker({
            stickerIndex: idx,
            url,
            meta: {
              id: Number(item.id),
              categoryId: 0,
              type: "DecorationItem",
              name: item.name || "",
              thumbUrl: item.thumbUrl || url,
              imageUrl: item.imageUrl || url,
              createdAt: item.createdAt || new Date().toISOString(),
            },
            position: {
              x: typeof item.posX === "number" ? item.posX : 50,
              y: typeof item.posY === "number" ? item.posY : 50,
            },
            size: {
              width: typeof item.width === "number" ? item.width : 120,
              height: typeof item.height === "number" ? item.height : 120,
            },
            rotation: 0,
          });
        });
      }
    }
  };

  return (
    <div className="rounded-xl bg-white shadow-custom flex w-full max-w-[342px] flex-col overflow-hidden mx-auto p-[30px_20px] border border-gray-200">
      <div className="flex flex-col">
        <div className="flex font-pretendard leading-none justify-between items-center">
          <div className="text-gray-700 text-xl font-semibold tracking-tight">
            추천 테마
          </div>
          <div className="flex justify-center">
            <ThemeSelectionModal>
              <Button
                variant="outline"
                className="w-[82px] h-[34px] rounded-md text-[14px] font-semibold font-pretendard flex items-center justify-center gap-1 border-[#CCCCCC] border-[1px] border-solid button-more"
              >
                더보기
                <ChevronRight size={16} />
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
                          ? "border border-primary bg-transparent hover:bg-transparent"
                          : " border border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <img
                        src={theme.thumbUrl || theme.previewUrl || "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage.svg"}
                        className="w-full h-full object-cover rounded"
                        alt={theme.name}
                        data-id={theme.id}
                      />
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
                        ? "border border-primary"
                        : "border border-gray-200"
                    }`}
                  >
                    <div className="w-6 h-6 bg-red-500 rounded-full"></div>
                  </div>
                  <div
                    onClick={() => setSelectedBackground(1)}
                    className={`rounded bg-blue-100 flex flex-col overflow-hidden items-center justify-center flex-1 p-[86px_29px] cursor-pointer transition-all duration-200 hover:bg-blue-200 ${
                      selectedBackground === 1
                        ? "border border-primary"
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
                        ? "border border-primary"
                        : "border border-gray-200"
                    }`}
                  >
                    <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                  </div>
                  <div
                    onClick={() => setSelectedBackground(3)}
                    className={`rounded bg-yellow-100 flex flex-col overflow-hidden items-center justify-center flex-1 p-[86px_29px] cursor-pointer transition-all duration-200 hover:bg-yellow-200 ${
                      selectedBackground === 3
                        ? "border border-primary"
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
