import React, { useState } from 'react';
import { ModalBase, Radio } from '@/components/common';
import { IPhotoAiFaceModal } from '@/components/modal/photo-ai-face/types';
import { createPortal } from 'react-dom';
import { PHOTO_AI_FACE_OPTION } from '@/const';

export const PhotoAiFaceModal = ({ isOpen, onConfirm, onCancel }: IPhotoAiFaceModal) => {
  const [selectedOption, setSelectedOption] = useState<string>('');

  const handleConfirm = () => {
    onConfirm(selectedOption);
    if (onCancel) {
      onCancel();
    }
  };

  return createPortal(
    <ModalBase
      isOpen={isOpen}
      onConfirm={handleConfirm}
      onCancel={onCancel}
      message="초상권 해결"
      className="modal-face"
      confirmText="적용"
    >
      <strong className="tit-sub">선택 항목</strong>
      <Radio
        name="aiFaceOption"
        options={PHOTO_AI_FACE_OPTION}
        value={selectedOption}
        onChange={(e: React.MouseEvent<HTMLInputElement, MouseEvent>) => {
          const { value } = e.target as HTMLInputElement;
          setSelectedOption(value);
        }}
      />
    </ModalBase>,
    document.getElementById('modal-root') as HTMLElement,
  );
};

PhotoAiFaceModal.displayName = 'PhotoAiFaceModal';
