import { create } from "zustand";

export type ReportType = "A" | "B" | "C";

interface ReportState {
  reportData: any | null;
  selectedReportType: ReportType | null;
  subject: number | null;
  isFirstVisit: boolean;
  showTypeSelectionModal: boolean;
  setReportData: (data: any, callback?: () => void) => void;
  clearReportData: () => void;
  setSelectedReportType: (type: ReportType) => void;
  setSubject: (subject: number) => void;
  getDefaultSubject: (type: ReportType) => number;
  setFirstVisit: (isFirst: boolean) => void;
  setShowTypeSelectionModal: (show: boolean) => void;
}

export const useReportStore = create<ReportState>()((set, get) => ({
  reportData: null,
  selectedReportType: null,
  subject: null,
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

  setSubject: (subject: number) => {
    set({ subject });
  },

  getDefaultSubject: (type: ReportType) => {
    // 타입 A일 때는 기본값 4, B와 C일 때는 기본값 3
    return type === "A" ? 4 : 3;
  },

  setFirstVisit: (isFirst: boolean) => {
    set({ isFirstVisit: isFirst });
  },

  setShowTypeSelectionModal: (show: boolean) => {
    set({ showTypeSelectionModal: show });
  },
}));
