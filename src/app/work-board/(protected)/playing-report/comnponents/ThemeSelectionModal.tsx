"use client";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
//

import type { ThemeItem, ThemeItemListResponse } from "./types";
import { useGlobalThemeStore } from "@/hooks/store/useGlobalThemeStore";
import { useStickerStore } from "@/hooks/store/useStickerStore";

interface ThemeSelectionModalProps {
  children: React.ReactNode;
}

// 카테고리 버튼 비활성화로 드래그 스크롤 훅 제거

function ThemeSelectionModal({ children }: ThemeSelectionModalProps) {
  const [activeTab, setActiveTab] = React.useState("테마선택");
  const [selectedImage, setSelectedImage] = React.useState<number | null>(null);
  const [selectedBgImage, setSelectedBgImage] = React.useState<number | null>(null);

  const [themeItems, setThemeItems] = React.useState<ThemeItem[]>([]);
  const [bgItems, setBgItems] = React.useState<ThemeItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const { setTheme, setBackgroundImageUrlFor, currentType } = useGlobalThemeStore();
  const { addSticker, setStickers } = useStickerStore();

  React.useEffect(() => {
    let isMounted = true;
    const fetchThemes = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/report/theme-item-list?offsetWithLimit=0,20&sorts=createdAt.desc,name.asc&type=${encodeURIComponent(currentType)}`, { method: "GET" });
        if (!res.ok) {
          if (isMounted) {
            setThemeItems([]);
            setBgItems([]);
          }
          return;
        }
        const data = (await res.json()) as ThemeItemListResponse;
        const list = Array.isArray(data?.result) ? data.result : [];
        if (isMounted) {
          setThemeItems(list);
          setBgItems(list);
        }
      } catch (_) {
        if (isMounted) {
          setThemeItems([]);
          setBgItems([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    fetchThemes();
    return () => {
      isMounted = false;
    };
  }, []);

  // 카테고리 버튼 HIDE: 기존 카테고리 UI 제거

  // 리스트는 API에서 받아온 result를 사용 (thumbUrl 기반 렌더링)

  const handleApply = React.useCallback(() => {
    // 탭 상태에 따라 적용 동작 분기
    if (activeTab === "테마선택" && selectedImage != null) {
      const selected = themeItems.find((it) => Number(it.id) === Number(selectedImage));
      if (selected) {
        // 테마 전환 시 기존 스티커 초기화
        setStickers([]);

        const themeId = typeof selected.id === "number" ? selected.id : parseInt(String(selected.id));
        const backgroundImageUrl = selected.backgroundImage
          ? typeof selected.backgroundImage === "string"
            ? selected.backgroundImage
            : selected.backgroundImage.imageUrl || ""
          : "";
        setTheme(
          {
            id: themeId,
            name: selected.name,
            backgroundImage: backgroundImageUrl
              ? {
                  id: 0,
                  imageUrl: backgroundImageUrl,
                }
              : null,
          },
          currentType
        );

        // 테마에 decorationItems가 있다면 스티커로 자동 삽입
        const items = Array.isArray(selected.decorationItems) ? selected.decorationItems : [];
        if (items.length > 0) {
          items.forEach((item, idx) => {
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
    } else if (activeTab === "배경" && selectedBgImage != null) {
      const selected = bgItems.find((it) => Number(it.id) === Number(selectedBgImage));
      if (selected) {
        const bgUrl = (selected.backgroundImage && (typeof selected.backgroundImage === "string" ? selected.backgroundImage : selected.backgroundImage.imageUrl)) || selected.thumbUrl || selected.previewUrl || "";
        setBackgroundImageUrlFor(currentType, bgUrl || null);
      }
    }
  }, [activeTab, selectedImage, selectedBgImage, themeItems, bgItems, setTheme, setBackgroundImageUrlFor, currentType, addSticker]);

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[700px] p-0 border-none bg-transparent shadow-none">
        <div className="flex overflow-hidden flex-col px-10 py-10 leading-none bg-white rounded-3xl max-w-[700px] max-md:px-5">
          <div className="flex gap-5 justify-between items-start w-full max-md:max-w-full mb-10">
            <div className="text-xl font-semibold tracking-tight text-gray-700">
              테마 선택
            </div>
            
            <DialogClose asChild>
              <button className="object-contain shrink-0 w-6 aspect-square rounded-[50px] hover:bg-gray-100 transition-colors">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/ec605318f986481376fc593472df4248aadb01e8?placeholderIfAbsent=true&apiKey=304aa4871c104446b0f8164e96d049f4"
                  className="object-contain shrink-0 w-6 aspect-square rounded-[50px]"
                  alt="닫기"
                />
              </button>
            </DialogClose>
          </div>
          
          {/* 커스텀 탭바 */}
          <div className="w-full flex flex-col gap-y-5">
            {/* 탭 헤더 */}
            <div className="relative border-b border-gray-200">
              <div className="flex w-[200px]">
                <div 
                  onClick={() => setActiveTab("테마선택")}
                  className={`flex-1 text-base font-medium tracking-tight cursor-pointer pb-3 text-center transition-colors ${
                    activeTab === "테마선택" 
                      ? "text-gray-700" 
                      : "text-zinc-400 hover:text-gray-600"
                  }`}
                >
                  테마선택
                </div>
                <div 
                  onClick={() => setActiveTab("배경")}
                  className={`flex-1 text-base font-medium tracking-tight cursor-pointer pb-3 text-center transition-colors ${
                    activeTab === "배경" 
                      ? "text-gray-700" 
                      : "text-zinc-400 hover:text-gray-600"
                  }`}
                >
                  배경
                </div>
              </div>
              {/* Active 표시 선 */}
              <div 
                className={`absolute bottom-0 h-[2px] bg-gray-700 transition-transform duration-200 ${
                  activeTab === "테마선택" ? "w-[100px] transform translate-x-0" : "w-[100px] transform translate-x-[100px]"
                }`}
              />
            </div>
            
            {/* 탭 내용 */}
            {activeTab === "테마선택" && (
              <div className="space-y-0">
                {/* 카테고리 버튼 HIDE - 제거 */}
                {/* 이미지 그리드 4x4 - 화면 50vh 높이까지만 보여주고 스크롤 가능 */}
                <div className="grid grid-cols-4 gap-3 w-full max-h-[50vh] overflow-y-auto overflow-x-hidden p-1">
                  {isLoading && (
                    <div className="col-span-3 text-center text-sm text-zinc-400 py-6">불러오는 중…</div>
                  )}
                  {!isLoading && Array.from({ length: 16 }).map((_, idx) => {
                    const item = themeItems[idx];
                    if (!item) {
                      return (
                        <div
                          key={`theme-empty-${idx}`}
                          className="relative w-[145px] h-[196px] rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center"
                        >
                          <img
                            src="/report/noimage.svg"
                            alt="이미지 없음"
                            className="w-6 h-6 opacity-40"
                          />
                        </div>
                      );
                    }
                    const idNum = typeof item.id === 'number' ? item.id : parseInt(String(item.id));
                    return (
                      <button
                        key={String(item.id)}
                        onClick={() => setSelectedImage(idNum)}
                        className={`relative w-[145px] h-[196px] rounded-lg overflow-hidden ${
                          selectedImage === idNum
                            ? "ring-2 ring-[#FAB83D] ring-offset-2"
                            : "ring-1 ring-gray-200"
                        }`}
                      >
                        <img
                          src={item.thumbUrl || item.previewUrl || "/report/sample.png"}
                          alt={item.name || '테마 이미지'}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {activeTab === "배경" && (
              <div className="space-y-0">
                {/* 카테고리 버튼 HIDE - 제거 */}
                {/* 배경 이미지 그리드 4x4 - 화면 50vh 높이까지만 보여주고 스크롤 가능 */}
                <div className="grid grid-cols-4 gap-3 w-full max-h-[50vh] overflow-y-auto overflow-x-hidden p-1">
                  {isLoading && (
                    <div className="col-span-3 text-center text-sm text-zinc-400 py-6">불러오는 중…</div>
                  )}
                  {!isLoading && Array.from({ length: 16 }).map((_, idx) => {
                    const item = bgItems[idx];
                    if (!item) {
                      return (
                        <div
                          key={`bg-empty-${idx}`}
                          className="relative w-[145px] h-[196px] rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center"
                        >
                          <img
                            src="/report/noimage.svg"
                            alt="이미지 없음"
                            className="w-6 h-6 opacity-40"
                          />
                        </div>
                      );
                    }
                    const idNum = typeof item.id === 'number' ? item.id : parseInt(String(item.id));
                    const bgUrl = (item.backgroundImage && (typeof item.backgroundImage === 'string' ? item.backgroundImage : item.backgroundImage.imageUrl)) || item.thumbUrl || item.previewUrl || "/report/sample.png";
                    return (
                      <button
                        key={`bg-${String(item.id)}`}
                        onClick={() => setSelectedBgImage(idNum)}
                        className={`relative w-[145px] h-[196px] rounded-lg overflow-hidden ${
                          selectedBgImage === idNum
                            ? "ring-2 ring-[#FAB83D] ring-offset-2"
                            : "ring-1 ring-gray-200"
                        }`}
                      >
                        <img
                          src={bgUrl}
                          alt={item.name || '배경 이미지'}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2.5 self-center mt-6 max-w-full text-base font-medium tracking-tight whitespace-nowrap">
            <DialogClose asChild>
              <button className="flex items-center justify-center w-[100px] h-[42px] text-gray-700 bg-gray-50 rounded-md border border-solid border-zinc-100 hover:bg-gray-100 transition-colors">
                <div>닫기</div>
              </button>
            </DialogClose>
            <DialogClose asChild>
              <button onClick={handleApply} className="flex items-center justify-center w-[100px] h-[42px] text-white bg-[#FAB83D] rounded-md hover:bg-[#e5a635] transition-colors">
                <div>적용</div>
              </button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ThemeSelectionModal;
