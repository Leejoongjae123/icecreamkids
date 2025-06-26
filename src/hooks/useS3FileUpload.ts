import { useCallback } from 'react';
import { useUploadCompleted, useUploadCompleted1, useUploadPrepare } from '@/service/file/fileStore';
import {
  CommonUploadCompletedRequest,
  CommonUploadCompletedRequestUploadedTaskType,
  FileObjectResult,
  FileObjectUploadRequest,
  FileObjectUploadRequestSource,
  SmartFolderItemResultSmartFolderApiType,
  SmartFolderItemResult,
  UploadedItemInfoFileType,
} from '@/service/file/schemas';
import useUserStore from '@/hooks/store/useUserStore';
import { IP_ADDRESS } from '@/const';
import { getBypassCorsUrl, getFileExtension, sanitizeFileName } from '@/utils';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import Resizer from 'react-image-file-resizer';

interface IS3UploadResult {
  type: string;
  url: string; // 요청한 URL (업로드한 파일의 URL 또는 presigned URL)
  redirected: boolean; // 리디렉션 여부
  status: number; // HTTP 상태 코드 (예: 200, 403, 등)
  ok: boolean; // 응답이 정상적인지 여부
  statusText: string; // 상태 텍스트 (예: 'Forbidden', 'OK' 등)
  bodyUsed: boolean; // 응답 본문이 이미 사용되었는지 여부
  headers: Headers; // 응답 헤더
}
export interface IPostFile {
  file: File;
  fileType: UploadedItemInfoFileType;
  taskType: CommonUploadCompletedRequestUploadedTaskType;
  source?: FileObjectUploadRequestSource; // default: 'FILE'
  thumbFile?: File | null; // default: null
  thumbObjectId?: number; // default: 0
  targetSmartFolderApiType?: SmartFolderItemResultSmartFolderApiType;
  targetFolderId?: number;
}

interface IS3UploadCompleted {
  file: File;
  fileSize: number;
  fileType: UploadedItemInfoFileType;
  fileObjectId: number;
  thumbObjectId: number;
  taskType: CommonUploadCompletedRequestUploadedTaskType;
  s3Result: any;
  targetSmartFolderApiType?: SmartFolderItemResultSmartFolderApiType;
  targetFolderId?: number;
}

export default function useS3FileUpload() {
  const { userInfo } = useUserStore();
  const { showAlert } = useAlertStore();

  const { mutateAsync: uploadFile } = useUploadPrepare();
  const { mutateAsync: completedProfile } = useUploadCompleted();
  const { mutateAsync: uploadCompleted } = useUploadCompleted1();

  /**
   * S3에 파일을 업로드하는 함수.
   *
   * 주어진 파일을 result 배열의 첫 번째 요소에 있는 presignedUrl을 사용해 S3로 업로드.
   * presignedUrl이 존재하지 않으면 null을 반환.
   *
   * @param {boolean} isSpecialType - 업로드할 파일 객체가 특수확장자인지 여부. (-isd)
   * @param {File} file - 업로드할 파일 객체.
   * @param {FileObjectResult[]} result - presignedUrl이 포함된 FileObjectResult 배열.
   * @returns {Promise<IS3UploadResul> | null>} S3 업로드 결과 또는 presignedUrl이 없을 경우 빈 객체.
   */
  const s3UploadFile = async (
    isSpecialType: boolean = false,
    file: File,
    result: FileObjectResult[],
  ): Promise<IS3UploadResult | null> => {
    if (result && result[0].presignedUrl) {
      return fetch(getBypassCorsUrl(result[0]?.presignedUrl), {
        method: 'PUT',
        headers: { 'Content-Type': isSpecialType || file.type == '' ? 'application/octet-stream' : file.type },
        body: file,
      });
    }
    return null;
  };

  /**
   * 자료 업로드 완료 처리 함수.
   *
   * 주어진 파일을 S3에 정상 업로드한 경우, 자료 업로드 완료 처리 API 호출.
   *
   * @param {File} file - 업로드힌 파일 객체.
   * @param {number} fileSize - 업로드힌 파일 객체 사이즈.
   * @param {UploadedItemInfoFileType} fileType - 업로드힌 파일 객체.
   * @param {number} fileObjectId - 업로드힌 파일 객체 아이디.
   * @param {number} thumbObjectId - 업로드한 파일 썸네일 객체 아이디.
   * @param {CommonUploadCompletedRequestUploadedTaskType} taskType - 업로드 작업 타입.
   * @param {any} s3Result - S3 업로드 결과.
   * @returns {SmartFolderItemResult |  FileObjectResult[] | NonNullable<unknown>>} 자료 업로드 결과 또는 S3에 정상 업로드 되지 않은 경우 빈 객체.
   */
  const s3UploadCompleted = useCallback(
    async ({
      file,
      fileSize,
      fileType,
      fileObjectId,
      thumbObjectId,
      taskType,
      s3Result,
      targetSmartFolderApiType,
      targetFolderId,
    }: IS3UploadCompleted) => {
      let completedResult: SmartFolderItemResult | NonNullable<unknown> = {};
      if (s3Result?.status === 200) {
        // AWS 정상 업로드 된 경우
        const completedReq: CommonUploadCompletedRequest = {
          uploadItemInfo: {
            type: 'FILE',
            thumbObjectId,
            fileType,
            name: file.name,
            totalSize: fileSize,
            creatorProfileId: userInfo?.id ?? 0,
            createdIp: IP_ADDRESS,
          },
          targetSmartFolderApiType,
          uploadedTaskType: taskType,
          targetFolderId,
        };
        const { result } = await uploadCompleted({
          fileObjectId: fileObjectId.toString(),
          data: completedReq,
        });
        if (result) completedResult = result;
      }
      return completedResult;
    },
    [uploadCompleted, userInfo?.id],
  );

  /**
   * 썸네일 리사이징 함수.
   *
   * 만약 source가 'THUMBNAIL'이면, 본 함수를 호출해 리사이징 후 S3에 업로드 하도록 함,
   * 업로드 완료시 리사이징 된 썸네일 파일 전달.
   *
   * @param {File} thumbFile - 리사이징할 썸네일 파일 객체.
   * @returns {Promise<File>} 리사이징 결과 썸네일 파일 객체.
   */
  const resizeThumbnail = (thumbFile: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      // MIME 타입 기준으로 변환할 이미지 형식 결정
      const isPng = thumbFile.type === 'image/png';
      const outputFormat = isPng ? 'PNG' : 'JPEG';
      const mimeType = isPng ? 'image/png' : 'image/jpeg';

      Resizer.imageFileResizer(
        thumbFile,
        300, // 너비를 300px로 제한
        300, // 높이도 300px로 제한 (비율은 유지)
        outputFormat, // 이미지 형식 (JPEG, PNG 등)
        80, // 품질
        0, // 회전 없음
        (uri) => {
          // base64 데이터로 리사이징된 이미지 반환
          const byteString = atob((uri as string).split(',')[1]);
          const arrayBuffer = new ArrayBuffer(byteString.length);
          const uintArray = new Uint8Array(arrayBuffer);

          for (let i = 0; i < byteString.length; i++) {
            uintArray[i] = byteString.charCodeAt(i);
          }

          const resizedFile = new File([arrayBuffer], thumbFile.name, { type: mimeType });

          // base64 데이터를 이미지로 설정
          resolve(resizedFile);
        },
        'base64', // base64 포맷으로 리사이징된 이미지를 받음
      );
    });
  };

  /**
   * 파일을 업로드하는 비동기 함수.
   *
   * 파일의 메타데이터를 등록하여 S3 presigned URL을 생성하고,
   * 해당 URL을 이용해 AWS S3에 파일을 업로드.
   * 만약 source가 'FILE'이고 thumbFile이 존재하면, 본 함수를 재귀 호출해 썸네일을 먼저 업로드하고,
   * 업로드 완료 콜백에서 썸네일 객체 아이디를 전달.
   *
   * @param {File} file - 업로드할 파일 객체.
   * @param {UploadedItemInfoFileType} fileType - 업로드할 파일의 타입.
   * @param {CommonUploadCompletedRequestUploadedTaskType} taskType - 업로드 작업 타입.
   * @param {FileObjectUploadRequestSource} [source='FILE'] - (옵션) 업로드 요청 소스 ('FILE', 'THUMBNAIL', 'PROFILE' 등).
   * @param {File | null} [thumbFile=null] - (옵션) 파일과 함께 업로드할 썸네일 객체.
   * @param {number} [thumbObjectId=0] - (옵션) 썸네일 오브젝트 아이디.
   * @param {SmartFolderItemResultSmartFolderApiType} [targetSmartFolderApiType=null] - (옵션) 업로드가될 폴더의 타입
   * @param {number} [targetFolderId=null] - (옵션) 업로드가될 폴더의 id
   * @returns {Promise<SmartFolderItemResult | NonNullable<unknown>>} 업로드 결과 객체.
   */
  const postFile = useCallback(
    async ({
      file,
      fileType,
      taskType,
      source = 'FILE',
      thumbFile = null,
      thumbObjectId = 0,
      targetSmartFolderApiType,
      targetFolderId,
    }: IPostFile) => {
      try {
        const extension = getFileExtension(file.name);
        const isSpecialType = extension?.startsWith('isd') || extension?.startsWith('url');

        let thumbFileObjectId = 0;
        // 만약 파일 업로드인데 썸네일 파일이 있다면, 재귀 호출을 통해 썸네일 먼저 업로드
        if (source === 'FILE' && thumbFile) {
          const thumbResult = await postFile({
            file: thumbFile,
            fileType: 'IMAGE',
            taskType,
            source: 'THUMBNAIL',
          });
          thumbFileObjectId = (thumbResult as any)[0]?.id || thumbObjectId;
        }

        // 썸네일 리사이징 처리
        let fileToUpload = file;
        let fileBody: FileObjectUploadRequest = {
          source,
          mediaType: isSpecialType || file.type == '' ? 'application/octet-stream' : file.type,
          originalFileName: sanitizeFileName(file.name),
          size: file.size,
          ownerAccountId: userInfo?.accountId ?? 0,
          createdIp: IP_ADDRESS,
        };

        if (source === 'THUMBNAIL') {
          // 썸네일 리사이징
          const resizedFile = await resizeThumbnail(fileToUpload);

          // 리사이징된 썸네일로 파일 정보 업데이트
          fileToUpload = resizedFile;
          fileBody = {
            ...fileBody,
            mediaType: isSpecialType ? 'application/octet-stream' : resizedFile.type,
            originalFileName: `thumb_${sanitizeFileName(file.name)}`,
            size: resizedFile.size,
          };
        }

        // 파일 정보를 등록하고 presigned URL 요청
        const { result: createUrlRes } = await uploadFile({ data: [fileBody] });
        if (!createUrlRes) return {} as SmartFolderItemResult;
        const fileId = createUrlRes[0].id;

        // AWS S3에 파일 업로드
        const awsUploadRes: IS3UploadResult | null = await s3UploadFile(isSpecialType, fileToUpload, createUrlRes);

        if (!awsUploadRes || awsUploadRes.status !== 200) {
          showAlert({ message: '자료 업로드에 실패했습니다.' });
          return null;
        }

        let completedRes: SmartFolderItemResult | NonNullable<unknown>;
        if (source === 'FILE') {
          completedRes = await s3UploadCompleted({
            file: { ...fileToUpload, name: sanitizeFileName(fileToUpload.name) },
            fileSize: fileToUpload.size,
            fileType,
            fileObjectId: fileId,
            thumbObjectId: thumbFileObjectId,
            taskType,
            s3Result: awsUploadRes,
            targetSmartFolderApiType,
            targetFolderId,
          });
        } else {
          await completedProfile({ fileObjectId: fileId });
          completedRes = createUrlRes;
        }
        return completedRes as SmartFolderItemResult | FileObjectResult[];
      } catch (error) {
        showAlert({ message: '자료 업로드에 실패했습니다.' });
        return null;
      }
    },
    [completedProfile, s3UploadCompleted, showAlert, uploadFile, userInfo?.accountId],
  );

  return { postFile };
}
