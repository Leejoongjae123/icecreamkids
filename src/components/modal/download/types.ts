import type { IModal } from '@/components/common/ModalBase/types';
import type {
  CommonUploadCompletedRequestUploadedTaskType,
  SmartFolderItemResult,
  SmartFolderItemResultFileType,
} from '@/service/file/schemas';

export interface IDownloadModal<T = SmartFolderItemResult> extends Omit<IModal, 'message' | 'onConfirm'> {
  onConfirm: (folderData?: SmartFolderItemResult | null, path?: string) => void | Promise<void>;
  onSaveToImage?: (folderData: SmartFolderItemResult | null, path?: string) => void | Promise<void>;
  /*
   * itemData: 다운로드 하기 위한 자료들 리스트.
   */
  itemData: T[];
  /*
   * taskType: 내 컴퓨터로 자료 업로드시, 지정해야 할 타입 (Default: ETC, 자료보드 LNB: ETC)
   */
  taskType?: CommonUploadCompletedRequestUploadedTaskType;
  /*
   * allowsFileTypes: 업로드를 허용하는 파일 타입 리스트.
   */
  allowsFileTypes?: SmartFolderItemResultFileType[];
  action?: 'COPY' | 'MOVE' | 'SAVE' | 'RENAME' | 'copy' | 'move' | 'save' | null;
}
