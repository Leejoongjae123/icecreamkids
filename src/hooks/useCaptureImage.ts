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
        console.error(`Element with ID "${elementId}" not found.`);
        return;
      }

      try {
        const dataUrl = await toPng(node, options);
        await download(dataUrl, fileName);
      } catch (error) {
        console.error('Failed to capture image:', error);
      }
    },
    [],
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
  const previewImage = useCallback(async (elementId: string, options: Options = { backgroundColor: '#FFF' }) => {
    const node = document.getElementById(elementId);

    if (!node) {
      console.error(`Element with ID "${elementId}" not found.`);
      return null;
    }

    try {
      const dataUrl = await toPng(node, options);
      if (dataUrl) {
        const blob = await (await fetch(dataUrl)).blob();
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        // 메모리 누수 방지: : 후 Blob URL 접근 해제
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60 * 1000);
      }
      return dataUrl;
    } catch (error) {
      console.error('Failed to preview image:', error);
      return null;
    }
  }, []);

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
  const getImageURL = useCallback(async (elementId: string, options: Options = { backgroundColor: '#FFF' }) => {
    const node = document.getElementById(elementId);

    if (!node) {
      console.error(`Element with ID "${elementId}" not found.`);
      return null;
    }

    try {
      return await toPng(node, options);
    } catch (error) {
      console.error('Failed to preview image:', error);
      return null;
    }
  }, []);

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
      const node = document.getElementById(elementId); // elementId로 HTML 요소를 선택
      if (!node) {
        throw new Error(`Element with id "${elementId}" not found`);
      }

      // HTML 요소를 Blob 형태로 변환
      const blob = await toBlob(node, { backgroundColor: '#FFF', includeQueryParams: true });

      if (blob) {
        const file = blobToFile(blob, fileName);
        // File 객체를 postFile 함수에 전달
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
    } catch (error) {
      showAlert({ message: '이미지로 저장에 실패했습니다.' });
      return undefined;
    }
  };

  return {
    downloadImage,
    previewImage,
    getImageURL,
    getImageAndUploadToS3,
  };
}
