import { useCallback } from 'react';
import { toBlob, toPng } from 'html-to-image';
import download from 'downloadjs';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import { Options } from 'html-to-image/src/types';
import useS3FileUpload from '@/hooks/useS3FileUpload';
import {
  CommonUploadCompletedRequestUploadedTaskType,
  SmartFolderItemResult,
  SmartFolderItemResultSmartFolderApiType,
} from '@/service/file/schemas';
import { blobToFile } from '@/utils';

export default function useCaptureImage() {
  const { showAlert } = useAlertStore();

  const getBaseOptions = useCallback(
    (overrides: Options = { backgroundColor: '#FFF' }): Options => ({
      backgroundColor: '#FFF',
      pixelRatio: 2,
      cacheBust: true,
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left',
      },
      // @ts-ignore - html-to-image accepts these at runtime
      useCORS: true,
      // @ts-ignore - html-to-image accepts these at runtime
      allowTaint: true,
      ...overrides,
    }),
    [],
  );

  /**
   * 이미지 캡처 및 다운로드 함수
   * @param {string} elementId - 캡처할 DOM 요소의 ID
   * @param {Object} options - html-to-image 옵션
   *  const options = {
   *     backgroundColor: '#ffffff',
   *     width: 800,
   *     height: 600,
   *     style: {
   *       transform: 'scale(2)',
   *       transformOrigin: 'top left',
   *     },
   *     pixelRatio: 2,
   *     cacheBust: true,
   *   };
   * @returns {Promise<void>}
   */
  const downloadImage = useCallback(
    async (elementId: string, fileName = 'captured-image.png', options: Options = { backgroundColor: '#FFF' }) => {
      const node = document.getElementById(elementId);

      if (!node) {
        showAlert({ message: '캡처할 영역을 찾을 수 없습니다.' });
        return;
      }

      try {
        const dataUrl = await toPng(node, getBaseOptions(options));
        await download(dataUrl, fileName);
      } catch (_err) {
        showAlert({ message: '이미지 캡처에 실패했습니다. 다시 시도해주세요.' });
      }
    },
    [getBaseOptions, showAlert],
  );

  /**
   * 이미지 캡처 및 미리보기 함수
   * @param {string} elementId - 캡처할 DOM 요소의 ID
   * @param {Object} options - html-to-image 옵션
   *  const options = {
   *     backgroundColor: '#ffffff',
   *     width: 800,
   *     height: 600,
   *     style: {
   *       transform: 'scale(2)',
   *       transformOrigin: 'top left',
   *     },
   *     pixelRatio: 2,
   *     cacheBust: true,
   *   };
   * @returns {Promise<void>}
   */
  const previewImage = useCallback(
    async (elementId: string, options: Options = { backgroundColor: '#FFF' }) => {
      const node = document.getElementById(elementId);

      if (!node) {
        showAlert({ message: '미리보기 할 영역을 찾을 수 없습니다.' });
        return null;
      }

      try {
        const dataUrl = await toPng(node, getBaseOptions(options));
        if (dataUrl) {
          const blob = await (await fetch(dataUrl)).blob();
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, '_blank');
          setTimeout(() => URL.revokeObjectURL(blobUrl), 60 * 1000);
        }
        return dataUrl;
      } catch (_err) {
        showAlert({ message: '미리보기에 실패했습니다. 다시 시도해주세요.' });
        return null;
      }
    },
    [getBaseOptions, showAlert],
  );

  /**
   * 이미지 캡처 및 URL 반환 함수
   * @param {string} elementId - 캡처할 DOM 요소의 ID
   * @param {Object} options - html-to-image 옵션
   *  const options = {
   *     backgroundColor: '#ffffff',
   *     width: 800,
   *     height: 600,
   *     style: {
   *       transform: 'scale(2)',
   *       transformOrigin: 'top left',
   *     },
   *     pixelRatio: 2,
   *     cacheBust: true,
   *   };
   * @returns {Promise<string | null>} - 이미지 URL
   */
  const getImageURL = useCallback(
    async (elementId: string, options: Options = { backgroundColor: '#FFF' }) => {
      const node = document.getElementById(elementId);

      if (!node) {
        showAlert({ message: '캡처할 영역을 찾을 수 없습니다.' });
        return null;
      }

      try {
        return await toPng(node, getBaseOptions(options));
      } catch (_err) {
        showAlert({ message: '이미지 URL 생성에 실패했습니다.' });
        return null;
      }
    },
    [getBaseOptions, showAlert],
  );

  const { postFile } = useS3FileUpload();

  /**
   * 이미지 캡처 및 S3 업로드 함수
   * html-to-image를 사용하여 이미지 파일을 Blob 형태로 변환한 후 S3에 업로드.
   */
  const getImageAndUploadToS3 = async ({
    elementId,
    fileName,
    taskType,
    smartFolderApiType,
    targetFolderId,
  }: {
    elementId: string;
    fileName: string;
    taskType: CommonUploadCompletedRequestUploadedTaskType;
    smartFolderApiType: SmartFolderItemResultSmartFolderApiType;
    targetFolderId: number;
  }) => {
    try {
      const node = document.getElementById(elementId);
      if (!node) {
        showAlert({ message: '업로드할 캡처 영역을 찾을 수 없습니다.' });
        return undefined;
      }

      const blob = await toBlob(node, getBaseOptions({ backgroundColor: '#FFF' }));

      if (blob) {
        const file = blobToFile(blob, fileName);
        return (await postFile({
          file,
          fileType: 'IMAGE',
          taskType,
          source: 'FILE',
          thumbFile: file,
          targetSmartFolderApiType: smartFolderApiType,
          targetFolderId,
        })) as SmartFolderItemResult;
      }
      return undefined;
    } catch (_err) {
      showAlert({ message: '이미지 업로드에 실패했습니다. 다시 시도해주세요.' });
      return undefined;
    }
  };

  const getImageBlob = useCallback(
    async (elementId: string, options: Options = { backgroundColor: '#FFF' }): Promise<Blob | null> => {
      const node = document.getElementById(elementId);
      if (!node) {
        showAlert({ message: '캡처할 영역을 찾을 수 없습니다.' });
        return null;
      }
      try {
        const blob = await toBlob(node, getBaseOptions(options));
        return blob ?? null;
      } catch (_err) {
        showAlert({ message: '이미지 생성에 실패했습니다.' });
        return null;
      }
    },
    [getBaseOptions, showAlert],
  );

  const getImageFile = useCallback(
    async (
      elementId: string,
      fileName = 'captured-image.png',
      options: Options = { backgroundColor: '#FFF' },
    ): Promise<File | null> => {
      const blob = await getImageBlob(elementId, options);
      if (!blob) return null;
      try {
        return blobToFile(blob, fileName);
      } catch (_err) {
        showAlert({ message: '파일 생성에 실패했습니다.' });
        return null;
      }
    },
    [getImageBlob, showAlert],
  );

  return {
    downloadImage,
    previewImage,
    getImageURL,
    getImageAndUploadToS3,
    getImageBlob,
    getImageFile,
  };
}
