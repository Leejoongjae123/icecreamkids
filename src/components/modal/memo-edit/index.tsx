import type React from 'react';
import { Input, ModalBase, Textarea } from '@/components/common';
import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import type { IEditMemoModal } from './types';

export function MemoEditModal({ isOpen, memo, onChangeMemo, onSave, onCancel }: IEditMemoModal) {
  // 제목 입력 변경 (최대 20자 제한)
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeMemo({ title: e.target.value });
  };
  // console.log("memo:", memo);
  const [currentMemo, setCurrentMemo] = useState<string>(memo?.memo ?? '');

  // memo prop이 변경될 때 내부 상태 업데이트
  useEffect(() => {
    if (memo?.memo !== undefined) {
      setCurrentMemo(memo.memo);
    }
  }, [memo?.memo]);

  // 메모 내용 변경 (최대 500자 제한)
  const handleContentChange = (value: string) => {
    setCurrentMemo(value);
    onChangeMemo({ memo: value });
  };
  return createPortal(
    <ModalBase
      className="modal-memo-edit"
      hiddenTitle
      message="메모 수정"
      size="small"
      cancelText="취소"
      confirmText="저장"
      onConfirm={onSave}
      onCancel={onCancel}
      isOpen={isOpen}
    >
      {memo?.title && (
        <Input
          id="titleMemo"
          placeholder="메모 제목 영역"
          maxLength={20}
          value={memo?.title ?? ''}
          onChange={handleTitleChange}
        />
      )}
      <Textarea
        id="contentsMemo"
        placeholder="메모 텍스트 영역"
        maxLength={500}
        value={currentMemo}
        onChange={handleContentChange}
      />
    </ModalBase>,
    document.getElementById('modal-root') as HTMLElement,
  );
}
