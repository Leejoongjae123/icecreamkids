import { create } from 'zustand';

interface ReportState {
  reportData: any | null;
  setReportData: (data: any, callback?: () => void) => void;
  clearReportData: () => void;
}

export const useReportStore = create<ReportState>()((set, get) => ({
  reportData: null,
  setReportData: (data, callback) => {
    set({ reportData: data });
    if (callback) {
      callback();
    }
  },

  clearReportData: () => set({ reportData: null }),
}));
