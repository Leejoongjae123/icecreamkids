"use client";
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { FileUploadProps, UploadedFile } from './types';
import Image from 'next/image';

function FileUpload({ onFilesChange, selectedFiles, onFileSelect }: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );

    if (imageFiles.length === 0) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    const newFiles: UploadedFile[] = imageFiles.map((file, index) => ({
      id: Date.now() + index,
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));

    const updatedFiles = [...uploadedFiles, ...newFiles];
    setUploadedFiles(updatedFiles);
    onFilesChange(updatedFiles);
  }, [uploadedFiles, onFilesChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  }, [handleFileSelect]);

  const handleBrowseFiles = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemoveFile = useCallback((id: number) => {
    const fileToRemove = uploadedFiles.find(file => file.id === id);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    
    const updatedFiles = uploadedFiles.filter(file => file.id !== id);
    setUploadedFiles(updatedFiles);
    onFilesChange(updatedFiles);
  }, [uploadedFiles, onFilesChange]);

  // 메모리 누수 방지를 위한 cleanup
  useEffect(() => {
    return () => {
      uploadedFiles.forEach(file => {
        URL.revokeObjectURL(file.preview);
      });
    };
  }, []);

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />
      
      {/* 드래그 앤 드롭 영역 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border border-dashed border-zinc-400rounded-lg p-8 text-center transition-colors ${
          isDragOver 
            ? 'border-amber-400 bg-amber-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 flex items-center justify-center cursor-pointer" onClick={handleBrowseFiles}>
<Image src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/image_upload.svg" alt="upload" width={48} height={48} />
          </div>
          
          <div className="text-medium font-medium text-gray-700">
          사진 파일을  끌어다 놓거나 <br />
          선택하여 업로드하세요. 
          </div>
          
        </div>
      </div>

      {/* 업로드된 파일들 */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <div className="grid grid-cols-6 gap-4">
            {uploadedFiles.map((file, index) => (
              <div key={file.id} className="flex flex-col relative">
                <div className="relative">
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="object-cover rounded-xl aspect-[1.34] w-full cursor-pointer"
                    onClick={() => onFileSelect(index)}
                  />
                  
                  {/* 체크박스 오버레이 */}
                  <div className="absolute top-2 left-2">
                    <Checkbox
                      checked={selectedFiles.has(index)}
                      onCheckedChange={() => onFileSelect(index)}
                      className="bg-white/80 border-gray-300 data-[state=checked]:bg-amber-400 data-[state=checked]:border-amber-400 data-[state=checked]:text-white"
                    />
                  </div>
                  

                </div>
                
                <div className="text-sm text-gray-700 mt-2 text-center truncate">
                  {file.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUpload; 