import { create } from 'zustand';
import { TextStickerItem, TextStickerStore } from '@/app/work-board/(protected)/playing-report/comnponents/types';

export const useTextStickerStore = create<TextStickerStore>((set, get) => ({
  textStickers: [],
  setTextStickers: (stickers) => set(() => ({ textStickers: [...stickers] })),

  addTextSticker: (stickerData) =>
    set((state) => {
      const newTextSticker: TextStickerItem = {
        ...stickerData,
        id: `text_sticker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        // 텍스트 스티커는 모달(overlay 49, content 50)보다 아래에서 항상 상단(48)으로 고정
        zIndex: 48,
      };
      
      return {
        textStickers: [...state.textStickers, newTextSticker],
      };
    }),

  updateTextStickerPosition: (id: string, position: { x: number; y: number }) =>
    set((state) => ({
      textStickers: state.textStickers.map((sticker) =>
        sticker.id === id ? { ...sticker, position } : sticker
      ),
    })),

  updateTextStickerSize: (id: string, size: { width: number; height: number }) =>
    set((state) => ({
      textStickers: state.textStickers.map((sticker) =>
        sticker.id === id ? { ...sticker, size } : sticker
      ),
    })),

  updateTextStickerRotation: (id: string, rotation: number) =>
    set((state) => ({
      textStickers: state.textStickers.map((sticker) =>
        sticker.id === id ? { ...sticker, rotation } : sticker
      ),
    })),

  updateTextStickerText: (id: string, text: string) =>
    set((state) => ({
      textStickers: state.textStickers.map((sticker) =>
        sticker.id === id ? { ...sticker, text } : sticker
      ),
    })),

  removeTextSticker: (id: string) =>
    set((state) => ({
      textStickers: state.textStickers.filter((sticker) => sticker.id !== id),
    })),

  bringTextStickerToFront: (id: string) =>
    set((state) => {
      const maxZIndex = Math.max(...state.textStickers.map((s) => s.zIndex), 30);
      return {
        textStickers: state.textStickers.map((sticker) =>
          sticker.id === id ? { ...sticker, zIndex: Math.min(48, maxZIndex + 1) } : sticker
        ),
      };
    }),
})); 