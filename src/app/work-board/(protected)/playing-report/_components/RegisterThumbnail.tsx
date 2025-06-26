// components/ThumbnailWithMemo.tsx

'use client';

import React from 'react';
import { Thumbnail } from '@/components/common';
import { FLOATING_BUTTON_TYPE } from '@/const';
import { useHandleMemo } from '@/hooks/useHandleMemo';
import { MemoEditModal } from '@/components/modal/memo-edit';
import { SmartFolderItemResult } from '@/service/file/schemas';

interface Props {
  item: SmartFolderItemResult;
  isChecked: boolean;
  displayIndex: number;
  onClose: () => void;
  onEditToggle: (
    e: React.ChangeEvent<HTMLInputElement> | React.MouseEvent<HTMLDivElement>,
    id: number,
    image: SmartFolderItemResult,
  ) => void;
}

export function RegisterThumbnail({ item, isChecked, displayIndex, onClose, onEditToggle }: Props) {
  // 이 컴포넌트 내부에 훅을 한 번만 호출
  const {
    isEditModalOpen,
    isMemoEditActive,
    driveItemMemoData,
    onChangeMemo,
    onEdit,
    handleCloseMemoEditModal,
    handleSaveEditedContent,
  } = useHandleMemo(item);

  return (
    <>
      <Thumbnail
        hover
        fileType={item.fileType}
        thumbUrl={item.thumbUrl || ''}
        fileName={item.name}
        floating={isChecked}
        floatingType={isMemoEditActive ? FLOATING_BUTTON_TYPE.CheckCloseEdit : FLOATING_BUTTON_TYPE.CheckClose}
        showIndexOnCheck
        showNumber={displayIndex}
        isEditActive={isChecked}
        isMine={item.isMine}
        onClose={onClose}
        onClick={(e) => onEditToggle(e, item.id, item)}
        onEditToggle={(e) => onEditToggle(e, item.id, item)}
        onEdit={onEdit}
      />

      {/* 모달 렌더링 */}
      {isEditModalOpen && driveItemMemoData && (
        <MemoEditModal
          memo={driveItemMemoData}
          isOpen={isEditModalOpen}
          onChangeMemo={onChangeMemo}
          onCancel={handleCloseMemoEditModal}
          onSave={handleSaveEditedContent}
        />
      )}
    </>
  );
}
