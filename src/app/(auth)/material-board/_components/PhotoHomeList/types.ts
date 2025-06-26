import { IMaterialBoardList } from '@/app/(auth)/material-board/_components/MaterialBoardList/types';
import { SelectOption } from '@/components/common/Select';
import { SmartFolderResult } from '@/service/file/schemas';

export interface IPhotoHomeList
  extends Omit<
    IMaterialBoardList,
    | 'fileList'
    | 'currentViewMode'
    | 'selectedIds'
    | 'hasFile'
    | 'onEditToggle'
    | 'onClickShareLinkButton'
    | 'searchKeyword'
    | 'handleFavorite'
    | 'makeRenameFile'
  > {
  fileList: SmartFolderResult[];
  classOptions: SelectOption[];
  onChange: (value: number) => void;
  selectClass: number;
  handleCreatePhotoFolder?: (sectionType: 'educational' | 'activity' | 'ai') => void;

  makeRenameFile?: ({ name, type, id }: { name: string; type: 'make' | 'rename' | 'cancel'; id?: number }) => void; // 파일 생성 or 이름 변경용 action
  photoHomeLoading: boolean;
  classModalCallback?: () => void;
}
