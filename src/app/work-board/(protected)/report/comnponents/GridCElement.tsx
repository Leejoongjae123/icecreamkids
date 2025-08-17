"use client";
import * as React from "react";
import * as ReactDOM from "react-dom";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";

import { ChevronDown } from "lucide-react";
import AddPictureClipping from "./AddPictureClipping";
import KonvaImageCanvas, { KonvaImageCanvasRef } from "./KonvaImageCanvas";
import GridEditToolbar from "./GridEditToolbar";
import { ClipPathItem } from "../dummy/types";
import {IoClose} from "react-icons/io5";
import useKeywordStore from "@/hooks/store/useKeywordStore";
import useUserStore from "@/hooks/store/useUserStore";
import useGridCStore from "@/hooks/store/useGridCStore";
import useKeywordExpansionStore from "@/hooks/store/useKeywordExpansionStore";

interface GridCElementProps {
  index: number;
  gridId: string;
  clipPathData: ClipPathItem;
  imageUrl: string;
  isClippingEnabled: boolean;
  isDragging?: boolean;
  dragAttributes?: any;
  dragListeners?: any;
  isSelected?: boolean;
  onSelectChange?: (isSelected: boolean) => void;
  onDelete?: () => void;
  onImageUpload: (gridId: string, imageUrl: string) => void;
  onClipPathChange?: (gridId: string, clipPathData: ClipPathItem) => void;
  onIntegratedUpload?: () => void; // 통합 업로드 핸들러
}

function GridCElement({
  index,
  gridId,
  clipPathData,
  imageUrl,
  isClippingEnabled,
  isDragging = false,
  dragAttributes,
  dragListeners,
  isSelected = false,
  onSelectChange,
  onDelete,
  onImageUpload,
  onClipPathChange,
  onIntegratedUpload,
}: GridCElementProps) {
  const [activityKeyword, setActivityKeyword] = React.useState("");
  const [isInputFocused, setIsInputFocused] = React.useState(false);
  const [selectedKeywords, setSelectedKeywords] = React.useState<string[]>([]);
  const [currentImageUrl, setCurrentImageUrl] = React.useState<string>(imageUrl);
  const [isHovered, setIsHovered] = React.useState(false);
  
  // 사용자 정보 가져오기
  const { userInfo } = useUserStore();
  const accountId = React.useMemo(() => userInfo?.accountId || null, [userInfo?.accountId]);
  
  // 메모 상태 관리
  const [memoStatus, setMemoStatus] = React.useState<boolean>(false);
  
  // 전역 키워드 store 사용
  const { recommendedKeywords, loadKeywords, addKeyword } = useKeywordStore();
  
  // 키워드 확장 상태 전역 store 사용
  const { isExpanded, expandOnlyOne, setExpanded } = useKeywordExpansionStore();
  const isRecommendedKeywordsExpanded = isExpanded(gridId);
  
  // placeholder 이미지 URL
  const NO_IMAGE_URL = "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg";


  
  // 이미지 메타데이터 상태 (driveItemKey 포함)
  const [imageMetadata, setImageMetadata] = React.useState<{url: string, driveItemKey?: string}[]>([]);
  const { setImage, setKeyword, remove } = useGridCStore();

  // KonvaImageCanvas ref
  const konvaCanvasRef = React.useRef<KonvaImageCanvasRef>(null);
  
  // canvas-container ref 및 크기 상태
  const canvasContainerRef = React.useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = React.useState<{ width: number; height: number }>({ width: 0, height: 0 });
  
  // photo-description-input ref 및 높이 상태
  const photoDescriptionRef = React.useRef<HTMLDivElement>(null);
  const [photoDescriptionHeight, setPhotoDescriptionHeight] = React.useState<number>(0);

  // 이미지 변환 정보 상태 (위치, 스케일 동기화용)
  const [imageTransformData, setImageTransformData] = React.useState<{
    x: number;
    y: number;
    scale: number;
    width: number;
    height: number;
  } | null>(null);

  // 툴바 상태 관리
  const [toolbarState, setToolbarState] = React.useState({
    show: false,
    isExpanded: false,
  });
  
  // 그리드 개별 클리핑 해제 상태 (true면 이 그리드만 클리핑 해제)
  const [isLocalClippingDisabled, setIsLocalClippingDisabled] = React.useState<boolean>(false);
  // 전역 설정과 개별 해제 상태를 합쳐서 실제 적용 여부 계산
  const effectiveClippingEnabled = isClippingEnabled && !isLocalClippingDisabled;
  
  // 더블클릭 편집 진입 시 외부 영역 어둡게 오버레이용 rect 상태 (뷰포트 기준 여백)
  const [overlayRect, setOverlayRect] = React.useState<{
    top: number;
    left: number;
    right: number;
    bottom: number;
    radius?: number;
  } | null>(null);
  
  // 툴바 위치 상태
  const [toolbarPosition, setToolbarPosition] = React.useState({ left: 0, top: 0 });

  // 이미지가 있는지 확인하는 헬퍼 함수
  const hasImage = currentImageUrl && currentImageUrl !== NO_IMAGE_URL;

  // 이미지 URL로 driveItemKey 찾기
  const getDriveItemKeyByImageUrl = React.useCallback((imageUrl: string): string | undefined => {
    const metadata = imageMetadata.find(item => item.url === imageUrl);
    return metadata?.driveItemKey;
  }, [imageMetadata]);

  // 현재 이미지의 driveItemKey 가져오기 (type-c create-record API 호출용)
  const getCurrentImageDataId = React.useCallback((): string | undefined => {
    if (hasImage) {
      const dataId = getDriveItemKeyByImageUrl(currentImageUrl);
      console.log("🔍 GridC getCurrentImageDataId:", {
        gridId,
        currentImageUrl,
        dataId,
        hasImage
      });
      return dataId;
    }
    return undefined;
  }, [hasImage, currentImageUrl, getDriveItemKeyByImageUrl, gridId]);

  // 메모 상태 체크
  const checkMemoStatus = React.useCallback(async (driveItemKey: string) => {
    if (!accountId || driveItemKey.startsWith('local_')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/file/v1/drive-items/${driveItemKey}/memos?owner_account_id=${accountId}`,
        {
          method: 'GET',
          headers: { 'accept': '*/*' },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const memoExists = Array.isArray(data.result) ? data.result.length > 0 : false;
        setMemoStatus(memoExists);
      }
    } catch (error) {
      console.log('메모 체크 실패:', error);
    }
  }, [accountId]);



  // 컨테이너 클릭 핸들러 - 툴바 표시
  const handleContainerClick = (event: React.MouseEvent) => {
    event.stopPropagation(); 

    // 클리핑이 활성화되어 있을 때만 툴바 표시 (개별 해제 상태 고려)
    if (effectiveClippingEnabled) {
      // 툴바 표시 전에 현재 이미지 상태를 저장
      if (konvaCanvasRef.current) {
        const currentImageData = konvaCanvasRef.current.getImageData();
        if (currentImageData) {
          console.log("툴바 표시 전 현재 이미지 상태 저장:", currentImageData);
          setImageTransformData({
            x: currentImageData.x,
            y: currentImageData.y,
            scale: currentImageData.scale,
            width: currentImageData.width,
            height: currentImageData.height
          });
        }
      }
      
      // 툴바 위치 업데이트
      if (canvasContainerRef.current) {
        const rect = canvasContainerRef.current.getBoundingClientRect();
        setToolbarPosition({
          left: rect.left + 8,
          top: rect.bottom + 8
        });
      }

      setToolbarState({
        show: true,
        isExpanded: true,
      });
    }
  };

  // 더블클릭 시 해당 그리드만 클리핑 해제하고 편집 모드 진입
  const handleDoubleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (hasImage) {
      setIsLocalClippingDisabled(true);
      setToolbarState({ show: false, isExpanded: false });
    }
  };

  // 수정 완료: 해당 그리드의 로컬 클리핑 해제 상태를 복구하여 편집 모드 종료
  const handleFinishEdit = React.useCallback(() => {
    setIsLocalClippingDisabled(false);
    setOverlayRect(null);
  }, []);

  // 더블클릭 편집 진입 시 현재 캔버스 영역을 제외한 화면을 어둡게 처리하기 위한 오버레이 위치 계산
  const outerContainerRef = React.useRef<HTMLDivElement>(null);

  const updateOverlayRect = React.useCallback(() => {
    if (typeof window === 'undefined') return;
    const el = outerContainerRef.current || canvasContainerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const viewportWidth = window.innerWidth || 0;
    const viewportHeight = window.innerHeight || 0;
    const top = Math.max(0, rect.top);
    const left = Math.max(0, rect.left);
    const right = Math.max(0, viewportWidth - rect.right);
    const bottom = Math.max(0, viewportHeight - rect.bottom);

    let radius = 0;
    try {
      const style = window.getComputedStyle(el);
      const parsePx = (v: string) => (v && v.endsWith('px') ? parseFloat(v) : 0);
      const rTL = parsePx(style.borderTopLeftRadius);
      const rTR = parsePx(style.borderTopRightRadius);
      const rBL = parsePx(style.borderBottomLeftRadius);
      const rBR = parsePx(style.borderBottomRightRadius);
      radius = Math.max(rTL, rTR, rBL, rBR);
    } catch (_) {}

    setOverlayRect({ top, left, right, bottom, radius });
  }, []);

  // 오버레이 위치 갱신: 편집 진입/스크롤/리사이즈 시 따라가도록 처리
  React.useEffect(() => {
    if (!isLocalClippingDisabled) return;
    updateOverlayRect();
    const handle = () => updateOverlayRect();
    window.addEventListener('resize', handle);
    window.addEventListener('scroll', handle, true);
    return () => {
      window.removeEventListener('resize', handle);
      window.removeEventListener('scroll', handle, true);
    };
  }, [isLocalClippingDisabled, updateOverlayRect]);

  // 체크박스 변경 핸들러
  const handleCheckboxChange = (checked: boolean | "indeterminate") => {
    if (onSelectChange && typeof checked === "boolean") {
      onSelectChange(checked);
      
      // 체크박스가 선택되면 해당 아이템만 키워드 영역 펼치고 나머지는 축소
      if (checked) {
        expandOnlyOne(gridId);
      } else {
        setExpanded(gridId, false);
      }
    }
  };

  // 삭제 핸들러
  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  // 개별 이미지 삭제 핸들러
  const handleImageDelete = (event: React.MouseEvent) => {
    event.stopPropagation(); // 이벤트 전파 방지
    
    console.log("🗑️ GridC 이미지 삭제:", {
      gridId,
      이전이미지: currentImageUrl
    });
    
    // 현재 이미지 URL 초기화
    setCurrentImageUrl("");
    
    // 이미지 메타데이터 초기화
    setImageMetadata([]);
    try {
      remove(gridId);
    } catch (_) {}
    
    // 이미지 변환 데이터 초기화
    setImageTransformData(null);
    
    // 부모 컴포넌트에 이미지 제거 알림
    if (onImageUpload) {
      onImageUpload(gridId, "");
    }
  };

  // 이미지 URL 변경 감지
  React.useEffect(() => {
    setCurrentImageUrl(imageUrl);
  }, [imageUrl]);

  // 이미지 메타데이터 변경 시 메모 상태 체크
  React.useEffect(() => {
    if (imageMetadata.length > 0 && accountId) {
      const currentMetadata = imageMetadata[0]; // GridC는 단일 이미지
      if (currentMetadata?.driveItemKey) {
        checkMemoStatus(currentMetadata.driveItemKey);
      }
    } else {
      setMemoStatus(false);
    }
  }, [imageMetadata, accountId, checkMemoStatus]);

  // canvas-container 크기 감지
  React.useEffect(() => {
    const updateContainerSize = () => {
      if (canvasContainerRef.current) {
        const rect = canvasContainerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setContainerSize({ width: rect.width, height: rect.height });
        }
      }
    };

    // 초기 크기 설정
    updateContainerSize();

    // ResizeObserver를 사용하여 크기 변화 감지
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerSize({ width, height });
        }
      }
    });

    if (canvasContainerRef.current) {
      resizeObserver.observe(canvasContainerRef.current);
    }

    // window resize 이벤트도 처리
    window.addEventListener('resize', updateContainerSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateContainerSize);
    };
  }, []);

  // photo-description-input 높이 감지
  React.useEffect(() => {
    const updatePhotoDescriptionHeight = () => {
      if (photoDescriptionRef.current) {
        const rect = photoDescriptionRef.current.getBoundingClientRect();
        setPhotoDescriptionHeight(rect.height);
      }
    };

    // 초기 높이 설정
    updatePhotoDescriptionHeight();

    // ResizeObserver를 사용하여 높이 변화 감지
    const resizeObserver = new ResizeObserver(() => {
      updatePhotoDescriptionHeight();
    });

    if (photoDescriptionRef.current) {
      resizeObserver.observe(photoDescriptionRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [isSelected]); // isSelected가 변경될 때마다 재실행

  // AddPictureClipping용 이미지 추가 핸들러
  const handleImageAdded = (hasImage: boolean, imageUrl?: string, driveItemKey?: string) => {
    if (hasImage && imageUrl) {
      // 이미지가 추가되면 현재 이미지 URL 업데이트
      setCurrentImageUrl(imageUrl);
      
      // 이미지 메타데이터 업데이트
      const resolvedKey = driveItemKey || `local_${Date.now()}_${Math.random()}`;
      setImageMetadata([{ url: imageUrl, driveItemKey: resolvedKey }]);
      setImage(gridId, resolvedKey);
      
      // 부모 컴포넌트에 이미지 업로드 알림
      if (onImageUpload) {
        onImageUpload(gridId, imageUrl);
      }
      
      // hover 상태 해제
      setIsHovered(false);
      
      // 이미지가 첨부되면 현재 그리드의 키워드 영역만 확장하고 나머지는 축소
      if (isSelected) {
        expandOnlyOne(gridId);
      }
    }
  };

  // 이미지 이동 핸들러 (KonvaImageCanvas에서 호출)
  const handleImageMove = React.useCallback((x: number, y: number) => {
    console.log("이미지 이동:", { x, y, gridId });
    
    // 현재 이미지 데이터 업데이트
    if (konvaCanvasRef.current) {
      const currentImageData = konvaCanvasRef.current.getImageData();
      if (currentImageData) {
        setImageTransformData({
          x: currentImageData.x,
          y: currentImageData.y,
          scale: currentImageData.scale,
          width: currentImageData.width || 0,
          height: currentImageData.height || 0
        });
      }
    }
  }, [gridId]);

  // 이미지 변환 데이터 업데이트 핸들러
  const handleImageTransformUpdate = React.useCallback((transformData: {
    x: number;
    y: number;
    scale: number;
    width: number;
    height: number;
  }) => {
    // console.log("이미지 변환 데이터 업데이트:", transformData);
    setImageTransformData(transformData);
  }, []);

  // 크롭된 이미지 업데이트 핸들러
  const handleCroppedImageUpdate = React.useCallback((croppedImageUrl: string) => {
    console.log("🎯 크롭된 이미지 업데이트:", {
      gridId,
      이전이미지: currentImageUrl,
      새이미지: croppedImageUrl.substring(0, 50) + '...'
    });
    
    // 현재 이미지 URL을 크롭된 이미지로 업데이트
    setCurrentImageUrl(croppedImageUrl);
    
    // 이미지 메타데이터 업데이트
    const croppedKey = `cropped_${Date.now()}_${Math.random()}`;
    setImageMetadata([{ url: croppedImageUrl, driveItemKey: croppedKey }]);
    setImage(gridId, croppedKey);
    
    // 부모 컴포넌트에 크롭된 이미지 전달
    if (onImageUpload) {
      onImageUpload(gridId, croppedImageUrl);
    }
    
    console.log("✅ 크롭된 이미지 적용 완료:", gridId);
  }, [gridId, currentImageUrl, setImage, onImageUpload]);

  // 이미지 위치 초기화
  const handleResetImagePosition = React.useCallback(() => {
    if (konvaCanvasRef.current) {
      konvaCanvasRef.current.resetImagePosition();
    }
  }, []);

  // 툴바 숨기기 핸들러
  const handleHideToolbar = () => {
    // 툴바 숨기기 전에 현재 이미지 상태를 저장
    if (konvaCanvasRef.current) {
      const currentImageData = konvaCanvasRef.current.getImageData();
      if (currentImageData) {
        console.log("툴바 숨기기 전 현재 이미지 상태 저장:", currentImageData);
        setImageTransformData({
          x: currentImageData.x,
          y: currentImageData.y,
          scale: currentImageData.scale,
          width: currentImageData.width,
          height: currentImageData.height
        });
      }
    }

    setToolbarState({
      show: false,
      isExpanded: false,
    });
  };

  // 툴바 아이콘 클릭 핸들러
  const handleToolbarIconClick = (iconIndex: number, data?: any) => {
    console.log(`툴바 아이콘 ${iconIndex} 클릭됨, Grid ${index}`, data);

    // 사진틀 변경 처리 (인덱스 0 + 특정 액션)
    if (data && data.action === 'changePhotoFrame' && data.clipPathData) {
      console.log(`그리드 ${gridId}의 사진틀 변경:`, data.clipPathData);
      
      // 부모 컴포넌트에 clipPath 변경 요청
      if (onClipPathChange) {
        onClipPathChange(gridId, data.clipPathData);
      }
      
      console.log("사진틀 변경 요청:", {
        gridId,
        이전클립패스: clipPathData,
        새클립패스: data.clipPathData
      });
      
      // 툴바 숨기기
      handleHideToolbar();
      
      return;
    }

    // 사진 배경 제거 처리 (인덱스 3)
    if (iconIndex === 3) {
      console.log(`그리드 ${index}의 이미지 제거 (사진 배경 제거)`);
      
      // 현재 이미지 URL 초기화
      setCurrentImageUrl("");
      
      // 이미지 메타데이터 초기화
      setImageMetadata([]);
      try { remove(gridId); } catch (_) {}
      
      // 이미지 변환 데이터 초기화
      setImageTransformData(null);
      
      // 부모 컴포넌트에 이미지 제거 알림
      if (onImageUpload) {
        onImageUpload(gridId, "");
      }
      
      // 툴바 숨기기
      handleHideToolbar();
      
      console.log("🗑️ GridC 이미지 제거 완료:", {
        gridId,
        이전이미지: currentImageUrl,
        새이미지: ""
      });
    }
    
    // 사진 틀 삭제 처리 (인덱스 4)
    if (iconIndex === 4) {
      console.log(`그리드 ${index}의 사진 틀 삭제`);
      if (onDelete) {
        onDelete();
      }
      
      // 툴바 숨기기
      handleHideToolbar();
    }

    // 여기에 다른 아이콘별 로직 구현
  };

  // 전역 클릭 이벤트로 툴바 숨기기
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // 현재 GridCElement 외부 클릭 시 툴바 숨기기
      if (
        !target.closest(`[data-grid-id="${gridId}"]`) &&
        !target.closest(".grid-edit-toolbar")
      ) {
        handleHideToolbar();
      }
    };

    if (toolbarState.show) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [toolbarState.show, gridId]);

  // 스크롤이나 리사이즈 시 툴바 위치 업데이트
  React.useEffect(() => {
    const updateToolbarPosition = () => {
      if (toolbarState.show && canvasContainerRef.current) {
        const rect = canvasContainerRef.current.getBoundingClientRect();
        setToolbarPosition({
          left: rect.left + 8,
          top: rect.bottom + 8
        });
      }
    };

    if (toolbarState.show) {
      window.addEventListener('scroll', updateToolbarPosition, true);
      window.addEventListener('resize', updateToolbarPosition);
    }

    return () => {
      window.removeEventListener('scroll', updateToolbarPosition, true);
      window.removeEventListener('resize', updateToolbarPosition);
    };
  }, [toolbarState.show]);

  // 드래그 상태에 따른 스타일
  const containerClass = isDragging
    ? "" // DragOverlay에서는 별도 스타일 적용하지 않음
    : "";

  // 툴바 표시 상태 또는 선택 상태에 따른 border 스타일 결정
  const borderClass =
    toolbarState.show || isSelected
      ? "border-solid border-primary border-2 rounded-xl border-2"
      : "border-none";

  // 컴포넌트 마운트 시 저장된 키워드 불러오기
  React.useEffect(() => {
    loadKeywords();
  }, [loadKeywords]);

  // isSelected 상태 변경 시 키워드 확장 처리는 체크박스 핸들러에서 수행

  // 키워드 버튼 클릭 핸들러
  const handleKeywordClick = (keyword: string) => {
    // 이미 선택된 키워드인지 확인
    if (selectedKeywords.includes(keyword)) {
      // 이미 선택된 경우 제거
      const newKeywords = selectedKeywords.filter(k => k !== keyword);
      setSelectedKeywords(newKeywords);
      setActivityKeyword(newKeywords.join(", "));
      try { setKeyword(gridId, newKeywords.join(", ")); } catch (_) {}
    } else {
      // 새로 선택하는 경우 배열에 추가
      const newKeywords = [...selectedKeywords, keyword];
      setSelectedKeywords(newKeywords);
      setActivityKeyword(newKeywords.join(", "));
      try { setKeyword(gridId, newKeywords.join(", ")); } catch (_) {}
    }
  };

  // input 변경시 선택된 키워드 상태도 업데이트
  const handleKeywordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setActivityKeyword(value);
    try {
      setKeyword(gridId, value);
    } catch (_) {}
    
    // 쉼표로 구분된 키워드들을 배열로 변환
    const keywordsArray = value.split(",").map(k => k.trim()).filter(k => k.length > 0);
    setSelectedKeywords(keywordsArray);
  };

  // 키워드 입력 완료 시 (Enter 키 또는 포커스 해제) 전역 store에 저장
  const handleKeywordSubmit = React.useCallback((keyword: string) => {
    if (keyword.trim()) {
      // 쉼표로 구분된 각 키워드를 개별적으로 저장
      const keywordsArray = keyword.split(",").map(k => k.trim()).filter(k => k.length > 0);
      keywordsArray.forEach(k => addKeyword(k));
    }
  }, [addKeyword]);

  // Enter 키 핸들러
  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleKeywordSubmit(activityKeyword);
    }
  };

  // 포커스 해제 시 저장
  const handleKeywordBlur = () => {
    setIsInputFocused(false);
    handleKeywordSubmit(activityKeyword);
    try {
      setKeyword(gridId, activityKeyword);
    } catch (_) {}
  };

  // photo-description-input을 하단에 고정하기 위한 top 값 (고정값)
  const [photoDescriptionTopOffset, setPhotoDescriptionTopOffset] = React.useState<number>(200);

  // 처음 컨테이너 크기가 설정될 때만 한 번 계산하여 고정
  React.useEffect(() => {
    if (containerSize.height > 0 && photoDescriptionTopOffset === 200) {
      // 예상 photo-description-input 높이를 80px로 가정하여 계산
      const estimatedHeight = 80;
      const calculatedTop = containerSize.height - estimatedHeight - 8;
      setPhotoDescriptionTopOffset(calculatedTop > 0 ? calculatedTop : 200);
    }
  }, [containerSize.height, photoDescriptionTopOffset]);

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
            setActivityKeyword(content);
            try {
              setKeyword(gridId, content);
            } catch (_) {}
            
            // 쉼표로 구분된 키워드들을 배열로 변환
            const keywordsArray = content.split(",").map(k => k.trim()).filter(k => k.length > 0);
            setSelectedKeywords(keywordsArray);
            
            // 전역 store에 저장
            keywordsArray.forEach(k => addKeyword(k));
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

  return (
    <div className="relative w-full h-full" style={{ zIndex: toolbarState.show ? 100 : 'auto' }}>
      <div
        ref={outerContainerRef}
        className={`relative w-full h-full ${!effectiveClippingEnabled ? "bg-white rounded-xl" : "bg-transparent"} ${containerClass} ${isDragging ? "opacity-100" : ""} transition-all duration-200 ${!isDragging && effectiveClippingEnabled ? "cursor-grab active:cursor-grabbing" : ""} ${borderClass}`}
        data-grid-id={gridId}
        {...(isDragging || !effectiveClippingEnabled ? {} : dragAttributes)}
        {...(isDragging || !effectiveClippingEnabled ? {} : dragListeners)}
        onClick={handleContainerClick}
      >
        {/* 체크박스 - 좌측 상단 */}
        <div
          className="absolute top-2 left-2 z-30"
          onClick={(e) => {
            e.stopPropagation();
            handleCheckboxChange(!isSelected);
          }}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleCheckboxChange}
            className="w-5 h-5 bg-white border-2 border-gray-300 rounded-full data-[state=checked]:bg-white data-[state=checked]:border-primary cursor-pointer"
          />
        </div>



        {/* 삭제 버튼 - 우측 상단 */}
       

        {/* SVG 클리핑 마스크 정의 */}
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

        {/* 항상 표시되는 Canvas 영역 */}
        <div 
          ref={canvasContainerRef}
          className="relative w-full h-full canvas-container"
          onMouseEnter={() => !hasImage && setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onDoubleClick={handleDoubleClick}
        >
          {/* KonvaImageCanvas - 항상 표시 */}
          <KonvaImageCanvas
            ref={konvaCanvasRef}
            imageUrl={hasImage ? currentImageUrl : NO_IMAGE_URL}
            containerWidth={containerSize.width}
            containerHeight={containerSize.height}
            isClippingEnabled={effectiveClippingEnabled}
            onImageMove={handleImageMove}
            onImageTransformUpdate={handleImageTransformUpdate}
            onCroppedImageUpdate={handleCroppedImageUpdate}
            clipPath={effectiveClippingEnabled ? clipPathData.pathData : undefined}
            gridId={gridId}
            imageTransformData={imageTransformData}
            onFinishEdit={handleFinishEdit}
          />

          {/* 이미지가 있을 때 X 삭제 버튼 표시 */}
          {hasImage && (
            <button
              className="absolute top-2 right-2 bg-white w-6 h-6 rounded-full flex items-center justify-center border border-solid border-[#F0F0F0] z-20 hover:bg-red-50 transition-colors"
              onClick={handleImageDelete}
              title="이미지 삭제"
            >
              <IoClose className="w-4 h-4 text-black" />
            </button>
          )}

          {/* 이미지가 없을 때 hover시 업로드 UI 표시 */}
          {!hasImage && isHovered && (
            <div className="absolute inset-0 z-20">
                              <div 
                className="absolute inset-0 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onIntegratedUpload) {
                    onIntegratedUpload();
                  }
                }}
              >
                {/* 업로드 오버레이 */}
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-md flex flex-col items-center justify-center transition-opacity duration-200 z-10">
                  {/* Upload icon */}
                  <Image
                    src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/imageupload3.svg"
                    width={24}
                    height={24}
                    className="object-contain mb-2"
                    alt="Upload icon"
                  />
                  {/* Upload text */}
                  <div className="text-white text-[10px] font-medium text-center mb-2 px-2">
                    이미지를 드래그하거나<br />클릭하여 업로드
                  </div>
                  {/* File select button */}
                  <button 
                    className="bg-primary text-white text-[10px] px-3 py-1.5 rounded hover:bg-primary/80 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onIntegratedUpload) {
                        onIntegratedUpload();
                      }
                    }}
                  >
                    파일선택
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 클리핑 형태 이름 라벨 */}
      </div>

      {/* GridEditToolbar - element 하단 좌측에 위치 (클리핑 활성화 시에만) */}
      {toolbarState.show && effectiveClippingEnabled && typeof window !== 'undefined' && ReactDOM.createPortal(
        <div 
          className="grid-edit-toolbar fixed"
          style={{
            zIndex: 9999,
            pointerEvents: 'auto',
            left: toolbarPosition.left,
            top: toolbarPosition.top,
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

      {/* 더블클릭 편집 진입 시(해당 그리드만 클리핑 해제) 현재 캔버스 영역을 제외한 나머지 화면 어둡게 처리 - 라운드 코너 반영 */}
      {isLocalClippingDisabled && overlayRect && typeof window !== 'undefined' && ReactDOM.createPortal(
        (() => {
          const vw = window.innerWidth || 0;
          const vh = window.innerHeight || 0;
          const holeX = overlayRect.left;
          const holeY = overlayRect.top;
          const holeW = vw - overlayRect.left - overlayRect.right;
          const holeH = vh - overlayRect.top - overlayRect.bottom;
          const r = overlayRect.radius || 0;
          const maskId = `dim-mask-${gridId}`;
          return (
            <>
              {/* 시각적 암전 레이어 (홀 포함) - 전역 클릭 비차단 */}
              <svg className="fixed inset-0 z-[10000] pointer-events-none" width={vw} height={vh} style={{ display: 'block' }}>
                <defs>
                  <mask id={maskId}>
                    <rect x="0" y="0" width={vw} height={vh} fill="white" />
                    <rect x={holeX} y={holeY} width={holeW} height={holeH} rx={r} ry={r} fill="black" />
                  </mask>
                </defs>
                <rect x="0" y="0" width={vw} height={vh} fill="rgba(0,0,0,0.2)" mask={`url(#${maskId})`} />
              </svg>
              {/* 클릭 차단 레이어(보이지 않음): 홀 주변 4영역만 포인터 차단 */}
              <div className="fixed inset-0 z-[10001]" style={{ pointerEvents: 'none' }}>
                {/* 상단 */}
                <div
                  className="absolute"
                  style={{ left: 0, right: 0, top: 0, height: overlayRect.top, pointerEvents: 'auto' }}
                />
                {/* 하단 */}
                <div
                  className="absolute"
                  style={{ left: 0, right: 0, bottom: 0, height: overlayRect.bottom, pointerEvents: 'auto' }}
                />
                {/* 좌측 */}
                <div
                  className="absolute"
                  style={{ left: 0, top: overlayRect.top, bottom: overlayRect.bottom, width: overlayRect.left, pointerEvents: 'auto' }}
                />
                {/* 우측 */}
                <div
                  className="absolute"
                  style={{ right: 0, top: overlayRect.top, bottom: overlayRect.bottom, width: overlayRect.right, pointerEvents: 'auto' }}
                />
              </div>
            </>
          );
        })(),
        document.body
      )}

      {/* Keyword Input Component at the bottom - 체크박스 선택 시 및 클리핑 활성화 시에만 표시 */}
      {isSelected && effectiveClippingEnabled && (
        <div 
          ref={photoDescriptionRef}
          className="absolute bottom-0 left-0 right-0 z-50 p-2 photo-description-input"
          
        >
          <div className="flex flex-col px-3 py-2 text-xs tracking-tight leading-none text-gray-700 bg-white rounded-lg w-full shadow-[1px_1px_10px_rgba(0,0,0,0.1)]">
            {/* 검색 입력 */}
            <div className="flex gap-2.5 text-zinc-400 w-full">
              <div className={`flex-1 flex overflow-hidden flex-col justify-center items-start px-2 py-1 bg-white rounded-md border border-solid transition-colors ${isInputFocused ? 'border-primary' : 'border-zinc-100'}`}>
                <input
                  type="text"
                  value={activityKeyword}
                  onChange={handleKeywordInputChange}
                  onFocus={() => {
                    setIsInputFocused(true);
                    // input에 포커스가 가면 해당 아이템만 확장하고 나머지는 축소
                    expandOnlyOne(gridId);
                  }}
                  onBlur={handleKeywordBlur}
                  onKeyDown={handleKeywordKeyDown}
                  placeholder="활동주제나 관련 키워드를 입력하세요."
                  className="w-full outline-none border-none bg-transparent placeholder-zinc-400 text-zinc-800"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTextFileUpload();
                }}
                className="flex overflow-hidden justify-center items-center w-[32px] h-[32px] bg-[#979797] border border-dashed border-zinc-400 rounded-md hover:bg-[#979797]/80 transition-colors"
                title="텍스트 파일 업로드"
              >
                <Image
                  src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/upload.svg"
                  className="object-contain"
                  width={16}
                  height={16}
                  alt="Upload icon"
                />
              </button>
            </div>

            {/* 모든 키워드들 */}
            <div className="relative">
              {/* 추천 키워드 섹션 */}
              <div className="relative">
                <div className="flex items-center justify-between mt-3.5">
                  <div className="font-semibold">추천 키워드</div>
                  <button
                    className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isRecommendedKeywordsExpanded) {
                        setExpanded(gridId, false);
                      } else {
                        expandOnlyOne(gridId);
                      }
                    }}
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isRecommendedKeywordsExpanded ? "" : "rotate-180"
                      }`}
                    />
                  </button>
                </div>
                
                {/* 추천 키워드 확장 영역 */}
                <div 
                  className={`overflow-hidden transition-all duration-200 ease-in-out ${
                    isRecommendedKeywordsExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className=" mt-2 pt-2">
                    {/* 추천 키워드 목록 - 2줄까지만 표시하고 나머지는 스크롤 */}
                    {recommendedKeywords.length > 0 && (
                      <div className="max-h-[4.5rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                        <div className="flex flex-wrap gap-1.5 font-medium">
                          {recommendedKeywords.map((keyword, index) => (
                            <div 
                              key={`${keyword}-${index}`}
                              className={`flex overflow-hidden flex-col justify-center px-2.5 py-1.5 whitespace-nowrap rounded-[50px] cursor-pointer transition-colors ${
                                selectedKeywords.includes(keyword) 
                                  ? 'bg-primary text-white hover:bg-primary/80' 
                                  : 'bg-gray-50 hover:bg-gray-100'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleKeywordClick(keyword);
                              }}
                            >
                              <div>{keyword}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* 저장된 키워드가 없을 때 안내 메시지 */}
                    {recommendedKeywords.length === 0 && (
                      <div className="text-center text-gray-400 text-xs py-2">
                        키워드를 입력하면 추천 키워드로 저장됩니다.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>
      )}


    </div>
  );
}

export default GridCElement;
