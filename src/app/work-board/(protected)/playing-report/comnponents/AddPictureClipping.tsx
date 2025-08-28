"use client";
import * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import FileUpload from "./FileUpload";
import { AddPictureProps, UploadedFile } from "./types";

// Konva 동적 임포트
import type { Stage as StageType, Layer as LayerType, Image as ImageType, Group as GroupType } from "react-konva";
import type Konva from "konva";

// 동적 임포트를 위한 변수
let Stage: typeof StageType | null = null;
let Layer: typeof LayerType | null = null;
let KonvaImage: typeof ImageType | null = null;
let Group: typeof GroupType | null = null;
let KonvaLib: typeof Konva | null = null;

// 클라이언트 사이드에서만 Konva 로드
if (typeof window !== 'undefined') {
  try {
    const ReactKonva = require('react-konva');
    Stage = ReactKonva.Stage;
    Layer = ReactKonva.Layer;
    KonvaImage = ReactKonva.Image;
    Group = ReactKonva.Group;
    KonvaLib = require('konva').default;
    // console.log("✅ AddPictureClipping - Konva 라이브러리 로드 성공");
  } catch (error) {
    // console.error("❌ AddPictureClipping - Konva 라이브러리 로드 실패:", error);
  }
}

function AddPicture({ children, targetImageRatio, targetFrame, onImageAdded, onImagesAdded, imageIndex = 0, mode = 'single', hasImage = false, maxImageCount, clipPathData, gridId, isClippingEnabled = false, imageTransformData }: AddPictureProps) {
  const [activeTab, setActiveTab] = useState("추천자료");
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [selectedImagesOrder, setSelectedImagesOrder] = useState<number[]>([]); // 선택 순서 추적
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedUploadedFiles, setSelectedUploadedFiles] = useState<Set<number>>(new Set());
  const [selectedUploadedFilesOrder, setSelectedUploadedFilesOrder] = useState<number[]>([]); // 업로드 파일 선택 순서 추적
  const [isAddPictureModalOpen, setIsAddPictureModalOpen] = useState(false);
  const [createdBlobUrls, setCreatedBlobUrls] = useState<string[]>([]); // 새로 생성된 Blob URL 추적
  const [insertedImageData, setInsertedImageData] = useState<string | null>(null); // 삽입된 이미지 데이터

  // Konva 관련 상태
  const stageRef = useRef<any>(null);
  const imageRef = useRef<any>(null);
  const [konvaImage, setKonvaImage] = useState<HTMLImageElement | null>(null);
  const [isKonvaLoaded, setIsKonvaLoaded] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 200, height: 150 }); // 기본 캔버스 크기
  const [imagePosition, setImagePosition] = useState({ x: 100, y: 75 });
  const [imageScale, setImageScale] = useState(1);
  const [originalImageSize, setOriginalImageSize] = useState({ width: 0, height: 0 });

  // 컨테이너 참조
  const containerRef = useRef<HTMLDivElement>(null);

  // 캔버스 크기 동적 조정
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        
        // 컨테이너 크기에서 여백을 뺀 실제 사용 가능한 공간 계산
        const availableWidth = Math.max(200, rect.width - 20);
        const availableHeight = Math.max(150, rect.height - 20);
        
        // console.log("📏 캔버스 크기 업데이트:", {
        //   container: { width: rect.width, height: rect.height },
        //   available: { width: availableWidth, height: availableHeight }
        // });
        
        setCanvasSize({ 
          width: Math.round(availableWidth), 
          height: Math.round(availableHeight) 
        });
      }
    };

    // 초기 크기 설정
    updateCanvasSize();

    // 윈도우 리사이즈 이벤트 리스너
    const handleResize = () => {
      requestAnimationFrame(updateCanvasSize);
    };

    window.addEventListener('resize', handleResize);
    
    // 컨테이너 크기 변화 감지를 위한 ResizeObserver
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current) {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  // Konva 라이브러리 로딩 확인
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let attempts = 0;
    const maxAttempts = 50;

    const checkKonvaLoading = () => {
      if (typeof window !== 'undefined' && Stage && Layer && KonvaImage && Group) {
        // console.log("✅ AddPictureClipping - Konva 모든 컴포넌트 로드 완료");
        setIsKonvaLoaded(true);
      } else if (attempts < maxAttempts) {
        attempts++;
        timeoutId = setTimeout(checkKonvaLoading, 100);
      } else {
        // console.error("❌ AddPictureClipping - Konva 라이브러리 로딩 실패");
        setIsKonvaLoaded(true); // 에러 상태라도 UI는 표시
      }
    };

    checkKonvaLoading();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  // 이미지 로드 함수
  const loadKonvaImage = useCallback((imageUrl: string) => {
    console.log("🖼️ Konva 이미지 로드 시작:", imageUrl);
    setIsImageLoading(true);

    const imageObj = new window.Image();
    imageObj.crossOrigin = "anonymous";
    
    imageObj.onload = () => {
      const imgWidth = imageObj.width;
      const imgHeight = imageObj.height;
      
      console.log("📏 원본 이미지 크기:", { width: imgWidth, height: imgHeight });
      console.log("🔄 전달받은 이미지 변환 데이터:", imageTransformData);
      
      let finalX, finalY, finalScale;
      
      // 이미지 변환 데이터가 있으면 그것을 사용, 없으면 기본 계산
      if (imageTransformData && imageTransformData.width === imgWidth && imageTransformData.height === imgHeight) {
        // 동일한 이미지의 변환 데이터 사용
        finalX = imageTransformData.x;
        finalY = imageTransformData.y;
        finalScale = imageTransformData.scale;
        
        // console.log("✅ 기존 이미지 변환 데이터 사용:", {
        //   position: { x: finalX, y: finalY },
        //   scale: finalScale
        // });
      } else {
        // 기본 계산: 캔버스 크기에 맞게 이미지 스케일 계산
        const scaleX = canvasSize.width / imgWidth;
        const scaleY = canvasSize.height / imgHeight;
        finalScale = Math.min(scaleX, scaleY, 1); // 최대 1배까지만 확대
        
        // 이미지를 캔버스 중앙에 배치
        finalX = canvasSize.width / 2;
        finalY = canvasSize.height / 2;
        
        console.log("🔧 기본 계산 사용:", {
          position: { x: finalX, y: finalY },
          scale: finalScale,
          canvasSize
        });
      }
      
      setOriginalImageSize({ width: imgWidth, height: imgHeight });
      setImagePosition({ x: finalX, y: finalY });
      setImageScale(finalScale);
      setKonvaImage(imageObj);
      setIsImageLoading(false);
      
      console.log("✅ Konva 이미지 로드 완료");
    };

    imageObj.onerror = () => {
      console.error("❌ 이미지 로드 실패:", imageUrl);
      setIsImageLoading(false);
    };

    imageObj.src = imageUrl;
  }, [canvasSize, imageTransformData]);

  // 이미지 드래그 핸들러
  const handleImageDrag = useCallback((e: any) => {
    if (!isClippingEnabled) {
      return; // 클리핑 비활성화 시 드래그 비활성화
    }
    
    const newX = e.target.x();
    const newY = e.target.y();
    
    console.log("🚚 이미지 드래그:", { x: newX, y: newY, isClippingEnabled });
    
    // 이미지가 캔버스 경계를 벗어나지 않도록 제한
    const imageWidth = originalImageSize.width * imageScale;
    const imageHeight = originalImageSize.height * imageScale;
    
    const minX = imageWidth / 2;
    const maxX = canvasSize.width - imageWidth / 2;
    const minY = imageHeight / 2;
    const maxY = canvasSize.height - imageHeight / 2;
    
    const boundedX = Math.max(minX, Math.min(maxX, newX));
    const boundedY = Math.max(minY, Math.min(maxY, newY));
    
    setImagePosition({ x: boundedX, y: boundedY });
    
    // Konva 객체의 실제 위치도 업데이트
    e.target.x(boundedX);
    e.target.y(boundedY);
  }, [isClippingEnabled, imageScale, originalImageSize, canvasSize]);

  // Konva가 로드되고 이미지 URL이 있을 때 자동으로 이미지 로드
  useEffect(() => {
    if (isKonvaLoaded && insertedImageData && !konvaImage && !isImageLoading) {
      console.log("🔄 Konva 로드 완료 후 기존 이미지 자동 로드:", insertedImageData);
      loadKonvaImage(insertedImageData);
    }
  }, [isKonvaLoaded, insertedImageData, konvaImage, isImageLoading, loadKonvaImage]);

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
      url:"/"
    }
  ]

  const handleImageSelect = (index: number) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      
      if (newSet.has(index)) {
        // 이미 선택된 이미지를 해제하는 경우
        newSet.delete(index);
        setSelectedImagesOrder(prevOrder => prevOrder.filter(i => i !== index));
      } else {
        // 새로운 이미지를 선택하는 경우
        if (mode === 'multiple' && maxImageCount && newSet.size >= maxImageCount) {
          // 최대 개수에 도달한 경우, 가장 오래된 것을 제거
          setSelectedImagesOrder(prevOrder => {
            if (prevOrder.length > 0) {
              const oldestIndex = prevOrder[0];
              newSet.delete(oldestIndex);
              return [...prevOrder.slice(1), index];
            }
            return [index];
          });
        } else {
          // 최대 개수에 도달하지 않은 경우, 순서에 추가
          setSelectedImagesOrder(prevOrder => [...prevOrder, index]);
        }
        newSet.add(index);
      }
      
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedImages.size === images.length) {
      // 전체 해제
      setSelectedImages(new Set());
      setSelectedImagesOrder([]);
    } else {
      // 전체 선택 (maxImageCount 고려)
      let imagesToSelect: number[];
      
      if (mode === 'multiple' && maxImageCount && maxImageCount < images.length) {
        // 최대 개수가 전체 이미지보다 적은 경우, 처음부터 maxImageCount만큼 선택
        imagesToSelect = Array.from({ length: maxImageCount }, (_, i) => i);
      } else {
        // 제한이 없거나 전체 선택 가능한 경우
        imagesToSelect = Array.from({ length: images.length }, (_, i) => i);
      }
      
      setSelectedImages(new Set(imagesToSelect));
      setSelectedImagesOrder(imagesToSelect);
    }
  };

  const handleUploadedFileSelect = (index: number) => {
    setSelectedUploadedFiles(prev => {
      const newSet = new Set(prev);
      
      if (newSet.has(index)) {
        // 이미 선택된 파일을 해제하는 경우
        newSet.delete(index);
        setSelectedUploadedFilesOrder(prevOrder => prevOrder.filter(i => i !== index));
      } else {
        // 새로운 파일을 선택하는 경우
        if (mode === 'multiple' && maxImageCount && newSet.size >= maxImageCount) {
          // 최대 개수에 도달한 경우, 가장 오래된 것을 제거
          setSelectedUploadedFilesOrder(prevOrder => {
            if (prevOrder.length > 0) {
              const oldestIndex = prevOrder[0];
              newSet.delete(oldestIndex);
              return [...prevOrder.slice(1), index];
            }
            return [index];
          });
        } else {
          // 최대 개수에 도달하지 않은 경우, 순서에 추가
          setSelectedUploadedFilesOrder(prevOrder => [...prevOrder, index]);
        }
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
        if (index < files.length) {
          return;
        }
        newSet.delete(index);
      });
      return newSet;
    });
    
    // 파일 순서도 정리
    setSelectedUploadedFilesOrder(prevOrder => 
      prevOrder.filter(index => index < files.length)
    );
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
      targetImageRatio,
      imageIndex
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

    console.log("✅ 조건 통과 - 이미지 적용 시작");
    
    // mode가 'multiple'이거나 여러 이미지가 선택된 경우
    if (mode === 'multiple' || imageUrls.length > 1) {
      if (onImagesAdded) {
        console.log("🖼️ 다중 이미지 모드, 부모 컴포넌트에 전달:", imageUrls);
        onImagesAdded(imageUrls);
      }
    } else {
      // mode가 'single'이고 단일 이미지인 경우
      const selectedImageUrl = imageUrls[0];
      console.log("🖼️ 단일 이미지 모드 적용:", selectedImageUrl);
      
      // Konva 이미지로 로드
      setInsertedImageData(selectedImageUrl);
      if (isKonvaLoaded) {
        loadKonvaImage(selectedImageUrl);
      } else {
        console.warn("⚠️ Konva가 아직 로드되지 않음, 이미지 URL만 저장");
      }
      
      // 부모 컴포넌트에 이미지 추가 상태 알림
      if (onImageAdded) {
        onImageAdded(true, selectedImageUrl);
      }
    }
    
    // 모달 닫기 및 상태 초기화
    setIsAddPictureModalOpen(false);
    cleanupCreatedBlobUrls(); // 생성된 Blob URL들 정리
    
    // 선택 상태 초기화
    setSelectedImages(new Set());
    setSelectedImagesOrder([]);
    setSelectedUploadedFiles(new Set());
    setSelectedUploadedFilesOrder([]);
    
    console.log("🖼️ 이미지 적용 완료");
  };



  // 메모리 누수 방지를 위한 cleanup
  useEffect(() => {
    return () => {
      uploadedFiles.forEach(file => {
        URL.revokeObjectURL(file.preview);
      });
      
      // Konva 이미지 정리
      if (konvaImage) {
        setKonvaImage(null);
      }
      
      // 생성된 Blob URL들 정리
      cleanupCreatedBlobUrls();
    };
  }, [uploadedFiles, konvaImage]);



  return (
    <>
      <Dialog open={isAddPictureModalOpen} onOpenChange={setIsAddPictureModalOpen}>
        <div ref={containerRef} className="relative h-full w-full">
          {/* SVG 클리핑 마스크 정의 - 클리핑이 활성화되고 클리핑 데이터가 있을 때만 */}
          {isClippingEnabled && clipPathData && gridId && (
            <svg width="0" height="0" className="absolute">
              <defs>
                <clipPath
                  id={`clip-${clipPathData.id}-${gridId}`}
                  clipPathUnits="objectBoundingBox"
                >
                  <path d={clipPathData.pathData} />
                </clipPath>
              </defs>
            </svg>
          )}

          {/* 이미지가 없거나 (multiple 모드이면서 hasImage가 false)일 때만 DialogTrigger 표시 */}
          {(mode === 'single' && !insertedImageData) || (mode === 'multiple' && !hasImage) ? (
            <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
              {children}
            </DialogTrigger>
          ) : (
            /* multiple 모드이면서 hasImage가 true일 때는 children만 표시 */
            mode === 'multiple' && hasImage && children
          )}
          
          {/* Konva Canvas로 이미지 표시 - single 모드일 때만 */}
          {insertedImageData && mode === 'single' && isKonvaLoaded && (
            <div className="relative w-full h-full">
              {/* 클리핑이 활성화된 경우의 렌더링 */}
              {isClippingEnabled && clipPathData && gridId ? (
                <div 
                  className="relative w-full h-full"
                  style={{
                    clipPath: `url(#clip-${clipPathData.id}-${gridId})`,
                  }}
                >
                  {/* 클리핑된 상태에서도 동일한 위치/스케일로 표시 */}
                  {konvaImage && imageTransformData ? (
                    <div 
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        overflow: 'hidden'
                      }}
                    >
                      <img 
                        src={insertedImageData} 
                        alt="클리핑된 이미지"
                        style={{
                          position: 'absolute',
                          left: `${imageTransformData.x - (imageTransformData.width * imageTransformData.scale) / 2}px`,
                          top: `${imageTransformData.y - (imageTransformData.height * imageTransformData.scale) / 2}px`,
                          width: `${imageTransformData.width * imageTransformData.scale}px`,
                          height: `${imageTransformData.height * imageTransformData.scale}px`,
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  ) : (
                    <img 
                      src={insertedImageData} 
                      alt="클리핑된 이미지"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ) : (
                /* 클리핑이 비활성화된 경우 Konva 캔버스로 표시 */
                <div className="relative w-full h-full">
                  {isImageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                      <div className="text-gray-500 text-sm">이미지 로딩 중...</div>
                    </div>
                  )}
                  
                  {Stage && Layer && KonvaImage && Group && (
                    <Stage 
                      width={canvasSize.width} 
                      height={canvasSize.height} 
                      ref={stageRef}
                      style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'transparent'
                      }}
                    >
                      <Layer>
                        {konvaImage && (
                          <Group>
                            <KonvaImage
                              ref={imageRef}
                              image={konvaImage}
                              x={imagePosition.x}
                              y={imagePosition.y}
                              width={originalImageSize.width}
                              height={originalImageSize.height}
                              scaleX={imageScale}
                              scaleY={imageScale}
                              offsetX={originalImageSize.width / 2}
                              offsetY={originalImageSize.height / 2}
                              draggable={isClippingEnabled}
                              onDragMove={handleImageDrag}
                              style={{
                                cursor: isClippingEnabled ? 'move' : 'default'
                              }}
                            />
                          </Group>
                        )}
                      </Layer>
                    </Stage>
                  )}
                  
                  {/* 이동 가능 상태 표시 */}
                  {isClippingEnabled && konvaImage && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                      이미지 이동 가능
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Konva가 로드되지 않았을 때 폴백 */}
          {insertedImageData && mode === 'single' && !isKonvaLoaded && (
            <div className="relative w-full h-full">
              <div 
                className="relative w-full h-full cursor-default"
                style={{
                  clipPath: isClippingEnabled && clipPathData && gridId
                    ? `url(#clip-${clipPathData.id}-${gridId})`
                    : "none",
                }}
              >
                {/* Konva가 로드되지 않은 경우에도 변환 데이터가 있으면 동일한 위치/스케일 적용 */}
                {imageTransformData ? (
                  <div 
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      overflow: 'hidden'
                    }}
                  >
                    <img 
                      src={insertedImageData} 
                      alt="이미지"
                      style={{
                        position: 'absolute',
                        left: `${imageTransformData.x - (imageTransformData.width * imageTransformData.scale) / 2}px`,
                        top: `${imageTransformData.y - (imageTransformData.height * imageTransformData.scale) / 2}px`,
                        width: `${imageTransformData.width * imageTransformData.scale}px`,
                        height: `${imageTransformData.height * imageTransformData.scale}px`,
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                ) : (
                  <img 
                    src={insertedImageData} 
                    alt="이미지"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      <DialogContent className="max-w-[1200px] p-0 border-none bg-transparent shadow-none z-[60]">
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
                  <div>{mode === 'single' ? '적용' : `적용(${getTotalSelectedCount()}/${maxImageCount || '∞'})`}</div>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 self-start mt-3.5 w-2 bg-zinc-100 h-[122px] rounded-[50px]" />
          </div>
        </div>
      </DialogContent>
    </Dialog>


    </>
  );
}

export default AddPicture;
