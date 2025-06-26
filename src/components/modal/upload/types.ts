import { IModal } from '@/components/common/ModalBase/types';
import { TASK_TYPE } from '@/const';
import {
  CommonUploadCompletedRequestUploadedTaskType,
  SmartFolderItemResultSmartFolderApiType,
  SmartFolderItemResult,
  SmartFolderItemResultFileType,
} from '@/service/file/schemas';
import React from 'react';

export interface IUploadModal<T = SmartFolderItemResult> extends Omit<IModal, 'message' | 'onConfirm'> {
  onConfirm: (itemData?: T[]) => void | Promise<void>;
  /*
   * setFileData: 모달 내에서 선택된 파일 모달 밖에서 상태 관리 하기 위한 SetStateAction.
   */
  setFileData?: React.Dispatch<React.SetStateAction<File[]>>;
  /*
   * setItemData: 모달 내에서 선택된 자료들을 모달 밖에서 상태 관리 하기 위한 SetStateAction.
   */
  setItemData?: React.Dispatch<React.SetStateAction<T[]>>;
  /*
   * taskType: 내 컴퓨터로 자료 업로드시, 지정해야 할 타입 (Default: ETC, 자료보드 LNB: ETC)
   */
  taskType?: CommonUploadCompletedRequestUploadedTaskType;
  /*
   * allowsFileTypes: 업로드를 허용하는 파일 타입 리스트.
   */
  allowsFileTypes?: SmartFolderItemResultFileType[];
  /*
   * isMultiUpload: 여러 파일 동시 업로드 여부.
   */
  isMultiUpload?: boolean;
  /*
   * isUploadS3: s3 파일 업로드 여부.
   */
  isUploadS3?: boolean;
  /*
   * isReturnS3UploadedItemData: 내 컴퓨터 자료를 s3 파일 업로드 후 SmartFolderItemResult로 리턴 여부.
   */
  isReturnS3UploadedItemData?: boolean;
  /*
   * targetSmartFolderApiType: 업로드가될 폴더의 타입
   */
  targetSmartFolderApiType?: SmartFolderItemResultSmartFolderApiType;
  /*
   * targetFolderId: 업로드가될 폴더의 id
   */
  targetFolderId?: number;
  /*
   * inputFileId: input 파일 아이디 - `inputFile_${inputFileId}` 형태;
   * 기본 값: fileUplpoad
   */
  inputFileId?: string;
  /*
   * isFolderUpload: 폴더 업로드 메뉴 활성화 여부;
   * 기본 값: false
   */
  isFolderUpload?: boolean;
}
