import { SmartFolderTreeResult } from '@/service/file/schemas';
import { create } from 'zustand';

type TFolderType = 'myFolders' | 'smartFolders';

interface IFolderState {
  folderList: Record<'myFolders' | 'smartFolders', SmartFolderTreeResult[]>;
  setFolderList: (keyword: TFolderType, folders: SmartFolderTreeResult[]) => void;
  resetFolderList: (keyword?: TFolderType) => void;
}

export const useFolderStore = create<IFolderState>((set) => ({
  folderList: {
    myFolders: [],
    smartFolders: [],
  },
  setFolderList: (keyword, folders) =>
    set((state) => ({
      folderList: {
        ...state.folderList,
        [keyword]: folders,
      },
    })),
  resetFolderList: (keyword) =>
    set((state) => ({
      folderList: keyword ? { ...state.folderList, [keyword]: [] } : { myFolders: [], smartFolders: [] },
    })),
}));
