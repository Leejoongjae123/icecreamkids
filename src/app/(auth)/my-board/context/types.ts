import { SmartFolderItemResult } from '@/service/file/schemas';
import React from 'react';

export interface IMyBoardLayout {
  searchValue: string;
  searchResult: SmartFolderItemResult[];
  searchLoadMoreRef: React.MutableRefObject<HTMLDivElement | null> | null;
  searchLoading: boolean;
  searchRefetch: () => void;
}
