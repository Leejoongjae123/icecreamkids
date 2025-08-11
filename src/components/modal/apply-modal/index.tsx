import React from 'react';
import { ModalBase } from '@/components/common';
import { createPortal } from 'react-dom';
import { IApplyModalProps } from './types';

export const ApplyModal = ({
  isOpen,
  message,
  description,
  onConfirm,
  onCancel,
  confirmText = "확인",
  cancelText = "취소",
}: IApplyModalProps) => {
  const handleConfirm = () => {
    onConfirm();
    onCancel(); // 모달 닫기
  };

  return createPortal(
    <ModalBase
      isOpen={isOpen}
      onConfirm={handleConfirm}
      onCancel={onCancel}
      message={message}
      confirmText={confirmText}
      cancelText={cancelText}
      className="modal-apply"
    >
      {description && (
        <div className="text-sm text-gray-600 text-center">
          {description}
        </div>
      )}
    </ModalBase>,
    document.getElementById('modal-root') as HTMLElement,
  );
};

ApplyModal.displayName = 'ApplyModal';

