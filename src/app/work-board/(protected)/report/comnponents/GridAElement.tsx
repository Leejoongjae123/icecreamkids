"use client";
import * as React from "react";
import Image from "next/image";
import AddPicture from "./AddPicture";
import { Input } from "@/components/ui/input";
import GridEditToolbar from "./GridEditToolbar";
import { Loader2 } from "lucide-react";

interface GridAElementProps {
  index: number;
  gridId?: string;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  category?: string;
  images?: string[];
  onAIGenerate?: () => void;
  onImageUpload?: () => void;
  onDelete?: () => void; // 삭제 핸들러 추가
  placeholderText?: string;
  isDragging?: boolean; // 드래그 상태 추가
  dragAttributes?: any; // 드래그 속성 추가
  dragListeners?: any; // 드래그 리스너 추가
  cardType?: 'large' | 'small'; // 카드 타입 추가
  isExpanded?: boolean; // 확장 상태 추가
  isWideCard?: boolean; // col-span-2인 경우를 위한 prop 추가
  imageCount?: number; // 초기 이미지 개수
}

function GridAElement({
  index,
  gridId,
  className = "",
  children,
  onClick,
  style,
  checked,
  onCheckedChange,
  category = "촉감놀이",
  images = [],
  onAIGenerate,
  onImageUpload,
  onDelete, // 삭제 핸들러 추가
  placeholderText = "(선택) 놀이 키워드를 입력하거나 메모파일을 업로드해주세요요",
  isDragging = false, // 드래그 상태 추가
  dragAttributes, // 드래그 속성 추가
  dragListeners, // 드래그 리스너 추가
  cardType, // 카드 타입 추가
  isExpanded = false, // 확장 상태 추가
  isWideCard = false, // col-span-2인 경우를 위한 prop 추가
  imageCount: initialImageCount = 1, // 초기 이미지 개수
}: GridAElementProps) {
  // 이미지 개수 상태 관리
  const [imageCount, setImageCount] = React.useState(initialImageCount);
  
  // 카테고리 편집 상태 관리
  const [isEditingCategory, setIsEditingCategory] = React.useState(false);
  const [categoryValue, setCategoryValue] = React.useState(category);
  
  // description-area 확장 상태 관리
  const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);
  
  // AI 생성 로딩 상태 관리
  const [isLoading, setIsLoading] = React.useState(false);
  
  // AI 생성 버튼을 클릭한 적이 있는지 추적
  const [hasClickedAIGenerate, setHasClickedAIGenerate] = React.useState(false);
  
  // textarea focus 상태 관리 추가
  const [isTextareaFocused, setIsTextareaFocused] = React.useState(false);
  
  // 텍스트 토글 상태 관리 (true: 애국가 1절, false: 애국가 2절)
  const [isFirstVerse, setIsFirstVerse] = React.useState(true);
  
  // 이미지 배열을 imageCount에 맞게 조정
  const [currentImages, setCurrentImages] = React.useState<string[]>(() => {
    const newImages = [...images];
    // 이미지 개수에 맞게 배열 크기 조정
    while (newImages.length < imageCount) {
      newImages.push("");
    }
    return newImages.slice(0, imageCount);
  });

  // 여러 이미지 추가 핸들러
  const handleImagesAdded = React.useCallback((imageUrls: string[]) => {
    console.log("📥 GridAElement에서 여러 이미지 받음:", imageUrls);
    
    setCurrentImages(prev => {
      const newImages = [...prev];
      
      // 받은 이미지들을 순서대로 빈 슬롯에 배치
      let imageUrlIndex = 0;
      for (let i = 0; i < newImages.length && imageUrlIndex < imageUrls.length; i++) {
        if (!newImages[i] || newImages[i] === "" || newImages[i] === "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg") {
          newImages[i] = imageUrls[imageUrlIndex];
          imageUrlIndex++;
        }
      }
      
      // 아직 배치할 이미지가 남아있다면, 기존 이미지가 있는 슬롯도 덮어씀
      if (imageUrlIndex < imageUrls.length) {
        for (let i = 0; i < newImages.length && imageUrlIndex < imageUrls.length; i++) {
          newImages[i] = imageUrls[imageUrlIndex];
          imageUrlIndex++;
        }
      }
      
      console.log("📊 이미지 배치 결과:", {
        받은이미지: imageUrls,
        이전이미지: prev,
        새이미지: newImages
      });
      
      return newImages;
    });
  }, []);

  // 개별 이미지 추가 핸들러
  const handleSingleImageAdded = React.useCallback((hasImage: boolean, imageIndex: number) => {
    console.log(`📥 개별 이미지 ${imageIndex} 변경:`, hasImage);
  }, []);

  // imageCount 변경 시 currentImages 업데이트
  React.useEffect(() => {
    setCurrentImages(prev => {
      const newImages = [...prev];
      // 이미지 개수에 맞게 배열 크기 조정
      while (newImages.length < imageCount) {
        newImages.push("");
      }
      return newImages.slice(0, imageCount);
    });
  }, [imageCount]);

  // isDescriptionExpanded 상태 변경 추적
  React.useEffect(() => {
    console.log("isDescriptionExpanded 상태 변경됨:", isDescriptionExpanded);
  }, [isDescriptionExpanded]);

  // 이미지 그리드 레이아웃 클래스 결정
  const getImageGridClass = (count: number, cardType?: string) => {
    switch (count) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-2";
      case 3:
        // 작은 그리드인 경우 2x2 형태로 배치 (첫 번째 이미지가 세로로 2칸 차지)
        return cardType === 'small' ? "grid-cols-2 grid-rows-2" : "grid-cols-3";
      case 4:
        // A타입 large 카드일 때는 가로로 4개 배치
        return cardType === 'large' ? "grid-cols-4" : "grid-cols-2";
      case 6:
        return "grid-cols-3";
      case 9:
        return "grid-cols-3";
      default:
        return "grid-cols-1";
    }
  };

  // 이미지 컨테이너 ref 추가
  const imageContainerRef = React.useRef<HTMLDivElement>(null);
  const [actualTargetFrame, setActualTargetFrame] = React.useState<{width: number, height: number, x: number, y: number} | undefined>(undefined);

  // 개별 이미지 셀 크기 측정 함수 - 특정 인덱스의 이미지 크기 계산
  const measureImageCellSize = React.useCallback((imageIndex: number) => {
    if (imageContainerRef.current) {
      const containerRect = imageContainerRef.current.getBoundingClientRect();
      
      // 그리드 gap 크기 (CSS에서 gap-1 = 4px)
      const gap = 4;
      
      // 이미지 개수에 따른 개별 셀 크기 계산
      let cellWidth = containerRect.width;
      let cellHeight = containerRect.height;
      let cellX = containerRect.left;
      let cellY = containerRect.top;
      
      switch (imageCount) {
        case 1:
          // 단일 이미지는 전체 영역 사용
          break;
        case 2:
          // 2개 이미지는 가로로 분할 (grid-cols-2)
          cellWidth = (containerRect.width - gap) / 2;
          cellX = containerRect.left + (imageIndex * (cellWidth + gap));
          break;
        case 3:
          if (cardType === 'small') {
            // 작은 그리드에서 3개 이미지는 왼쪽 1개(세로로 전체), 오른쪽 2개(위아래) 형태
            cellWidth = (containerRect.width - gap) / 2;
            
            if (imageIndex === 0) {
              // 첫 번째 이미지: 왼쪽 전체 높이
              cellHeight = containerRect.height;
              cellX = containerRect.left;
              cellY = containerRect.top;
            } else {
              // 두 번째, 세 번째 이미지: 오른쪽 위/아래
              cellHeight = (containerRect.height - gap) / 2;
              cellX = containerRect.left + cellWidth + gap;
              if (imageIndex === 1) {
                // 두 번째 이미지: 오른쪽 위
                cellY = containerRect.top;
              } else {
                // 세 번째 이미지: 오른쪽 아래
                cellY = containerRect.top + cellHeight + gap;
              }
            }
          } else {
            // 일반적인 3개 이미지는 가로로 분할 (grid-cols-3)
            cellWidth = (containerRect.width - gap * 2) / 3;
            cellX = containerRect.left + (imageIndex * (cellWidth + gap));
          }
          break;
        case 4:
          if (cardType === 'large') {
            // large 카드는 가로 4개 (grid-cols-4)
            cellWidth = (containerRect.width - gap * 3) / 4;
            cellX = containerRect.left + (imageIndex * (cellWidth + gap));
          } else {
            // 일반 카드는 2x2 (grid-cols-2)
            cellWidth = (containerRect.width - gap) / 2;
            cellHeight = (containerRect.height - gap) / 2;
            cellX = containerRect.left + ((imageIndex % 2) * (cellWidth + gap));
            cellY = containerRect.top + (Math.floor(imageIndex / 2) * (cellHeight + gap));
          }
          break;
        case 6:
          // 3x2 그리드 (grid-cols-3)
          cellWidth = (containerRect.width - gap * 2) / 3;
          cellHeight = (containerRect.height - gap) / 2;
          cellX = containerRect.left + ((imageIndex % 3) * (cellWidth + gap));
          cellY = containerRect.top + (Math.floor(imageIndex / 3) * (cellHeight + gap));
          break;
        case 9:
          // 3x3 그리드 (grid-cols-3)
          cellWidth = (containerRect.width - gap * 2) / 3;
          cellHeight = (containerRect.height - gap * 2) / 3;
          cellX = containerRect.left + ((imageIndex % 3) * (cellWidth + gap));
          cellY = containerRect.top + (Math.floor(imageIndex / 3) * (cellHeight + gap));
          break;
      }
      
      const targetFrame = {
        width: Math.round(cellWidth),
        height: Math.round(cellHeight),
        x: Math.round(cellX),
        y: Math.round(cellY)
      };
      
      console.log(`📏 이미지 ${imageIndex} 실제 측정된 셀 크기:`, {
        imageCount,
        cardType,
        imageIndex,
        containerSize: { width: containerRect.width, height: containerRect.height },
        cellSize: targetFrame
      });
      
      return targetFrame;
    }
    return undefined;
  }, [imageCount, cardType]);

  // 모든 이미지의 기본 크기 (이전 함수와의 호환성을 위해 유지)
  const measureSingleImageCellSize = React.useCallback(() => {
    return measureImageCellSize(0);
  }, [measureImageCellSize]);

  // 컴포넌트 마운트 후와 리사이즈 시 크기 측정
  React.useEffect(() => {
    measureSingleImageCellSize();
    
    const handleResize = () => {
      measureSingleImageCellSize();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [measureSingleImageCellSize, cardType, isWideCard, imageCount]);

  // 특정 이미지 인덱스의 영역 크기를 계산하여 비율 반환
  const getImageAreaRatio = React.useCallback((imageIndex: number = 0) => {
    // 실제 측정된 크기가 있으면 그것을 사용
    const actualFrame = measureImageCellSize(imageIndex);
    if (actualFrame) {
      return {
        width: actualFrame.width,
        height: actualFrame.height,
        aspectRatio: actualFrame.width / actualFrame.height
      };
    }
    
    // 실제 측정 크기가 없을 때만 추정 크기 사용 (fallback)
    let baseWidth = 180; // 기본 카드 폭
    let baseHeight = 120; // 기본 카드 높이
    
    // cardType에 따른 크기 조정
    if (cardType === 'large') {
      baseWidth = 280;
      baseHeight = 180;
    }
    
    // isWideCard인 경우 폭이 더 넓어짐
    if (isWideCard) {
      baseWidth = baseWidth * 2; // 대략 2배 넓어짐
    }
    
    // imageCount에 따른 개별 이미지 크기 계산
    let imageWidth = baseWidth;
    let imageHeight = baseHeight;
    
    switch (imageCount) {
      case 1:
        // 단일 이미지는 전체 영역 사용
        break;
      case 2:
        // 2개 이미지는 가로로 분할
        imageWidth = baseWidth / 2 - 4; // gap 고려
        break;
      case 3:
        if (cardType === 'small') {
          // 작은 그리드에서 3개 이미지는 왼쪽 1개(세로로 전체), 오른쪽 2개(위아래) 형태
          imageWidth = baseWidth / 2 - 4; // gap 고려
          if (imageIndex === 0) {
            // 첫 번째 이미지: 전체 높이
            imageHeight = baseHeight - 4; // gap 고려
          } else {
            // 두 번째, 세 번째 이미지: 높이 절반
            imageHeight = baseHeight / 2 - 4; // gap 고려
          }
        } else {
          // 일반적인 3개 이미지는 가로로 분할
          imageWidth = baseWidth / 3 - 4; // gap 고려
        }
        break;
      case 4:
        if (cardType === 'large') {
          // large 카드는 가로 4개
          imageWidth = baseWidth / 4 - 4; // gap 고려
        } else {
          // 일반 카드는 2x2
          imageWidth = baseWidth / 2 - 4; // gap 고려
          imageHeight = baseHeight / 2 - 4; // gap 고려
        }
        break;
      case 6:
        // 3x2 그리드
        imageWidth = baseWidth / 3 - 4; // gap 고려
        imageHeight = baseHeight / 2 - 4; // gap 고려
        break;
      case 9:
        // 3x3 그리드
        imageWidth = baseWidth / 3 - 4; // gap 고려
        imageHeight = baseHeight / 3 - 4; // gap 고려
        break;
    }
    
    return {
      width: imageWidth,
      height: imageHeight,
      aspectRatio: imageWidth / imageHeight
    };
  }, [measureImageCellSize, cardType, isWideCard, imageCount]);

  const [inputValue, setInputValue] = React.useState("");
  
  // 툴바 상태 관리
  const [toolbarState, setToolbarState] = React.useState({
    show: false,
    isExpanded: false,
  });

  // Default images if none provided - A타입은 최대 4개로 제한
  const defaultImages = [
    "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg",
    "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg",
    "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg",
    "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg",
  ];

  const displayImages = images.length > 0 ? images : defaultImages;

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleAIGenerate = () => {
    console.log("AI 생성 버튼 클릭됨");
    console.log("현재 isDescriptionExpanded:", isDescriptionExpanded);
    
    // AI 생성 버튼을 클릭했다고 표시
    setHasClickedAIGenerate(true);
    
    // 로딩 상태 시작
    setIsLoading(true);
    
    // 2초 후에 로딩 완료 및 내용 변경
    setTimeout(() => {
      // 제목을 "아이스크림키즈"로 변경
      setCategoryValue("독도는 우리땅");
      
      // 설명 내용 변경 (애국가 1절로 초기화)
      setInputValue("동해물과 백두산이\n마르고 닳도록\n하느님이 보우하사\n우리나라 만세");
      setIsFirstVerse(true); // 1절 상태로 설정
      
      // description-area를 확장된 textarea로 변경
      setIsDescriptionExpanded(true);
      console.log("setIsDescriptionExpanded(true) 호출됨");
      
      // 로딩 상태 종료
      setIsLoading(false);
      
      if (onAIGenerate) {
        onAIGenerate();
      }
    }, 2000);
  };

  const handleImageUpload = () => {
    if (onImageUpload) {
      onImageUpload();
    }
  };

  // 텍스트 새로고침(토글) 핸들러
  const handleTextRefresh = (event: React.MouseEvent) => {
    event.stopPropagation(); // 이벤트 전파 방지
    
    // 로딩 상태 시작
    setIsLoading(true);
    
    // 2초 후에 로딩 완료 및 내용 변경
    setTimeout(() => {
      if (isFirstVerse) {
        // 애국가 2절로 변경
        setInputValue("남산 위의 저 소나무\n철갑을 두른 듯\n바람서리 불변함은\n우리 기상일세");
        setIsFirstVerse(false);
      } else {
        // 애국가 1절로 변경
        setInputValue("동해물과 백두산이\n마르고 닳도록\n하느님이 보우하사\n우리나라 만세");
        setIsFirstVerse(true);
      }
      
      // 로딩 상태 종료
      setIsLoading(false);
    }, 2000);
  };

  // 삭제 핸들러
  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation(); // 이벤트 전파 방지
    
    // 삭제 확인 대화상자
    if (window.confirm('정말로 이 카드를 삭제하시겠습니까?')) {
      if (onDelete) {
        onDelete();
      }
    }
  };

  // 이미지가 아닌 영역 클릭 핸들러 - 툴바 표시
  const handleNonImageClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // 이벤트 전파 방지
    
    // 툴바 표시
    setToolbarState({
      show: true,
      isExpanded: true,
    });
    
    if (onClick) {
      onClick();
    }
  };

  // 이미지 영역 클릭 핸들러 (이벤트 전파 방지)
  const handleImageClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    // 이미지 클릭 시 특별한 동작이 필요하면 여기에 추가
  };

  // 툴바 숨기기 핸들러
  const handleHideToolbar = () => {
    setToolbarState({
      show: false,
      isExpanded: false,
    });
  };

  // 툴바 아이콘 클릭 핸들러
  const handleToolbarIconClick = (iconIndex: number, data?: any) => {
    console.log(`툴바 아이콘 ${iconIndex} 클릭됨, Grid ${index}`, data);
    
    // 이미지 개수 변경 처리
    if (data && data.action === 'changeImageCount') {
      console.log(`그리드 ${data.gridId}의 이미지 개수를 ${data.count}개로 변경`);
      setImageCount(data.count);
    }
    
    // 여기에 각 아이콘별 로직 구현
  };

  // 전역 클릭 이벤트로 툴바 숨기기
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // 현재 GridAElement 외부 클릭 시 툴바 숨기기
      if (!target.closest(`[data-grid-id="${gridId}"]`) && !target.closest('.grid-edit-toolbar')) {
        handleHideToolbar();
      }
    };

    if (toolbarState.show) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [toolbarState.show, gridId]);

  // 툴바 표시 상태에 따른 border 스타일 결정
  const borderClass = toolbarState.show 
    ? "border-solid border-2 border-primary" 
    : "border-dashed border border-zinc-400";

  // 드래그 상태에 따른 스타일 추가
  const containerClass = isDragging 
    ? "border-solid border-2 border-primary shadow-2xl" 
    : borderClass;

  // 카테고리 편집 핸들러
  const handleCategoryClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsEditingCategory(true);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCategoryValue(e.target.value);
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditingCategory(false);
    }
    if (e.key === 'Escape') {
      setCategoryValue(category); // 원래 값으로 복원
      setIsEditingCategory(false);
    }
  };

  const handleCategoryBlur = () => {
    setIsEditingCategory(false);
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      <div
        className={`drag-contents overflow-hidden px-2.5 py-2.5 bg-white rounded-2xl ${containerClass} w-full h-full flex flex-col ${className} gap-y-1.5 ${isDragging ? 'opacity-90' : ''} transition-all duration-200 cursor-grab active:cursor-grabbing`}
        style={style}
        onClick={handleNonImageClick}
        data-grid-id={gridId}
        {...dragAttributes}
        {...dragListeners}
      >
        {/* 카테고리 섹션 - 고정 높이 */}
        <div className="flex gap-2.5 text-sm font-bold tracking-tight leading-none text-amber-400 whitespace-nowrap flex-shrink-0 mb-1">
          <div 
            className={`flex overflow-hidden flex-col grow shrink-0 justify-center items-start px-2 py-1 rounded-md border border-solid basis-0 w-fit transition-colors cursor-text hover:bg-gray-50 ${
              isEditingCategory ? 'border-primary' : 'border-gray-300'
            }`}
            onClick={!isEditingCategory ? handleCategoryClick : undefined}
          >
            {isEditingCategory ? (
              <Input
                type="text"
                value={categoryValue}
                onChange={handleCategoryChange}
                onKeyDown={handleCategoryKeyDown}
                onBlur={handleCategoryBlur}
                className="text-[16px] font-bold text-amber-400 bg-transparent border-0 p-0 h-auto leading-tight focus:ring-0 focus-visible:ring-0 focus:outline-none focus:border-primary shadow-none min-w-[60px] w-auto"
                style={{ 
                  borderRadius: '0px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#fbbf24' // text-amber-400
                }}
                autoFocus
              />
            ) : (
              <div className="text-[16px] leading-tight px-1 py-0.5 rounded transition-colors">
                {categoryValue}
              </div>
            )}
          </div>
        </div>

        {/* 이미지 그리드 - 60% 고정 높이를 차지하는 영역 */}
        {/* 작은 그리드이고 이미지가 3개일 때는 flex 레이아웃 사용 */}
        {cardType === 'small' && imageCount === 3 ? (
          <div ref={imageContainerRef} className="flex gap-1 w-full" style={{ height: '60%' }}>
            {/* 왼쪽: 첫 번째 이미지 */}
            <div className="flex-1 h-full">
              <AddPicture 
                key={0} 
                targetImageRatio={getImageAreaRatio(0)}
                targetFrame={measureImageCellSize(0)}
                onImagesAdded={handleImagesAdded}
                onImageAdded={(hasImage) => handleSingleImageAdded(hasImage, 0)}
                imageIndex={0}
                mode="multiple"
              >
                <div 
                  className="relative cursor-pointer hover:opacity-80 transition-opacity group w-full h-full"
                  onClick={(e) => {
                    measureImageCellSize(0);
                    handleImageClick(e);
                  }}
                >
                  {currentImages[0] && currentImages[0] !== "" ? (
                    <Image
                      src={currentImages[0]}
                      alt="Image 1"
                      fill
                      className="object-cover rounded-md"
                    />
                  ) : (
                    <Image
                      src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg"
                      alt="No image"
                      fill
                      className="object-cover rounded-md"
                    />
                  )}
                  {/* Black overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-40 rounded-md flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                    <Image
                      src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/imageupload3.svg"
                      width={20}
                      height={20}
                      className="object-cover mb-2"
                      alt="Upload icon"
                    />
                    <div className="text-white text-[8px] font-medium text-center mb-2 px-1">
                      이미지를 드래그하거나<br />클릭하여 업로드
                    </div>
                    <button 
                      className="bg-primary text-white text-[9px] px-2 py-1 rounded hover:bg-primary/80 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      파일선택
                    </button>
                  </div>
                </div>
              </AddPicture>
            </div>
            
            {/* 오른쪽: 두 번째, 세 번째 이미지를 위아래로 */}
            <div className="flex-1 flex flex-col gap-1 h-full">
              {/* 두 번째 이미지 */}
              <div className="flex-1 h-full">
                <AddPicture 
                  key={1} 
                  targetImageRatio={getImageAreaRatio(1)}
                  targetFrame={measureImageCellSize(1)}
                  onImagesAdded={handleImagesAdded}
                  onImageAdded={(hasImage) => handleSingleImageAdded(hasImage, 1)}
                  imageIndex={1}
                  mode="multiple"
                >
                  <div 
                    className="relative cursor-pointer hover:opacity-80 transition-opacity group w-full h-full"
                    onClick={(e) => {
                      measureImageCellSize(1);
                      handleImageClick(e);
                    }}
                  >
                    {currentImages[1] && currentImages[1] !== "" ? (
                      <Image
                        src={currentImages[1]}
                        alt="Image 2"
                        fill
                        className="object-cover rounded-md"
                      />
                    ) : (
                      <Image
                        src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg"
                        alt="No image"
                        fill
                        className="object-cover rounded-md"
                      />
                    )}
                    {/* Black overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-40 rounded-md flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                      <Image
                        src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/imageupload3.svg"
                        width={20}
                        height={20}
                        className="object-contain mb-2"
                        alt="Upload icon"
                      />
                      <div className="text-white text-[8px] font-medium text-center mb-2 px-1">
                        이미지를 드래그하거나<br />클릭하여 업로드
                      </div>
                      <button 
                        className="bg-primary text-white text-[9px] px-2 py-1 rounded hover:bg-primary/80 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        파일선택
                      </button>
                    </div>
                  </div>
                </AddPicture>
              </div>
              
              {/* 세 번째 이미지 */}
              <div className="flex-1 h-full">
                <AddPicture 
                  key={2} 
                  targetImageRatio={getImageAreaRatio(2)}
                  targetFrame={measureImageCellSize(2)}
                  onImagesAdded={handleImagesAdded}
                  onImageAdded={(hasImage) => handleSingleImageAdded(hasImage, 2)}
                  imageIndex={2}
                  mode="multiple"
                >
                  <div 
                    className="relative cursor-pointer hover:opacity-80 transition-opacity group w-full h-full"
                    onClick={(e) => {
                      measureImageCellSize(2);
                      handleImageClick(e);
                    }}
                  >
                    {currentImages[2] && currentImages[2] !== "" ? (
                      <Image
                        src={currentImages[2]}
                        alt="Image 3"
                        fill
                        className="object-cover rounded-md"
                      />
                    ) : (
                      <Image
                        src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg"
                        alt="No image"
                        fill
                        className="object-cover rounded-md"
                      />
                    )}
                    {/* Black overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-40 rounded-md flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                      <Image
                        src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/imageupload3.svg"
                        width={20}
                        height={20}
                        className="object-contain mb-2"
                        alt="Upload icon"
                      />
                      <div className="text-white text-[8px] font-medium text-center mb-2 px-1">
                        이미지를 드래그하거나<br />클릭하여 업로드
                      </div>
                      <button 
                        className="bg-primary text-white text-[9px] px-2 py-1 rounded hover:bg-primary/80 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        파일선택
                      </button>
                    </div>
                  </div>
                </AddPicture>
              </div>
            </div>
          </div>
        ) : (
          // 기존 그리드 레이아웃 - 60% 고정 높이 적용
          <div 
            ref={imageContainerRef}
            className={`grid gap-1 w-full ${
              isWideCard
                ? `${getImageGridClass(imageCount, cardType)}` // col-span-2인 경우 이미지 개수에 따라 배치
                : cardType === 'large' 
                  ? `${getImageGridClass(imageCount, cardType)}` // large 카드는 이미지 개수에 따라 배치
                  : `${getImageGridClass(imageCount, cardType)}` // small 카드도 이미지 개수에 따라 배치
            }`}
            style={{ height: '60%' }}>
            {currentImages.map((imageSrc, index) => (
              <AddPicture 
                key={index} 
                targetImageRatio={getImageAreaRatio(index)}
                targetFrame={measureImageCellSize(index)}
                onImagesAdded={handleImagesAdded}
                onImageAdded={(hasImage) => handleSingleImageAdded(hasImage, index)}
                imageIndex={index}
                mode="multiple"
              >
                <div 
                  className="relative cursor-pointer hover:opacity-80 transition-opacity group w-full h-full"
                  onClick={(e) => {
                    // 클릭 시에도 크기 측정
                    measureImageCellSize(index);
                    handleImageClick(e);
                  }}
                >
                  {imageSrc && imageSrc !== "" ? (
                    <Image
                      src={imageSrc}
                      alt={`Image ${index + 1}`}
                      fill
                      className="object-cover rounded-md"
                    />
                  ) : (
                    <Image
                      src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg"
                      alt="No image"
                      fill
                      className="object-cover rounded-md"
                    />
                  )}
                  {/* Black overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-40 rounded-md flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                    {/* Upload icon */}
                    <Image
                      src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/imageupload3.svg"
                      width={20}
                      height={20}
                      className="object-contain mb-2"
                      alt="Upload icon"
                    />
                    {/* Upload text */}
                    <div className="text-white text-[8px] font-medium text-center mb-2 px-1">
                      이미지를 드래그하거나<br />클릭하여 업로드
                    </div>
                    {/* File select button */}
                    <button 
                      className="bg-primary text-white text-[9px] px-2 py-1 rounded hover:bg-primary/80 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        // 파일 선택 로직
                      }}
                    >
                      파일선택
                    </button>
                  </div>
                </div>
              </AddPicture>
            ))}
          </div>
        )}

        {/* 하단 입력 영역 - 남은 공간(약 40%)을 차지 */}
        {console.log("렌더링 시점 isDescriptionExpanded:", isDescriptionExpanded)}
        {isLoading ? (
          // 로딩 중일 때
          <div className="description-area flex flex-col items-center justify-center px-2 py-2 w-full leading-none bg-white rounded-md border border-dashed border-zinc-400 min-h-[90px] flex-1 mt-1">
            <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
            <div className="text-[#B4B4B4] text-xs">내용을 생성중입니다...</div>
          </div>
        ) : isDescriptionExpanded ? (
          // 확장된 textarea 모드
          <div className={`description-area flex overflow-hidden flex-col px-2 py-2 w-full leading-none bg-white rounded-md min-h-[90px] flex-1 mt-1 relative transition-colors ${
            isTextareaFocused ? 'border border-solid border-primary' : 'border border-dashed border-zinc-400'
          }`}>
            {/* 상단 버튼들 - 우측 상단 */}
            <div className="absolute top-2 right-3 flex items-center gap-1 z-20">
              {/* 새로고침 버튼 */}
              <button
                onClick={handleTextRefresh}
                className="w-7 h-7 bg-white border border-[#F0F0F0] rounded-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                title="텍스트 새로고침"
              >
                <Image
                  src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/refresh.svg"
                  width={14}
                  height={14}
                  alt="Refresh"
                  className="object-contain hover:opacity-80"
                />
              </button>
              
              
            </div>
            
            <textarea
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => setIsTextareaFocused(true)}
              onBlur={() => setIsTextareaFocused(false)}
              placeholder={placeholderText}
              className="w-full h-full px-2 py-1 pr-8 text-xs tracking-tight bg-white border-0 text-zinc-600 placeholder-zinc-400 shadow-none rounded-md focus:ring-0 focus:outline-none resize-none flex-1 scrollbar-hide"
              style={{ 
                borderRadius: '6px', 
                fontSize: '12px', 
                lineHeight: '1.4', 
                minHeight: '74px',
                scrollbarWidth: 'none', /* Firefox */
                msOverflowStyle: 'none' /* IE and Edge */
              }}
              onClick={handleImageClick}
            />
            
            {/* 글자수 카운팅 - 우측하단 */}
            {hasClickedAIGenerate && (
              <div className="absolute bottom-2 right-3 text-[9px] font-medium text-primary">
                ({inputValue.length}/200)
              </div>
            )}
          </div>
        ) : (
          // 기본 모드
          <div className="description-area flex overflow-hidden flex-col px-2 py-2 w-full leading-none bg-white rounded-md border border-dashed border-zinc-400 min-h-[90px] flex-1 mt-1 relative">
            {/* 삭제 버튼 - 우측 상단 */}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="absolute top-2 right-2 w-7 h-7 bg-white border border-[#F0F0F0] rounded-md flex items-center justify-center z-20 hover:bg-red-50 transition-colors"
                title="카드 삭제"
              >
                <Image
                  src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/trash.svg"
                  width={14}
                  height={14}
                  alt="Delete"
                  className="object-contain hover:opacity-80"
                />
              </button>
            )}
            
            <div className="flex gap-1.5 w-full mb-1.5"> 
              <Input
                value={inputValue}
                onChange={handleInputChange}
                placeholder={placeholderText}
                className="h-[26px] min-h-[26px] max-h-[26px] px-2 py-1 text-xs tracking-tight bg-white border border-dashed border-zinc-400 text-zinc-600 placeholder-zinc-400 flex-1 shadow-none rounded-md focus:ring-0 focus:outline-none focus:border-primary resize-none"
                style={{ borderRadius: '6px', fontSize: '10px', lineHeight: '1.2' }}
                onClick={handleImageClick}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation(); // 이벤트 전파 방지
                  handleImageUpload();
                }}
                className="flex overflow-hidden justify-center items-center w-[26px] h-[26px] bg-[#979797] border border-dashed border-zinc-400 rounded-md hover:bg-[#979797]/80 transition-colors"
                title="파일 업로드"
              >
                <Image
                  src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/upload.svg"
                  className="object-contain"
                  width={14}
                  height={14}
                  alt="Upload icon"
                />
              </button>
            </div>
            
            {/* AI 생성 버튼 - 별도 줄에 배치 */}
            <div className="flex w-full mb-1.5 justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // 이벤트 전파 방지
                  if (!isLoading) {
                    handleAIGenerate();
                  }
                }}
                disabled={isLoading}
                className={`flex overflow-hidden gap-0.5 text-xs font-semibold tracking-tight text-white rounded-md bg-gradient-to-r from-[#FA8C3D] via-[#FF8560] to-[#FAB83D] hover:opacity-90 flex justify-center items-center w-[54px] h-[26px] self-start transition-opacity ${isLoading ? 'cursor-not-allowed opacity-75' : ''}`}
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin text-white" />
                ) : (
                  <>
                    <Image
                      src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/leaf.svg"
                      className="object-contain"
                      width={11}
                      height={11}
                      alt="AI icon"
                    />
                    <div className="text-[10px] tracking-[-0.03em]">AI 생성</div>
                  </>
                )}
              </button>
            </div>

            {/* 글자수 카운팅 - 우측하단 */}
            {hasClickedAIGenerate && (
              <div className="absolute bottom-2 right-3 text-[9px] font-medium text-primary">
                ({inputValue.length}/200)
              </div>
            )}



            
          </div>
        )}

        {children && <div className="mt-1 flex-shrink-0">{children}</div>}
      </div>
      
      {/* GridEditToolbar - element 하단 좌측에 위치 */}
      {toolbarState.show && (
        <div className="grid-edit-toolbar">
          <GridEditToolbar
            show={toolbarState.show}
            isExpanded={toolbarState.isExpanded}
            position={{ left: "8px", top: "calc(100% + 8px)" }}
            onIconClick={handleToolbarIconClick}
            targetGridId={gridId}
          />
        </div>
      )}
    </div>
  );
}

export default GridAElement;