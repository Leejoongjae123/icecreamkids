import { IMenuList } from '@/const/menu/types';
import { SmartFolderTreeResult } from '@/service/file/schemas';

export interface IRecursiveMenu {
  menuList: IMenuList;
  pathName: string;
  toggleSubMenu: (index: number) => void;
  isActivePath: (path: string, menuPath: string) => boolean;
  openSubMenuIdx: number | null;
  depth?: number;
}

export interface IMaterialBoardGnb {
  myFolders: SmartFolderTreeResult[];
  smartFolders: SmartFolderTreeResult[];
}

export const SmartFolderSlugType = ['photo', 'docs'];

export const MyFolderSlugType = ['folder'];
