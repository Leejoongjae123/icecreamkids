import { useCallback } from 'react';
import {
  CdnFileDownloadRequest,
  CdnFilesForDownloadRequest,
  SmartFolderItemResultSmartFolderApiType,
} from '@/service/file/schemas';
import { IP_ADDRESS } from '@/const';
import { getItemKeyList, useGetCdnFilesForDownload, useGetCdnFilesForDownloadV2 } from '@/service/file/fileStore';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import { useToast } from '@/hooks/store/useToastStore';

export const useGetCdnFile = () => {
  const { showAlert } = useAlertStore();
  const addToast = useToast((state) => state.add);

  const { mutateAsync: getCdnFilesForDownload } = useGetCdnFilesForDownload();
  const { mutateAsync: getPublicCdnFilesForDownload } = useGetCdnFilesForDownloadV2(); // 공개자료용

  // 공통 원본 자료 요청
  const getCdnFile = useCallback(
    async <T extends { driveItemKey: string; ownerAccountId: number; ownerProfileId: number; name: string }>(
      item: T,
      isForDownload: boolean = false,
    ) => {
      try {
        const cdnParams: CdnFilesForDownloadRequest = {
          ownerId: item.ownerAccountId,
          ownerProfileId: item.ownerProfileId,
          driveItemKeys: [item?.driveItemKey || ''],
          period: 360,
          ip: IP_ADDRESS,
          isForDownload,
        };

        const { result } = await getCdnFilesForDownload({ data: cdnParams });
        return result;
      } catch (error) {
        showAlert({ message: '원본 자료를 찾을 수 없습니다. 관리자에게 문의해주세요.' });
        return undefined;
      }
    },
    [getCdnFilesForDownload, showAlert],
  );

  // 공개 자료용 원본 자료 요청
  const getPublicCdnFile = useCallback(
    async <T extends { driveItemKey: string; name: string }>(item: T, isForDownload: boolean = false) => {
      try {
        const publicCdnParams: CdnFileDownloadRequest = {
          driveItemKeys: [item?.driveItemKey || ''],
          period: 360,
          ip: IP_ADDRESS,
          isForDownload,
        };

        const { result } = await getPublicCdnFilesForDownload({ data: publicCdnParams });
        return result;
      } catch (error) {
        showAlert({ message: '원본 자료를 찾을 수 없습니다. 관리자에게 문의해주세요.' });
        return undefined;
      }
    },
    [getPublicCdnFilesForDownload, showAlert],
  );

  const downloadFromBlob = async (blob: Blob, filename: string) => {
    try {
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      a.style.display = 'none';

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      addToast({ message: '저장되었습니다.' });
    } catch (err) {
      console.error('다운로드 실패:', err);
      showAlert({ message: '저장에 실패했습니다.' });
    }
  };

  // Blob을 파일로 저장.
  const saveBlobToFile = async (blob: Blob, filename: string, mimeType: string = 'application/octet-stream') => {
    try {
      if ('showSaveFilePicker' in window) {
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: 'File',
              accept: { [mimeType]: [`.${filename.split('.').pop()}`] },
            },
          ],
        });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        addToast({ message: '저장되었습니다.' });
        return true;
      }
      await downloadFromBlob(blob, filename);
      return true;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('파일 저장 실패:', err);
        showAlert({ message: '저장에 실패했습니다.' });
        throw err; // 호출자가 에러를 처리할 수 있도록 전달
      }
      return false;
    }
  };

  // 폴더의 하위 리스트 자료 요청
  const getCdnFolder = async (id: string, smartFolderApiType: SmartFolderItemResultSmartFolderApiType) => {
    try {
      const keyList = await getItemKeyList({
        parentSmartFolderId: id,
        smartFolderApiType,
      });
      if (keyList.result) {
        const publicCdnParams: CdnFileDownloadRequest = {
          driveItemKeys: keyList.result,
          period: 360,
          ip: IP_ADDRESS,
          isForDownload: true,
        };

        const { result } = await getPublicCdnFilesForDownload({ data: publicCdnParams });
        return result;
      }
      throw new Error('file download failed');
    } catch (error) {
      showAlert({ message: '원본 자료를 찾을 수 없습니다. 관리자에게 문의해주세요.' });
      return undefined;
    }
  };

  return { getCdnFile, getPublicCdnFile, saveBlobToFile, downloadFromBlob, getCdnFolder };
};
