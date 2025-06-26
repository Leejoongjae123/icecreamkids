import type { Dispatch, SetStateAction } from 'react';
import type { FileSelectorMessageKey } from './const';

interface IUploadedFileListProps {
  files: any[];
  onRemove: (id: number) => void;
}

interface IDropZoneProps {
  availableFiles: any[];
  uploadedFiles: any[];
  // setUploadedFiles: Dispatch<SetStateAction<any[]>>;
  setUploadedFiles: any | any[];
  setSelectedIds: Dispatch<SetStateAction<number[]>>;
  allowedFileTypes: string[] | string;
  fileSelectorMessageType: FileSelectorMessageKey;
  onError?: (message: string) => void;
}

interface IFileSelectorProps {
  fileInputRef: React.RefObject<HTMLInputElement>;
  allowedFileTypes: string[] | string;
  onFileSelect: (files: any[] | null) => void;
  messageType: FileSelectorMessageKey;
}

export type { IUploadedFileListProps, IDropZoneProps, IFileSelectorProps };
