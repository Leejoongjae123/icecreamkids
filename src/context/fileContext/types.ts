import { ReactNode } from 'react';

export interface IFileContext {
  files: FileList | [];
  handleFileSelect: (files: FileList | []) => void;
  isPreviewModalOpen?: boolean;
  handleIsPreviewOpen: (isOpen: boolean) => void;
  hasNewFiles?: boolean;
  resetNewFilesFlag?: () => void;
  stopHeaderScroll?: boolean;
  handleStopHeaderScroll: (isStop: boolean) => void;
}

export interface IFileProvider {
  children: ReactNode;
}
