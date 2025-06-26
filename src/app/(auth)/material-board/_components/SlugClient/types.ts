import { TSlugType } from '@/app/(auth)/material-board/[...slug]/types';

export interface ISlugClient {
  category: TSlugType;
  parentSmartFolderId: string;
}
