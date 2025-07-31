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
import ImageEditModal from "./ImageEditModal";
import { AddPictureProps, UploadedFile } from "./types";
import { useImageRatioStore } from "@/hooks/store/useImageRatioStore";

function AddPicture({ children, targetImageRatio, targetFrame }: AddPictureProps) {
  const [activeTab, setActiveTab] = useState("추천자료");
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedUploadedFiles, setSelectedUploadedFiles] = useState<Set<number>>(new Set());
  const [showImageEditModal, setShowImageEditModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const [isAddPictureModalOpen, setIsAddPictureModalOpen] = useState(false);
  const [isAddPictureModalVisible, setIsAddPictureModalVisible] = useState(true);
  const [createdBlobUrls, setCreatedBlobUrls] = useState<string[]>([]); // 새로 생성된 Blob URL 추적
  
  const { setTargetImageRatio, clearTargetImageRatio } = useImageRatioStore();

  // 생성된 Blob URL들 정리 함수
  const cleanupCreatedBlobUrls = () => {
    createdBlobUrls.forEach(url => {
      URL.revokeObjectURL(url);
    });
    setCreatedBlobUrls([]);
  };

  const tabs = [
    { id: "추천자료", label: "추천자료" },
    { id: "자료보드", label: "자료 보드" },
    { id: "내컴퓨터", label: "내 컴퓨터" }
  ];

  const images=[
    {
      id:1,
      url:"https://icecreamkids.s3.ap-northeast-2.amazonaws.com/cha1.jpg"
    },
    {
      id:2,
      url:"https://icecreamkids.s3.ap-northeast-2.amazonaws.com/cha2.png"
    },
    {
      id:3,
      url:"https://icecreamkids.s3.ap-northeast-2.amazonaws.com/cha3.png"
    },
    {
      id:4,
      url:"https://icecreamkids.s3.ap-northeast-2.amazonaws.com/gong1.png"
    },
    {
      id:5,
      url:"https://icecreamkids.s3.ap-northeast-2.amazonaws.com/gong2.png"
    },
    {
      id:6,
      url:"https://icecreamkids.s3.ap-northeast-2.amazonaws.com/logo1.png"
    },
    {
      id:7,
      url:"https://icecreamkids.s3.ap-northeast-2.amazonaws.com/logo2.png"
    }
  ]

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
    if (selectedImages.size === images.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(Array.from({ length: images.length }, (_, i) => i)));
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

  const getSelectedImageUrls = () => {
    if (activeTab === "내컴퓨터" && selectedUploadedFiles.size > 0) {
      // 업로드된 파일의 경우 새로운 Blob URL 생성 (기존 URL이 만료될 수 있음)
      const newBlobUrls: string[] = [];
      const imageUrls = Array.from(selectedUploadedFiles).map(index => {
        const file = uploadedFiles[index];
        if (file?.file) {
          // 기존 preview URL이 유효한지 확인
          try {
            // 새로운 Blob URL 생성 (기존 것이 만료되었을 수 있음)
            const newPreviewUrl = URL.createObjectURL(file.file);
            newBlobUrls.push(newPreviewUrl);
            console.log(`새로운 Blob URL 생성:`, {
              fileName: file.name,
              oldUrl: file.preview.substring(0, 50) + '...',
              newUrl: newPreviewUrl.substring(0, 50) + '...'
            });
            return newPreviewUrl;
          } catch (error) {
            console.error("Blob URL 생성 실패:", error);
            return file.preview; // 실패시 기존 URL 사용
          }
        }
        return file?.preview;
      }).filter(Boolean);
      
      // 새로 생성된 Blob URL들을 상태에 저장
      setCreatedBlobUrls(prev => [...prev, ...newBlobUrls]);
      
      return imageUrls;
    } else if (activeTab !== "내컴퓨터" && selectedImages.size > 0) {
      return Array.from(selectedImages).map(index => images[index].url);
    }
    return [];
  };

  const handleApplyImages = () => {
    const imageUrls = getSelectedImageUrls();
    const totalCount = getTotalSelectedCount();
    
    console.log("🔍 적용 버튼 클릭 - 디버깅 정보:", {
      totalCount,
      imageUrls,
      activeTab,
      selectedImages: Array.from(selectedImages),
      selectedUploadedFiles: Array.from(selectedUploadedFiles),
      targetFrame,
      targetImageRatio
    });
    
    if (imageUrls.length === 0) {
      console.error("❌ 선택된 이미지가 없습니다");
      alert("이미지를 선택해주세요.");
      return;
    }
    
    if (totalCount === 0) {
      console.error("❌ 총 선택 개수가 0입니다");
      alert("이미지를 선택해주세요.");
      return;
    }

    console.log("✅ 조건 통과 - ImageEditModal 열기 시작");
    
    // targetFrame이 있으면 그것을 기반으로 targetImageRatio 계산
    if (targetFrame) {
      console.log("🎯 AddPicture에서 받은 targetFrame:", targetFrame);
      const calculatedRatio = {
        width: targetFrame.width,
        height: targetFrame.height,
        aspectRatio: targetFrame.width / targetFrame.height
      };
      console.log("📐 AddPicture에서 계산한 targetImageRatio:", calculatedRatio);
      setTargetImageRatio(calculatedRatio);
    } else if (targetImageRatio) {
      // 기존 방식 지원
      console.log("📊 기존 targetImageRatio 사용:", targetImageRatio);
      setTargetImageRatio(targetImageRatio);
    }
    
    setSelectedImageUrl(imageUrls[0]); // 첫 번째 이미지를 기본으로 설정
    
    console.log("🔄 모달 상태 변경 시작...");
    console.log("- 선택된 이미지 URL:", imageUrls[0]);
    
    // AddPicture 모달 숨기기 (닫지 않고 숨기기만)
    setIsAddPictureModalVisible(false);
    
    // 약간의 지연을 두어 AddPicture 모달이 숨겨진 후 ImageEdit 모달 열기
    setTimeout(() => {
      console.log("🚀 ImageEditModal 열기 실행");
      setShowImageEditModal(true);
    }, 50); // 지연 시간을 줄임
  };

  const handleImageEditApply = (editedImageData: string) => {
    // 여기서 편집된 이미지 데이터를 실제로 적용하는 로직을 구현
    console.log("✅ 편집된 이미지 적용:", editedImageData);
    console.log("🔄 모든 모달 닫기 및 상태 초기화");
    
    setShowImageEditModal(false);
    setIsAddPictureModalOpen(false); // 모달 완전히 닫기
    setIsAddPictureModalVisible(true); // visibility 상태 초기화
    clearTargetImageRatio(); // store 정리
    cleanupCreatedBlobUrls(); // 생성된 Blob URL들 정리
    
    // 선택 상태 초기화
    setSelectedImages(new Set());
    setSelectedUploadedFiles(new Set());
    
    // 필요에 따라 부모 컴포넌트로 데이터 전달
  };

  const handleImageEditClose = () => {
    console.log("🔄 ImageEditModal 닫기 시작");
    setShowImageEditModal(false);
    clearTargetImageRatio(); // store 정리
    cleanupCreatedBlobUrls(); // 생성된 Blob URL들 정리
    
    // AddPicture 모달 다시 열기
    setTimeout(() => {
      console.log("🔄 AddPicture 모달 다시 열기");
      setIsAddPictureModalOpen(true);
      setIsAddPictureModalVisible(true);
    }, 100);
  };

  // 메모리 누수 방지를 위한 cleanup
  useEffect(() => {
    return () => {
      uploadedFiles.forEach(file => {
        URL.revokeObjectURL(file.preview);
      });
    };
  }, [uploadedFiles]);

  // showImageEditModal 상태 변화 추적
  useEffect(() => {
    console.log("📊 showImageEditModal 상태 변화:", showImageEditModal);
    if (showImageEditModal) {
      console.log("🖼️ ImageEditModal이 열림 - 전달되는 이미지 URLs:", getSelectedImageUrls());
    }
  }, [showImageEditModal]);

  return (
    <>
      <Dialog open={isAddPictureModalOpen} onOpenChange={setIsAddPictureModalOpen}>
        <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
          {children}
        </DialogTrigger>
      <DialogContent className="max-w-[1200px] p-0 border-none bg-transparent shadow-none z-[60]" style={{ 
        zIndex: 60,
        visibility: isAddPictureModalVisible ? 'visible' : 'hidden',
        opacity: isAddPictureModalVisible ? 1 : 0,
        transition: 'opacity 0.2s ease-in-out'
      }}>
        <div className="flex overflow-hidden flex-col items-start py-10 pl-10 bg-white rounded-2xl max-md:pl-5">
          <div className="flex flex-wrap gap-5 justify-between w-full text-xl font-semibold tracking-tight leading-none text-gray-700 whitespace-nowrap max-w-[1120px] max-md:max-w-full">
            <div className="my-auto">업로드</div>
            <button 
              className="object-contain shrink-0 w-6 aspect-square rounded-[50px] hover:bg-gray-100 transition-colors"
              onClick={() => setIsAddPictureModalOpen(false)}
            >
              <img
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/b5abf07e3dfcb099074331a920108dba1d1438bf?placeholderIfAbsent=true&apiKey=304aa4871c104446b0f8164e96d049f4"
                className="object-contain shrink-0 w-6 aspect-square rounded-[50px]"
              />
            </button>
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
                    {images.map((currentImage, index) => (
                      <div key={index} className="flex flex-col relative">
                        <div className="relative">
                          <img
                            src={currentImage.url}
                            className={`object-cover rounded-xl aspect-[1.34] w-full cursor-pointer transition-all ${
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
                <div 
                  className="flex overflow-hidden flex-col justify-center px-5 py-3.5 text-gray-700 bg-gray-50 rounded-md border border-solid border-gray-300 max-md:px-5 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setIsAddPictureModalOpen(false)}
                >
                  <div>닫기</div>
                </div>
                <div 
                  className="flex overflow-hidden flex-col justify-center px-5 py-3.5 text-white bg-amber-400 rounded-md cursor-pointer hover:bg-amber-500 transition-colors"
                  onClick={handleApplyImages}
                >
                  <div>적용({getTotalSelectedCount()})</div>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 self-start mt-3.5 w-2 bg-zinc-100 h-[122px] rounded-[50px]" />
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* 이미지 편집 모달 */}
    {showImageEditModal && (
      <ImageEditModal
        key="image-edit-modal" // 고정된 key 사용
        isOpen={showImageEditModal}
        onClose={handleImageEditClose}
        imageUrls={getSelectedImageUrls()}
        selectedImageIndex={0}
        onApply={handleImageEditApply}
        targetFrame={targetFrame || {
          width: 300,
          height: 200,
          x: 250,
          y: 200
        }}
      />
    )}
    </>
  );
}

export default AddPicture;
