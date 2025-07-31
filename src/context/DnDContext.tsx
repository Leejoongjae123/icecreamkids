'use client';

import { createContext, useCallback, useContext, useMemo, useState, useEffect, type ReactNode } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { usePathname } from 'next/navigation';

// 컨텍스트 타입 정의
interface DndContextType {
  enableDnd: () => void;
  disableDnd: () => void;
  isDndEnabled: boolean;
}

const DndContext = createContext<DndContextType>({
  enableDnd: () => {},
  disableDnd: () => {},
  isDndEnabled: false,
});

interface DndProviderWrapperProps {
  children: ReactNode;
}

export function DndProviderWrapper({ children }: DndProviderWrapperProps) {
  const pathname = usePathname();
  // const [isDndEnabled, setIsDndEnabled] = useState(false);
  const [isDndEnabled, setIsDndEnabled] = useState(true);

  // useCallback으로 함수 메모이제이션
  const enableDnd = useCallback(() => setIsDndEnabled(true), []);
  const disableDnd = useCallback(() => setIsDndEnabled(false), []);

  // useMemo로 context 값 메모이제이션
  const contextValue = useMemo(() => ({ enableDnd, disableDnd, isDndEnabled }), [enableDnd, disableDnd, isDndEnabled]);

  useEffect(() => {
    if (
      pathname.includes('/work-board/student-record') ||
      pathname.includes('/work-board/playing-plan/activity-card')
    ) {
      disableDnd();
    } else enableDnd();
  }, [disableDnd, enableDnd, pathname]);

  return (
    <DndContext.Provider value={contextValue}>
      {isDndEnabled ? (
        <DndProvider backend={HTML5Backend}>{children}</DndProvider>
      ) : (
        <div key="disabled-dnd">{children}</div>
      )}
    </DndContext.Provider>
  );
}

export const useDndContext = () => useContext(DndContext);
