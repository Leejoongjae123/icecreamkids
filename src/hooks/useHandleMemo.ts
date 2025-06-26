import { useMemo, useState, useEffect } from 'react';
import { useGetDriveItemMemos, useUpdateDriveItemMemo } from '@/service/file/fileStore';
import { useToast } from '@/hooks/store/useToastStore';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import { DriveItemMemoResult, DriveItemMemoUpdateRequest, SmartFolderItemResult } from '@/service/file/schemas';
import { IEditMemoData } from '@/components/modal/memo-edit/types';

export const useHandleMemo = (item: SmartFolderItemResult) => {
  const addToast = useToast((state) => state.add);
  const { showAlert } = useAlertStore();

  const isMemoEditActive = useMemo(() => {
    return (item?.driveItemResult && item.driveItemResult?.memoCount > 0) ?? false;
  }, [item]);

  const getDriveItemMemeParams = {
    owner_account_id: item.ownerAccountId?.toString() || '0',
  };

  /* 메모 수정 mutate */
  const { mutateAsync: updateMemo } = useUpdateDriveItemMemo();

  /* 메모 조회  */
  const { data: driveItemMemo, refetch: refetchMemo } = useGetDriveItemMemos(
    item.driveItemKey,
    getDriveItemMemeParams,
    {
      query: { enabled: isMemoEditActive },
    },
  );

  const driveItemMemoData: DriveItemMemoResult | undefined = useMemo(() => {
    return driveItemMemo?.result?.[0];
  }, [driveItemMemo]);

  // 초기 memo를 상태로 관리, driveItemMemoData가 변경될 때마다 업데이트
  const [currentMemo, setCurrentMemo] = useState<IEditMemoData>({
    title: driveItemMemoData?.title ?? '',
    memo: driveItemMemoData?.memo ?? '',
  });

  // driveItemMemoData가 변경될 때 currentMemo 상태 업데이트
  useEffect(() => {
    if (driveItemMemoData) {
      setCurrentMemo({
        title: driveItemMemoData.title,
        memo: driveItemMemoData.memo ?? '',
      });
    }
  }, [driveItemMemoData]);

  const onChangeMemo = (memo: Partial<IEditMemoData>) => {
    setCurrentMemo((prev) => ({
      ...prev,
      ...memo,
    }));
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  /* 메모 편집 아이콘 클릭시 실행되는 함수 (수정 모달 오픈) */
  const onEdit = () => {
    if (!isMemoEditActive || !driveItemMemoData) return;
    setIsEditModalOpen(true);
  };

  const handleCloseMemoEditModal = () => {
    setIsEditModalOpen(false);
  };

  /* 메모 수정 */
  const handleSaveEditedContent = async () => {
    if (!driveItemMemoData?.id) return;

    try {
      const updateMemoData: DriveItemMemoUpdateRequest = {
        title: currentMemo.title,
        memo: currentMemo.memo,
        ownerAccountId: item.ownerAccountId,
        ownerProfileId: item.ownerProfileId,
      };

      const { status } = await updateMemo({
        idOrKey: driveItemMemoData?.driveItemId.toString() ?? item.driveItemKey,
        memoId: driveItemMemoData?.id.toString(),
        data: updateMemoData,
      });

      if (status === 200) {
        addToast({ message: '저장되었습니다.' });
        await refetchMemo();
      } else {
        showAlert({ message: '메모 수정에 실패하였습니다.' });
      }
    } catch {
      showAlert({ message: '메모 수정에 실패하였습니다.' });
    } finally {
      handleCloseMemoEditModal();
    }
  };

  return {
    isEditModalOpen,
    isMemoEditActive,
    driveItemMemoData,
    currentMemo,
    onChangeMemo,
    onEdit,
    handleCloseMemoEditModal,
    handleSaveEditedContent,
  };
};
