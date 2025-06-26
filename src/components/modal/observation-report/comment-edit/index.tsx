import React, { useState } from 'react';
import { ModalBase, Textarea } from '@/components/common';

export function ObservationReportCommentEditModal({
  code = '',
  text = '',
  onSave,
  onCancel,
}: {
  code: string | undefined;
  text: string | undefined;
  onSave: (code: string, value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(text);

  const handleChange = (newValue: string) => {
    setValue(newValue);
  };

  return (
    <ModalBase
      isOpen
      size="small"
      cancelText="취소"
      onCancel={onCancel}
      confirmText="저장"
      onConfirm={() => onSave(code, value)}
      className="modal-rating-edit"
    >
      <strong className="screen_out">평가 내용 수정</strong>
      <div className="modal-body">
        <Textarea value={value} maxLength={500} onChange={handleChange} />
      </div>
    </ModalBase>
  );
}
