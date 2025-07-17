"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import FileUpload from "./FileUpload";
import { AddPictureProps, UploadedFile } from "./types";

function AddPicture({ children }: AddPictureProps) {
  const [activeTab, setActiveTab] = useState("추천자료");
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedUploadedFiles, setSelectedUploadedFiles] = useState<Set<number>>(new Set());

  const tabs = [
    { id: "추천자료", label: "추천자료" },
    { id: "자료보드", label: "자료 보드" },
    { id: "내컴퓨터", label: "내 컴퓨터" }
  ];

  const handleImageSelect = (index: number) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedImages.size === 24) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(Array.from({ length: 24 }, (_, i) => i)));
    }
  };

  const handleUploadedFileSelect = (index: number) => {
    setSelectedUploadedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleUploadedFilesChange = (files: UploadedFile[]) => {
    setUploadedFiles(files);
    // 파일이 삭제되었을 때 선택된 파일들도 정리
    setSelectedUploadedFiles(prev => {
      const newSet = new Set(prev);
      files.forEach((_, index) => {
        if (index < files.length) return;
        newSet.delete(index);
      });
      return newSet;
    });
  };

  const getTotalSelectedCount = () => {
    if (activeTab === "내컴퓨터") {
      return selectedUploadedFiles.size;
    }
    return selectedImages.size;
  };

  // 메모리 누수 방지를 위한 cleanup
  useEffect(() => {
    return () => {
      uploadedFiles.forEach(file => {
        URL.revokeObjectURL(file.preview);
      });
    };
  }, [uploadedFiles]);

  return (
    <Dialog>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-[1200px] p-0 border-none bg-transparent shadow-none z-[60]" style={{ zIndex: 60 }}>
        <div className="flex overflow-hidden flex-col items-start py-10 pl-10 bg-white rounded-2xl max-md:pl-5">
          <div className="flex flex-wrap gap-5 justify-between w-full text-xl font-semibold tracking-tight leading-none text-gray-700 whitespace-nowrap max-w-[1120px] max-md:max-w-full">
            <div className="my-auto">업로드</div>
            <DialogClose asChild>
              <button className="object-contain shrink-0 w-6 aspect-square rounded-[50px] hover:bg-gray-100 transition-colors">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/b5abf07e3dfcb099074331a920108dba1d1438bf?placeholderIfAbsent=true&apiKey=304aa4871c104446b0f8164e96d049f4"
                  className="object-contain shrink-0 w-6 aspect-square rounded-[50px]"
                />
              </button>
            </DialogClose>
          </div>
          
          <div className="flex flex-wrap gap-7 items-start mt-8 leading-none w-full">
            <div className="flex flex-col w-full">
              {/* 탭 헤더 */}
              <div className="flex gap-8 text-base tracking-tight relative border-b border-gray-200">
                {tabs.map((tab) => (
                  <div
                    key={tab.id}
                    className={`cursor-pointer transition-colors pb-3 relative ${
                      activeTab === tab.id 
                        ? "font-semibold text-gray-700" 
                        : "text-zinc-400 hover:text-gray-600"
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <div className="text-center">{tab.label}</div>
                    {/* 활성 탭 언더라인 */}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
          </div>

          {/* 전체 선택 체크박스 */}
         

          <div className="flex flex-wrap gap-8 self-stretch mt-4">
            <div className="flex flex-col grow shrink-0 basis-0 w-fit max-md:max-w-full">
              <div className="overflow-y-auto max-h-[500px] w-full bg-white max-md:max-w-full">
                {/* 추천자료 및 자료보드 탭 */}
                {activeTab !== "내컴퓨터" && (
                  <div className="grid grid-cols-6 gap-4 text-sm tracking-tight leading-none text-gray-700 whitespace-nowrap">
                    {Array.from({ length: 24 }, (_, index) => (
                      <div key={index} className="flex flex-col relative">
                        <div className="relative">
                          <img
                            src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/upload_sample.png"
                            className={`object-contain rounded-xl aspect-[1.34] w-full cursor-pointer transition-all ${
                              selectedImages.has(index) ? '' : ''
                            }`}
                            alt={`이미지 ${index + 1}`}
                            onClick={() => handleImageSelect(index)}
                          />
                          {/* 체크박스 오버레이 */}
                          <div className="absolute top-2 left-2">
                            <Checkbox
                              checked={selectedImages.has(index)}
                              onCheckedChange={() => handleImageSelect(index)}
                              className="bg-white/80 border-gray-300 data-[state=checked]:bg-amber-400 data-[state=checked]:border-amber-400 data-[state=checked]:text-white"
                            />
                          </div>
                        </div>
                        <div className="self-center mt-2">
                          name_name_name_{index + 1}.jpg
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 내 컴퓨터 탭 */}
                {activeTab === "내컴퓨터" && (
                  <FileUpload
                    onFilesChange={handleUploadedFilesChange}
                    selectedFiles={selectedUploadedFiles}
                    onFileSelect={handleUploadedFileSelect}
                  />
                )}
              </div>
              <div className="flex gap-2.5 self-center mt-6 max-w-full text-base font-medium tracking-tight leading-none whitespace-nowrap w-[210px]">
                <DialogClose asChild>
                  <div className="flex overflow-hidden flex-col justify-center px-5 py-3.5 text-gray-700 bg-gray-50 rounded-md border border-solid border-zinc-100 max-md:px-5 cursor-pointer hover:bg-gray-100 transition-colors">
                    <div>닫기</div>
                  </div>
                </DialogClose>
                <div className="flex overflow-hidden flex-col justify-center px-5 py-3.5 text-white bg-amber-400 rounded-md cursor-pointer hover:bg-amber-500 transition-colors">
                  <div>적용({getTotalSelectedCount()})</div>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 self-start mt-3.5 w-2 bg-zinc-100 h-[122px] rounded-[50px]" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AddPicture;
