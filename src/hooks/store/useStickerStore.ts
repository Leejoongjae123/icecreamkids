import { create } from 'zustand';
import { StickerItem, StickerStore } from '@/app/work-board/(protected)/playing-report/comnponents/types';

export const useStickerStore = create<StickerStore>((set, get) => ({
  stickers: [],
  setStickers: (stickers) => set(() => ({ stickers: [...stickers] })),

  addSticker: (payload) =>
    set((state) => {
      const {
        stickerIndex,
        url,
        meta,
        position,
        size,
        rotation,
        zIndex,
      } = payload;

      const newSticker: StickerItem = {
        id: `sticker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        stickerIndex,
        url,
        position: position || { x: 50, y: 50 },
        size: size || { width: 120, height: 120 },
        rotation: typeof rotation === 'number' ? rotation : 0,
        // 기본 z-index는 30대에서 시작하여 모달(overlay 49, content 50)보다 항상 아래에 위치하도록 제한
        zIndex:
          typeof zIndex === 'number'
            ? Math.min(Math.max(0, zIndex), 48)
            : Math.min(48, 30 + state.stickers.length),
        // 메타데이터(원격 스티커 정보)는 선택적으로 포함
        ...(meta ? { meta } : ({} as any)),
      } as StickerItem;

      return {
        stickers: [...state.stickers, newSticker],
      };
    }),

  updateStickerPosition: (id: string, position: { x: number; y: number }) =>
    set((state) => ({
      stickers: state.stickers.map((sticker) =>
        sticker.id === id ? { ...sticker, position } : sticker
      ),
    })),

  updateStickerSize: (id: string, size: { width: number; height: number }) =>
    set((state) => ({
      stickers: state.stickers.map((sticker) =>
        sticker.id === id ? { ...sticker, size } : sticker
      ),
    })),

  updateStickerRotation: (id: string, rotation: number) =>
    set((state) => ({
      stickers: state.stickers.map((sticker) =>
        sticker.id === id ? { ...sticker, rotation } : sticker
      ),
    })),

  removeSticker: (id: string) =>
    set((state) => ({
      stickers: state.stickers.filter((sticker) => sticker.id !== id),
    })),

  bringToFront: (id: string) =>
    set((state) => {
      const maxZIndex = Math.max(...state.stickers.map((s) => s.zIndex), 30);
      return {
        stickers: state.stickers.map((sticker) =>
          sticker.id === id ? { ...sticker, zIndex: Math.min(48, maxZIndex + 1) } : sticker
        ),
      };
    }),
})); 