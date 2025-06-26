import type { Dispatch, SetStateAction } from 'react';

interface IUseFileUploadProps {
  allowedFileTypes: string[];
  uploadedFiles: any[];
  setUploadedFiles: Dispatch<SetStateAction<any[]>>;
  onError?: (message: string) => void;
}

interface IUseFileDropProps {
  availableFiles: any[];
  allowedFileTypes: string[];
  onDrop: (files: any[]) => void;
  onError?: (message: string) => void;
  onDropComplete?: () => void;
  uploadedFiles: any[];
}

export type { IUseFileUploadProps, IUseFileDropProps };
