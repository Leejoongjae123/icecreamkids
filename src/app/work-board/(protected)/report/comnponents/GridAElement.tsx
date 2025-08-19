"use client";
import * as React from "react";
import * as ReactDOM from "react-dom";
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
import { useSavedDataStore } from "@/hooks/store/useSavedDataStore";


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
  mode?: 'single' | 'multiple'; // 이미지 편집 모드
  onDecreaseSubject?: () => void; // subject 감소 함수 추가
  targetFrame?: {
    width: number;
    height: number;
    x: number;
    y: number;
  };
  imagePositions?: any[]; // 외부에서 전달받은 이미지 위치 정보
  onImagePositionsUpdate?: (positions: any[]) => void; // 이미지 위치 업데이트 핸들러
  gridCount?: number; // 그리드 갯수 추가
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
  category = "",
  images = [],
  onAIGenerate,
  onImageUpload,
  onDelete, // 삭제 핸들러 추가
  placeholderText = "(선택) 놀이 키워드를 입력하거나 메모파일을 업로드해주세요",
  isDragging = false, // 드래그 상태 추가
  dragAttributes, // 드래그 속성 추가
  dragListeners, // 드래그 리스너 추가
  cardType, // 카드 타입 추가
  isExpanded = false, // 확장 상태 추가
  isWideCard = false, // col-span-2인 경우를 위한 prop 추가
  imageCount: propsImageCount = 1, // 초기 이미지 개수
  mode = 'single', // 이미지 편집 모드
  onDecreaseSubject, // subject 감소 함수 추가
  imagePositions: externalImagePositions = [], // 외부에서 전달받은 이미지 위치 정보
  onImagePositionsUpdate, // 이미지 위치 업데이트 핸들러
  gridCount, // 그리드 갯수
}: GridAElementProps) {
  // 사용자 정보 가져오기
  const { userInfo } = useUserStore();
  const profileId = React.useMemo(() => userInfo?.id || null, [userInfo?.id]);
  const accountId = React.useMemo(() => userInfo?.accountId || null, [userInfo?.accountId]);
  
  // 저장 상태 가져오기
  const { isSaved } = useSavedDataStore();
  
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
  const { updatePlaySubject, updateImages, updateCategoryValue, updateDriveItemKeys, updateAiGenerated, gridContents } = useGridContentStore();
  
  // 현재 gridId의 AI 생성 상태 확인
  const hasAiGeneratedContent = gridId ? gridContents[gridId]?.hasAiGenerated || false : false;
  
  // 저장 모드에서 LLM 콘텐츠가 없는 경우 숨김 처리 여부 결정
  const shouldHideInSavedMode = isSaved && !hasAiGeneratedContent;
  
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
          // addToast({ message: '메모가 수정되었습니다.' });
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
  
  console.log('GridAElement profileId:', profileId);
  console.log('GridAElement accountId:', accountId);

  // 이미지 개수 상태 관리
  const [imageCount, setImageCount] = React.useState(propsImageCount);
  
  // 카테고리 편집 상태 관리
  const [isEditingCategory, setIsEditingCategory] = React.useState(false);
  const [categoryValue, setCategoryValue] = React.useState(category);
  
  // description-area 확장 상태 관리
  const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);
  
  // AI 생성 로딩 상태 관리
  const [isLoading, setIsLoading] = React.useState(false);
  
  // 배경 제거 로딩 상태 관리 - 각 이미지별로 관리
  const [isRemoveBackgroundLoading, setIsRemoveBackgroundLoading] = React.useState(false);
  const [imageRemoveLoadingStates, setImageRemoveLoadingStates] = React.useState<{[index: number]: boolean}>({});
  
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
    console.log("🏁 초기 currentImages 설정:", {
      원본이미지: images,
      새이미지: newImages,
      초기이미지: initialImages,
      imageCount: imageCount
    });
    return initialImages;
  });

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

  // 이미지 위치 정보 상태 - 외부에서 전달받은 데이터 우선 사용
  const [imagePositions, setImagePositions] = React.useState<ImagePosition[]>(() => {
    if (externalImagePositions.length > 0) {
      return externalImagePositions;
    }
    return Array(imageCount).fill({ x: 0, y: 0, scale: 1 });
  });

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
      console.log('📥 이미지 업로드 완료:', files);
      
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

  // 여러 이미지 추가 핸들러
  const handleImagesAdded = React.useCallback((imageUrls: string[]) => {
    console.log("📥 GridAElement에서 여러 이미지 받음:", imageUrls);
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
      
      console.log("📊 이미지 배치 결과:", {
        받은이미지: imageUrls,
        제한된이미지: limitedImageUrls,
        이전이미지: prev,
        새이미지: newImages,
        최종이미지: finalImages,
        imageCount: imageCount
      });
      
      // driveItemKeys도 함께 업데이트
      const driveItemKeys = finalImages.map(imageUrl => {
        if (!imageUrl || imageUrl === "" || imageUrl === "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg") {
          return "";
        }
        return getDriveItemKeyByImageUrl(imageUrl) || "";
      }).filter(key => key !== "");
      
      console.log("📊 driveItemKeys 추출:", {
        finalImages,
        driveItemKeys,
        imageMetadata
      });
      
      // Grid content store 업데이트
      if (gridId) {
        updateDriveItemKeys(gridId, driveItemKeys);
      }
      
      return finalImages;
    });
  }, [imageCount, getDriveItemKeyByImageUrl, updateDriveItemKeys, gridId]);

  // 개별 이미지 추가 핸들러
  const handleSingleImageAdded = React.useCallback((hasImage: boolean, imageIndex: number) => {
    console.log(`📥 개별 이미지 ${imageIndex} 변경:`, hasImage);
  }, []);

  // imageCount 변경 시 currentImages와 imagePositions, imageMetadata 업데이트
  React.useEffect(() => {
    console.log("🔄 imageCount 변경됨:", imageCount);
    
    setCurrentImages(prev => {
      const newImages = [...prev];
      // 이미지 개수에 맞게 배열 크기 조정
      while (newImages.length < imageCount) {
        newImages.push("");
      }
      // 항상 imageCount로 길이 제한
      const limitedImages = newImages.slice(0, imageCount);
      
      console.log("🔄 currentImages 업데이트:", {
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

  // isDescriptionExpanded 상태 변경 추적
  React.useEffect(() => {
    console.log("isDescriptionExpanded 상태 변경됨:", isDescriptionExpanded);
  }, [isDescriptionExpanded]);

  // 외부에서 전달받은 이미지 위치 정보 동기화
  React.useEffect(() => {
    if (externalImagePositions.length > 0) {
      setImagePositions(externalImagePositions);
      console.log("📍 외부 이미지 위치 정보 동기화:", externalImagePositions);
    }
  }, [externalImagePositions]);

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
      
      // gridCount가 2이고 imageCount가 4인 경우 특별 처리
      if (gridCount === 2 && imageCount === 4) {
        // 4개 이미지는 가로로 분할 (flex layout)
        cellWidth = (containerRect.width - gap * 3) / 4;
        cellX = containerRect.left + (imageIndex * (cellWidth + gap));
        
        const targetFrame = {
          width: Math.round(cellWidth),
          height: Math.round(cellHeight),
          x: Math.round(cellX),
          y: Math.round(cellY)
        };
        
        console.log(`📏 gridCount=2, imageCount=4 이미지 ${imageIndex} 실제 측정된 셀 크기:`, {
          imageCount,
          gridCount,
          imageIndex,
          containerSize: { width: containerRect.width, height: containerRect.height },
          cellSize: targetFrame
        });
        
        return targetFrame;
      }

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
      baseWidth *= 2; // 대략 2배 넓어짐
    }
    
    // imageCount에 따른 개별 이미지 크기 계산
    let imageWidth = baseWidth;
    let imageHeight = baseHeight;
    
    // gridCount가 2이고 imageCount가 4인 경우 특별 처리
    if (gridCount === 2 && imageCount === 4) {
      // 4개 이미지는 가로로 분할
      imageWidth = baseWidth / 4 - 4; // gap 고려
      return {
        width: imageWidth,
        height: imageHeight,
        aspectRatio: imageWidth / imageHeight
      };
    }
    
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
  
  // hover 상태 관리
  const [isHovered, setIsHovered] = React.useState(false);
  const isHoveredRef = React.useRef(false);
  const hoverTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // 툴바 위치 상태
  const [toolbarPosition, setToolbarPosition] = React.useState({ left: 0, top: 0 });
  
  // 컨테이너 ref
  const containerRef = React.useRef<HTMLDivElement>(null);

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
      
      // driveItemKeys도 함께 업데이트
      const driveItemKeys = validImages.map(imageUrl => {
        return getDriveItemKeyByImageUrl(imageUrl) || "";
      }).filter(key => key !== "");
      
      updateDriveItemKeys(gridId, driveItemKeys);
    }
  }, [currentImages, gridId, updateImages, updateDriveItemKeys, getDriveItemKeyByImageUrl]);

  // categoryValue가 변경될 때 store 업데이트 (무한 루프 방지를 위한 ref 사용)
  const isUpdatingFromStore = React.useRef(false);
  
  React.useEffect(() => {
    if (gridId && !isUpdatingFromStore.current) {
      console.log("📝 categoryValue store 업데이트:", { gridId, categoryValue });
      updateCategoryValue(gridId, categoryValue);
    }
  }, [categoryValue, gridId, updateCategoryValue]);

  // store에서 categoryValue가 변경될 때 로컬 상태 동기화 (무한 루프 방지)
  React.useEffect(() => {
    if (gridId && gridContents[gridId]?.categoryValue !== undefined) {
      const storeCategoryValue = gridContents[gridId].categoryValue || "";
      if (storeCategoryValue !== categoryValue) {
        console.log("🔄 store에서 categoryValue 동기화:", { 
          gridId, 
          현재값: categoryValue, 
          스토어값: storeCategoryValue 
        });
        isUpdatingFromStore.current = true;
        setCategoryValue(storeCategoryValue);
        // 다음 렌더링에서 다시 store 업데이트가 가능하도록 플래그 초기화
        setTimeout(() => {
          isUpdatingFromStore.current = false;
        }, 0);
      }
    }
  }, [gridContents, gridId]);

  // store에서 해당 gridId가 삭제되었을 때 로컬 상태 초기화
  React.useEffect(() => {
    if (gridId && !gridContents[gridId]) {
      // store에서 해당 gridId가 삭제되었으면 로컬 상태 초기화
      setCategoryValue("");
      setInputValue("");
      setCurrentImages(Array(imageCount).fill(""));
      setImagePositions(Array(imageCount).fill({ x: 0, y: 0, scale: 1 }));
      setImageMetadata([]);
      setIsDescriptionExpanded(false);
      setHasClickedAIGenerate(false);
      setIsEditingCategory(false);
      setIsTextareaFocused(false);
      console.log(`GridAElement ${gridId} 상태 초기화됨`);
    }
  }, [gridContents, gridId, imageCount]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Grid content store 업데이트 (gridId가 있을 때만)
    if (gridId) {
      updatePlaySubject(gridId, newValue);
    }
  };

  // LLM API 호출 함수
  const callLLMAPI = React.useCallback(async () => {
    console.log("🤖 AI 생성 조건 체크:", {
      profileId,
      categoryValue,
      categoryValueTrimmed: categoryValue?.trim(),
      categoryValueLength: categoryValue?.length,
      isValidCategory: categoryValue && categoryValue.trim() !== "" && categoryValue !== "타이틀을 입력해주세요"
    });
    
    // profileId 체크 - 로그인 상태 확인
    if (!profileId) {
      console.log("❌ AI 생성 조건 실패: 로그인 필요");
      addToast({ message: '로그인 후 사용해주세요.' });
      return;
    }
    
    // categoryValue 체크 - 타이틀 입력 상태 확인
    if (!categoryValue || categoryValue.trim() === "" || categoryValue === "타이틀을 입력해주세요") {
      console.log("❌ AI 생성 조건 실패: 타이틀이 유효하지 않음");
      addToast({ message: '먼저 타이틀을 입력해주세요.' });
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

      return;
    }

    // searchParams에서 age 값 가져오기
    const ageParam = searchParams?.get('age');
    const age = ageParam ? parseInt(ageParam, 10) : 3; // 기본값: 3 (6세)

    const requestData = {
      profileId,
      subject: categoryValue,
      age,
      startsAt: new Date().toISOString().split('T')[0], // 오늘 날짜
      endsAt: new Date().toISOString().split('T')[0], // 오늘 날짜
      photoDriveItemKeys,
      keywords: inputValue.trim() || "" // 현재 입력된 키워드 사용
    };

    console.log("LLM API 호출 데이터:", requestData);

    try {
      const response = await fetch('/api/ai/v2/report/type-a/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        showAlert({ message: 'AI 생성에 실패했습니다. 다시 시도해주세요.' });
        return;
      }

      const result = await response.json() as any;
      console.log("LLM API 응답:", result);

      // API 응답 구조에서 텍스트 추출
      let generatedText = "";
      
      console.log("응답 구조 분석:", {
        hasStatus: !!result.status,
        status: result.status,
        hasResult: !!result.result,
        hasContents: !!result.result?.contents,
        fullResponse: result
      });
      
      if (result.status === 200 && result.result?.contents) {
        // 실제 API 응답 구조: { status: 200, result: { contents: "..." } }
        generatedText = result.result.contents;
      } else if (result.success && result.data?.result?.contents) {
        // 기존 구조 지원
        generatedText = result.data.result.contents;
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

      // addToast({ message: 'AI 텍스트가 생성되었습니다.' });

    } catch (error) {

      showAlert({ message: 'AI 생성 중 오류가 발생했습니다.' });
    }
  }, [profileId, categoryValue, currentImages, getDriveItemKeyByImageUrl, searchParams, inputValue, gridId, updatePlaySubject, showAlert, addToast]);

  const handleAIGenerate = () => {
    console.log("🎯 AI 생성 버튼 클릭됨");
    console.log("현재 isDescriptionExpanded:", isDescriptionExpanded);
    console.log("현재 categoryValue:", categoryValue);
    console.log("현재 이미지 개수:", getCurrentImageCount());
    
    // 추가 조건 체크 (안전장치)
    if (!categoryValue || categoryValue.trim() === "" || categoryValue === "타이틀을 입력해주세요") {
      console.log("❌ AI 생성 실패: 카테고리 값이 유효하지 않음");
      addToast({ message: '먼저 타이틀을 입력해주세요.' });
      return;
    }
    
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
    console.log('이미지 업로드 버튼 클릭됨');
    // 새로운 이미지 업로드 모달 열기
    handleOpenUploadModal();
    
    // 기존 핸들러도 호출 (필요시)
    if (onImageUpload) {
      onImageUpload();
    }
  };

  // 텍스트 파일 업로드 핸들러
  const handleTextFileUpload = () => {
    // 숨겨진 파일 input 요소 생성
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt';
    fileInput.style.display = 'none';
    
    // 파일 선택 시 이벤트 핸들러
    fileInput.onchange = (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (file && file.type === 'text/plain') {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          const content = e.target?.result as string;
          if (content) {
            // 읽은 텍스트 내용을 input에 설정
            setInputValue(content);
            
            // Grid content store에도 업데이트 (gridId가 있을 때만)
            if (gridId) {
              updatePlaySubject(gridId, content);
            }
          }
        };
        
        reader.readAsText(file, 'UTF-8');
      } else {
        alert('텍스트 파일(.txt)만 업로드 가능합니다.');
      }
      
      // input 요소 제거
      document.body.removeChild(fileInput);
    };
    
    // body에 추가하고 클릭
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
  const handleImageEditApply = (editedImageData: string, transformData?: { x: number; y: number; scale: number; width: number; height: number }) => {
    console.log("📸 편집된 이미지 데이터 받음:", editedImageData.substring(0, 50) + "...");
    console.log("📸 편집된 이미지 변환 데이터:", transformData);
    
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

    // 이미지 위치 정보가 있다면 imagePositions 업데이트
    if (transformData) {
      const selectedImageUrl = imageEditModal.imageUrls[imageEditModal.selectedImageIndex];
      
      setImagePositions(prev => {
        const newPositions = [...prev];
        // 원래 이미지 배열에서 해당 URL의 인덱스를 찾아서 위치 정보 업데이트
        const currentImageIndex = currentImages.findIndex(img => img === selectedImageUrl);
        if (currentImageIndex >= 0 && currentImageIndex < newPositions.length) {
          // KonvaImageCanvas의 변환 데이터를 ImagePosition 형태로 변환
          // 여기서는 간단히 x, y, scale만 사용 (회전이나 다른 변환은 필요시 추가)
          newPositions[currentImageIndex] = {
            x: transformData.x,
            y: transformData.y,
            scale: transformData.scale
          };
          console.log("📍 이미지 위치 정보 업데이트:", {
            imageIndex: currentImageIndex,
            position: newPositions[currentImageIndex]
          });
        }
        
        // 상위 컴포넌트로 위치 정보 전달
        if (onImagePositionsUpdate) {
          onImagePositionsUpdate(newPositions);
        }
        
        return newPositions;
      });
    }

    // 모달 닫기
    setImageEditModal(prev => ({ ...prev, isOpen: false }));
  };

  // ImageEditModal에서 이미지 순서 변경 핸들러
  const handleImageOrderChange = (newOrder: string[]) => {
    console.log("🔄 이미지 순서 변경:", newOrder);
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
    
    console.log("🔄 텍스트 새로고침 조건 체크:", {
      profileId,
      categoryValue,
      categoryValueTrimmed: categoryValue?.trim(),
      currentImageCount: getCurrentImageCount(),
      isValidCategory: categoryValue && categoryValue.trim() !== "" && categoryValue !== "타이틀을 입력해주세요"
    });
    
    // LLM 호출 조건 확인
    if (!profileId || !categoryValue || categoryValue.trim() === "" || categoryValue === "타이틀을 입력해주세요") {
      console.log("❌ 새로고침 조건 실패: 타이틀이 유효하지 않음");
      addToast({ message: '먼저 타이틀을 입력해주세요.' });
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

  // 삭제 핸들러
  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation(); // 이벤트 전파 방지
    
    // 삭제 확인 대화상자
    if (window.confirm('정말로 이 카드를 삭제하시겠습니까?') && onDelete) {
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
      
      console.log(`🗑️ 이미지 ${imageIndex} 삭제:`, {
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
      
      // 상위 컴포넌트로 위치 정보 전달
      if (onImagePositionsUpdate) {
        onImagePositionsUpdate(newPositions);
      }
      
      return newPositions;
    });
  };

  // 툴바 표시 공통 함수 (저장 상태가 아닐 때만)
  const showToolbar = () => {
    if (!isSaved) {
      setToolbarState({
        show: true,
        isExpanded: true,
      });
    }
  };

  // 이미지가 아닌 영역 클릭 핸들러 - 툴바 표시
  const handleNonImageClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // 이벤트 전파 방지
    
    // 기존 hover 타이머가 있다면 제거
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    
    // 툴바 표시
    showToolbar();
    
    if (onClick) {
      onClick();
    }
  };

  // 마우스 hover 핸들러
  const handleMouseEnter = () => {
    console.log("🟢 Mouse Enter - GridAElement", gridId);
    setIsHovered(true);
    isHoveredRef.current = true;
    
    // 기존 타이머가 있다면 제거
    if (hoverTimerRef.current) {
      console.log("⏰ Clearing existing hover timer");
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    
    // 툴바 표시
    showToolbar();
  };

  const handleMouseLeave = () => {
    console.log("🔴 Mouse Leave - GridAElement", gridId);
    setIsHovered(false);
    isHoveredRef.current = false;
    
    // 3초 후 툴바 숨기기 타이머 설정
    const timer = setTimeout(() => {
      console.log("⏰ Timer callback - checking hover state", isHoveredRef.current);
      // 여전히 hover 상태가 아닐 때만 숨기기
      if (!isHoveredRef.current) {
        console.log("✅ Hiding toolbar after 3 seconds");
        setToolbarState({
          show: false,
          isExpanded: false,
        });
      } else {
        console.log("❌ Still hovered, not hiding toolbar");
      }
      hoverTimerRef.current = null;
    }, 3000);
    
    console.log("⏰ Setting 3-second timer");
    hoverTimerRef.current = timer;
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

  // 개별 이미지의 배경 제거 API 호출 함수
  const removeBackgroundForSingleImage = React.useCallback(async (imageIndex: number, imageUrl: string, driveItemKey: string) => {
    try {
      setImageRemoveLoadingStates(prev => ({ ...prev, [imageIndex]: true }));
      
      const response = await fetch('/api/ai/v1/remove-background', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': '*/*'
        },
        body: JSON.stringify({
          profileId,
          driveItemKeys: [driveItemKey], // 단일 이미지만 처리
          threshold: 0.8,
          responseWithFolder: false
        })
      });

      if (!response.ok) {
        console.log(`이미지 ${imageIndex + 1} 배경 제거 실패`);
        return null;
      }

      const result = await response.json();
      console.log(`🖼️ 이미지 ${imageIndex + 1} 배경 제거 API 응답:`, result);

      // 응답에서 새로운 이미지 정보 추출
      if (result?.result) {
        const processedImage = Array.isArray(result.result) ? result.result[0] : result.result;
        
        if (processedImage?.driveItemKey && processedImage?.thumbUrl) {
          const newDriveItemKey = processedImage.driveItemKey;
          const newThumbUrl = processedImage.thumbUrl;
          
          // 이미지 교체
          setCurrentImages(prev => {
            const newImages = [...prev];
            newImages[imageIndex] = newThumbUrl;
            console.log(`🖼️ 이미지 ${imageIndex + 1} 배경 제거 완료:`, {
              원본: prev[imageIndex],
              신규: newThumbUrl,
              원본DriveItemKey: driveItemKey,
              신규DriveItemKey: newDriveItemKey
            });
            return newImages;
          });

          // 이미지 메타데이터도 업데이트
          setImageMetadata(prev => {
            const newMetadata = [...prev];
            // 해당 인덱스의 메타데이터 업데이트
            const metaIndex = newMetadata.findIndex(meta => meta.url === imageUrl);
            if (metaIndex >= 0) {
              newMetadata[metaIndex] = {
                url: newThumbUrl,
                driveItemKey: newDriveItemKey
              };
            } else {
              // 새로운 메타데이터 추가
              newMetadata.push({
                url: newThumbUrl,
                driveItemKey: newDriveItemKey
              });
            }
            return newMetadata;
          });
          
          return true; // 성공
        }
      }
      
      return false; // 실패
    } catch (error) {
      console.log(`이미지 ${imageIndex + 1} 배경 제거 오류:`, error);
      return false;
    } finally {
      setImageRemoveLoadingStates(prev => ({ ...prev, [imageIndex]: false }));
    }
  }, [profileId, setCurrentImages, setImageMetadata]);

  // 모든 이미지의 배경 제거 API 호출 함수 (병렬 처리)
  const callRemoveBackgroundAPI = React.useCallback(async () => {
    if (!profileId) {
      addToast({ message: '로그인 후 사용해주세요.' });
      return;
    }

    // 현재 이미지들에서 유효한 이미지와 driveItemKey 수집
    const validImages: Array<{index: number, url: string, driveItemKey: string}> = [];
    
    currentImages.forEach((imageUrl, index) => {
      if (imageUrl && imageUrl !== "" && imageUrl !== "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg") {
        const driveItemKey = getDriveItemKeyByImageUrl(imageUrl);
        if (driveItemKey && !driveItemKey.startsWith('local_')) {
          validImages.push({ index, url: imageUrl, driveItemKey });
        }
      }
    });

    if (validImages.length === 0) {
      addToast({ message: '배경 제거에 필요한 정보가 없습니다.' });
      return;
    }

    console.log(`🖼️ ${validImages.length}개 이미지의 배경 제거 시작:`, validImages);

    try {
      setIsRemoveBackgroundLoading(true);
      
      // 모든 이미지에 대해 병렬로 배경 제거 처리
      const promises = validImages.map(({index, url, driveItemKey}) => 
        removeBackgroundForSingleImage(index, url, driveItemKey)
      );
      
      const results = await Promise.all(promises);
      
      // 성공한 이미지 개수 계산
      const successCount = results.filter(result => result === true).length;
      
      if (successCount > 0) {
        addToast({ message: `${successCount}개 이미지의 배경 제거가 완료되었습니다.` });
      } else {
        showAlert({ message: '배경 제거된 이미지를 찾을 수 없습니다.' });
      }

    } catch (error) {
      console.log('배경 제거 API 호출 오류:', error);
      showAlert({ message: '배경 제거 중 오류가 발생했습니다.' });
    } finally {
      setIsRemoveBackgroundLoading(false);
    }
  }, [profileId, currentImages, getDriveItemKeyByImageUrl, addToast, showAlert, removeBackgroundForSingleImage]);

  // 툴바 아이콘 클릭 핸들러
  const handleToolbarIconClick = (iconIndex: number, data?: any) => {
    console.log(`툴바 아이콘 ${iconIndex} 클릭됨, Grid ${index}`, data);
    
    // 이미지 개수 변경 처리
    if (data && data.action === 'changeImageCount') {
      console.log(`그리드 ${data.gridId}의 이미지 개수를 ${data.count}개로 변경`);
      setImageCount(data.count);
    }
    
    // 사진 배경 제거 처리 (인덱스 3) - 새로운 배경 제거 API 사용
    if (iconIndex === 3) {
      console.log(`그리드 ${index}의 배경 제거 API 호출`);
      callRemoveBackgroundAPI();
      
      // 툴바 숨기기
      handleHideToolbar();
    }
    
    // 사진 틀 삭제 처리 (인덱스 4)
    if (iconIndex === 4) {
      console.log(`사진 틀 삭제 클릭됨 - subject 감소`);
      if (onDecreaseSubject) {
        onDecreaseSubject();
      }
      
      // 툴바 숨기기
      handleHideToolbar();
    }
    
    // 여기에 각 아이콘별 로직 구현
  };

  // hover 타이머 정리
  React.useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  // 전역 클릭 이벤트로 툴바 숨기기
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // 현재 GridAElement 외부 클릭 시 툴바 숨기기
      if (!target.closest(`[data-grid-id="${gridId}"]`) && !target.closest('.grid-edit-toolbar')) {
        // hover 타이머도 정리
        if (hoverTimerRef.current) {
          clearTimeout(hoverTimerRef.current);
          hoverTimerRef.current = null;
        }
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
  
  // 스크롤이나 리사이즈 시 툴바 위치 업데이트
  React.useEffect(() => {
    const updateToolbarPosition = () => {
      if (toolbarState.show && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setToolbarPosition({
          left: rect.left + 8,
          top: rect.bottom + 8
        });
      }
    };

    if (toolbarState.show) {
      // 초기 위치 설정
      updateToolbarPosition();
      
      window.addEventListener('scroll', updateToolbarPosition, true);
      window.addEventListener('resize', updateToolbarPosition);
    }

    return () => {
      window.removeEventListener('scroll', updateToolbarPosition, true);
      window.removeEventListener('resize', updateToolbarPosition);
    };
  }, [toolbarState.show]);

  // 툴바 표시 상태에 따른 border 스타일 결정
  const borderClass = toolbarState.show 
    ? "border-solid border-2 border-primary" 
    : (isSaved ? "border-none" : "border-dashed border border-zinc-400");

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
    const newValue = e.target.value;
    console.log("📝 카테고리 값 변경:", { 이전값: categoryValue, 새값: newValue });
    setCategoryValue(newValue);
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 드래그 관련 키 이벤트 전파 방지
    e.stopPropagation();
    
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

  // 저장 모드에서 LLM 콘텐츠가 없는 경우 레이아웃 영향 없이 시각적으로만 숨김 처리

  return (
    <div className={`relative w-full h-full flex flex-col ${shouldHideInSavedMode ? 'invisible pointer-events-none' : ''}`}>
      <div
        ref={containerRef}
        className={`drag-contents overflow-hidden px-2.5 py-2.5 ${
          isSaved ? 'bg-white' : 'bg-white'
        } rounded-2xl ${containerClass} w-full h-full flex flex-col ${className} gap-y-1.5 ${isDragging ? 'opacity-90' : ''} transition-all duration-200 cursor-grab active:cursor-grabbing`}
        style={style}
        onClick={handleNonImageClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-grid-id={gridId}
        {...dragAttributes}
        {...dragListeners}
      >
        {/* 카테고리 섹션 - 고정 높이 */}
        <div className="flex gap-2.5 text-sm font-bold tracking-tight leading-none text-amber-400 whitespace-nowrap flex-shrink-0 mb-1">
          <div 
            className={`flex overflow-hidden flex-col grow shrink-0 justify-center items-start px-2 py-1 rounded-md border border-solid basis-0 w-fit transition-colors ${
              isSaved ? 'cursor-default bg-white border-transparent' : 'cursor-text hover:bg-gray-50'
            } ${
              isSaved 
                ? 'border-transparent bg-white' 
                : isEditingCategory ? 'border-primary' : 'border-gray-300'
            }`}
            onClick={!isEditingCategory && !isSaved ? handleCategoryClick : undefined}
          >
            {isEditingCategory ? (
              <Input
                type="text"
                value={categoryValue}
                onChange={handleCategoryChange}
                onKeyDown={handleCategoryKeyDown}
                onKeyUp={(e) => e.stopPropagation()} // 키업 이벤트 전파 방지
                onKeyPress={(e) => e.stopPropagation()} // 키프레스 이벤트 전파 방지
                onBlur={handleCategoryBlur}
                onMouseDown={(e) => e.stopPropagation()} // 드래그 이벤트 방지
                onDragStart={(e) => e.preventDefault()} // 드래그 시작 방지
                placeholder="타이틀을 입력해주세요"
                className="text-[16px] font-bold text-primary bg-transparent border-0 p-0 h-auto leading-tight focus:ring-0 focus-visible:ring-0 focus:outline-none focus:border-primary shadow-none min-w-[60px] w-auto placeholder:text-gray-400 focus:text-primary"
                style={{ 
                  borderRadius: '0px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#3b82f6 !important' // primary color 강제 적용
                }}
                autoFocus
                draggable={false} // 드래그 완전 비활성화
              />
            ) : (
              <div 
                className={`text-[16px] leading-tight px-1 py-0.5 rounded transition-colors ${
                  categoryValue ? 'text-primary' : 'text-gray-400'
                }`}
              >
                {categoryValue || "타이틀을 입력해주세요"}
              </div>
            )}
          </div>
        </div>

        {/* 이미지 그리드 - 60% 고정 높이를 차지하는 영역 */}
        {/* 그리드가 2개이고 이미지가 4개일 때: 가로로 4개 일렬 배치 */}
        {gridCount === 2 && imageCount === 4 ? (
          <div 
            ref={dropRef}
            className="flex gap-1 w-full relative"
            style={{ 
              height: '60%',
              backgroundColor: canDrop && isOver ? '#f0f0f0' : 'transparent',
              transition: 'background-color 0.2s ease'
            }}
          >

            {[0, 1, 2, 3].map((imageIndex) => (
              <div 
                key={imageIndex} 
                className="flex-1 h-full"
              >
                <div 
                  className="relative cursor-pointer hover:opacity-80 transition-opacity group w-full h-full"
                  onClick={(e) => {
                    measureImageCellSize(imageIndex);
                    if (!currentImages[imageIndex] || currentImages[imageIndex] === "" || currentImages[imageIndex] === "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg") {
                      handleOpenUploadModal();
                    }
                    handleImageClick(e);
                  }}
                >
                  {currentImages[imageIndex] && currentImages[imageIndex] !== "" && currentImages[imageIndex] !== "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg" ? (
                    <div
                      className="absolute inset-0 overflow-hidden rounded-md cursor-pointer group"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageAdjustClick(imageIndex, currentImages[imageIndex]);
                      }}
                    >
                      <Image
                        src={currentImages[imageIndex]}
                        alt={`Image ${imageIndex + 1}`}
                        fill
                        className="object-cover rounded-md"
                        style={{
                          transform: `translate(${imagePositions[imageIndex]?.x || 0}px, ${imagePositions[imageIndex]?.y || 0}px) scale(${imagePositions[imageIndex]?.scale || 1})`,
                          transformOrigin: 'center'
                        }}
                        data-id={getDriveItemKeyByImageUrl(currentImages[imageIndex])}
                        unoptimized={true}
                      />
                      {/* 개별 이미지 배경 제거 로딩 오버레이 */}
                      {imageRemoveLoadingStates[imageIndex] && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 rounded-md">
                          <div className="flex flex-col items-center gap-1">
                            <Loader size="sm" />
                            <div className="text-white text-xs">배경 제거 중...</div>
                          </div>
                        </div>
                      )}
                      {/* X 삭제 버튼 - isSaved가 true이면 숨김 */}
                      {!isSaved && (
                        <button
                          className="absolute top-1 right-1 bg-white w-5 h-5 rounded-full flex items-center justify-center border border-solid border-[#F0F0F0]"
                          onClick={(e) => handleImageDelete(imageIndex, e)}
                          title="이미지 삭제"
                        >
                          <IoClose className="w-4 h-4 text-black" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <Image
                        src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg"
                        alt="No image"
                        fill
                        className="object-cover rounded-md"
                        unoptimized={true}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-40 rounded-md flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                        <Image
                          src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/imageupload3.svg"
                          width={20}
                          height={20}
                          className="object-cover mb-2"
                          alt="Upload icon"
                          unoptimized={true}
                        />
                        <div className="text-white text-[8px] font-medium text-center mb-2 px-1">
                          이미지를 드래그하거나<br />클릭하여 업로드
                        </div>
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
            ))}
          </div>
        ) : 
        /* 그리드가 2개이고 이미지가 3개일 때: 가로로 3개 일렬 배치 */
        gridCount === 2 && imageCount === 3 ? (
          <div 
            ref={dropRef} 
            className="flex gap-1 w-full relative"
            style={{ 
              height: '60%',
              backgroundColor: canDrop && isOver ? '#f0f0f0' : 'transparent',
              transition: 'background-color 0.2s ease'
            }}
          >

            {[0, 1, 2].map((imageIndex) => (
              <div 
                key={imageIndex} 
                className="flex-1 h-full"
              >
                <div 
                  className="relative cursor-pointer hover:opacity-80 transition-opacity group w-full h-full"
                  onClick={(e) => {
                    measureImageCellSize(imageIndex);
                    if (!currentImages[imageIndex] || currentImages[imageIndex] === "" || currentImages[imageIndex] === "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg") {
                      handleOpenUploadModal();
                    }
                    handleImageClick(e);
                  }}
                >
                  {currentImages[imageIndex] && currentImages[imageIndex] !== "" && currentImages[imageIndex] !== "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg" ? (
                    <div
                      className="absolute inset-0 overflow-hidden rounded-md cursor-pointer group"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageAdjustClick(imageIndex, currentImages[imageIndex]);
                      }}
                    >
                      <Image
                        src={currentImages[imageIndex]}
                        alt={`Image ${imageIndex + 1}`}
                        fill
                        className="object-cover rounded-md"
                        style={{
                          transform: `translate(${imagePositions[imageIndex]?.x || 0}px, ${imagePositions[imageIndex]?.y || 0}px) scale(${imagePositions[imageIndex]?.scale || 1})`,
                          transformOrigin: 'center'
                        }}
                        data-id={getDriveItemKeyByImageUrl(currentImages[imageIndex])}
                        unoptimized={true}
                      />
                      {/* 개별 이미지 배경 제거 로딩 오버레이 */}
                      {imageRemoveLoadingStates[imageIndex] && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 rounded-md">
                          <div className="flex flex-col items-center gap-1">
                            <Loader size="sm" />
                            <div className="text-white text-xs">배경 제거 중...</div>
                          </div>
                        </div>
                      )}
                      {/* X 삭제 버튼 - isSaved가 true이면 숨김 */}
                      {!isSaved && (
                        <button
                          className="absolute top-1 right-1 bg-white w-5 h-5 rounded-full flex items-center justify-center border border-solid border-[#F0F0F0]"
                          onClick={(e) => handleImageDelete(imageIndex, e)}
                          title="이미지 삭제"
                        >
                          <IoClose className="w-4 h-4 text-black" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <Image
                        src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg"
                        alt="No image"
                        fill
                        className="object-cover rounded-md"
                        unoptimized={true}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-40 rounded-md flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                        <Image
                          src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/imageupload3.svg"
                          width={20}
                          height={20}
                          className="object-cover mb-2"
                          alt="Upload icon"
                          unoptimized={true}
                        />
                        <div className="text-white text-[8px] font-medium text-center mb-2 px-1">
                          이미지를 드래그하거나<br />클릭하여 업로드
                        </div>
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
            ))}
          </div>
        ) : 
        /* 작은 그리드이고 이미지가 3개일 때는 flex 레이아웃 사용 (기존 로직) */
        cardType === 'small' && imageCount === 3 ? (
          <div 
            ref={dropRef} 
            className="flex gap-1 w-full relative"
            style={{ 
              height: '60%',
              backgroundColor: canDrop && isOver ? '#f0f0f0' : 'transparent',
              transition: 'background-color 0.2s ease'
            }}
          >

            {(() => {
              console.log("🎨 3개 이미지 특별 레이아웃 렌더링:", {
                cardType,
                imageCount,
                currentImages,
                currentImagesLength: currentImages.length,
                첫번째: currentImages[0],
                두번째: currentImages[1],
                세번째: currentImages[2]
              });
              return null;
            })()}
            {/* 왼쪽: 첫 번째 이미지 */}
            <div className="flex-1 h-full">
              <div 
                className="relative cursor-pointer hover:opacity-80 transition-opacity group w-full h-full"
                onClick={(e) => {
                  measureImageCellSize(0);
                  if (!currentImages[0] || currentImages[0] === "" || currentImages[0] === "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg") {
                    handleOpenUploadModal();
                  }
                  handleImageClick(e);
                }}
              >
                {currentImages[0] && currentImages[0] !== "" && currentImages[0] !== "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg" ? (
                  <div
                    className="absolute inset-0 overflow-hidden rounded-md cursor-pointer "
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageAdjustClick(0, currentImages[0]);
                    }}
                  >
                                          <Image
                        src={currentImages[0]}
                        alt="Image 1"
                        fill
                        className="object-cover rounded-md"
                        style={{
                          transform: `translate(${imagePositions[0]?.x || 0}px, ${imagePositions[0]?.y || 0}px) scale(${imagePositions[0]?.scale || 1})`,
                          transformOrigin: 'center'
                        }}
                        data-id={getDriveItemKeyByImageUrl(currentImages[0])}
                        unoptimized={true}
                      />
                      {/* 개별 이미지 배경 제거 로딩 오버레이 */}
                      {imageRemoveLoadingStates[0] && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 rounded-md">
                          <div className="flex flex-col items-center gap-1">
                            <Loader size="sm" />
                            <div className="text-white text-xs">배경 제거 중...</div>
                          </div>
                        </div>
                      )}
                      {/* X 삭제 버튼 - isSaved가 true이면 숨김 */}
                      {!isSaved && (
                        <button
                          className="absolute top-1 right-1 bg-white w-5 h-5 rounded-full flex items-center justify-center border border-solid border-[#F0F0F0]"
                          onClick={(e) => handleImageDelete(0, e)}
                          title="이미지 삭제"
                        >
                          <IoClose className="w-4 h-4 text-black" />
                        </button>
                      )}
                    {/* 메모 인디케이터 */}
                    <MemoIndicator 
                      show={Boolean(getDriveItemKeyByImageUrl(currentImages[0]) && memoStatuses[getDriveItemKeyByImageUrl(currentImages[0]) || ''])}
                      driveItemKey={getDriveItemKeyByImageUrl(currentImages[0])}
                      onMemoClick={() => {
                        const driveItemKey = getDriveItemKeyByImageUrl(currentImages[0]);
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
                      unoptimized={true}
                    />
                    {/* Black overlay - 이미지가 없을 때만 표시 */}
                    <div className="absolute inset-0 bg-black bg-opacity-40 rounded-md flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                      <Image
                        src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/imageupload3.svg"
                        width={20}
                        height={20}
                        className="object-cover mb-2"
                        alt="Upload icon"
                        unoptimized={true}
                      />
                      <div className="text-white text-[8px] font-medium text-center mb-2 px-1">
                        이미지를 드래그하거나<br />클릭하여 업로드
                      </div>
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
            
            {/* 오른쪽: 두 번째, 세 번째 이미지를 위아래로 */}
            <div className="flex-1 flex flex-col gap-1 h-full">
              {/* 두 번째 이미지 */}
              <div className="flex-1 h-full">
                <div 
                  className="relative cursor-pointer hover:opacity-80 transition-opacity group w-full h-full"
                  onClick={(e) => {
                    measureImageCellSize(1);
                    if (!currentImages[1] || currentImages[1] === "" || currentImages[1] === "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg") {
                      handleOpenUploadModal();
                    }
                    handleImageClick(e);
                  }}
                >
                  {currentImages[1] && currentImages[1] !== "" && currentImages[1] !== "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg" ? (
                    <div
                      className="absolute inset-0 overflow-hidden rounded-md cursor-pointer group"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageAdjustClick(1, currentImages[1]);
                      }}
                    >
                      <Image
                        src={currentImages[1]}
                        alt="Image 2"
                        fill
                        className="object-cover rounded-md"
                        style={{
                          transform: `translate(${imagePositions[1]?.x || 0}px, ${imagePositions[1]?.y || 0}px) scale(${imagePositions[1]?.scale || 1})`,
                          transformOrigin: 'center'
                        }}
                        data-id={getDriveItemKeyByImageUrl(currentImages[1])}
                        unoptimized={true}
                      />
                      {/* 개별 이미지 배경 제거 로딩 오버레이 */}
                      {imageRemoveLoadingStates[1] && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 rounded-md">
                          <div className="flex flex-col items-center gap-1">
                            <Loader size="sm" />
                            <div className="text-white text-xs">배경 제거 중...</div>
                          </div>
                        </div>
                      )}
                      {/* X 삭제 버튼 - isSaved가 true이면 숨김 */}
                      {!isSaved && (
                        <button
                          className="absolute top-1 right-1 bg-white w-5 h-5 rounded-full flex items-center justify-center border border-solid border-[#F0F0F0]"
                          onClick={(e) => handleImageDelete(1, e)}
                          title="이미지 삭제"
                        >
                          <IoClose className="w-4 h-4 text-black" />
                        </button>
                      )}
                      {/* 메모 인디케이터 */}
                      <MemoIndicator 
                        show={Boolean(getDriveItemKeyByImageUrl(currentImages[1]) && memoStatuses[getDriveItemKeyByImageUrl(currentImages[1]) || ''])}
                        driveItemKey={getDriveItemKeyByImageUrl(currentImages[1])}
                        onMemoClick={() => {
                          const driveItemKey = getDriveItemKeyByImageUrl(currentImages[1]);
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
                        unoptimized={true}
                      />
                      {/* Black overlay - 이미지가 없을 때만 표시 */}
                      <div className="absolute inset-0 bg-black bg-opacity-40 rounded-md flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                        <Image
                          src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/imageupload3.svg"
                          width={20}
                          height={20}
                          className="object-contain mb-2"
                          alt="Upload icon"
                          unoptimized={true}
                        />
                        <div className="text-white text-[8px] font-medium text-center mb-2 px-1">
                          이미지를 드래그하거나<br />클릭하여 업로드
                        </div>
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
              
              {/* 세 번째 이미지 */}
              <div className="flex-1 h-full">
                <div 
                  className="relative cursor-pointer hover:opacity-80 transition-opacity group w-full h-full"
                  onClick={(e) => {
                    measureImageCellSize(2);
                    if (!currentImages[2] || currentImages[2] === "" || currentImages[2] === "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg") {
                      handleOpenUploadModal();
                    }
                    handleImageClick(e);
                  }}
                >
                  {currentImages[2] && currentImages[2] !== "" && currentImages[2] !== "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg" ? (
                    <div
                      className="absolute inset-0 overflow-hidden rounded-md cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageAdjustClick(2, currentImages[2]);
                      }}
                    >
                      <Image
                        src={currentImages[2]}
                        alt="Image 3"
                        fill
                        className="object-cover rounded-md"
                        style={{
                          transform: `translate(${imagePositions[2]?.x || 0}px, ${imagePositions[2]?.y || 0}px) scale(${imagePositions[2]?.scale || 1})`,
                          transformOrigin: 'center'
                        }}
                        data-id={getDriveItemKeyByImageUrl(currentImages[2])}
                        unoptimized={true}
                      />
                      {/* 개별 이미지 배경 제거 로딩 오버레이 */}
                      {imageRemoveLoadingStates[2] && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 rounded-md">
                          <div className="flex flex-col items-center gap-1">
                            <Loader size="sm" />
                            <div className="text-white text-xs">배경 제거 중...</div>
                          </div>
                        </div>
                      )}
                      {/* X 삭제 버튼 - isSaved가 true이면 숨김 */}
                      {!isSaved && (
                        <button
                          className="absolute top-1 right-1 bg-white w-5 h-5 rounded-full flex items-center justify-center border border-solid border-[#F0F0F0]"
                          onClick={(e) => handleImageDelete(2, e)}
                          title="이미지 삭제"
                        >
                          <IoClose className="w-4 h-4 text-black" />
                        </button>
                      )}
                      {/* 메모 인디케이터 */}
                      <MemoIndicator 
                        show={Boolean(getDriveItemKeyByImageUrl(currentImages[2]) && memoStatuses[getDriveItemKeyByImageUrl(currentImages[2]) || ''])}
                        driveItemKey={getDriveItemKeyByImageUrl(currentImages[2])}
                        onMemoClick={() => {
                          const driveItemKey = getDriveItemKeyByImageUrl(currentImages[2]);
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
                        unoptimized={true}
                      />
                      {/* Black overlay - 이미지가 없을 때만 표시 */}
                      <div className="absolute inset-0 bg-black bg-opacity-40 rounded-md flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                        <Image
                          src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/imageupload3.svg"
                          width={20}
                          height={20}
                          className="object-contain mb-2"
                          alt="Upload icon"
                          unoptimized={true}
                        />
                        <div className="text-white text-[8px] font-medium text-center mb-2 px-1">
                          이미지를 드래그하거나<br />클릭하여 업로드
                        </div>
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
            </div>
          </div>
        ) : (
          // 기존 그리드 레이아웃 - 60% 고정 높이 적용
          <div 
            ref={dropRef}
            className={`grid gap-1 w-full relative ${
              isWideCard
                ? `${getImageGridClass(imageCount, cardType)}` // col-span-2인 경우 이미지 개수에 따라 배치
                : cardType === 'large' 
                  ? `${getImageGridClass(imageCount, cardType)}` // large 카드는 이미지 개수에 따라 배치
                  : `${getImageGridClass(imageCount, cardType)}` // small 카드도 이미지 개수에 따라 배치
            }`}
            style={{ 
              height: '60%',
              backgroundColor: canDrop && isOver ? '#f0f0f0' : 'transparent',
              transition: 'background-color 0.2s ease'
            }}>

            {(() => {
              const imagesToRender = currentImages.slice(0, imageCount);
              console.log("🎨 일반 그리드 렌더링:", {
                cardType,
                imageCount,
                currentImages,
                imagesToRender,
                gridClass: getImageGridClass(imageCount, cardType)
              });
              return imagesToRender;
            })().map((imageSrc, index) => (
              <div 
                key={index}
                className="w-full h-full"
              >
                <div 
                  className="relative cursor-pointer hover:opacity-80 transition-opacity group w-full h-full"
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
                        unoptimized={true}
                      />
                      {/* 개별 이미지 배경 제거 로딩 오버레이 */}
                      {imageRemoveLoadingStates[index] && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 rounded-md">
                          <div className="flex flex-col items-center gap-1">
                            <Loader size="sm" />
                            <div className="text-white text-xs">배경 제거 중...</div>
                          </div>
                        </div>
                      )}
                      {/* X 삭제 버튼 - isSaved가 true이면 숨김 */}
                      {!isSaved && (
                        <button
                          className="absolute top-1 right-1 bg-white w-5 h-5 rounded-full flex items-center justify-center border border-solid border-[#F0F0F0]"
                          onClick={(e) => handleImageDelete(index, e)}
                          title="이미지 삭제"
                        >
                          <IoClose className="w-4 h-4 text-black" />
                        </button>
                      )}
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
                        unoptimized={true}
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
                          unoptimized={true}
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
            ))}
          </div>
        )}

        {/* 하단 입력 영역 - 남은 공간(약 40%)을 차지 */}
        {console.log("렌더링 시점 isDescriptionExpanded:", isDescriptionExpanded)}
        {isLoading ? (
          // 로딩 중일 때
          <div className={`description-area gap-y-3 flex flex-col items-center justify-center px-2 py-2 w-full leading-none ${
            isSaved && hasAiGeneratedContent ? 'bg-white' : 'bg-white'
          } rounded-md border border-dashed border-zinc-400 min-h-[90px] flex-1 mt-1`}>
            <Loader size="default" />
            <div className="text-[#B4B4B4] text-xs">내용을 생성중입니다...</div>
          </div>
        ) : isDescriptionExpanded ? (
          // 확장된 textarea 모드
          <div className={`description-area flex overflow-hidden flex-col px-2 py-2 w-full leading-none ${
            isSaved ? 'bg-white' : 'bg-white'
          } rounded-md min-h-[90px] flex-1 mt-1 relative transition-colors ${
            isSaved ? 'border-none' : (isTextareaFocused ? 'border border-solid border-primary' : 'border border-dashed border-zinc-400')
          }`}>
            {/* 상단 버튼들 - 우측 상단 (저장 상태가 아닐 때만 표시) */}
            {!isSaved && (
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
                    unoptimized={true}
                  />
                </button>
                
                
              </div>
            )}
            
            {/* 저장 상태일 때는 읽기 전용 텍스트, 편집 상태일 때는 textarea */}
            {isSaved ? (
              <div className="w-full h-full px-2 py-1 text-xs tracking-tight text-zinc-600 flex-1 overflow-auto"
                style={{ 
                  fontSize: '12px', 
                  lineHeight: '1.4', 
                  minHeight: '74px'
                }}
              >
                {inputValue || ''}
              </div>
            ) : (
              <textarea
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => setIsTextareaFocused(true)}
                onBlur={() => setIsTextareaFocused(false)}
                onMouseDown={(e) => e.stopPropagation()} // 드래그 이벤트 방지
                onDragStart={(e) => e.preventDefault()} // 드래그 시작 방지
                onKeyDown={(e) => e.stopPropagation()} // 키보드 이벤트 전파 방지 (스페이스바 포함)
                onKeyUp={(e) => e.stopPropagation()} // 키업 이벤트 전파 방지
                onKeyPress={(e) => e.stopPropagation()} // 키프레스 이벤트 전파 방지
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
                draggable={false} // 드래그 완전 비활성화
              />
            )}
            
            {/* 글자수 카운팅 - 우측하단 (저장 상태가 아닐 때만 표시) */}
            {!isSaved && hasClickedAIGenerate && (
              <div className="absolute bottom-2 right-3 text-[9px] font-medium text-primary">
                ({inputValue.length}/200)
              </div>
            )}
          </div>
        ) : (
          // 기본 모드
          <div className={`description-area flex overflow-hidden flex-col px-2 py-2 w-full leading-none ${
            isSaved ? 'bg-white' : 'bg-white'
          } rounded-md ${
            isSaved ? 'border-none' : 'border border-dashed border-zinc-400'
          } min-h-[90px] flex-1 mt-1 relative`}>
            {/* 삭제 버튼 - 우측 상단 (저장 상태가 아닐 때만 표시) */}
            {onDelete && !isSaved && (
              <button
                onClick={handleDelete}
                className="absolute top-2 right-2 w-5 h-5  bg-white border border-[#F0F0F0] rounded-full flex items-center justify-center z-20 hover:bg-red-50 transition-colors"
                title="카드 삭제"
              >
                <IoClose className="w-[7.5px] h-[7.5px] text-black" />
              </button>
            )}
            
            {/* 저장 상태일 때는 읽기 전용 텍스트 표시, 편집 상태일 때는 입력 영역 표시 */}
            {isSaved ? (
              inputValue && (
                <div className="w-full mb-1.5 px-2 py-1 text-xs tracking-tight text-zinc-600 min-h-[26px]">
                  {inputValue}
                </div>
              )
            ) : (
              <div className="flex gap-1.5 w-full mb-1.5"> 
                <Input
                  value={inputValue}
                  onChange={handleInputChange}
                  onMouseDown={(e) => e.stopPropagation()} // 드래그 이벤트 방지
                  onDragStart={(e) => e.preventDefault()} // 드래그 시작 방지
                  onKeyDown={(e) => e.stopPropagation()} // 키보드 이벤트 전파 방지 (스페이스바 포함)
                  onKeyUp={(e) => e.stopPropagation()} // 키업 이벤트 전파 방지
                  onKeyPress={(e) => e.stopPropagation()} // 키프레스 이벤트 전파 방지
                  placeholder={placeholderText}
                  className="h-[26px] min-h-[26px] max-h-[26px] px-2 py-1 text-xs tracking-tight bg-white border border-dashed border-zinc-400 text-zinc-600 placeholder-zinc-400 flex-1 shadow-none rounded-md focus:ring-0 focus:outline-none focus:border-primary resize-none"
                  style={{ borderRadius: '6px', fontSize: '10px', lineHeight: '1.2' }}
                  onClick={handleImageClick}
                  draggable={false} // 드래그 완전 비활성화
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
                    unoptimized={true}
                  />
                </button>
              </div>
            )}
            
            {/* AI 생성 버튼 - 별도 줄에 배치 (저장 상태가 아닐 때만 표시) */}
            {!isSaved && (
              <div className="flex w-full mb-1.5 justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // 이벤트 전파 방지
                    handleAIGenerate();
                  }}
                  disabled={(() => {
                    const hasValidCategory = categoryValue && categoryValue.trim() !== "" && categoryValue !== "타이틀을 입력해주세요";
                    const hasImages = getCurrentImageCount() > 0;
                    const isNotLoading = !isLoading;
                    const disabled = !hasValidCategory || !hasImages || !isNotLoading;
                    
                    console.log("🔘 AI 생성 버튼 상태:", {
                      hasValidCategory,
                      hasImages,
                      isNotLoading,
                      disabled,
                      categoryValue,
                      imageCount: getCurrentImageCount()
                    });
                    
                    return disabled;
                  })()}
                  className={`flex overflow-hidden gap-0.5 text-xs font-semibold tracking-tight rounded-md flex justify-center items-center w-[54px] h-[26px] self-start transition-all ${
                    (() => {
                      const hasValidCategory = categoryValue && categoryValue.trim() !== "" && categoryValue !== "타이틀을 입력해주세요";
                      const hasImages = getCurrentImageCount() > 0;
                      const isNotLoading = !isLoading;
                      return (!hasValidCategory || !hasImages || !isNotLoading)
                        ? 'cursor-not-allowed bg-gray-400 text-gray-300' 
                        : 'text-white bg-gradient-to-r from-[#FA8C3D] via-[#FF8560] to-[#FAB83D] hover:opacity-90';
                    })()
                  }`}
                >
                  {isLoading ? (
                    <Loader size="sm" className="text-white" />
                  ) : (
                    <>
                      <Image
                        src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/leaf.svg"
                        className={`object-contain ${(() => {
                          const hasValidCategory = categoryValue && categoryValue.trim() !== "" && categoryValue !== "타이틀을 입력해주세요";
                          const hasImages = getCurrentImageCount() > 0;
                          return (!hasValidCategory || !hasImages) ? 'opacity-50' : '';
                        })()}`}
                        width={11}
                        height={11}
                        alt="AI icon"
                        unoptimized={true}
                      />
                      <div className="text-[10px] tracking-[-0.03em]">AI 생성</div>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* 글자수 카운팅 - 우측하단 (저장 상태가 아닐 때만 표시) */}
            {!isSaved && hasClickedAIGenerate && (
              <div className="absolute bottom-2 right-3 text-[9px] font-medium text-primary">
                ({inputValue.length}/200)
              </div>
            )}



            
          </div>
        )}

        {children && <div className="mt-1 flex-shrink-0">{children}</div>}
      </div>
      
      {/* GridEditToolbar - Portal로 렌더링하여 최상위에 위치 */}
      {toolbarState.show && typeof window !== 'undefined' && ReactDOM.createPortal(
        <div 
          className="grid-edit-toolbar fixed"
          style={{
            zIndex: 9999,
            pointerEvents: 'auto',
            left: toolbarPosition.left,
            top: toolbarPosition.top,
          }}
          onMouseEnter={() => {
            console.log("🟡 Toolbar Mouse Enter");
            // 툴바에 hover하면 타이머 취소하고 hover 상태 유지
            if (hoverTimerRef.current) {
              clearTimeout(hoverTimerRef.current);
              hoverTimerRef.current = null;
            }
            isHoveredRef.current = true;
          }}
          onMouseLeave={() => {
            console.log("🟠 Toolbar Mouse Leave");
            // 툴바에서 벗어나면 다시 타이머 시작
            isHoveredRef.current = false;
            const timer = setTimeout(() => {
              if (!isHoveredRef.current) {
                console.log("✅ Hiding toolbar after leaving toolbar");
                setToolbarState({
                  show: false,
                  isExpanded: false,
                });
              }
              hoverTimerRef.current = null;
            }, 3000);
            hoverTimerRef.current = timer;
          }}
        >
          <GridEditToolbar
            show={toolbarState.show}
            isExpanded={toolbarState.isExpanded}
            position={{ left: "0", top: "0" }}
            onIconClick={handleToolbarIconClick}
            targetGridId={gridId}
          />
        </div>,
        document.body
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
          isMultiUpload
          allowsFileTypes={['IMAGE']}
          isUploadS3
          isReturnS3UploadedItemData
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

export default GridAElement;