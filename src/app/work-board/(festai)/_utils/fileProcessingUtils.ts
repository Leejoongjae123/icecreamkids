// src/utils/fileProcessingUtils.ts
import {
  CommonUploadCompletedRequestUploadedTaskType,
  SmartFolderResult,
  SmartFolderItemResult,
  UploadedItemInfoFileType,
  FileObjectUploadRequestSource,
  SmartFolderTreeResult,
} from '@/service/file/schemas';
import { AIMaskingReqeust } from '@/service/aiAndProxy/schemas';
import { getImageFlatPath } from '@/service/file/fileStore';
import { IClassificationParams, IUploadedFileInfo } from '@/app/work-board/(festai)/types';

type TaskApi<T = IClassificationParams | AIMaskingReqeust> = (params: T) => Promise<{ result?: SmartFolderResult[] }>;
type ToastFn = (options: { message: string }) => void;
type PostFileFn = (options: {
  file: File;
  taskType: CommonUploadCompletedRequestUploadedTaskType;
  fileType: UploadedItemInfoFileType;
  source: FileObjectUploadRequestSource;
  thumbFile: File;
}) => Promise<any>;

export const createFileInfoFromFile = (file: File): IUploadedFileInfo => ({
  id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  file,
  previewUrl: URL.createObjectURL(file),
  isPreUploaded: false,
});

export const createFileInfoFromSmartFolderResult = (file: SmartFolderResult): IUploadedFileInfo => ({
  id: String(file.id),
  file,
  previewUrl: file.thumbUrl || '',
  thumbKey: file.driveItemKey,
  smartFolderItemId: file.id,
  isPreUploaded: true,
});

export const handleFilesUpload = (
  files: File[] | SmartFolderResult[],
  setUploadedFileInfos: React.Dispatch<React.SetStateAction<IUploadedFileInfo[]>>,
) => {
  console.log('handleFilesUpload - 입력된 파일:', files);
  if (!files.length) return;

  setUploadedFileInfos((prev) => {
    console.log('handleFilesUpload - 기존 파일 정보:', prev);

    const newFiles = files.filter((newFile) => {
      if (newFile instanceof File) {
        return !prev.some(
          (info) =>
            info.file instanceof File &&
            info.file.name === newFile.name &&
            info.file.size === newFile.size &&
            info.file.lastModified === newFile.lastModified,
        );
      }
      if ('driveItemKey' in newFile) {
        return !prev.some((info) => info.thumbKey === newFile.driveItemKey || info.smartFolderItemId === newFile.id);
      }
      console.warn('handleFilesUpload - 알 수 없는 파일 타입:', newFile);
      return false;
    });

    console.log('handleFilesUpload - 중복 제거 후 새 파일:', newFiles);
    if (!newFiles.length) return prev;

    const newFileInfos = newFiles.map((file) => {
      if (file instanceof File) {
        return createFileInfoFromFile(file);
      }
      if ('driveItemKey' in file) {
        return createFileInfoFromSmartFolderResult(file as SmartFolderResult);
      }
      throw new Error('지원되지 않는 파일 타입입니다.');
    });

    console.log('handleFilesUpload - 새로 생성된 파일 정보:', newFileInfos);
    return [...newFileInfos, ...prev];
  });
};

export const handleFileDelete = (
  id: string,
  setUploadedFileInfos: React.Dispatch<React.SetStateAction<IUploadedFileInfo[]>>,
) => {
  setUploadedFileInfos((prev) => {
    const fileToDelete = prev.find((info) => info.id === id);
    if (fileToDelete && !fileToDelete.isPreUploaded && fileToDelete.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(fileToDelete.previewUrl);
    }
    return prev.filter((info) => info.id !== id);
  });
};

export const handleDeleteAll = (
  uploadedFileInfos: IUploadedFileInfo[],
  setUploadedFileInfos: React.Dispatch<React.SetStateAction<IUploadedFileInfo[]>>,
  showAlert: (options: { message: string; onCancel: () => void; onConfirm: () => void }) => void,
  addToast: ToastFn,
  ...setResultFunctions: ((results: SmartFolderResult[]) => void)[] // 가변 인자로 변경
) => {
  showAlert({
    message: '업로드된 이미지를 전체 삭제하시겠습니까?',
    onCancel: () => {},
    onConfirm: async () => {
      uploadedFileInfos.forEach((info) => {
        if (!info.isPreUploaded && info.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(info.previewUrl);
        }
      });
      setUploadedFileInfos([]);
      setResultFunctions.forEach((setResult) => setResult([])); // 동적 초기화
      addToast({ message: '업로드된 이미지를 전체 삭제하였습니다.' });
    },
  });
};

export const uploadFilesToS3 = async (
  filesToUpload: IUploadedFileInfo[],
  postFile: PostFileFn,
  addToast: ToastFn,
  taskType: CommonUploadCompletedRequestUploadedTaskType,
): Promise<IUploadedFileInfo[]> => {
  console.log('uploadFilesToS3 - 업로드할 파일 정보:', filesToUpload);
  if (!filesToUpload.length) return [];

  const uploadPromises = filesToUpload.map(async (info) => {
    if (info.isPreUploaded || !(info.file instanceof File)) {
      console.log('uploadFilesToS3 - 업로드 건너뜀:', info);
      return info;
    }

    try {
      const result = await postFile({
        file: info.file,
        taskType,
        fileType: 'IMAGE',
        source: 'FILE',
        thumbFile: info.file,
      });
      console.log('uploadFilesToS3 - 개별 파일 업로드 응답:', { file: info.file.name, result });

      if (!result) {
        console.warn('uploadFilesToS3 - 업로드 실패 (응답 없음):', info.file.name);
        return info;
      }

      const driveItemKey = Array.isArray(result)
        ? result[0]?.id?.toString()
        : 'driveItemKey' in result
          ? result.driveItemKey
          : undefined;

      if (driveItemKey) {
        return { ...info, thumbKey: driveItemKey };
      }

      console.warn('uploadFilesToS3 - driveItemKey 누락:', result);
      return info;
    } catch (error) {
      console.error('uploadFilesToS3 - 개별 파일 업로드 오류:', { error, file: info });
      addToast({ message: `파일 업로드 실패: ${info.file.name}` });
      return info;
    }
  });

  const settledResults = await Promise.allSettled(uploadPromises);
  console.log('uploadFilesToS3 - 모든 업로드 결과:', settledResults);

  const uploadResults: IUploadedFileInfo[] = settledResults.map((result, index) =>
    result.status === 'fulfilled' ? (result.value as IUploadedFileInfo) : filesToUpload[index],
  );

  console.log('uploadFilesToS3 - 최종 업로드 완료 후 파일 정보:', uploadResults);
  return uploadResults;
};

export const fetchTaskResult = async <T extends IClassificationParams | AIMaskingReqeust>(
  params: T, // 여기서 union 타입이 아니라 T로 수정
  taskApi: (params: T) => Promise<{ result?: SmartFolderResult[] }>,
  taskType: string,
  setResults: (results: SmartFolderResult[] | SmartFolderItemResult[]) => void,
  setBreadCrumb: (breadCrumb: SmartFolderTreeResult[]) => void,
  showAlert: ToastFn,
  errorMessage: string,
) => {
  try {
    const [taskResponse, pathResponse] = await Promise.all([taskApi(params), getImageFlatPath({ taskType })]);
    if (!taskResponse.result || !pathResponse.result) {
      throw new Error(`${taskType} 데이터를 받아오지 못했습니다.`);
    }

    setResults(taskResponse.result);
    setBreadCrumb(pathResponse.result);
    return taskResponse.result;
  } catch (error) {
    showAlert({ message: errorMessage });
    console.error(`${taskType} 작업 오류:`, error);
    return false;
  }
};
