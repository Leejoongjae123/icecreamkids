import { create } from 'zustand';

interface KeywordExpansionState {
  // 각 gridId별 키워드 확장 상태
  expandedItems: Record<string, boolean>;
  
  // 특정 gridId의 키워드 확장 상태 설정
  setExpanded: (gridId: string, expanded: boolean) => void;
  
  // 하나만 확장하고 나머지는 모두 축소
  expandOnlyOne: (gridId: string) => void;
  
  // 모든 키워드 영역 축소
  collapseAll: () => void;
  
  // 첫 번째 이미지가 있는 그리드만 확장
  expandFirstImageGrid: (gridIds: string[]) => void;
  
  // 특정 gridId가 확장되어 있는지 확인
  isExpanded: (gridId: string) => boolean;
}

export const useKeywordExpansionStore = create<KeywordExpansionState>((set, get) => ({
  expandedItems: {},
  
  setExpanded: (gridId: string, expanded: boolean) => 
    set((state) => ({
      expandedItems: {
        ...state.expandedItems,
        [gridId]: expanded,
      },
    })),
  
  expandOnlyOne: (gridId: string) => 
    set((state) => {
      const newExpandedItems: Record<string, boolean> = {};
      
      // 모든 항목을 false로 설정
      Object.keys(state.expandedItems).forEach(id => {
        newExpandedItems[id] = false;
      });
      
      // 지정된 gridId만 true로 설정
      newExpandedItems[gridId] = true;
      
      return { expandedItems: newExpandedItems };
    }),
  
  collapseAll: () => 
    set((state) => {
      const newExpandedItems: Record<string, boolean> = {};
      
      Object.keys(state.expandedItems).forEach(id => {
        newExpandedItems[id] = false;
      });
      
      return { expandedItems: newExpandedItems };
    }),
  
  expandFirstImageGrid: (gridIds: string[]) => 
    set(() => {
      const newExpandedItems: Record<string, boolean> = {};
      
      // 모든 gridId를 false로 설정
      gridIds.forEach(id => {
        newExpandedItems[id] = false;
      });
      
      // 첫 번째 gridId만 true로 설정 (이미지가 있는 첫 번째 것)
      if (gridIds.length > 0) {
        newExpandedItems[gridIds[0]] = true;
      }
      
      return { expandedItems: newExpandedItems };
    }),
  
  isExpanded: (gridId: string) => {
    const state = get();
    return state.expandedItems[gridId] || false;
  },
}));

export default useKeywordExpansionStore;
