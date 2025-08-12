import { create } from 'zustand';

// 놀이기록 결과 데이터 타입
export interface PlayRecordResult {
  subject?: string; // 이렇게 놀이했어요 부분
  objective?: string; // 가정연계 부분  
  support?: string; // 놀이속 배움 부분
}

// Store 타입 정의
export interface PlayRecordStore {
  playRecordResult: PlayRecordResult | null;
  
  // 놀이기록 결과 저장
  setPlayRecordResult: (result: PlayRecordResult) => void;
  
  // 특정 필드만 업데이트
  updatePlayRecordField: (field: keyof PlayRecordResult, value: string) => void;
  
  // 놀이기록 결과 초기화
  clearPlayRecordResult: () => void;
  
  // 놀이기록 결과가 있는지 확인
  hasPlayRecordResult: () => boolean;
}

const usePlayRecordStore = create<PlayRecordStore>((set, get) => ({
  playRecordResult: null,

  setPlayRecordResult: (result: PlayRecordResult) => {
    console.log('usePlayRecordStore - setPlayRecordResult 호출됨:', result);
    set({ playRecordResult: result });
    console.log('usePlayRecordStore - 저장 완료');
  },

  updatePlayRecordField: (field: keyof PlayRecordResult, value: string) => {
    set((state) => ({
      playRecordResult: {
        ...state.playRecordResult,
        [field]: value,
      },
    }));
  },

  clearPlayRecordResult: () => {
    set({ playRecordResult: null });
  },

  hasPlayRecordResult: () => {
    const { playRecordResult } = get();
    return playRecordResult !== null && (
      Boolean(playRecordResult.subject) ||
      Boolean(playRecordResult.objective) ||
      Boolean(playRecordResult.support)
    );
  },
}));

export default usePlayRecordStore;
