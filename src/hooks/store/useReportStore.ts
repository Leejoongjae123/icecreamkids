import { create } from "zustand";

export type ReportType = "A" | "B" | "C";

interface ReportState {
  reportData: any | null;
  selectedReportType: ReportType | null;
  isFirstVisit: boolean;
  showTypeSelectionModal: boolean;
  setReportData: (data: any, callback?: () => void) => void;
  clearReportData: () => void;
  setSelectedReportType: (type: ReportType) => void;
  setFirstVisit: (isFirst: boolean) => void;
  setShowTypeSelectionModal: (show: boolean) => void;
}

export const useReportStore = create<ReportState>()((set, get) => ({
  reportData: null,
  selectedReportType: null,
  isFirstVisit: true,
  showTypeSelectionModal: false,

  setReportData: (data, callback) => {
    set({ reportData: data });
    if (callback) {
      callback();
    }
  },

  clearReportData: () => set({ reportData: null }),

  setSelectedReportType: (type: ReportType) => {
    set({ selectedReportType: type });
  },

  setFirstVisit: (isFirst: boolean) => {
    set({ isFirstVisit: isFirst });
  },

  setShowTypeSelectionModal: (show: boolean) => {
    set({ showTypeSelectionModal: show });
  },
}));
