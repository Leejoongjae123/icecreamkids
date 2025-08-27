import { create } from 'zustand';

// Grid별 컨텐츠 데이터 타입
export interface GridContentData {
  gridId: string;
  hasPlaySubject: boolean; // 놀이주제 입력 여부
  hasImages: boolean; // 이미지 삽입 여부
  hasCategoryValue: boolean; // 카테고리 값 입력 여부
  hasAiGenerated: boolean; // AI로 생성된 내용이 있는지 여부
  playSubjectText?: string; // 놀이주제 텍스트
  imageUrls?: string[]; // 이미지 URL 배열
  driveItemKeys?: string[]; // 드라이브 아이템 키 배열
  categoryValue?: string; // 카테고리 값
}

// Store 타입 정의
export interface GridContentStore {
  gridContents: Record<string, GridContentData>; // gridId를 key로 하는 Grid 컨텐츠 맵
  setAllGridContents: (all: Record<string, any>) => void;
  
  // Grid 컨텐츠 상태 업데이트
  updateGridContent: (gridId: string, data: Partial<Omit<GridContentData, 'gridId'>>) => void;
  
  // 특정 Grid의 놀이주제 업데이트
  updatePlaySubject: (gridId: string, text: string) => void;
  
  // 특정 Grid의 이미지 업데이트
  updateImages: (gridId: string, imageUrls: string[]) => void;
  
  // 특정 Grid의 드라이브 아이템 키 업데이트
  updateDriveItemKeys: (gridId: string, driveItemKeys: string[]) => void;
  
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
  
  // AI 생성 상태 업데이트
  updateAiGenerated: (gridId: string, hasAiGenerated: boolean) => void;
  
  // AI 생성된 컨텐츠가 하나라도 있는지 확인
  hasAnyAiGeneratedContent: () => boolean;
  
  // 모든 그리드 데이터를 reportCaptions 형태로 반환
  getAllReportCaptions: () => { title: string; contents: string; }[];

  // 타입에 따라 캡션 생성 방식 분기 (A, B, C)
  getReportCaptionsByType: (type: string) => { title: string; contents: string; }[];
}

const useGridContentStore = create<GridContentStore>((set, get) => ({
  gridContents: {},
  setAllGridContents: (all) => {
    // 입력값을 맵으로 교체하되, 플래그들을 실제 데이터 기반으로 정규화
    const normalized: Record<string, GridContentData> = {} as Record<string, GridContentData>;
    Object.entries(all || {}).forEach(([gridId, raw]) => {
      const content = (raw || {}) as Partial<GridContentData> & {
        playSubjectText?: string;
        imageUrls?: string[];
        categoryValue?: string;
        hasPlaySubject?: boolean;
        hasImages?: boolean;
        hasCategoryValue?: boolean;
        hasAiGenerated?: boolean;
      };
      const text = typeof content.playSubjectText === 'string' ? content.playSubjectText.trim() : '';
      const images = Array.isArray(content.imageUrls) ? content.imageUrls.filter((u) => !!u && u !== '') : [];
      const categoryValue = typeof content.categoryValue === 'string' ? content.categoryValue : '';
      const hasCategoryValue = categoryValue.trim().length > 0 && categoryValue !== '타이틀을 입력해주세요';
      const normalizedEntry: GridContentData = {
        gridId,
        hasPlaySubject: text.length > 0,
        hasImages: images.length > 0,
        hasCategoryValue,
        hasAiGenerated: (content.hasAiGenerated ?? false) || text.length > 0,
        playSubjectText: content.playSubjectText,
        imageUrls: images,
        driveItemKeys: content.driveItemKeys || [],
        categoryValue,
      };
      normalized[gridId] = normalizedEntry;
    });
    set({ gridContents: normalized });
  },

  updateGridContent: (gridId: string, data: Partial<Omit<GridContentData, 'gridId'>>) => {
    set((state) => {
      const existingContent = state.gridContents[gridId] || {};
      const providedText = typeof data.playSubjectText === 'string' ? data.playSubjectText : undefined;
      const hasText = typeof providedText === 'string' ? providedText.trim().length > 0 : undefined;
      
      return {
        gridContents: {
          ...state.gridContents,
          [gridId]: {
            gridId,
            hasPlaySubject: hasText !== undefined ? hasText : (data.hasPlaySubject ?? existingContent.hasPlaySubject ?? false),
            hasImages: data.hasImages ?? existingContent.hasImages ?? false,
            hasCategoryValue: data.hasCategoryValue ?? existingContent.hasCategoryValue ?? false,
            hasAiGenerated: hasText !== undefined ? hasText : (data.hasAiGenerated ?? existingContent.hasAiGenerated ?? false),
            playSubjectText: (providedText !== undefined ? providedText : existingContent.playSubjectText),
            imageUrls: data.imageUrls ?? existingContent.imageUrls,
            driveItemKeys: data.driveItemKeys ?? existingContent.driveItemKeys,
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
            hasAiGenerated: text.trim().length > 0,
            hasPlaySubject: text.trim().length > 0,
            playSubjectText: text,
            driveItemKeys: existingData.driveItemKeys,
          },
        },
      };
    });
  },

  updateImages: (gridId: string, imageUrls: string[]) => {
    set((state) => {
      const existingContent = state.gridContents[gridId] || ({} as Partial<GridContentData>);
      const { gridId: _ignored, ...existingData } = existingContent;

      const prev = Array.isArray(existingData.imageUrls) ? existingData.imageUrls : [];
      const next = Array.isArray(imageUrls) ? imageUrls : [];

      // 내용이 완전히 동일하면 상태 변경을 생략하여 불필요한 리렌더/루프 방지
      const isSameLength = prev.length === next.length;
      const isSameOrderAndValues = isSameLength && prev.every((v, i) => v === next[i]);
      if (isSameOrderAndValues && (existingData.hasImages ?? false) === (next.length > 0)) {
        return state;
      }

      return {
        gridContents: {
          ...state.gridContents,
          [gridId]: {
            ...existingData,
            gridId,
            hasPlaySubject: existingData.hasPlaySubject ?? false,
            hasCategoryValue: existingData.hasCategoryValue ?? false,
            hasAiGenerated: existingData.hasAiGenerated ?? false,
            hasImages: next.length > 0,
            imageUrls: next,
            driveItemKeys: existingData.driveItemKeys,
          },
        },
      };
    });
  },

  updateDriveItemKeys: (gridId: string, driveItemKeys: string[]) => {
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
            hasImages: (existingData.hasImages ?? false),
            hasCategoryValue: (existingData.hasCategoryValue ?? false),
            hasAiGenerated: (existingData.hasAiGenerated ?? false),
            driveItemKeys,
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
            hasAiGenerated: (existingData.hasAiGenerated ?? false),
            hasCategoryValue,
            categoryValue: value,
            driveItemKeys: existingData.driveItemKeys,
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

  updateAiGenerated: (gridId: string, hasAiGenerated: boolean) => {
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
            hasImages: (existingData.hasImages ?? false),
            hasCategoryValue: (existingData.hasCategoryValue ?? false),
            hasAiGenerated,
            playSubjectText: existingData.playSubjectText,
            imageUrls: existingData.imageUrls,
            categoryValue: existingData.categoryValue,
          },
        },
      };
    });
  },

  hasAnyAiGeneratedContent: () => {
    const { gridContents } = get();
    return Object.values(gridContents).some(
      (content) => content.hasAiGenerated
    );
  },

  getAllReportCaptions: () => {
    const { gridContents } = get();
    const reportCaptions: { title: string; contents: string; }[] = [];
    
    // gridContents를 gridId 순서대로 정렬 (grid-0, grid-1, grid-2 ...)
    const sortedEntries = Object.entries(gridContents).sort((a, b) => {
      const aIndex = parseInt(a[0].split('-').pop() || '0', 10);
      const bIndex = parseInt(b[0].split('-').pop() || '0', 10);
      return aIndex - bIndex;
    });
    
    sortedEntries.forEach(([gridId, content]) => {
      // categoryValue와 playSubjectText 모두 있는 경우만 포함
      if (content.categoryValue && content.categoryValue.trim() !== "" && 
          content.categoryValue !== "타이틀을 입력해주세요" && 
          content.playSubjectText && content.playSubjectText.trim() !== "") {
        reportCaptions.push({
          title: content.categoryValue,
          contents: content.playSubjectText
        });
      }
    });
    
    return reportCaptions;
  },

  getReportCaptionsByType: (type: string) => {
    const { gridContents } = get();
    const reportCaptions: { title: string; contents: string; }[] = [];

    // gridContents를 gridId 순서대로 정렬 (grid-0, grid-1, grid-2 ...)
    const sortedEntries = Object.entries(gridContents).sort((a, b) => {
      const aIndex = parseInt(a[0].split('-').pop() || '0', 10);
      const bIndex = parseInt(b[0].split('-').pop() || '0', 10);
      return aIndex - bIndex;
    });

    if ((type || '').toUpperCase() === 'B') {
      // B타입: categoryValue가 없으므로, AI 생성된 내용(playSubjectText)이 있는 항목을 사용
      sortedEntries.forEach(([_, content]) => {
        const hasText = !!(content.playSubjectText && content.playSubjectText.trim() !== '');
        if (content.hasAiGenerated && hasText) {
          reportCaptions.push({
            title: '놀이 활동',
            contents: content.playSubjectText as string,
          });
        }
      });
      return reportCaptions;
    }

    // 기본(A/C): 기존 로직과 동일 - categoryValue + playSubjectText 모두 존재하는 항목만 포함
    sortedEntries.forEach(([_, content]) => {
      if (content.categoryValue && content.categoryValue.trim() !== '' &&
          content.categoryValue !== '타이틀을 입력해주세요' &&
          content.playSubjectText && content.playSubjectText.trim() !== '') {
        reportCaptions.push({
          title: content.categoryValue,
          contents: content.playSubjectText,
        });
      }
    });
    return reportCaptions;
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

