import { create } from 'zustand';
import { TextStickerItem, TextStickerStore } from '@/app/work-board/(protected)/report/comnponents/types';

export const useTextStickerStore = create<TextStickerStore>((set, get) => ({
  textStickers: [],

  addTextSticker: (stickerData) =>
    set((state) => {
      const newTextSticker: TextStickerItem = {
        ...stickerData,
        id: `text_sticker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        zIndex: 100000 + state.textStickers.length,
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
      const maxZIndex = Math.max(...state.textStickers.map((s) => s.zIndex), 100000);
      return {
        textStickers: state.textStickers.map((sticker) =>
          sticker.id === id ? { ...sticker, zIndex: maxZIndex + 1 } : sticker
        ),
      };
    }),
})); 