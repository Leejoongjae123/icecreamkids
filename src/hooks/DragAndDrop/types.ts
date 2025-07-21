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

export interface DragItem {
  index: number;
  id: string;
  type: string;
}

export interface GridItem {
  id: string;
  index: number;
}

export type { IUseFileUploadProps, IUseFileDropProps };
