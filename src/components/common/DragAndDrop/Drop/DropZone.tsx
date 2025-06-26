'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFileUpload } from '@/hooks/DragAndDrop/useFileUpload';
import { useFileDrop } from '@/hooks/DragAndDrop/useFileDrop';
import cx from 'clsx';
import { useFileContext } from '@/context/fileContext';
import { FileSelector } from './FileSelector';
import { UploadedFileList } from './UploadedFileList';
import type { IDropZoneProps } from './types';

export default function DropZone({
  availableFiles,
  uploadedFiles,
  setUploadedFiles,
  setSelectedIds,
  allowedFileTypes,
  fileSelectorMessageType,
  onError,
}: IDropZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);

  const fileTypesArray = useMemo(
    () => (Array.isArray(allowedFileTypes) ? allowedFileTypes : [allowedFileTypes]),
    [allowedFileTypes],
  );

  const { handleFileSelection, removeFile, addFiles } = useFileUpload({
    allowedFileTypes: fileTypesArray,
    uploadedFiles,
    setUploadedFiles,
    onError,
  });

  const { isOver, dropRef } = useFileDrop({
    availableFiles,
    allowedFileTypes: fileTypesArray,
    onDrop: addFiles,
    onError,
    onDropComplete: () => setSelectedIds([]),
    uploadedFiles,
  });

  // 드롭 영역에 대한 참조를 전달
  useEffect(() => {
    dropRef(dropAreaRef);
  }, [dropRef, dropAreaRef]);

  /**
   * SNB 내 컴퓨터 버튼 핸들러
   */
  // DropZone.tsx 수정
  const { files: snbFiles, handleFileSelect, hasNewFiles, resetNewFilesFlag } = useFileContext();

  useEffect(() => {
    if (snbFiles && snbFiles.length > 0 && hasNewFiles) {
      // 파일 타입 검증 추가
      const validFiles = Array.from(snbFiles).filter((file) => {
        // 파일 확장자 검사
        const extension = file.name.split('.').pop()?.toLowerCase();
        return fileTypesArray.some((type) => {
          const allowedExt = type.replace('.', '').toLowerCase();
          return extension === allowedExt;
        });
      });

      if (validFiles.length > 0) {
        setUploadedFiles(validFiles);
      } else {
        console.warn('업로드된 파일 형식이 맞지 않습니다.');
        // 필요하다면 오류 처리
        if (onError) onError('지원하지 않는 파일 형식입니다.');
      }

      // 플래그 초기화 및 파일 상태 정리
      if (resetNewFilesFlag) resetNewFilesFlag();
      handleFileSelect([]);
    }
  }, [snbFiles, hasNewFiles, resetNewFilesFlag, setUploadedFiles, handleFileSelect, fileTypesArray, onError]);

  return (
    <div ref={dropAreaRef} className={cx('item-preset', 'preset-type3', { draggable: isOver })}>
      <div className="inner-preset">
        {uploadedFiles.length > 0 ? (
          <UploadedFileList files={uploadedFiles} onRemove={removeFile} />
        ) : (
          <FileSelector
            fileInputRef={fileInputRef}
            allowedFileTypes={allowedFileTypes}
            onFileSelect={handleFileSelection}
            messageType={fileSelectorMessageType}
          />
        )}
      </div>
    </div>
  );
}
