"use client";
import * as React from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import GridEditToolbar from "./GridEditToolbar";
import { Loader } from "@/components/ui/loader";
import ImageEditModal from "./ImageEditModal";
import { ImagePosition } from "../types";
import {IoClose} from "react-icons/io5";
import useUserStore from "@/hooks/store/useUserStore";
import useGridContentStore from "@/hooks/store/useGridContentStore";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useMemoCheck } from "@/hooks/useMemoCheck";
import MemoIndicator from "../components/MemoIndicator";
import { MemoEditModal } from "@/components/modal/memo-edit";
import { UploadModal } from "@/components/modal";
import { useGetDriveItemMemos, useUpdateDriveItemMemo } from "@/service/file/fileStore";
import { useToast } from "@/hooks/store/useToastStore";
import { useAlertStore } from "@/hooks/store/useAlertStore";
import { DriveItemMemoUpdateRequest } from "@/service/file/schemas";
import { IEditMemoData } from "@/components/modal/memo-edit/types";
import { useSearchParams } from "next/navigation";

interface GridBElementProps {
  index: number;
  gridId?: string;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  isSelected?: boolean;
  onSelectChange?: (isSelected: boolean) => void;
  images?: string[];
  onAIGenerate?: () => void;
  onImageUpload?: () => void;
  onDelete?: () => void;
  placeholderText?: string;
  isExpanded?: boolean; // col-span-2 적용 여부
  isHidden?: boolean; // 숨김 처리 여부 (쓰레기통으로 삭제된 경우)
  imageCount?: number; // 초기 이미지 개수
  onImageCountChange?: (count: number) => void; // 이미지 개수 변경 콜백
}

function GridBElement({
  index,
  gridId,
  className = "",
  children,
  onClick,
  style,
  isSelected = false,
  onSelectChange,
  images = [],
  onAIGenerate,
  onImageUpload,
  onDelete,
  placeholderText = "ex) 아이들과 촉감놀이를 했어요",
  isExpanded = false,
  isHidden = false,
  imageCount: propsImageCount = 1, // 초기 이미지 개수
  onImageCountChange, // 이미지 개수 변경 콜백
}: GridBElementProps) {
  // 사용자 정보 가져오기
  const { userInfo } = useUserStore();
  const profileId = React.useMemo(() => userInfo?.id || null, [userInfo?.id]);
  const accountId = React.useMemo(() => userInfo?.accountId || null, [userInfo?.accountId]);
  
  // URL 파라미터 가져오기
  const searchParams = useSearchParams();

  // 각 이미지의 메모 존재 여부를 체크하는 상태
  const [memoStatuses, setMemoStatuses] = React.useState<{[key: string]: boolean}>({});
  
  // 현재 메모를 편집하고자 하는 driveItemKey 상태 관리
  const [currentDriveItemKey, setCurrentDriveItemKey] = React.useState<string>('');
  const [isMemoOpen, setIsMemoOpen] = React.useState<boolean>(false);
  const [memoData, setMemoData] = React.useState<IEditMemoData>({
    title: '',
    memo: ''
  });
  
  // Grid content store 사용
  const { updatePlaySubject, updateImages, updateCategoryValue, updateAiGenerated, gridContents } = useGridContentStore();
  
  // Toast 및 Alert hook
  const addToast = useToast((state) => state.add);
  const { showAlert } = useAlertStore();

  // 메모 조회 및 업데이트 hooks
  const { data: driveItemMemo, refetch: refetchMemo } = useGetDriveItemMemos(
    currentDriveItemKey,
    {
      owner_account_id: accountId?.toString() || '0',
    },
    {
      query: { enabled: !!currentDriveItemKey && !!accountId },
    }
  );

  const { mutateAsync: updateMemo } = useUpdateDriveItemMemo();
  // 메모 데이터가 조회되면 상태 업데이트
  React.useEffect(() => {
    if (driveItemMemo?.result?.[0]) {
      const existingMemo = driveItemMemo.result[0];
      setMemoData({
        title: existingMemo.title || '',
        memo: existingMemo.memo || ''
      });
    } else {
      // 메모가 없으면 초기화
      setMemoData({ title: '', memo: '' });
    }
  }, [driveItemMemo]);

  // 메모 모달 열기 함수
  const openMemoModal = (driveItemKey: string) => {
    setCurrentDriveItemKey(driveItemKey);
    setIsMemoOpen(true);
  };

  // 메모 모달 닫기 함수
  const closeMemoModal = () => {
    setIsMemoOpen(false);
    setCurrentDriveItemKey('');
    setMemoData({ title: '', memo: '' });
  };

  // 메모 데이터 업데이트 함수
  const updateMemoData = (data: Partial<IEditMemoData>) => {
    setMemoData(prev => ({ ...prev, ...data }));
  };

  // 메모 저장 함수
  const saveMemo = async () => {
    if (!currentDriveItemKey || !accountId || !profileId) {
      return;
    }

    const existingMemo = driveItemMemo?.result?.[0];

    try {
      if (existingMemo?.id) {
        // 기존 메모 업데이트
        const updateMemoDataPayload: DriveItemMemoUpdateRequest = {
          title: memoData.title,
          memo: memoData.memo,
          ownerAccountId: accountId,
          ownerProfileId: profileId,
        };

        const { status } = await updateMemo({
          idOrKey: currentDriveItemKey,
          memoId: existingMemo.id.toString(),
          data: updateMemoDataPayload,
        });

        if (status === 200) {
          await refetchMemo();
          // 메모 상태 업데이트
          setMemoStatuses(prev => ({
            ...prev,
            [currentDriveItemKey]: true
          }));
        } else {
          showAlert({ message: '메모 수정에 실패하였습니다.' });
        }
      } else {
        // 새 메모 생성 - API 호출
        const response = await fetch(
          `/api/file/v1/drive-items/${currentDriveItemKey}/memos?owner_account_id=${accountId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'accept': '*/*',
            },
            body: JSON.stringify({
              title: memoData.title,
              memo: memoData.memo,
            }),
          }
        );

        if (response.ok) {
          addToast({ message: '메모가 저장되었습니다.' });
          await refetchMemo();
          // 메모 상태 업데이트
          setMemoStatuses(prev => ({
            ...prev,
            [currentDriveItemKey]: true
          }));
        } else {
          showAlert({ message: '메모 저장에 실패하였습니다.' });
        }
      }
    } catch {
      showAlert({ message: '메모 저장 중 오류가 발생했습니다.' });
    } finally {
      closeMemoModal();
    }
  };

  // 이미지 개수 상태 관리
  const [imageCount, setImageCount] = React.useState(propsImageCount);
  
  // description-area 확장 상태 관리
  const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);
  
  // AI 생성 로딩 상태 관리
  const [isLoading, setIsLoading] = React.useState(false);
  
  // AI 생성 버튼을 클릭한 적이 있는지 추적
  const [hasClickedAIGenerate, setHasClickedAIGenerate] = React.useState(false);
  
  // textarea focus 상태 관리 추가
  const [isTextareaFocused, setIsTextareaFocused] = React.useState(false);
  
  // 이미지 배열을 imageCount에 맞게 조정
  const [currentImages, setCurrentImages] = React.useState<string[]>(() => {
    const newImages = [...images];
    // 이미지 개수에 맞게 배열 크기 조정
    while (newImages.length < imageCount) {
      newImages.push("");
    }
    const initialImages = newImages.slice(0, imageCount);
    console.log("🏁 GridB 초기 currentImages 설정:", {
      원본이미지: images,
      새이미지: newImages,
      초기이미지: initialImages,
      imageCount: imageCount
    });
    return initialImages;
  });

  // 이미지 업로드 관련 상태
  const [uploadedFiles, setUploadedFiles] = React.useState<File[]>([]);
  
  // 이미지 메타데이터 상태 (driveItemKey 포함)
  const [imageMetadata, setImageMetadata] = React.useState<{url: string, driveItemKey?: string}[]>([]);
  
  // 드래그앤드롭을 위한 ref
  const dropRef = React.useRef<HTMLDivElement>(null);

  // 이미지 업로드 훅
  const {
    isUploadModalOpen,
    drop,
    canDrop,
    isOver,
    handleOpenUploadModal,
    handleCloseUploadModal,
    handleConfirmUploadModal,
    handleSetItemData,
    processUploadedFiles,
  } = useImageUpload({
    uploadedFiles,
    onFilesUpload: (files: File[] | any[]) => {
      console.log('📥 GridB 이미지 업로드 완료:', files);
      
      const imageUrls: string[] = [];
      const metadata: {url: string, driveItemKey?: string}[] = [];
      
      files.forEach((item) => {
        if (item instanceof File) {
          // File 타입인 경우
          const fileUrl = URL.createObjectURL(item);
          imageUrls.push(fileUrl);
          metadata.push({ url: fileUrl, driveItemKey: `local_${Date.now()}_${Math.random()}` });
          setUploadedFiles(prev => [...prev, item]);
        } else if (item && typeof item === 'object' && item.thumbUrl) {
          // SmartFolderItemResult 타입인 경우
          imageUrls.push(item.thumbUrl);
          metadata.push({ url: item.thumbUrl, driveItemKey: item.driveItemKey });
        }
      });
      
      // 이미지 메타데이터 업데이트
      setImageMetadata(prev => [...prev, ...metadata]);
      
      // 이미지 URL들을 currentImages에 추가
      handleImagesAdded(imageUrls);
    },
    maxDataLength: imageCount, // 현재 이미지 개수만큼 제한
  });

  // ref를 drop에 연결
  React.useEffect(() => {
    if (dropRef.current) {
      drop(dropRef);
    }
  }, [drop]);

  // 이미지 URL로 driveItemKey 찾기
  const getDriveItemKeyByImageUrl = React.useCallback((imageUrl: string): string | undefined => {
    const metadata = imageMetadata.find(item => item.url === imageUrl);
    return metadata?.driveItemKey;
  }, [imageMetadata]);

  // 이미지 메타데이터가 변경될 때마다 메모 상태 체크
  React.useEffect(() => {
    const checkMemosForImages = async () => {
      if (!userInfo?.accountId) {
        return;
      }

      const memoCheckPromises = imageMetadata.map(async (metadata) => {
        if (metadata.driveItemKey && metadata.driveItemKey.startsWith('local_')) {
          // 로컬 이미지(직접 업로드)는 메모 체크하지 않음
          return null;
        }

        if (metadata.driveItemKey) {
          try {
            const response = await fetch(
              `/api/file/v1/drive-items/${metadata.driveItemKey}/memos?owner_account_id=${userInfo.accountId}`,
              {
                method: 'GET',
                headers: {
                  'accept': '*/*',
                },
              }
            );

            if (response.ok) {
              const data = await response.json();
              const memoExists = Array.isArray(data.result) ? data.result.length > 0 : false;
              return { driveItemKey: metadata.driveItemKey, hasMemo: memoExists };
            }
          } catch (error) {
            console.log('메모 체크 실패:', error);
          }
        }
        return null;
      });

      const results = await Promise.all(memoCheckPromises);
      const newMemoStatuses: {[key: string]: boolean} = {};
      
      results.forEach((result) => {
        if (result) {
          newMemoStatuses[result.driveItemKey] = result.hasMemo;
        }
      });

      setMemoStatuses(newMemoStatuses);
    };

    checkMemosForImages();
  }, [imageMetadata, userInfo?.accountId]);

  // props에서 받은 images가 변경될 때 currentImages 상태 업데이트 (초기화 반영)
  React.useEffect(() => {
    if (Array.isArray(images)) {
      console.log("🔄 GridBElement props.images 변경됨, currentImages 업데이트:", {
        propsImages: images,
        이전currentImages: currentImages,
        imageCount: imageCount
      });
      
      // props images가 비어있으면 currentImages도 초기화
      if (images.length === 0 || images.every(img => !img || img === "")) {
        setCurrentImages(new Array(imageCount).fill(""));
        setImageMetadata([]); // 메타데이터도 초기화
        setUploadedFiles([]); // 업로드 파일도 초기화
      } else {
        // props images를 currentImages에 반영
        const newCurrentImages = new Array(imageCount).fill("");
        images.forEach((img, index) => {
          if (index < newCurrentImages.length && img && img !== "") {
            newCurrentImages[index] = img;
          }
        });
        setCurrentImages(newCurrentImages);
      }
    }
  }, [images, imageCount]);



  // props에서 받은 imageCount가 변경될 때 내부 상태 업데이트
  React.useEffect(() => {
    // props로 받은 imageCount로 강제 업데이트
    setImageCount(propsImageCount);
  }, [propsImageCount]);

  // 현재 선택된 이미지 개수 계산 함수
  const getCurrentImageCount = React.useCallback((): number => {
    return currentImages.filter(img => 
      img && img !== "" && img !== "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg"
    ).length;
  }, [currentImages]);

  // 남은 선택 가능한 이미지 개수 계산
  const getRemainingImageCount = React.useCallback((): number => {
    const currentCount = getCurrentImageCount();
    return Math.max(0, imageCount - currentCount);
  }, [getCurrentImageCount, imageCount]);

  // 이미지 위치 정보 상태
  const [imagePositions, setImagePositions] = React.useState<ImagePosition[]>(() => 
    Array(imageCount).fill({ x: 0, y: 0, scale: 1 })
  );

  // 이미지 편집 모달 상태
  const [imageEditModal, setImageEditModal] = React.useState<{
    isOpen: boolean;
    imageUrls: string[];
    selectedImageIndex: number;
    originalImageIndex: number; // 클릭한 원래 이미지 인덱스
  }>({
    isOpen: false,
    imageUrls: [],
    selectedImageIndex: 0,
    originalImageIndex: 0
  });

  // 여러 이미지 추가 핸들러
  const handleImagesAdded = React.useCallback((imageUrls: string[]) => {
    console.log("📥 GridBElement에서 여러 이미지 받음:", imageUrls);
    console.log("📏 현재 imageCount:", imageCount);
    
    setCurrentImages(prev => {
      const newImages = [...prev];
      
      // 받은 이미지 개수를 imageCount로 제한
      const limitedImageUrls = imageUrls.slice(0, imageCount);
      
      // 받은 이미지들을 순서대로 빈 슬롯에 배치
      let imageUrlIndex = 0;
      for (let i = 0; i < newImages.length && imageUrlIndex < limitedImageUrls.length; i++) {
        if (!newImages[i] || newImages[i] === "" || newImages[i] === "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg") {
          newImages[i] = limitedImageUrls[imageUrlIndex];
          imageUrlIndex++;
        }
      }
      
      // 아직 배치할 이미지가 남아있다면, 기존 이미지가 있는 슬롯도 덮어씀
      if (imageUrlIndex < limitedImageUrls.length) {
        for (let i = 0; i < newImages.length && imageUrlIndex < limitedImageUrls.length; i++) {
          newImages[i] = limitedImageUrls[imageUrlIndex];
          imageUrlIndex++;
        }
      }
      
      // 최종적으로 배열 길이를 imageCount로 제한
      const finalImages = newImages.slice(0, imageCount);
      
      console.log("📊 GridB 이미지 배치 결과:", {
        받은이미지: imageUrls,
        제한된이미지: limitedImageUrls,
        이전이미지: prev,
        새이미지: newImages,
        최종이미지: finalImages,
        imageCount: imageCount
      });
      
      return finalImages;
    });
  }, [imageCount]);

  // 개별 이미지 추가 핸들러
  const handleSingleImageAdded = React.useCallback((hasImage: boolean, imageIndex: number) => {
    console.log(`📥 GridB 개별 이미지 ${imageIndex} 변경:`, hasImage);
  }, []);

  // imageCount 변경 시 currentImages와 imagePositions 업데이트
  React.useEffect(() => {
    console.log("🔄 GridB imageCount 변경됨:", imageCount);
    
    setCurrentImages(prev => {
      const newImages = [...prev];
      // 이미지 개수에 맞게 배열 크기 조정
      while (newImages.length < imageCount) {
        newImages.push("");
      }
      // 항상 imageCount로 길이 제한
      const limitedImages = newImages.slice(0, imageCount);
      
      console.log("🔄 GridB currentImages 업데이트:", {
        이전이미지: prev,
        새이미지: newImages,
        제한된이미지: limitedImages,
        imageCount: imageCount
      });
      
      return limitedImages;
    });

    setImagePositions(prev => {
      const newPositions = [...prev];
      // 이미지 개수가 증가한 경우 기본 위치 정보 추가
      while (newPositions.length < imageCount) {
        newPositions.push({ x: 0, y: 0, scale: 1 });
      }
      // 이미지 개수가 감소한 경우 배열 크기 조정
      return newPositions.slice(0, imageCount);
    });

    // 이미지 메타데이터도 imageCount에 맞게 조정
    setImageMetadata(prev => {
      // 현재 currentImages에 있는 URL들과 매칭되는 메타데이터만 유지
      return prev.filter((metadata, index) => index < imageCount);
    });
  }, [imageCount]);

  // 이미지 그리드 레이아웃 클래스 및 스타일 결정
  const getImageGridLayout = (count: number) => {
    // 합친 경우(isExpanded)이고 이미지가 3개일 때 특별한 레이아웃
    // 좌우로 나누고 좌측을 다시 좌우로 분할
    if (isExpanded && count === 3) {
      return {
        className: "grid",
        style: {
          gridTemplateAreas: `"left-left left-right right"`,
          gridTemplateColumns: "1fr 1fr 2fr", // 좌좌 1:1, 좌우 1:1, 우측 2 비율
          gridTemplateRows: "1fr" // 높이는 모두 같음
        }
      };
    }
    
    // 기본 레이아웃
    switch (count) {
      case 1:
        return { className: "grid-cols-1", style: {} };
      case 2:
        return { className: "grid-cols-2", style: {} };
      case 3:
        return { className: "grid-cols-3", style: {} };
      case 4:
        return { className: "grid-cols-2", style: {} };
      case 6:
        return { className: "grid-cols-3", style: {} };
      case 9:
        return { className: "grid-cols-3", style: {} };
      default:
        return { className: "grid-cols-1", style: {} };
    }
  };

  // 이미지 컨테이너 ref 추가
  const imageContainerRef = React.useRef<HTMLDivElement>(null);

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
      
      // 합친 경우(isExpanded)이고 이미지가 3개일 때 특별한 레이아웃
      if (isExpanded && imageCount === 3) {
        const leftWidth = (containerRect.width * 2) / 3; // 좌측 전체 너비 (66.67%)
        const rightWidth = containerRect.width / 3; // 우측 너비 (33.33%)
        const halfWidth = leftWidth / 2; // 좌측 반쪽 너비
        
        switch (imageIndex) {
          case 0: // 좌좌
            cellWidth = halfWidth;
            cellHeight = containerRect.height;
            cellX = containerRect.left;
            cellY = containerRect.top;
            break;
          case 1: // 좌우
            cellWidth = halfWidth - gap;
            cellHeight = containerRect.height;
            cellX = containerRect.left + halfWidth + gap;
            cellY = containerRect.top;
            break;
          case 2: // 우측
            cellWidth = rightWidth - gap;
            cellHeight = containerRect.height;
            cellX = containerRect.left + leftWidth + gap;
            cellY = containerRect.top;
            break;
        }
      } else {
        // 기본 레이아웃
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
            // 3개 이미지는 가로로 분할 (grid-cols-3)
            cellWidth = (containerRect.width - gap * 2) / 3;
            cellX = containerRect.left + (imageIndex * (cellWidth + gap));
            break;
          case 4:
            // 2x2 그리드 (grid-cols-2)
            cellWidth = (containerRect.width - gap) / 2;
            cellHeight = (containerRect.height - gap) / 2;
            cellX = containerRect.left + ((imageIndex % 2) * (cellWidth + gap));
            cellY = containerRect.top + (Math.floor(imageIndex / 2) * (cellHeight + gap));
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
      }
      
      const targetFrame = {
        width: Math.round(cellWidth),
        height: Math.round(cellHeight),
        x: Math.round(cellX),
        y: Math.round(cellY)
      };
      
      console.log(`📏 GridB 이미지 ${imageIndex} 실제 측정된 셀 크기:`, {
        imageCount,
        isExpanded,
        imageIndex,
        containerSize: { width: containerRect.width, height: containerRect.height },
        cellSize: targetFrame
      });
      
      return targetFrame;
    }
    return undefined;
  }, [imageCount, isExpanded]);

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
  }, [measureSingleImageCellSize, isExpanded, imageCount]);

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
    
    // isExpanded인 경우 폭이 더 넓어짐
    if (isExpanded) {
      baseWidth *= 2; // 대략 2배 넓어짐
    }
    
    // imageCount에 따른 개별 이미지 크기 계산
    let imageWidth = baseWidth;
    let imageHeight = baseHeight;
    
    if (isExpanded && imageCount === 3) {
      // 특별한 3개 이미지 레이아웃
      if (imageIndex === 0 || imageIndex === 1) {
        // 좌측 이미지들
        imageWidth = baseWidth / 3; // 전체 너비의 1/3
      } else {
        // 우측 이미지
        imageWidth = (baseWidth * 2) / 3; // 전체 너비의 2/3
      }
    } else {
      switch (imageCount) {
        case 1:
          // 단일 이미지는 전체 영역 사용
          break;
        case 2:
          // 2개 이미지는 가로로 분할
          imageWidth = baseWidth / 2 - 4; // gap 고려
          break;
        case 3:
          // 3개 이미지는 가로로 분할
          imageWidth = baseWidth / 3 - 4; // gap 고려
          break;
        case 4:
          // 2x2 그리드
          imageWidth = baseWidth / 2 - 4; // gap 고려
          imageHeight = baseHeight / 2 - 4; // gap 고려
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
    }
    
    return {
      width: imageWidth,
      height: imageHeight,
      aspectRatio: imageWidth / imageHeight
    };
  }, [measureImageCellSize, isExpanded, imageCount]);

  const [inputValue, setInputValue] = React.useState("");
  
  // Grid content store에서 해당 그리드의 playSubjectText 값 변경 시 inputValue 업데이트 (초기화 반영)
  React.useEffect(() => {
    if (gridId && gridContents[gridId]) {
      const storePlaySubjectText = gridContents[gridId].playSubjectText || "";
      console.log(`🔄 GridBElement ${gridId} store playSubjectText 변경됨:`, {
        storeValue: storePlaySubjectText,
        currentInputValue: inputValue
      });
      
      // store에서 값이 초기화된 경우 inputValue도 초기화
      if (storePlaySubjectText === "" && inputValue !== "") {
        setInputValue("");
      } else if (storePlaySubjectText !== inputValue) {
        setInputValue(storePlaySubjectText);
      }
    }
  }, [gridContents, gridId, inputValue]);
  
  // 툴바 상태 관리
  const [toolbarState, setToolbarState] = React.useState({
    show: false,
    isExpanded: false,
  });

  // Default images if none provided - imageCount에 맞게 동적으로 생성
  const defaultImages = React.useMemo(() => {
    return Array(imageCount).fill("https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg");
  }, [imageCount]);

  const displayImages = images.length > 0 ? images : defaultImages;

  // currentImages가 변경될 때 store 업데이트
  React.useEffect(() => {
    if (gridId && currentImages.length > 0) {
      // 기본 이미지가 아닌 실제 업로드된 이미지들만 필터링
      const validImages = currentImages.filter(img => 
        img && img !== "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg"
      );
      updateImages(gridId, validImages);
    }
  }, [currentImages, gridId, updateImages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Grid content store 업데이트 (gridId가 있을 때만)
    if (gridId) {
      updatePlaySubject(gridId, newValue);
    }
  };

  // LLM API 호출 함수
  const callLLMAPI = React.useCallback(async () => {
    console.log("🤖 GridB AI 생성 조건 체크:", {
      profileId,
      이미지개수: getCurrentImageCount(),
      키워드: inputValue?.trim()
    });
    
    // profileId 체크 - 로그인 상태 확인
    if (!profileId) {
      console.log("❌ AI 생성 조건 실패: 로그인 필요");
      addToast({ message: '로그인 후 사용해주세요.' });
      return;
    }

    // 그리드에서 이미지의 data-id 값들 수집
    const photoDriveItemKeys: string[] = [];
    currentImages.forEach((imageUrl) => {
      if (imageUrl && imageUrl !== "" && imageUrl !== "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg") {
        const driveItemKey = getDriveItemKeyByImageUrl(imageUrl);
        if (driveItemKey && !driveItemKey.startsWith('local_')) {
          photoDriveItemKeys.push(driveItemKey);
        }
      }
    });

    if (photoDriveItemKeys.length === 0) {
      console.log("❌ AI 생성 조건 실패: 유효한 이미지가 없음");
      addToast({ message: '먼저 이미지를 업로드해주세요.' });
      return;
    }

    // searchParams에서 age 값 가져오기
    const ageParam = searchParams?.get('age');
    const age = ageParam ? parseInt(ageParam, 10) : 3; // 기본값: 3 (6세)

    const requestData = {
      profileId,
      subject: "놀이 활동", // GridB는 categoryValue가 없으므로 기본값 사용
      age,
      startsAt: new Date().toISOString().split('T')[0], // 오늘 날짜
      endsAt: new Date().toISOString().split('T')[0], // 오늘 날짜
      photoDriveItemKeys,
      keywords: inputValue.trim() || "" // 현재 입력된 키워드 사용
    };

    console.log("GridB LLM API 호출 데이터:", requestData);

    try {
      const response = await fetch('/api/ai/v2/report/type-b/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log("API 오류:", errorData);
        showAlert({ message: 'AI 생성에 실패했습니다. 다시 시도해주세요.' });
        return;
      }

      const result = await response.json() as any;
      console.log("GridB LLM API 응답:", result);

      // API 응답 구조에서 텍스트 추출
      let generatedText = "";
      
      console.log("응답 구조 분석:", {
        hasSuccess: !!result.success,
        hasData: !!result.data,
        hasDataResult: !!result.data?.result,
        hasDataResultContents: !!result.data?.result?.contents,
        fullResponse: result
      });
      
      if (result.success && result.data?.result?.contents) {
        // type-b API 응답 구조: { success: true, data: { result: { contents: "..." } } }
        generatedText = result.data.result.contents;
      } else if (result.success && result.data?.contents) {
        generatedText = result.data.contents;
      } else if (result.data && typeof result.data === 'string') {
        generatedText = result.data;
      } else if (result.data && result.data.content) {
        generatedText = result.data.content;
      } else if (result.data && result.data.text) {
        generatedText = result.data.text;
      } else if (result.contents) {
        // 직접 contents 필드가 있는 경우
        generatedText = result.contents;
      } else if (typeof result === 'string') {
        generatedText = result;
      } else {
        console.warn("예상하지 못한 응답 구조:", result);
        generatedText = "AI 텍스트 생성에 성공했지만 내용을 추출할 수 없습니다."; // 기본값
      }

      // 생성된 텍스트로 input 값 업데이트
      setInputValue(generatedText);
      
      // Grid content store에도 업데이트 (gridId가 있을 때만)
      if (gridId) {
        updatePlaySubject(gridId, generatedText);
        // AI 생성된 콘텐츠임을 표시
        updateAiGenerated(gridId, true);
      }

      addToast({ message: 'AI 텍스트가 생성되었습니다.' });

    } catch (error) {
      console.log("API 호출 오류:", error);
      showAlert({ message: 'AI 생성 중 오류가 발생했습니다.' });
    }
  }, [profileId, currentImages, getDriveItemKeyByImageUrl, searchParams, inputValue, gridId, updatePlaySubject, updateAiGenerated, getCurrentImageCount, showAlert, addToast]);

  const handleAIGenerate = () => {
    console.log("🎯 GridB AI 생성 버튼 클릭됨");
    console.log("현재 isDescriptionExpanded:", isDescriptionExpanded);
    console.log("현재 이미지 개수:", getCurrentImageCount());
    
    // 추가 조건 체크 (안전장치)
    if (getCurrentImageCount() === 0) {
      console.log("❌ AI 생성 실패: 이미지가 없음");
      addToast({ message: '먼저 이미지를 업로드해주세요.' });
      return;
    }
    
    // AI 생성 버튼을 클릭했다고 표시
    setHasClickedAIGenerate(true);
    
    // 로딩 상태 시작
    setIsLoading(true);
    
    // description-area를 확장된 textarea로 변경
    setIsDescriptionExpanded(true);
    console.log("setIsDescriptionExpanded(true) 호출됨");
    
    // LLM API 호출
    callLLMAPI().finally(() => {
      // 로딩 상태 종료 (성공/실패 관계없이)
      setIsLoading(false);
    });
    
    if (onAIGenerate) {
      onAIGenerate();
    }
  };

  const handleImageUpload = () => {
    console.log('GridB 이미지 업로드 버튼 클릭됨');
    // 새로운 이미지 업로드 모달 열기
    handleOpenUploadModal();
    
    // 기존 핸들러도 호출 (필요시)
    if (onImageUpload) {
      onImageUpload();
    }
  };

  // 텍스트 파일 업로드 핸들러
  const handleTextFileUpload = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt';
    fileInput.style.display = 'none';
    
    fileInput.onchange = (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (file && file.type === 'text/plain') {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          const content = e.target?.result as string;
          if (content) {
            setInputValue(content);
            if (gridId) {
              updatePlaySubject(gridId, content);
            }
          }
        };
        
        reader.readAsText(file, 'UTF-8');
      } else {
        alert('텍스트 파일(.txt)만 업로드 가능합니다.');
      }
      
      document.body.removeChild(fileInput);
    };
    
    document.body.appendChild(fileInput);
    fileInput.click();
  };

  // 이미지 편집 모달 열기 핸들러
  const handleImageAdjustClick = (imageIndex: number, imageUrl: string) => {
    if (imageUrl && imageUrl !== "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg") {
      // 모든 유효한 이미지들을 가져와서 ImageEditModal 사용
      const validImages = currentImages.filter(img => 
        img && img !== "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg"
      );
      
      if (validImages.length > 0) {
        // 클릭한 이미지가 유효한 이미지 목록에서 몇 번째인지 찾기
        const clickedImageIndex = validImages.findIndex(img => img === imageUrl);
        const finalSelectedIndex = clickedImageIndex >= 0 ? clickedImageIndex : 0;
        
        setImageEditModal({
          isOpen: true,
          imageUrls: validImages,
          selectedImageIndex: finalSelectedIndex,
          originalImageIndex: imageIndex // 클릭한 원래 이미지 인덱스 저장
        });
      }
    }
  };

  // ImageEditModal에서 편집된 이미지 적용 핸들러
  const handleImageEditApply = (editedImageData: string) => {
    console.log("📸 GridB 편집된 이미지 데이터 받음:", editedImageData.substring(0, 50) + "...");
    
    // 편집된 이미지로 원래 위치의 이미지 교체
    // selectedImageIndex는 필터링된 배열에서의 인덱스이므로
    // 실제 원래 이미지 URL을 찾아서 교체해야 함
    const selectedImageUrl = imageEditModal.imageUrls[imageEditModal.selectedImageIndex];
    
    setCurrentImages(prev => {
      const newImages = [...prev];
      // 원래 이미지 배열에서 해당 URL의 인덱스를 찾아서 교체
      const originalIndex = newImages.findIndex(img => img === selectedImageUrl);
      if (originalIndex >= 0) {
        newImages[originalIndex] = editedImageData;
      }
      return newImages;
    });

    // 모달 닫기
    setImageEditModal(prev => ({ ...prev, isOpen: false }));
  };

  // ImageEditModal에서 이미지 순서 변경 핸들러
  const handleImageOrderChange = (newOrder: string[]) => {
    console.log("🔄 GridB 이미지 순서 변경:", newOrder);
    setCurrentImages(prev => {
      const newImages = [...prev];
      // 유효한 이미지들만 새로운 순서로 교체
      newOrder.forEach((imageUrl, index) => {
        if (index < newImages.length) {
          newImages[index] = imageUrl;
        }
      });
      return newImages;
    });
  };

  // 텍스트 새로고침 핸들러 - LLM API 호출
  const handleTextRefresh = (event: React.MouseEvent) => {
    event.stopPropagation(); // 이벤트 전파 방지
    
    console.log("🔄 GridB 텍스트 새로고침 조건 체크:", {
      profileId,
      currentImageCount: getCurrentImageCount(),
      키워드: inputValue?.trim()
    });
    
    // LLM 호출 조건 확인
    if (!profileId) {
      console.log("❌ 새로고침 조건 실패: 로그인 필요");
      addToast({ message: '로그인 후 사용해주세요.' });
      return;
    }

    if (getCurrentImageCount() === 0) {
      console.log("❌ 새로고침 조건 실패: 이미지가 없음");
      addToast({ message: '먼저 이미지를 업로드해주세요.' });
      return;
    }
    
    // 로딩 상태 시작
    setIsLoading(true);
    
    // LLM API 호출
    callLLMAPI().finally(() => {
      // 로딩 상태 종료 (성공/실패 관계없이)
      setIsLoading(false);
    });
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  // 개별 이미지 삭제 핸들러
  const handleImageDelete = (imageIndex: number, event: React.MouseEvent) => {
    event.stopPropagation(); // 이벤트 전파 방지
    
    setCurrentImages(prev => {
      const deletedImageUrl = prev[imageIndex];
      const newImages = [...prev];
      newImages[imageIndex] = ""; // 해당 인덱스의 이미지를 빈 문자열로 설정
      
      // 이미지 메타데이터에서도 해당 URL을 가진 메타데이터 삭제
      if (deletedImageUrl) {
        setImageMetadata(prevMetadata => 
          prevMetadata.filter(metadata => metadata.url !== deletedImageUrl)
        );
      }
      
      console.log(`🗑️ GridB 이미지 ${imageIndex} 삭제:`, {
        이전이미지: prev,
        새이미지: newImages,
        삭제된URL: deletedImageUrl
      });
      return newImages;
    });
    
    // 해당 인덱스의 이미지 위치 정보도 초기화
    setImagePositions(prev => {
      const newPositions = [...prev];
      if (newPositions[imageIndex]) {
        newPositions[imageIndex] = { x: 0, y: 0, scale: 1 };
      }
      return newPositions;
    });
  };

  // 이미지가 아닌 영역 클릭 핸들러 - 툴바 표시 및 기존 선택 로직
  const handleNonImageClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // 이벤트 전파 방지
    
    // 툴바 표시
    setToolbarState({
      show: true,
      isExpanded: true,
    });
    
    // 기존 선택 로직 유지
    if (onSelectChange) {
      onSelectChange(!isSelected);
    }
    if (onClick) {
      onClick();
    }
  };

  // 이미지 영역 클릭 핸들러 (이벤트 전파 방지)
  const handleImageClick = (event: React.MouseEvent) => {
    event.stopPropagation();
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
      // 부모 컴포넌트에 이미지 개수 변경 알림
      if (onImageCountChange) {
        onImageCountChange(data.count);
      }
    }
    
    // 사진 배경 제거 처리 (인덱스 3)
    if (iconIndex === 3) {
      console.log(`그리드 ${index}의 모든 이미지 제거 (갯수 유지)`);
      setCurrentImages(prev => {
        const newImages = new Array(prev.length).fill("");
        console.log("🗑️ GridB 이미지 제거 완료:", {
          이전이미지: prev,
          새이미지: newImages,
          이미지개수: newImages.length
        });
        return newImages;
      });
      
      // 툴바 숨기기
      handleHideToolbar();
    }
    
    // 사진 틀 삭제 처리 (인덱스 4)
    if (iconIndex === 4) {
      console.log(`그리드 ${index}의 사진 틀 삭제 - 숨김 처리`);
      // 부모 컴포넌트의 onDelete 콜백 호출 (hiddenItems 상태 업데이트)
      if (onDelete) {
        onDelete();
      }
      
      // 툴바 숨기기
      handleHideToolbar();
    }
    
    // 여기에 각 아이콘별 로직 구현
  };

  // 전역 클릭 이벤트로 툴바 숨기기
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // 현재 GridBElement 외부 클릭 시 툴바 숨기기
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

  // 툴바 표시 상태 또는 기존 선택 상태에 따른 border 스타일 결정
  const borderClass = (toolbarState.show || isSelected)
    ? 'border-solid border-primary border-2' 
    : 'border-dashed border-zinc-400';

  return (
    <div className="relative w-full h-full">
      <div
        className={`relative overflow-hidden px-2.5 py-2.5 bg-white rounded-2xl border ${borderClass} w-full h-full flex flex-col ${className} gap-y-1.5 cursor-pointer`}
        style={style}
        onClick={handleNonImageClick}
        data-grid-id={gridId}
      >
        

        {/* 이미지 그리드 - 계산된 높이로 설정하여 공간 최적화 */}
        <div 
          ref={dropRef}
          className={`grid gap-1 w-full ${getImageGridLayout(imageCount).className}`}
          style={{ 
            height: 'calc(100% - 70px)', // 전체 높이에서 하단 입력 영역(70px) 제외
            backgroundColor: canDrop && isOver ? '#f0f0f0' : 'transparent',
            transition: 'background-color 0.2s ease',
            ...getImageGridLayout(imageCount).style
          }}
        >
          {currentImages.map((imageSrc, index) => {
            // 합친 경우이고 이미지가 3개일 때 각 이미지의 grid-area 지정
            let gridAreaStyle = {};
            if (isExpanded && imageCount === 3) {
              switch (index) {
                case 0:
                  gridAreaStyle = { gridArea: 'left-left' };
                  break;
                case 1:
                  gridAreaStyle = { gridArea: 'left-right' };
                  break;
                case 2:
                  gridAreaStyle = { gridArea: 'right' };
                  break;
              }
            }
            
            return (
              <div 
                key={index}
                className="w-full h-full"
              >
                <div 
                  className="relative cursor-pointer hover:opacity-80 transition-opacity group w-full h-full"
                  style={gridAreaStyle}
                  onClick={(e) => {
                    // 클릭 시에도 크기 측정
                    measureImageCellSize(index);
                    if (!imageSrc || imageSrc === "" || imageSrc === "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg") {
                      handleOpenUploadModal();
                    }
                    handleImageClick(e);
                  }}
                >
                  {imageSrc && imageSrc !== "" && imageSrc !== "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg" ? (
                    <div
                      className="absolute inset-0 overflow-hidden rounded-md cursor-pointer group"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageAdjustClick(index, imageSrc);
                      }}
                    >
                      <Image
                        src={imageSrc}
                        alt={`Image ${index + 1}`}
                        fill
                        className="object-cover rounded-md"
                        style={{
                          transform: `translate(${imagePositions[index]?.x || 0}px, ${imagePositions[index]?.y || 0}px) scale(${imagePositions[index]?.scale || 1})`,
                          transformOrigin: 'center'
                        }}
                        data-id={getDriveItemKeyByImageUrl(imageSrc)}
                      />
                      {/* X 삭제 버튼 */}
                      <button
                        className="absolute top-1 right-1 bg-white w-5 h-5 rounded-full flex items-center justify-center border border-solid border-[#F0F0F0]"
                        onClick={(e) => handleImageDelete(index, e)}
                        title="이미지 삭제"
                      >
                        <IoClose className="w-4 h-4 text-black" />
                      </button>
                      {/* 메모 인디케이터 */}
                      <MemoIndicator 
                        show={Boolean(getDriveItemKeyByImageUrl(imageSrc) && memoStatuses[getDriveItemKeyByImageUrl(imageSrc) || ''])}
                        driveItemKey={getDriveItemKeyByImageUrl(imageSrc)}
                        onMemoClick={() => {
                          const driveItemKey = getDriveItemKeyByImageUrl(imageSrc);
                          if (driveItemKey) {
                            openMemoModal(driveItemKey);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <Image
                        src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg"
                        alt="No image"
                        fill
                        className="object-cover rounded-md"
                      />
                      {/* Black overlay - 이미지가 없을 때만 표시 */}
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
                            handleOpenUploadModal();
                          }}
                        >
                          파일선택
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 하단 입력 영역 - 고정 높이 70px로 최적화 */}
        {isLoading ? (
          // 로딩 중일 때
          <div className="flex flex-col gap-y-2 items-center justify-center px-2 py-2 w-full leading-none bg-white rounded-md border border-dashed border-zinc-400 h-[70px] flex-shrink-0">
            <Loader size="default" />
            <div className="text-[#B4B4B4] text-xs">내용을 생성중입니다...</div>
          </div>
        ) : isDescriptionExpanded ? (
          // 확장된 textarea 모드
          <div className={`flex overflow-hidden flex-col px-2 py-2 w-full leading-none bg-white rounded-md h-[70px] justify-center flex-shrink-0 relative transition-colors ${
            isTextareaFocused ? 'border border-solid border-primary' : 'border border-dashed border-zinc-400'
          }`}>
            {/* 새로고침 버튼 - 우측 상단 */}
            <button
              onClick={handleTextRefresh}
              className="absolute top-2 right-3 w-5 h-5 flex items-center justify-center hover:bg-gray-100 rounded-sm transition-colors z-10"
              title="텍스트 새로고침"
            >
              <Image
                src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/refresh.svg"
                width={20}
                height={20}
                alt="Refresh"
                className="object-contain"
              />
            </button>
            
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
          <div className="flex overflow-hidden flex-col items-center px-2 py-2 w-full leading-none bg-white rounded-md border border-dashed border-zinc-400 h-[70px] justify-center flex-shrink-0 relative">
            <div className="flex gap-1.5 w-full mb-1.5"> 
              <Input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder={placeholderText}
                className="h-[26px] min-h-[26px] max-h-[26px] px-2 py-1 text-xs tracking-tight bg-white border border-dashed border-zinc-400 text-zinc-600 placeholder-zinc-400 flex-1 shadow-none rounded-md focus:ring-0 focus:outline-none focus:border-primary resize-none"
                style={{ borderRadius: '6px', fontSize: '10px', lineHeight: '1.2' }}
                onClick={handleImageClick} // Input 클릭 시에도 이벤트 전파 방지
              />
              <button
                onClick={(e) => {
                  e.stopPropagation(); // 이벤트 전파 방지
                  handleTextFileUpload();
                }}
                className="flex overflow-hidden justify-center items-center w-[26px] h-[26px] bg-[#979797] border border-dashed border-zinc-400 rounded-md hover:bg-[#979797]/80 transition-colors"
                title="텍스트 파일 업로드"
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
                  if (!isLoading && getCurrentImageCount() > 0) {
                    handleAIGenerate();
                  }
                }}
                disabled={isLoading || getCurrentImageCount() === 0}
                className={`flex overflow-hidden gap-0.5 text-xs font-semibold tracking-tight rounded-md flex justify-center items-center w-[54px] h-[26px] self-start transition-all ${
                  isLoading || getCurrentImageCount() === 0 
                    ? 'cursor-not-allowed bg-gray-400 text-gray-300' 
                    : 'text-white bg-gradient-to-r from-[#FA8C3D] via-[#FF8560] to-[#FAB83D] hover:opacity-90'
                }`}
              >
                {isLoading ? (
                  <Loader size="sm" className="text-white" />
                ) : (
                  <>
                    <Image
                      src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/leaf.svg"
                      className={`object-contain ${getCurrentImageCount() === 0 ? 'opacity-50' : ''}`}
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
            targetIsExpanded={isExpanded}
          />
        </div>
      )}

      {/* 이미지 편집 모달 */}
      <ImageEditModal
        isOpen={imageEditModal.isOpen}
        onClose={() => setImageEditModal(prev => ({ ...prev, isOpen: false }))}
        imageUrls={imageEditModal.imageUrls}
        selectedImageIndex={imageEditModal.selectedImageIndex}
        onApply={handleImageEditApply}
        onImageOrderChange={handleImageOrderChange}
        targetFrame={measureImageCellSize(imageEditModal.originalImageIndex || 0)}
      />
      
      {/* 이미지 업로드 모달 */}
      {isUploadModalOpen && (
        <UploadModal
          isOpen={isUploadModalOpen}
          onCancel={handleCloseUploadModal}
          onConfirm={handleConfirmUploadModal}
          setItemData={handleSetItemData}
          setFileData={(files: React.SetStateAction<File[]>) => {
            // files가 File[] 배열인 경우에만 처리
            if (Array.isArray(files) && files.length > 0) {
              console.log('📁 GridB 파일 선택됨:', files);
              processUploadedFiles(files);
            }
          }}
          isMultiUpload
          allowsFileTypes={['IMAGE']}
        />
      )}

      {/* 메모 편집 모달 */}
      <MemoEditModal
        isOpen={isMemoOpen}
        memo={memoData}
        onChangeMemo={updateMemoData}
        onSave={saveMemo}
        onCancel={closeMemoModal}
      />
    </div>
  );
}

export default GridBElement; 