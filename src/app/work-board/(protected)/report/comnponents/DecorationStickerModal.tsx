"use client";
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useStickerStore } from "@/hooks/store/useStickerStore";
import {
  DecorationCategoryRemote,
  DecorationItemRemote,
  RemoteResponse,
  StickerMeta,
} from "./types";

interface DecorationStickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply?: (selectedSticker: DecorationItemRemote) => void;
}

const DecorationStickerModal: React.FC<DecorationStickerModalProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  const [categories, setCategories] = useState<DecorationCategoryRemote[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [items, setItems] = useState<DecorationItemRemote[]>([]);
  const [selectedStickerIndex, setSelectedStickerIndex] = useState<number>(0);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);
  const [loadingItems, setLoadingItems] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { addSticker } = useStickerStore();

  const handleApply = () => {
    const sticker = items[selectedStickerIndex];
    if (sticker) {
      const url: string = sticker.imageUrl ?? sticker.thumbUrl ?? "";
      const meta: StickerMeta = {
        id: Number(sticker.id),
        categoryId: (sticker as any).decorationCategoryId ?? (sticker as any).categoryId ?? 0,
        type: "DecorationItem",
        name: sticker.name ?? "",
        thumbUrl: sticker.thumbUrl ?? url,
        imageUrl: sticker.imageUrl ?? url,
        createdAt: (sticker as any).createdAt ?? new Date().toISOString(),
      };
      addSticker({
        stickerIndex: selectedStickerIndex,
        url,
        meta,
      });
      if (onApply) {
        onApply(sticker);
      }
    }
    setTimeout(() => {
      onClose();
    }, 100);
  };

  const handleStickerSelect = (stickerIndex: number) => {
    setSelectedStickerIndex(stickerIndex);
  };

  // 카테고리 불러오기
  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    const fetchCategories = async () => {
      setLoadingCategories(true);
      setError(null);
      try {
        const res = await fetch("/api/decoration-categories", { method: "GET" });
        const json: RemoteResponse<DecorationCategoryRemote[]> = await res.json();
        if (mounted && Array.isArray(json.result)) {
          setCategories(json.result);
          setActiveCategoryId((prev) => prev ?? (json.result[0]?.id ?? null));
        }
      } catch (e) {
        setError("카테고리를 불러오지 못했습니다.");
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  // 아이템 불러오기
  useEffect(() => {
    if (!isOpen || !activeCategoryId) return;
    let mounted = true;
    const fetchItems = async () => {
      setLoadingItems(true);
      setError(null);
      try {
        const url = `/api/decoration-items/${activeCategoryId}?offsetWithLimit=0,20&sorts=createdAt.desc,name.asc`;
        const res = await fetch(url, { method: "GET" });
        const json: RemoteResponse<DecorationItemRemote[]> = await res.json();
        if (mounted && Array.isArray(json.result)) {
          setItems(json.result);
          setSelectedStickerIndex(0);
        }
      } catch (e) {
        setError("스티커 목록을 불러오지 못했습니다.");
      } finally {
        setLoadingItems(false);
      }
    };
    fetchItems();
    return () => {
      mounted = false;
    };
  }, [isOpen, activeCategoryId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded-3xl max-h-[90vh] w-[541px] p-0 border-0 z-50",
          "max-md:max-w-[541px] max-md:w-[90vw]",
          "max-sm:rounded-2xl max-sm:w-[95vw]",
          "flex flex-col overflow-hidden"
        )}
        onClick={(e) => e.stopPropagation()}
        onInteractOutside={(e) => {
          // 모달 외부 클릭시만 닫기
          onClose();
        }}
        onEscapeKeyDown={(e) => {
          // ESC 키 동작은 허용
          onClose();
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-10 pb-6 max-md:px-5 max-sm:px-4 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-700">꾸미기 스티커</h2>
          <DialogClose
            className={cn(
              "flex shrink-0 justify-center items-center p-0.5 w-6 h-6 bg-white border border-solid border-zinc-100 rounded-[50px] hover:bg-gray-50"
            )}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.83398 5.8335L14.1673 14.1668M5.83398 14.1668L14.1673 5.8335"
                stroke="#333D4B"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </DialogClose>
        </div>

        {/* Tabs */}
        <div className="px-10 max-md:px-5 max-sm:px-4 flex-shrink-0">
          <div className="flex space-x-8 border-b border-gray-200 overflow-x-auto no-scrollbar">
            {loadingCategories && (
              <div className="py-2 text-sm text-zinc-400">카테고리 불러오는 중…</div>
            )}
            {!loadingCategories && categories.map((cat) => (
              <button
                key={cat.id}
                className={cn(
                  "relative pb-2 text-base tracking-tight transition-colors whitespace-nowrap",
                  activeCategoryId === cat.id ? "text-gray-700 font-medium" : "text-zinc-400"
                )}
                onClick={() => setActiveCategoryId(cat.id)}
              >
                {cat.name}
                {activeCategoryId === cat.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-700" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Sticker Grid */}
        <div className="flex-1 px-10 py-6 max-md:px-5 max-sm:px-4 overflow-y-auto min-h-0">
          {error && (
            <div className="text-sm text-red-500 mb-2">{error}</div>
          )}
          {loadingItems ? (
            <div className="py-20 text-center text-zinc-400">스티커 불러오는 중…</div>
          ) : (
            <div className="grid grid-cols-4 gap-3 min-h-[400px]">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={cn(
                    "bg-gray-50 rounded-lg aspect-square cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-center overflow-hidden",
                    selectedStickerIndex === index && "border-2 border-amber-400 border-solid"
                  )}
                  onClick={() => handleStickerSelect(index)}
                  title={item.name}
                >
                  <img
                    src={item.thumbUrl || item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              ))}
              {items.length === 0 && (
                <div className="col-span-4 text-center text-zinc-400 py-10">아이템이 없습니다.</div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-2 px-10 pb-10 max-md:px-5 max-sm:px-4 flex-shrink-0 ">
          <button
            className={cn(
              "flex justify-center items-center px-6 py-3 bg-gray-50 rounded-md border border-solid border-zinc-100 hover:bg-gray-100 transition-colors min-w-[100px]"
            )}
            onClick={onClose}
          >
            <div className="text-base font-medium text-gray-700">닫기</div>
          </button>
          <button
            className={cn(
              "flex justify-center items-center px-6 py-3 bg-amber-400 rounded-md hover:bg-amber-500 transition-colors min-w-[100px]"
            )}
            onClick={handleApply}
          >
            <div className="text-base font-medium text-white">적용</div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DecorationStickerModal;