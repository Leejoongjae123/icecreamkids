import { create } from 'zustand';

interface KeywordStore {
  // 추천 키워드 배열
  recommendedKeywords: string[];
  
  // sessionStorage에서 키워드 불러오기
  loadKeywords: () => void;
  
  // 새 키워드 추가 (sessionStorage에 저장 + 상태 업데이트)
  addKeyword: (keyword: string) => void;
  
  // 키워드 배열 직접 설정
  setKeywords: (keywords: string[]) => void;
  
  // 키워드 삭제
  removeKeyword: (keyword: string) => void;
  
  // 키워드 초기화
  clearKeywords: () => void;
}

// sessionStorage 관리 함수들
const KEYWORD_STORAGE_KEY = 'activityKeywords';
const MAX_KEYWORDS = 20; // 최대 저장할 키워드 수

const getStoredKeywords = (): string[] => {
  try {
    if (typeof window === 'undefined') return [];
    const stored = sessionStorage.getItem(KEYWORD_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.log('키워드 불러오기 오류:', error);
    return [];
  }
};

const saveKeywordsToStorage = (keywords: string[]): void => {
  try {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(KEYWORD_STORAGE_KEY, JSON.stringify(keywords));
  } catch (error) {
    console.log('키워드 저장 오류:', error);
  }
};

const useKeywordStore = create<KeywordStore>((set, get) => ({
  recommendedKeywords: [],
  
  loadKeywords: () => {
    const storedKeywords = getStoredKeywords();
    set({ recommendedKeywords: storedKeywords });
  },
  
  addKeyword: (keyword: string) => {
    if (!keyword.trim()) return;
    
    const { recommendedKeywords } = get();
    const trimmedKeyword = keyword.trim();
    
    // 중복 제거하고 최신 키워드를 맨 앞에 추가
    const updatedKeywords = [
      trimmedKeyword,
      ...recommendedKeywords.filter(k => k !== trimmedKeyword)
    ].slice(0, MAX_KEYWORDS);
    
    // sessionStorage에 저장
    saveKeywordsToStorage(updatedKeywords);
    
    // 상태 업데이트
    set({ recommendedKeywords: updatedKeywords });
  },
  
  setKeywords: (keywords: string[]) => {
    const limitedKeywords = keywords.slice(0, MAX_KEYWORDS);
    saveKeywordsToStorage(limitedKeywords);
    set({ recommendedKeywords: limitedKeywords });
  },
  
  removeKeyword: (keyword: string) => {
    const { recommendedKeywords } = get();
    const updatedKeywords = recommendedKeywords.filter(k => k !== keyword);
    saveKeywordsToStorage(updatedKeywords);
    set({ recommendedKeywords: updatedKeywords });
  },
  
  clearKeywords: () => {
    saveKeywordsToStorage([]);
    set({ recommendedKeywords: [] });
  },
}));

export default useKeywordStore;
