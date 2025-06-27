import { createContext } from 'react';
import { IMyBoardLayout } from '@/app/(auth)/my-board/context/types';

export const MyBoardLayoutContext = createContext<IMyBoardLayout>({
  searchValue: '',
  searchResult: [],
  searchLoadMoreRef: null,
  searchLoading: false,
  searchRefetch: () => {},
});
