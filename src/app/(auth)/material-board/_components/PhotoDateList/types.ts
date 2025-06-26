import { IMaterialBoardList } from '@/app/(auth)/material-board/_components/MaterialBoardList/types';
import { Dispatch, SetStateAction } from 'react';

export interface IPhotoDateList extends Omit<IMaterialBoardList, 'hasFile' | 'searchKeyword'> {
  setSelectedIds: Dispatch<SetStateAction<Record<string | number, boolean>>>;
}
