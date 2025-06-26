import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ISnbContextType } from './types';

const SnbContext = createContext<ISnbContextType | undefined>(undefined);

export function SnbProvider({ children, value }: { children: ReactNode; value?: ISnbContextType }) {
  // value가 제공되면 사용, 아니면 내부 상태 생성
  const [isSnbOpenInternal, setIsSnbOpen] = useState<boolean>(true);

  // useCallback으로 함수의 참조 안정성 확보
  const toggleSnbInternal = useCallback(() => {
    setIsSnbOpen((prev) => !prev);
  }, []);

  // useMemo로 객체의 참조 안정성 확보
  const contextValue = useMemo(() => {
    if (value) return value;

    return {
      isSnbOpen: isSnbOpenInternal,
      toggleSnb: toggleSnbInternal,
    };
  }, [isSnbOpenInternal, toggleSnbInternal, value]);

  return <SnbContext.Provider value={contextValue}>{children}</SnbContext.Provider>;
}

export function useSnb() {
  const context = useContext(SnbContext);
  if (context === undefined) {
    throw new Error('useSnb는 SnbProvider 내에서만 사용할 수 있습니다.');
  }
  return context;
}
