import { create } from 'zustand';
import { StickerItem, StickerStore } from '@/app/work-board/(protected)/report/comnponents/types';

export const useStickerStore = create<StickerStore>((set, get) => ({
  stickers: [],

  addSticker: (stickerIndex: number, url: string) =>
    set((state) => {
      const newSticker: StickerItem = {
        id: `sticker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        stickerIndex,
        url,
        position: { x: 50, y: 50 }, // 좌상단 근처에 배치
        size: { width: 120, height: 120 },
        rotation: 0,
        zIndex: 100000 + state.stickers.length,
      };
      
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
      const maxZIndex = Math.max(...state.stickers.map((s) => s.zIndex), 100000);
      return {
        stickers: state.stickers.map((sticker) =>
          sticker.id === id ? { ...sticker, zIndex: maxZIndex + 1 } : sticker
        ),
      };
    }),
})); 