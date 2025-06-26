import { useCallback } from 'react';
import getValidateFileTypes from '../../utils/DragAndDrop/getValidateFileTypes';
import getUniqueFiles from '../../utils/DragAndDrop/getUniqueFiles';
import type { IUseFileUploadProps } from './types';

export const useFileUpload = ({
  allowedFileTypes,
  uploadedFiles,
  setUploadedFiles,
  onError = (message) => alert(message),
}: IUseFileUploadProps) => {
  const addFiles = useCallback(
    (newFiles: any[]) => {
      setUploadedFiles((prev) => {
        const uniqueFiles = getUniqueFiles(newFiles, prev);
        return [...prev, ...uniqueFiles];
      });
    },
    [setUploadedFiles],
  );

  // 파일 찾아보기를 통해 파일을 선택했을 때
  const handleFileSelection = useCallback(
    (files: any[] | null) => {
      console.log('시스템 업로드시 들어오는 파일 확인: ', files);
      if (!files?.length) return;

      const fileList = Array.from(files);

      // if (!getValidateFileTypes(fileList, allowedFileTypes)) {
      //   onError('놀이카드 양식을 확인해주세요.');
      //   return;
      // }

      addFiles(fileList);
    },
    [addFiles],
  );

  const removeFile = useCallback(
    (id: number) => {
      setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
    },
    [setUploadedFiles],
  );

  return {
    handleFileSelection,
    removeFile,
    addFiles,
  };
};
