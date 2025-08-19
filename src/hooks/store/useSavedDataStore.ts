import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SavedDataStore, SavedReportData, ReportType, StickerItem, TextStickerItem } from '@/app/work-board/(protected)/report/comnponents/types';

export const useSavedDataStore = create<SavedDataStore>()(
  persist(
    (set, get) => ({
      savedReports: [],
      currentSavedData: null,
      isSaved: false,

      saveCurrentReport: (
        reportType: ReportType,
        subject: number,
        stickers: StickerItem[],
        textStickers: TextStickerItem[],
        title?: string,
        description?: string
      ) => {
        const newReport: SavedReportData = {
          id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          reportType,
          subject,
          stickers: [...stickers], // 깊은 복사
          textStickers: [...textStickers], // 깊은 복사
          savedAt: new Date().toISOString(),
          title: title || `${reportType}형 리포트 - ${new Date().toLocaleDateString()}`,
          description,
        };

        set((state) => ({
          savedReports: [...state.savedReports, newReport],
          currentSavedData: newReport,
        }));

        return newReport.id;
      },

      loadSavedReport: (id: string) => {
        const { savedReports } = get();
        const report = savedReports.find((report) => report.id === id);
        
        if (report) {
          set({ currentSavedData: report });
          return report;
        }
        
        return null;
      },

      deleteSavedReport: (id: string) => {
        set((state) => ({
          savedReports: state.savedReports.filter((report) => report.id !== id),
          currentSavedData: state.currentSavedData?.id === id ? null : state.currentSavedData,
        }));
      },

      updateSavedReport: (id: string, updates: Partial<SavedReportData>) => {
        set((state) => ({
          savedReports: state.savedReports.map((report) =>
            report.id === id ? { ...report, ...updates } : report
          ),
          currentSavedData: state.currentSavedData?.id === id 
            ? { ...state.currentSavedData, ...updates } 
            : state.currentSavedData,
        }));
      },

      setCurrentSavedData: (data: SavedReportData | null) => {
        set({ currentSavedData: data });
      },

      getAllSavedReports: () => {
        return get().savedReports;
      },

      setSaved: (saved: boolean) => {
        set({ isSaved: saved });
      },
    }),
    {
      name: 'saved-report-data', // localStorage에 저장될 키 이름
      version: 1,
    }
  )
);
