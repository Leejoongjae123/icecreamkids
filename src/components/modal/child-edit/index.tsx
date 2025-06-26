'use client';

import { ModalBase } from '@/components/common';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ProfileEditModal } from '@/components/modal/proifile-edit';
import { useImageEditor } from '@/hooks/useImageEditor';
import useS3FileUpload from '@/hooks/useS3FileUpload';

interface IModalState {
  open: boolean;
  thumbUrl?: string | null;
  close: () => void;
  handleGetFileData: ({ file, preview }: { file: File; preview: string }) => void;
}

export default function EditChildPhotoClient({ open, thumbUrl = '', close, handleGetFileData }: IModalState) {
  const imageEditor = useImageEditor('/images/childProfileImage.jpg');
  const [hasGuideBeenShown, setHasGuideBeenShown] = useState<boolean>(false);
  const { postFile } = useS3FileUpload();

  useEffect(() => {
    if (thumbUrl) imageEditor.setImage(thumbUrl);
    else {
      imageEditor.setImage('/images/childProfileImage.jpg');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thumbUrl]);

  useEffect(() => {
    // 열어본적 있는지 로컬스토리지 체크
    const flag = localStorage.getItem('popupGuideShown');
    if (flag === 'true') setHasGuideBeenShown(true);
  }, []);

  const handleContinueProfile = () => {
    localStorage.setItem('popupGuideShown', 'true');
    setHasGuideBeenShown(true);
  };

  // onConfirm 콜백: 편집된 이미지 업로드 처리
  const handleConfirmEditPopup = async () => {
    const imageFileType = await imageEditor.getCroppedImageFile();
    const base64Type = await imageEditor.getCroppedImage();
    if (imageFileType && base64Type) handleGetFileData({ file: imageFileType, preview: base64Type });
    close();
    imageEditor.setImage('/images/childProfileImage.jpg');
  };

  if (!open) return null; // 외부에서 open이 false면 렌더링하지 않음
  const computedModal = () => {
    return hasGuideBeenShown ? (
      <ProfileEditModal
        message="아이 사진 등록"
        isOpen={open}
        imageEditor={imageEditor}
        onConfirm={handleConfirmEditPopup}
        onCancel={close}
        size="medium"
        className="modal-profile"
      />
    ) : (
      <ModalBase
        message="아이 사진 등록"
        cancelText="다음에 등록하기"
        confirmText="등록 시작하기"
        className="modal-profile"
        size="medium"
        isOpen={open}
        onCancel={close}
        onConfirm={handleContinueProfile}
      >
        <div className="guide-content">
          <div className="group-image" style={{ padding: 0 }}>
            <div className="item-image">
              <span className="ico-comm ico-illust-profile-correct" />
              <span className="screen_out">올바른 사진 예시 : 정면 사진</span>
            </div>
            <div className="item-image">
              <span className="ico-comm ico-illust-profile-incorrect" />
              <span className="screen_out">올바르지 못한 사진 예시 : 누워있는 사진</span>
            </div>
          </div>
          <div className="group-info">
            <strong className="tit-info">사진 등록 가이드</strong>
            <ul className="list-info">
              <li>아이 얼굴이 잘 보이는 정면 사진을 등록해 주세요.</li>
              <li>얼굴 가이드에 맞춰 사진을 올려주세요.</li>
              <li>밝은 곳에서 찍은 사진을 올려주세요.</li>
              <li>단체 사진이 아닌 단독 사진으로 올려주세요.</li>
              <li>2G 이하의 사진으로 올려주세요.</li>
              <li>확장자 PNG,JPGE,JPG 파일로 올려주세요.</li>
            </ul>
          </div>
        </div>
      </ModalBase>
    );
  };

  return createPortal(computedModal(), document.getElementById('modal-root') as HTMLElement);
}
