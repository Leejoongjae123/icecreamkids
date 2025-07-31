import { create } from 'zustand';

export interface ImageRatio {
  width: number;
  height: number;
  aspectRatio: number;
}

interface ImageRatioStore {
  targetImageRatio: ImageRatio | null;
  setTargetImageRatio: (ratio: ImageRatio) => void;
  clearTargetImageRatio: () => void;
}

export const useImageRatioStore = create<ImageRatioStore>((set) => ({
  targetImageRatio: null,
  setTargetImageRatio: (ratio) => set({ targetImageRatio: ratio }),
  clearTargetImageRatio: () => set({ targetImageRatio: null }),
})); 