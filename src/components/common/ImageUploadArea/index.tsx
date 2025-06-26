'use client';

import React, { useEffect, useRef, useState } from 'react';
import cx from 'clsx';
import { UploadModal } from '@/components/modal';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import {
  // CommonUploadCompletedRequestUploadedTaskType,
  SmartFolderItemResult,
  SmartFolderResult,
} from '@/service/file/schemas';
import { useFileContext } from '@/context/fileContext';

export interface ImageUploadAreaProps {
  onFilesUpload: (files: File[] | SmartFolderItemResult[]) => void;
  uploadedFiles: (File | SmartFolderResult)[];
  className?: string;
  // taskType?: CommonUploadCompletedRequestUploadedTaskType;
  type?: 'face' | 'edit' | 'sort' | 'play';
  disabled?: boolean;
  maxDataLength?: number;
}

export const ImageUploadArea: React.FC<ImageUploadAreaProps> = ({
  onFilesUpload,
  uploadedFiles = [],
  className = '',
  type = null,
  disabled,
  maxDataLength = Infinity,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const {
    isUploadModalOpen,
    drop,
    canDrop,
    isOver,
    handleOpenUploadModal,
    handleCloseUploadModal,
    handleConfirmUploadModal,
    handleSetItemData,
    processUploadedFiles,
  } = useImageUpload({
    uploadedFiles,
    onFilesUpload,
    maxDataLength,
  });

  // 드래그 중일 때 스타일 변화
  const isActive = canDrop && isOver;
  const [fileData, setFileData] = useState<File[]>([]);
  const { showAlert } = useAlertStore();

  // ref를 drop에 연결
  useEffect(() => {
    if (ref.current) {
      drop(ref); // drop과 ref를 연결
    }
  }, [drop]);

  const handleOpenModal = () => {
    if (disabled || uploadedFiles.length >= maxDataLength) {
      showAlert({
        message: `최대 ${maxDataLength}건만 등록 가능합니다.<br/>업로드된 이미지를 삭제 후 다시 시도해주세요.`,
      });
      return;
    }
    handleOpenUploadModal();
  };

  // 내컴터에서 일반 파일 추가하기
  useEffect(() => {
    if (fileData.length > 0) {
      const available = maxDataLength - uploadedFiles.length;
      const toUpload = available > 0 ? fileData.slice(0, available) : [];

      if (toUpload.length > 0) {
        onFilesUpload(toUpload);
      }
      if (fileData.length > available) {
        showAlert({ message: `최대 ${maxDataLength}건만 등록됩니다. 초과된 파일은 제외됩니다.` });
      }

      setFileData([]);
      handleCloseUploadModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileData, uploadedFiles, maxDataLength, handleCloseUploadModal, setFileData, showAlert]);

  /**
   * SNB 내 컴퓨터 버튼 핸들러
   */
  const { files: snbFiles, handleFileSelect } = useFileContext();

  useEffect(() => {
    if (snbFiles && snbFiles.length > 0) {
      processUploadedFiles(Array.from(snbFiles));
      handleFileSelect([]);
    }
  }, [processUploadedFiles, handleFileSelect, snbFiles]);

  return (
    <>
      <div className={cx(className || 'item-preset preset-type3', { draggable: isActive })} ref={ref}>
        <button type="button" className="inner-preset" onClick={handleOpenModal}>
          <div className="item-file">
            <span className={cx('ico-comm', type && `ico-upload-${type}-40`)} />
            <div className="txt-file">
              사진을 선택하여 여기에 드래그 하거나, <span className="btn-file">업로드</span>
              해주세요.
            </div>
          </div>
        </button>
      </div>

      {/* 업로드 모달 */}
      {isUploadModalOpen && (
        <UploadModal
          isOpen={isUploadModalOpen}
          onCancel={handleCloseUploadModal}
          onConfirm={handleConfirmUploadModal}
          setItemData={handleSetItemData}
          setFileData={setFileData}
          isMultiUpload
          allowsFileTypes={['IMAGE']}
        />
      )}
    </>
  );
};

export default ImageUploadArea;
