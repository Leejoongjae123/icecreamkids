import { create } from 'zustand';

// Grid별 컨텐츠 데이터 타입
export interface GridContentData {
  gridId: string;
  hasPlaySubject: boolean; // 놀이주제 입력 여부
  hasImages: boolean; // 이미지 삽입 여부
  hasCategoryValue: boolean; // 카테고리 값 입력 여부
  playSubjectText?: string; // 놀이주제 텍스트
  imageUrls?: string[]; // 이미지 URL 배열
  categoryValue?: string; // 카테고리 값
}

// Store 타입 정의
export interface GridContentStore {
  gridContents: Record<string, GridContentData>; // gridId를 key로 하는 Grid 컨텐츠 맵
  
  // Grid 컨텐츠 상태 업데이트
  updateGridContent: (gridId: string, data: Partial<Omit<GridContentData, 'gridId'>>) => void;
  
  // 특정 Grid의 놀이주제 업데이트
  updatePlaySubject: (gridId: string, text: string) => void;
  
  // 특정 Grid의 이미지 업데이트
  updateImages: (gridId: string, imageUrls: string[]) => void;
  
  // 특정 Grid의 카테고리 값 업데이트
  updateCategoryValue: (gridId: string, value: string) => void;
  
  // Grid 컨텐츠 삭제
  removeGridContent: (gridId: string) => void;
  
  // 모든 Grid 컨텐츠 초기화
  clearAllGridContents: () => void;
  
  // 작업된 내용이 있는지 확인 (하나라도 놀이주제나 이미지, 카테고리가 있으면 true)
  hasAnyContent: () => boolean;
  
  // 특정 Grid에 컨텐츠가 있는지 확인
  hasContent: (gridId: string) => boolean;
  
  // 특정 타입(A, B, C)의 모든 Grid 초기화
  clearGridsByType: (type: string, gridCount: number) => void;
}

const useGridContentStore = create<GridContentStore>((set, get) => ({
  gridContents: {},

  updateGridContent: (gridId: string, data: Partial<Omit<GridContentData, 'gridId'>>) => {
    set((state) => {
      const existingContent = state.gridContents[gridId] || {};
      
      return {
        gridContents: {
          ...state.gridContents,
          [gridId]: {
            gridId,
            hasPlaySubject: data.hasPlaySubject ?? existingContent.hasPlaySubject ?? false,
            hasImages: data.hasImages ?? existingContent.hasImages ?? false,
            hasCategoryValue: data.hasCategoryValue ?? existingContent.hasCategoryValue ?? false,
            playSubjectText: data.playSubjectText ?? existingContent.playSubjectText,
            imageUrls: data.imageUrls ?? existingContent.imageUrls,
            categoryValue: data.categoryValue ?? existingContent.categoryValue,
          },
        },
      };
    });
  },

  updatePlaySubject: (gridId: string, text: string) => {
    set((state) => {
      const existingContent = state.gridContents[gridId] || {} as Partial<GridContentData>;
      const { gridId: _ignored, ...existingData } = existingContent;

      return {
        gridContents: {
          ...state.gridContents,
          [gridId]: {
            ...existingData,
            gridId,
            hasImages: (existingData.hasImages ?? false),
            hasCategoryValue: (existingData.hasCategoryValue ?? false),
            hasPlaySubject: text.trim().length > 0,
            playSubjectText: text,
          },
        },
      };
    });
  },

  updateImages: (gridId: string, imageUrls: string[]) => {
    set((state) => {
      const existingContent = state.gridContents[gridId] || {} as Partial<GridContentData>;
      const { gridId: _ignored, ...existingData } = existingContent;

      return {
        gridContents: {
          ...state.gridContents,
          [gridId]: {
            ...existingData,
            gridId,
            hasPlaySubject: (existingData.hasPlaySubject ?? false),
            hasCategoryValue: (existingData.hasCategoryValue ?? false),
            hasImages: imageUrls.length > 0,
            imageUrls,
          },
        },
      };
    });
  },

  updateCategoryValue: (gridId: string, value: string) => {
    set((state) => {
      const existingContent = state.gridContents[gridId] || {} as Partial<GridContentData>;
      const { gridId: _ignored, ...existingData } = existingContent;

      const hasCategoryValue = value.trim().length > 0 && value !== "타이틀을 입력해주세요";

      return {
        gridContents: {
          ...state.gridContents,
          [gridId]: {
            ...existingData,
            gridId,
            hasPlaySubject: (existingData.hasPlaySubject ?? false),
            hasImages: (existingData.hasImages ?? false),
            hasCategoryValue,
            categoryValue: value,
          },
        },
      };
    });
  },

  removeGridContent: (gridId: string) => {
    set((state) => {
      const newGridContents = { ...state.gridContents };
      delete newGridContents[gridId];
      return { gridContents: newGridContents };
    });
  },

  clearAllGridContents: () => {
    set({ gridContents: {} });
  },

  hasAnyContent: () => {
    const { gridContents } = get();
    return Object.values(gridContents).some(
      (content) => content.hasPlaySubject || content.hasImages || content.hasCategoryValue
    );
  },

  hasContent: (gridId: string) => {
    const { gridContents } = get();
    const content = gridContents[gridId];
    return content ? (content.hasPlaySubject || content.hasImages || content.hasCategoryValue) : false;
  },

  clearGridsByType: (type: string, gridCount: number) => {
    set((state) => {
      const newGridContents = { ...state.gridContents };

      // 실제 사용 중인 gridId 패턴을 모두 고려하여 삭제한다.
      // 1) 기존 로직: `${type}-grid-${i}` (예: a-grid-0)
      // 2) 현재 GridA에서 사용하는 로직: `grid-${i}`
      for (let i = 0; i < gridCount; i++) {
        const typedKey = `${type.toLowerCase()}-grid-${i}`;
        const genericKey = `grid-${i}`;

        if (typedKey in newGridContents) {
          delete newGridContents[typedKey];
        }
        if (genericKey in newGridContents) {
          delete newGridContents[genericKey];
        }
      }

      return { gridContents: newGridContents };
    });
  },
}));

export default useGridContentStore;

