import getAcceptedMIMEType from '@/utils/DragAndDrop/getAcceptedMIMEType';
import { useEffect, useState } from 'react';
import type { SmartFolderItemResult } from '@/service/file/schemas';
import { UploadModal } from '@/components/modal';
import type { IFileSelectorProps } from './types';
import { FILE_SELECTOR_MESSAGE } from './const';

export const FileSelector = function FileSelector({ fileInputRef, onFileSelect }: IFileSelectorProps) {
  const [itemData, setItemData] = useState<SmartFolderItemResult[]>([]);
  const [fileData, setFileData] = useState<File[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // 파일 데이터가 변경되면 부모 컴포넌트에 전달
  useEffect(() => {
    if (fileData.length > 0) {
      console.log('FileSelector: fileData 변경됨', fileData);
      onFileSelect(fileData);
    }
  }, [fileData, onFileSelect]);

  // 아이템 데이터가 변경되면 파일 데이터 업데이트
  useEffect(() => {
    if (itemData.length > 0) {
      console.log('FileSelector: itemData 변경됨', itemData);
      // 여기서 처리 필요 없음 - 이제 부모 컴포넌트에서 처리
      onFileSelect(itemData);
    }
  }, [itemData, onFileSelect]);

  // 업로드 모달 열기
  const handleOpenUploadModal = () => {
    setIsUploadModalOpen(true);
  };

  // 업로드 모달 닫기
  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
  };

  // 업로드 모달 확인 - 이미 setItemData, setFileData가 호출된 후임
  const handleConfirmUploadModal = () => {
    setIsUploadModalOpen(false);
  };

  return (
    <>
      <button type="button" className="item-file" onClick={handleOpenUploadModal}>
        <span className="ico-comm ico-upload-play-40" />
        <p className="txt-file">
          놀이카드를 선택해 여기에 드래그 하거나,
          <span className="btn-file">업로드</span>
          해주세요.
        </p>
      </button>

      {isUploadModalOpen && (
        <UploadModal
          isOpen={isUploadModalOpen}
          onCancel={handleCloseUploadModal}
          onConfirm={handleConfirmUploadModal}
          setItemData={setItemData}
          setFileData={setFileData}
          allowsFileTypes={['LECTURE_PLAN']}
          isMultiUpload
          taskType="LECTURE_PLAN"
        />
      )}
    </>
  );
};
