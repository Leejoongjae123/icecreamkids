import { SmartFolderItemResult } from '@/service/file/schemas';

export interface IMyBoardThumbnail {
  item: SmartFolderItemResult;
  path: string;
  selected: boolean;
  floating: boolean;
  isSearching?: boolean;
  isAllSelected?: boolean;
  onRemoveItems: (items: number[]) => Promise<void>;
  onActionItems: (action: 'COPY' | 'MOVE' | 'SAVE', items: SmartFolderItemResult) => void;
  onThumbnailChange: (newValue: boolean) => void;
  onClickShareLinkButton: (item: SmartFolderItemResult) => void;
  onClickItem?: (item: SmartFolderItemResult) => void; // 클릭 이벤트
  onFavorite: (item: SmartFolderItemResult) => void; // 즐겨찾기 이벤트
}
