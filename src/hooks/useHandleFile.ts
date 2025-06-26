import { useAddItem, useCopyItem, useMoveItem1 } from '@/service/file/fileStore';
import { IP_ADDRESS } from '@/const';
import useUserStore from '@/hooks/store/useUserStore';
import { useToast } from '@/hooks/store/useToastStore';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import { SmartFolderItemResult, SmartFolderItemResultSmartFolderApiType } from '@/service/file/schemas';
import { ReactNode, useCallback } from 'react';

export const useHandleFile = () => {
  const addToast = useToast((state) => state.add);
  const { showAlert } = useAlertStore();
  const { userInfo } = useUserStore();

  // 선택한 폴더에 저장
  const { mutateAsync: addItem } = useAddItem();

  /**
   * 파일을 저장하는 비동기 함수.
   *
   * 다운로드 모달에서 타겟 폴더를 지정하여 선택 파일을 저장한다.
   *
   * @param {SmartFolderItemResult} folderData - 저장할 위치 즉, 대상 폴더의 객체.
   * @param {string | string[]} targetItemKeys - 저장하고자 하는 자료의 아이템 키 배열 혹은 단일 키 .
   * @param {string?} path - 저장되는 경로
   * @returns {Promise<void>}
   */
  const handleSave = useCallback(
    async (folderData: SmartFolderItemResult, targetItemKeys: string | string[], path: string = '') => {
      if (!folderData) {
        showAlert({ message: '폴더를 선택해 주세요.' });
        return;
      }

      try {
        const addItemParams = {
          folderOwnerAccountId: userInfo?.accountId ?? 0,
          folderOwnerProfileId: userInfo?.id ?? 0,
          folderOwnerIp: IP_ADDRESS,
          targetSmartFolderApiType: folderData?.smartFolderApiType,
          targetFolderId: folderData?.id,
          originalDriveItemKeys: Array.isArray(targetItemKeys) ? targetItemKeys : [targetItemKeys],
        };
        const moveItemResult = await addItem({ data: addItemParams });
        if (moveItemResult.status === 200) {
          addToast({
            message: `저장되었습니다. ${path && `<br />${path}`}`,
          });
        } else {
          showAlert({ message: '저장에 실패하였습니다.' });
        }
      } catch (error) {
        showAlert({ message: '저장에 실패하였습니다.' });
      }
    },
    [addItem, addToast, showAlert, userInfo?.accountId, userInfo?.id],
  );

  // 선택한 폴더에 이동
  const { mutateAsync: moveItem } = useMoveItem1();
  /**
   * 파일을 이동하는 비동기 함수.
   *
   * 다운로드 모달에서 타겟 폴더를 지정하여 선택 파일을 복사한다.
   *
   * @param {SmartFolderItemResult} folderData - 이동시킬 위치 즉, 대상 폴더의 객체.
   * @param {string | string[]} targetItemKeys - 이동하고자 하는 자료의 아이템 키 배열 혹은 단일 키 .
   * @param {SmartFolderItemResultSmartFolderApiType?} originalSmartFolderApiType  - 현재 폴더 객체의 smartFolderApiType
   * @param {string?} path - 저장되는 경로
   * @returns {Promise<void>}
   */
  const handleMove = useCallback(
    async (
      folderData: SmartFolderItemResult,
      targetItemIds: number | number[],
      originalSmartFolderApiType?: SmartFolderItemResultSmartFolderApiType | null,
      path: string = '',
    ) => {
      if (!folderData) {
        showAlert({ message: '폴더를 선택해 주세요.' });
        return;
      }

      try {
        const moveItemParams = {
          itemOwnerAccountId: userInfo?.accountId ?? 0,
          itemOwnerProfileId: userInfo?.id ?? 0,
          targetSmartFolderApiType: folderData?.smartFolderApiType,
          targetFolderId: folderData?.id,
          originalSmartFolderApiType: originalSmartFolderApiType ?? folderData?.smartFolderApiType,
          originalItemIds: Array.isArray(targetItemIds) ? targetItemIds : [targetItemIds],
        };

        const moveItemResult = await moveItem({ data: moveItemParams });
        if (moveItemResult.status === 200) {
          addToast({ message: `이동되었습니다. ${path && `<br />${path}`}` });
        } else {
          showAlert({ message: '이동에 실패하였습니다.' });
        }
      } catch (error) {
        showAlert({ message: '이동에 실패하였습니다.' });
      }
    },
    [addToast, moveItem, showAlert, userInfo?.accountId, userInfo?.id],
  );

  // 선택한 폴더에 복사
  const { mutateAsync: copyItem } = useCopyItem();
  /**
   * 파일을 복사하는 비동기 함수.
   *
   * 다운로드 모달에서 타겟 폴더를 지정하여 선택 파일을 복사한다.
   *
   * @param {SmartFolderItemResult} folderData - 복사하여 저장할 위치 즉, 대상 폴더의 객체.
   * @param {string | string[]} targetItemKeys - 복사하고자 하는 자료의 아이템 키 배열 혹은 단일 키 .
   * @param {SmartFolderItemResultSmartFolderApiType?} originalSmartFolderApiType  - 현재 폴더 객체의 smartFolderApiType
   * @param {string?} path - 저장되는 경로
   * @param {string | ReactNode} successMessage - 복사 성공시 노출되는 토스트 메시지
   * @param {string} failMessage - 복사 실패시 노출되는 토스트 메시지
   * @returns {Promise<void>}
   */
  const handleCopy = useCallback(
    async (
      folderData: SmartFolderItemResult,
      targetItemIds: number | number[],
      originalSmartFolderApiType?: SmartFolderItemResultSmartFolderApiType | null,
      path: string = '',
      successMessage: string | ReactNode = '복사되었습니다.',
      failMessage: string = '복사에 실패하였습니다.',
    ) => {
      if (!folderData) {
        showAlert({ message: '폴더를 선택해 주세요.' });
        return;
      }

      try {
        const copyItemParams = {
          itemOwnerAccountId: userInfo?.accountId ?? 0,
          itemOwnerProfileId: userInfo?.id ?? 0,
          targetSmartFolderApiType: folderData?.smartFolderApiType,
          targetFolderId: folderData?.id,
          originalSmartFolderApiType: originalSmartFolderApiType ?? folderData?.smartFolderApiType,
          originalItemIds: Array.isArray(targetItemIds) ? targetItemIds : [targetItemIds],
        };

        const copyItemResult = await copyItem({ data: copyItemParams });
        if (copyItemResult.status === 200) {
          addToast({ message: `${successMessage} ${path && `<br />${path}`}` });
        } else {
          showAlert({ message: failMessage });
        }
      } catch (error) {
        showAlert({ message: failMessage });
      }
    },
    [addToast, copyItem, showAlert, userInfo?.accountId, userInfo?.id],
  );

  return { handleSave, handleMove, handleCopy };
};
