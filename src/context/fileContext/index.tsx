import React, { createContext, useState, useContext, useMemo } from 'react';
import { IFileContext, IFileProvider } from '@/context/fileContext/types';
import { boolean } from 'zod';

const FileContext = createContext<IFileContext>({
  files: [],
  handleFileSelect: () => {},
  isPreviewModalOpen: false,
  handleIsPreviewOpen: () => {},
  hasNewFiles: false,
  stopHeaderScroll: false,
  handleStopHeaderScroll: () => {},
});

export const FileProvider = ({ children }: IFileProvider) => {
  const [files, setFiles] = useState<FileList | []>([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [hasNewFiles, setHasNewFiles] = useState<boolean>(false);
  const [stopHeaderScroll, setStopHeaderScroll] = useState<boolean>(false);

  const handleFileSelect = (selectedFile: FileList | []) => {
    setFiles(selectedFile);
    // 파일이 있는 경우
    if (selectedFile.length > 0) {
      setHasNewFiles(true);
    }
  };

  const handleIsPreviewOpen = (isOpen: boolean) => {
    setIsPreviewModalOpen(isOpen);
  };

  const handleStopHeaderScroll = (isStop: boolean) => {
    setStopHeaderScroll(isStop);
  };

  const fileContextValue = useMemo(() => {
    return {
      files,
      handleFileSelect,
      isPreviewModalOpen,
      handleIsPreviewOpen,
      hasNewFiles,
      resetNewFilesFlag: () => setHasNewFiles(false),
      stopHeaderScroll,
      handleStopHeaderScroll,
    };
  }, [files, isPreviewModalOpen, hasNewFiles, stopHeaderScroll]);

  return <FileContext.Provider value={fileContextValue}>{children}</FileContext.Provider>;
};

export const useFileContext = () => useContext(FileContext);
