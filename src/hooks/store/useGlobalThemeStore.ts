import { create } from 'zustand';

export type ReportType = 'A' | 'B' | 'C';

interface SelectedTheme {
  id: number;
  name: string;
  backgroundImage?: {
    id: number;
    imageUrl: string;
  } | null;
}

interface GlobalThemeState {
  backgroundImageUrlByType: Record<ReportType, string | null>;
  selectedThemeByType: Record<ReportType, SelectedTheme | null>;
  currentType: ReportType;
  setTheme: (theme: SelectedTheme, type: ReportType) => void;
  setCurrentType: (type: ReportType) => void;
  setBackgroundImageUrlFor: (type: ReportType, url: string | null) => void;
}

export const useGlobalThemeStore = create<GlobalThemeState>((set) => ({
  backgroundImageUrlByType: { A: null, B: null, C: null },
  selectedThemeByType: { A: null, B: null, C: null },
  currentType: 'A',
  setTheme: (theme, type) => set((state) => ({
    selectedThemeByType: { ...state.selectedThemeByType, [type]: theme },
    backgroundImageUrlByType: { 
      ...state.backgroundImageUrlByType, 
      [type]: theme?.backgroundImage?.imageUrl || null 
    },
    currentType: type
  })),
  setCurrentType: (type) => set({ currentType: type }),
  setBackgroundImageUrlFor: (type, url) => set((state) => ({
    backgroundImageUrlByType: { ...state.backgroundImageUrlByType, [type]: url }
  })),
}));
