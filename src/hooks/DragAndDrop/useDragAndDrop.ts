import { useState, type Dispatch, type SetStateAction } from 'react';

// 파일 업로드를 위한 타입 정의
export interface IFileUploadState {
  file: File;
  preview: string;
  id: string;
}

interface IUseDragAndDropProps<T> {
  handleSetFiles: Dispatch<SetStateAction<IFileUploadState[]>>;
  files: IFileUploadState[];
}

interface IUseDragAndDropReturn<T> {
  dndEvent: {
    handleDragEnter: () => void;
    handleDragLeave: () => void;
    handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  };
  isDragging: boolean;
  uploadedFiles: any[];
}

export function useDragAndDrop<T = any>({
  handleSetFiles,
  files,
}: IUseDragAndDropProps<T>): IUseDragAndDropReturn<T> {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const handleDragEnter = () => {
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const newFiles: IFileUploadState[] = droppedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(2, 11), // Unique ID
    }));

    handleSetFiles((prevFiles) => [...prevFiles, ...newFiles]);
    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      const newFiles: IFileUploadState[] = Array.from(selectedFiles).map(
        (file) => ({
          file,
          preview: URL.createObjectURL(file),
          id: Math.random().toString(36).substring(2, 11),
        })
      );
      handleSetFiles((prevFiles) => [...prevFiles, ...newFiles]);
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  return {
    dndEvent: {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      handleFileUpload,
    },
    isDragging,
    uploadedFiles,
  };
}
