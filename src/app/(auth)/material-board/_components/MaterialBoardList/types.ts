import { TSlugType } from '@/app/(auth)/material-board/[...slug]/types';
import { IThumbnail } from '@/components/common/Thumbnail/types';

import {
  SmartFolderItemResult,
  SmartFolderItemResultFileType,
  SmartFolderItemResultSmartFolderApiType,
} from '@/service/file/schemas';
import { Dispatch, SetStateAction } from 'react';

export interface IMaterialBoardList extends Pick<IThumbnail, 'makeRenameFile'> {
  category: TSlugType;
  hasFile: boolean;
  currentViewMode: 'grid' | 'list';
  fileList: SmartFolderItemResult[];
  searchKeyword?: string;
  onEditToggle?: (id: number) => void;
  onClick?: ({
    id,
    apiType,
    fileType,
  }: {
    id: number;
    fileType: SmartFolderItemResultFileType;
    apiType: SmartFolderItemResultSmartFolderApiType;
  }) => void;
  onClickShareLinkButton: (item: SmartFolderItemResult) => void;
  selectedIds: Record<number, boolean>;
  dropDownActions: (
    action: 'COPY' | 'MOVE' | 'SAVE' | 'DELETE' | 'RENAME' | 'TAG',
    item?: SmartFolderItemResult,
  ) => void;
  dropDown: (id: number) => boolean;
  onDropDown: (event: React.MouseEvent<HTMLButtonElement>, key: number) => void;
  handleFavorite: (item: SmartFolderItemResult) => void;
  nameEditableInfo?: SmartFolderItemResult | null;
  setNameEditableInfo?: Dispatch<SetStateAction<SmartFolderItemResult | null>>;
  deleteActions?: (action: 'restore' | 'remove' | 'removeFromService', item?: SmartFolderItemResult) => void;
  isFavoriteFolder?: boolean; //
}

export type TRowData = { [key: string]: any };
