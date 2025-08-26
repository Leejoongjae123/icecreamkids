"use client";
import * as React from "react";
import * as ReactDOM from "react-dom";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";

import { ChevronDown } from "lucide-react";
import AddPictureClipping from "./AddPictureClipping";
// Konva 기반 캔버스는 사용하지 않음 (CSS 기반 편집으로 전환)
import GridEditToolbar from "./GridEditToolbar";
import { Loader } from "@/components/ui/loader";
import { ClipPathItem } from "../dummy/types";
import {IoClose} from "react-icons/io5";
import useKeywordStore from "@/hooks/store/useKeywordStore";
import useUserStore from "@/hooks/store/useUserStore";
import useGridCStore from "@/hooks/store/useGridCStore";
import useKeywordExpansionStore from "@/hooks/store/useKeywordExpansionStore";
import { Button } from "@/components/ui/button";
import { Button as CommonButton } from "@/components/common/Button";
import { MdZoomIn, MdZoomOut, MdRefresh } from "react-icons/md";
import { useToast } from "@/hooks/store/useToastStore";
import { useAlertStore } from "@/hooks/store/useAlertStore";
import { useGridToolbarStore } from "@/hooks/store/useGridToolbarStore";

interface GridCElementProps {
  index: number;
  gridId: string;
  clipPathData: ClipPathItem;
  imageUrl: string;
  driveItemKey?: string; // driveItemKey 추가
  isClippingEnabled: boolean;
  isReadOnly?: boolean;
  isDragging?: boolean;
  dragAttributes?: any;
  dragListeners?: any;
  isSelected?: boolean;
  onSelectChange?: (isSelected: boolean) => void;
  onDelete?: () => void;
  onImageUpload: (gridId: string, imageUrl: string, driveItemKey?: string) => void;
  onClipPathChange?: (gridId: string, clipPathData: ClipPathItem) => void;
  onIntegratedUpload?: () => void; // 통합 업로드 핸들러
  onSingleUpload?: (gridId: string) => void; // 단일 업로드 핸들러
  hasAnyImage?: boolean; // 전체 중 하나라도 이미지가 있는가
  isUploadModalOpen?: boolean; // 업로드 모달 열림 여부 (툴바 자동 닫기용)
  onDropFiles?: (gridId: string, files: File[]) => void; // 네이티브 파일 드롭 처리 콜백
}

function GridCElement({
  index,
  gridId,
  clipPathData,
  imageUrl,
  driveItemKey,
  isClippingEnabled,
  isReadOnly = false,
  isDragging = false,
  dragAttributes,
  dragListeners,
  isSelected = false,
  onSelectChange,
  onDelete,
  onImageUpload,
  onClipPathChange,
  onIntegratedUpload,
  onSingleUpload,
  hasAnyImage,
  isUploadModalOpen,
  onDropFiles,
}: GridCElementProps) {
  const [activityKeyword, setActivityKeyword] = React.useState("");
  const [isInputFocused, setIsInputFocused] = React.useState(false);
  const [selectedKeywords, setSelectedKeywords] = React.useState<string[]>([]);
  const [currentImageUrl, setCurrentImageUrl] = React.useState<string>(imageUrl);
  const [isHovered, setIsHovered] = React.useState(false);
  const isHoveredRef = React.useRef(false);
  const hoverTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // 사용자 정보 가져오기
  const { userInfo } = useUserStore();
  const profileId = React.useMemo(() => userInfo?.id || null, [userInfo?.id]);
  const accountId = React.useMemo(() => userInfo?.accountId || null, [userInfo?.accountId]);
  
  // 메모 상태 관리
  const [memoStatus, setMemoStatus] = React.useState<boolean>(false);
  
  // 전역 키워드 store 사용
  const { recommendedKeywords, loadKeywords, addKeyword } = useKeywordStore();
  
  // Toast 및 Alert hook
  const addToast = useToast((state) => state.add);
  const { showAlert } = useAlertStore();
  
  // 키워드 확장 상태 전역 store 사용
  const { isExpanded, expandOnlyOne, setExpanded } = useKeywordExpansionStore();
  const isRecommendedKeywordsExpanded = isExpanded(gridId);
  
  // 기본 배경 이미지 (GridAElement와 동일한 웹 호스팅 이미지)
  const NO_IMAGE_URL = "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg";


  
  // 이미지 메타데이터 상태 (driveItemKey 포함)
  const [imageMetadata, setImageMetadata] = React.useState<{url: string, driveItemKey?: string}[]>([]);
  const { setImage, setKeyword, remove } = useGridCStore();

  // 현재 이미지의 driveItemKey 상태를 명시적으로 관리 (prop으로 받은 값으로 초기화)
  const [currentImageDriveItemKey, setCurrentImageDriveItemKey] = React.useState<string>(driveItemKey || "");

  // 인라인 편집 상태 (CSS 기반)
  const [inlineEditState, setInlineEditState] = React.useState<{
    active: boolean;
    temp: { x: number; y: number; scale: number };
    cropActive: boolean;
    cropRect?: { left: number; top: number; right: number; bottom: number } | null;
    cropDraggingEdge?: 'left' | 'right' | 'top' | 'bottom' | null;
    cropStartPointer?: { x: number; y: number } | null;
    cropBounds?: { left: number; top: number; right: number; bottom: number } | null;
  }>({ active: false, temp: { x: 0, y: 0, scale: 1 }, cropActive: false, cropRect: null, cropDraggingEdge: null, cropStartPointer: null, cropBounds: null });
  
  // canvas-container ref 및 크기 상태
  const canvasContainerRef = React.useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = React.useState<{ width: number; height: number }>({ width: 0, height: 0 });
  
  // photo-description-input ref 및 높이 상태
  const photoDescriptionRef = React.useRef<HTMLDivElement>(null);
  const [photoDescriptionHeight, setPhotoDescriptionHeight] = React.useState<number>(0);

  // 배경 제거 로딩 상태 관리
  const [isRemoveBackgroundLoading, setIsRemoveBackgroundLoading] = React.useState(false);

  // 이미지 변환 정보 상태 (위치, 스케일)
  const [imageTransformData, setImageTransformData] = React.useState<{
    x: number;
    y: number;
    scale: number;
  } | null>(null);

  // 툴바 상태 관리
  const [toolbarState, setToolbarState] = React.useState({
    show: false,
    isExpanded: false,
  });
  // 툴바 내부 모달 열림 상태 (모달 열림 동안 포털 유지)
  const [toolbarModalOpen, setToolbarModalOpen] = React.useState(false);
  // 전역 툴바 닫기 신호 구독
  const { lastCloseAllAt } = useGridToolbarStore();
  React.useEffect(() => {
    if (lastCloseAllAt > 0 && toolbarState.show) {
      setToolbarState({ show: false, isExpanded: false });
    }
  }, [lastCloseAllAt]);

  // 업로드 모달 열림 시 툴바 자동 닫기
  React.useEffect(() => {
    if (isUploadModalOpen) {
      setToolbarState({ show: false, isExpanded: false });
    }
  }, [isUploadModalOpen]);
  
  // 그리드 개별 클리핑 해제 상태 (true면 이 그리드만 클리핑 해제)
  const [isLocalClippingDisabled, setIsLocalClippingDisabled] = React.useState<boolean>(false);
  // 전역 설정과 개별 해제 상태를 합쳐서 실제 적용 여부 계산
  const effectiveClippingEnabled = isClippingEnabled && !isLocalClippingDisabled;
  
  // 외부 오버레이는 CSS 기반에서 사용하지 않음
  
  // 툴바 위치 상태
  const [toolbarPosition, setToolbarPosition] = React.useState({ left: 0, top: 0 });
  // 인라인 편집 포털 위치 상태 (그리드 바로 하단에 배치)
  const [editPortalPosition, setEditPortalPosition] = React.useState<{ left: number; top: number }>({ left: 0, top: 0 });

  // 이미지가 있는지 확인하는 헬퍼 함수
  const hasImage = currentImageUrl && currentImageUrl !== NO_IMAGE_URL;

  // 네이티브 파일 드래그앤드롭 지원 (react-dnd 외부 파일 허용 없이도 동작)
  React.useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;

    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length > 0) {
        if (onDropFiles) {
          onDropFiles(gridId, files as File[]);
        } else if (onIntegratedUpload) {
          onIntegratedUpload();
        }
      }
    };

    el.addEventListener("dragover", onDragOver as any);
    el.addEventListener("drop", onDrop as any);
    return () => {
      el.removeEventListener("dragover", onDragOver as any);
      el.removeEventListener("drop", onDrop as any);
    };
  }, [onDropFiles, onIntegratedUpload]);

  // 이미지 URL로 driveItemKey 찾기
  const getDriveItemKeyByImageUrl = React.useCallback((imageUrl: string): string | undefined => {
    const metadata = imageMetadata.find(item => item.url === imageUrl);
    return metadata?.driveItemKey;
  }, [imageMetadata]);

  // 현재 이미지의 driveItemKey 가져오기 (type-c create-record API 호출용)
  const getCurrentImageDataId = React.useCallback((): string | undefined => {
    console.log("🔍 GridC getCurrentImageDataId 호출:", {
      gridId,
      currentImageUrl,
      hasImage,
      currentImageDriveItemKey,
      imageMetadata,
      getDriveItemKeyResult: getDriveItemKeyByImageUrl(currentImageUrl)
    });
    
    if (hasImage) {
      // 우선순위 1: 명시적으로 관리하는 currentImageDriveItemKey 사용
      if (currentImageDriveItemKey && currentImageDriveItemKey !== "") {
        console.log("✅ GridC getCurrentImageDataId - currentImageDriveItemKey 사용:", currentImageDriveItemKey);
        return currentImageDriveItemKey;
      }
      
      // 우선순위 2: getDriveItemKeyByImageUrl 함수로 찾기
      const dataId = getDriveItemKeyByImageUrl(currentImageUrl);
      if (dataId && dataId !== "") {
        console.log("✅ GridC getCurrentImageDataId - getDriveItemKeyByImageUrl 사용:", dataId);
        return dataId;
      }
      
      console.warn("❌ GridC getCurrentImageDataId - driveItemKey를 찾을 수 없음");
    }
    return undefined;
  }, [hasImage, currentImageUrl, currentImageDriveItemKey, getDriveItemKeyByImageUrl, gridId, imageMetadata]);

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
    if (effectiveClippingEnabled && !isReadOnly) {
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

  // hover 진입/이탈 핸들러 (GridBElement 참고)
  const handleMouseEnter = () => {
    setIsHovered(true);
    isHoveredRef.current = true;
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (effectiveClippingEnabled && !isReadOnly) {
      setToolbarState({ show: true, isExpanded: true });
      if (canvasContainerRef.current) {
        const rect = canvasContainerRef.current.getBoundingClientRect();
        setToolbarPosition({ left: rect.left + 8, top: rect.bottom + 8 });
      }
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    isHoveredRef.current = false;
    const timer = setTimeout(() => {
      if (!isHoveredRef.current) {
        setToolbarState({ show: false, isExpanded: false });
      }
      hoverTimerRef.current = null;
    }, 3000);
    hoverTimerRef.current = timer;
  };

  // 더블클릭 시 인라인 편집 모드 진입
  const handleDoubleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!hasImage) return;
    setToolbarState({ show: false, isExpanded: false });
    const base = imageTransformData || { x: 0, y: 0, scale: 1 };
    setInlineEditState(prev => ({
      ...prev,
      active: true,
      temp: { x: base.x || 0, y: base.y || 0, scale: base.scale || 1 },
      cropActive: false,
      cropRect: null,
      cropDraggingEdge: null,
      cropStartPointer: null,
      cropBounds: null,
    }));
  };

  // (미사용) 기존 Konva 편집 종료 핸들러 제거됨

  // 인라인 편집 컨테이너 ref
  const outerContainerRef = React.useRef<HTMLDivElement>(null);

  // 체크박스 변경 핸들러
  const handleCheckboxChange = (checked: boolean | "indeterminate") => {
    if (onSelectChange && typeof checked === "boolean") {
      onSelectChange(checked);
      
      // 체크박스가 선택되면 해당 아이템만 키워드 영역 펼치고 나머지는 축소
      if (checked) {
        if (filteredRecommendedKeywords.length > 0) {
          expandOnlyOne(gridId);
        } else {
          setExpanded(gridId, false);
        }
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
      이전이미지: currentImageUrl,
      이전DriveItemKey: currentImageDriveItemKey
    });
    
    // 현재 이미지 URL 초기화
    setCurrentImageUrl("");
    
    // 이미지 메타데이터 초기화
    setImageMetadata([]);
    
    // 현재 이미지의 driveItemKey 초기화
    setCurrentImageDriveItemKey("");
    
    try {
      remove(gridId);
    } catch (_) {}
    
    // 이미지 변환 데이터 초기화
    setImageTransformData({ x: 0, y: 0, scale: 1 });
    
    // 부모 컴포넌트에 이미지 제거 알림
    if (onImageUpload) {
      onImageUpload(gridId, "", "");
    }
    // 이미지가 삭제되면 선택 해제하여 키워드 영역 숨김
    if (onSelectChange && isSelected) {
      try { onSelectChange(false); } catch (_) {}
    }
    
    console.log("✅ GridC 이미지 삭제 완료:", { gridId });
  };

  // driveItemKey prop 변경 감지
  React.useEffect(() => {
    if (driveItemKey !== currentImageDriveItemKey) {
      setCurrentImageDriveItemKey(driveItemKey || "");
      console.log("🔄 GridC driveItemKey prop 변경으로 상태 동기화:", {
        gridId,
        이전: currentImageDriveItemKey,
        새값: driveItemKey
      });
    }
  }, [driveItemKey, currentImageDriveItemKey, gridId]);

  // 이미지 URL 변경 감지
  React.useEffect(() => {
    setCurrentImageUrl(imageUrl);
    
    // imageUrl이 변경되면 해당 이미지의 driveItemKey도 찾아서 설정
    if (imageUrl && imageUrl !== NO_IMAGE_URL) {
      const foundMetadata = imageMetadata.find(meta => meta.url === imageUrl);
      if (foundMetadata?.driveItemKey) {
        setCurrentImageDriveItemKey(foundMetadata.driveItemKey);
        console.log("🔄 GridC imageUrl 변경으로 driveItemKey 동기화:", {
          gridId,
          imageUrl: imageUrl.substring(0, 50) + "...",
          driveItemKey: foundMetadata.driveItemKey
        });
      }
    } else {
      // 이미지가 없으면 driveItemKey도 초기화
      setCurrentImageDriveItemKey("");
    }
  }, [imageUrl, imageMetadata, gridId]);

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

  // 이미지 추가 핸들러
  const handleImageAdded = (hasImage: boolean, imageUrl?: string, driveItemKey?: string) => {
    if (hasImage && imageUrl) {
      console.log("🖼️ GridC handleImageAdded:", {
        gridId,
        imageUrl: imageUrl.substring(0, 50) + "...",
        driveItemKey,
        hasImage
      });
      
      // 이미지가 추가되면 현재 이미지 URL 업데이트
      setCurrentImageUrl(imageUrl);
      
      // 이미지 메타데이터 업데이트
      const resolvedKey = driveItemKey || `local_${Date.now()}_${Math.random()}`;
      setImageMetadata([{ url: imageUrl, driveItemKey: resolvedKey }]);
      setImage(gridId, resolvedKey);
      
      // 현재 이미지의 driveItemKey 명시적으로 설정
      setCurrentImageDriveItemKey(resolvedKey);
      
      console.log("✅ GridC 이미지 메타데이터 업데이트 완료:", {
        gridId,
        resolvedKey,
        imageUrl: imageUrl.substring(0, 50) + "..."
      });
      
      // 부모 컴포넌트에 이미지 업로드 알림
      if (onImageUpload) {
        onImageUpload(gridId, imageUrl, resolvedKey);
      }
      
      // hover 상태 해제
      setIsHovered(false);
      
      // 이미지가 첨부되면 현재 그리드의 키워드 영역만 확장하고 나머지는 축소
      if (isSelected) {
        if (filteredRecommendedKeywords.length > 0) {
          expandOnlyOne(gridId);
        } else {
          setExpanded(gridId, false);
        }
      }
    } else {
      // 이미지가 제거된 경우
      console.log("🗑️ GridC 이미지 제거:", { gridId });
      setCurrentImageDriveItemKey("");
    }
  };

  // 인라인 편집 드래그/리사이즈
  const suppressClickRef = React.useRef<boolean>(false);
  const onEditMouseDown = React.useCallback((e: React.MouseEvent) => {
    if (!inlineEditState.active) return;
    e.preventDefault(); e.stopPropagation();
    const start = { x: e.clientX, y: e.clientY };
    suppressClickRef.current = false;
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - start.x; const dy = ev.clientY - start.y;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) suppressClickRef.current = true;
      setInlineEditState(prev => ({ ...prev, temp: { x: prev.temp.x + dx, y: prev.temp.y + dy, scale: prev.temp.scale } }));
      start.x = ev.clientX; start.y = ev.clientY;
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [inlineEditState.active]);

  // 인라인 편집 활성 시 키보드 + / - 로 확대/축소 지원 (입력 포커스 시 무시)
  React.useEffect(() => {
    if (!inlineEditState.active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName.toLowerCase();
        const isEditable = tag === 'input' || tag === 'textarea' || (target as HTMLElement).isContentEditable;
        if (isEditable) return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return; // 브라우저 페이지 줌과 충돌 방지
      const isPlus = e.key === '+' || e.code === 'NumpadAdd';
      const isMinus = e.key === '-' || e.code === 'NumpadSubtract';
      if (!isPlus && !isMinus) return;
      e.preventDefault();
      if (isPlus) {
        setInlineEditState(prev => ({
          ...prev,
          temp: { ...prev.temp, scale: Math.min(3, (prev.temp.scale || 1) * 1.2) }
        }));
      } else if (isMinus) {
        setInlineEditState(prev => ({
          ...prev,
          temp: { ...prev.temp, scale: Math.max(0.1, (prev.temp.scale || 1) / 1.2) }
        }));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [inlineEditState.active]);

  const onResizeHandleDown = React.useCallback((e: React.MouseEvent) => {
    if (!inlineEditState.active) return;
    e.preventDefault(); e.stopPropagation();
    const start = { x: e.clientX, y: e.clientY };
    const onMove = (ev: MouseEvent) => {
      const dy = ev.clientY - start.y; const dx = ev.clientX - start.x;
      const delta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      setInlineEditState(prev => ({ ...prev, temp: { ...prev.temp, scale: Math.max(0.2, Math.min(5, prev.temp.scale + delta * 0.005)) } }));
      start.x = ev.clientX; start.y = ev.clientY;
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [inlineEditState.active]);

  const renderResizeHandles = React.useCallback(() => {
    return null;
  }, []);

  const confirmInlineEdit = React.useCallback(() => {
    setImageTransformData({ ...(inlineEditState.temp) });
    setInlineEditState(prev => ({ ...prev, active: false, cropActive: false, cropRect: null, cropDraggingEdge: null, cropStartPointer: null, cropBounds: null }));
  }, [inlineEditState.temp]);

  const cancelInlineEdit = React.useCallback(() => {
    setInlineEditState(prev => ({ ...prev, active: false, cropActive: false, cropRect: null, cropDraggingEdge: null, cropStartPointer: null, cropBounds: null }));
  }, []);

  // 인라인 편집 활성 시 Enter 키로 적용 (입력 포커스 시 무시)
  React.useEffect(() => {
    if (!inlineEditState.active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName.toLowerCase();
        const isEditable = tag === 'input' || tag === 'textarea' || (target as HTMLElement).isContentEditable;
        if (isEditable) return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        confirmInlineEdit();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [inlineEditState.active, confirmInlineEdit]);

  // 배경 제거 API 호출 함수
  const callRemoveBackgroundAPI = React.useCallback(async () => {
    console.log("🖼️ GridC 배경 제거 API 호출 시작:", {
      gridId,
      profileId,
      hasImage,
      currentImageUrl,
      currentImageDriveItemKey
    });
    
    if (!profileId) {
      showAlert({ message: '로그인 후 사용해주세요.' });
      return;
    }

    // 현재 이미지에서 driveItemKey 수집 - getCurrentImageDataId 함수 사용
    const driveItemKeys: string[] = [];
    if (hasImage) {
      const driveItemKey = getCurrentImageDataId();
      console.log("🔍 GridC 배경제거용 driveItemKey 수집:", {
        gridId,
        driveItemKey,
        hasImage,
        isLocal: driveItemKey?.startsWith('local_')
      });
      
      if (driveItemKey && !driveItemKey.startsWith('local_')) {
        driveItemKeys.push(driveItemKey);
        console.log("✅ GridC 유효한 driveItemKey 추가:", driveItemKey);
      } else {
        console.warn("❌ GridC 유효하지 않은 driveItemKey:", {
          driveItemKey,
          isLocal: driveItemKey?.startsWith('local_'),
          isEmpty: !driveItemKey
        });
      }
    }

    if (driveItemKeys.length === 0) {
      console.error("❌ GridC 배경제거에 필요한 driveItemKey가 없음:", {
        gridId,
        driveItemKeys,
        hasImage,
        currentImageUrl,
        currentImageDriveItemKey,
        imageMetadata
      });
      showAlert({ message: '배경 제거에 필요한 정보가 없습니다.' });
      return;
    }

    console.log("🖼️ GridC 배경 제거 API 호출:", {
      profileId,
      driveItemKeys,
      threshold: 0.8,
      responseWithFolder: false
    });

    try {
      setIsRemoveBackgroundLoading(true);
      
      const response = await fetch('/api/ai/v1/remove-background', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': '*/*'
        },
        body: JSON.stringify({
          profileId,
          driveItemKeys,
          threshold: 0.8,
          responseWithFolder: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        showAlert({ message: '배경 제거에 실패했습니다. 다시 시도해주세요.' });
        return;
      }

      const result = await response.json();
      console.log("🖼️ GridC 배경 제거 API 응답:", result);

      // 응답에서 새로운 이미지 정보 추출
      if (result?.result) {
        // 처리된 이미지 정보
        const processedImage = Array.isArray(result.result) ? result.result[0] : result.result;
        
        if (processedImage?.driveItemKey && processedImage?.thumbUrl) {
          const newDriveItemKey = processedImage.driveItemKey;
          const newThumbUrl = processedImage.thumbUrl;
          
          console.log(`🖼️ GridC 배경 제거 완료:`, {
            원본: currentImageUrl,
            신규: newThumbUrl,
            원본DriveItemKey: driveItemKeys[0],
            신규DriveItemKey: newDriveItemKey
          });
          
          // 현재 이미지 URL을 배경 제거된 이미지로 업데이트
          setCurrentImageUrl(newThumbUrl);
          
          // 이미지 메타데이터 업데이트
          setImageMetadata([{ url: newThumbUrl, driveItemKey: newDriveItemKey }]);
          setImage(gridId, newDriveItemKey);
          
          // 현재 이미지의 driveItemKey 명시적으로 설정
          setCurrentImageDriveItemKey(newDriveItemKey);
          
          // 부모 컴포넌트에 배경 제거된 이미지 전달
          if (onImageUpload) {
            onImageUpload(gridId, newThumbUrl, newDriveItemKey);
          }
          
          // 이미지 변환 데이터 초기화 (새로운 이미지이므로)
          setImageTransformData({ x: 0, y: 0, scale: 1 });
          
          console.log("✅ GridC 배경제거 이미지 상태 업데이트 완료:", {
            gridId,
            newDriveItemKey,
            newThumbUrl: newThumbUrl.substring(0, 50) + "..."
          });
          
          addToast({ message: '배경 제거가 완료되었습니다.' });
        } else {
          showAlert({ message: '배경 제거된 이미지를 찾을 수 없습니다.' });
        }
      } else {
        showAlert({ message: '배경 제거 결과를 처리할 수 없습니다.' });
      }

    } catch (error) {
      console.log('GridC 배경 제거 API 호출 오류:', error);
      showAlert({ message: '배경 제거 중 오류가 발생했습니다.' });
    } finally {
      setIsRemoveBackgroundLoading(false);
    }
  }, [profileId, hasImage, currentImageUrl, currentImageDriveItemKey, getCurrentImageDataId, showAlert, gridId, setImage, onImageUpload, addToast]);

  // 툴바 숨기기 핸들러
  const handleHideToolbar = () => {
    setToolbarState({ show: false, isExpanded: false });
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

    // 사진 배경 제거 처리 (인덱스 3) - 새로운 배경 제거 API 사용
    if (iconIndex === 3) {
      console.log(`GridC 그리드 ${index}의 배경 제거 API 호출`);
      callRemoveBackgroundAPI();
      
      // 툴바 숨기기
      handleHideToolbar();
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

  // 언마운트 시 hover 타이머 정리
  React.useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  // 인라인 편집 포털 위치 업데이트 (스크롤/리사이즈 대응)
  React.useEffect(() => {
    if (!inlineEditState.active) return;
    const update = () => {
      if (canvasContainerRef.current) {
        const rect = canvasContainerRef.current.getBoundingClientRect();
        setEditPortalPosition({ left: rect.left + rect.width / 2, top: rect.bottom + 8 });
      }
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [inlineEditState.active]);

  // 드래그 상태에 따른 스타일
  const containerClass = isDragging
    ? "" // DragOverlay에서는 별도 스타일 적용하지 않음
    : "";

  // 툴바 표시 상태 또는 선택 상태에 따른 border 스타일 결정
  const borderClass =
    toolbarState.show
      ? "border-solid border-primary border-2 rounded-xl border-2"
      : "border-none";

  // 컴포넌트 마운트 시 저장된 키워드 불러오기
  React.useEffect(() => {
    loadKeywords();
  }, [loadKeywords]);

  // 추천 키워드에서 현재 입력/선택된 키워드 제외
  const filteredRecommendedKeywords = React.useMemo(() => {
    const setSelected = new Set(
      selectedKeywords.map((k) => k.trim()).filter((k) => k.length > 0)
    );
    return recommendedKeywords.filter((k) => !setSelected.has(k));
  }, [recommendedKeywords, selectedKeywords]);

  // 표시 가능한 추천 키워드 유무 (필터링 결과 기준)
  const hasDisplayableRecommendedKeywords = filteredRecommendedKeywords.length > 0;

  // 추천 키워드가 없으면 펼침 상태를 강제로 접음
  React.useEffect(() => {
    if (!hasDisplayableRecommendedKeywords && isRecommendedKeywordsExpanded) {
      try { setExpanded(gridId, false); } catch (_) {}
    }
  }, [hasDisplayableRecommendedKeywords, isRecommendedKeywordsExpanded, gridId, setExpanded]);

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
        {...(isDragging || !effectiveClippingEnabled || inlineEditState.active ? {} : dragAttributes)}
        {...(isDragging || !effectiveClippingEnabled || inlineEditState.active ? {} : dragListeners)}
        onClick={handleContainerClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* 체크박스 - 좌측 상단 (이미지 업로드 이후에만 표시) */}
        {hasImage && !isReadOnly && (
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
        )}



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

        {/* 이미지 영역 (CSS 기반) */}
        <div 
          ref={canvasContainerRef}
          className="relative w-full h-full canvas-container"
          onMouseEnter={() => !hasImage && setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onDoubleClick={isReadOnly ? undefined : handleDoubleClick}
        >
          {/* 배경 제거 로딩 오버레이 */}
          {isRemoveBackgroundLoading && (
            <div
              className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 rounded-md"
              style={{
                WebkitClipPath: effectiveClippingEnabled ? `url(#clip-${clipPathData.id}-${gridId})` : undefined,
                clipPath: effectiveClippingEnabled ? `url(#clip-${clipPathData.id}-${gridId})` : undefined,
              }}
            >
              <div className="flex flex-col items-center gap-2">
                <Loader size="default" />
                <div className="text-white text-xs">배경을 제거하는 중...</div>
              </div>
            </div>
          )}
          {/* CSS 기반 이미지 및 인라인 편집 */}
          <div className="absolute inset-0" data-id={currentImageDriveItemKey}
            style={{
              WebkitClipPath: effectiveClippingEnabled && !inlineEditState.active ? `url(#clip-${clipPathData.id}-${gridId})` : undefined,
              clipPath: effectiveClippingEnabled && !inlineEditState.active ? `url(#clip-${clipPathData.id}-${gridId})` : undefined,
              overflow: inlineEditState.active ? 'visible' : undefined,
            }}
          >
            <img
              src={hasImage ? currentImageUrl : NO_IMAGE_URL}
              alt="GridC image"
              className="absolute inset-0 w-full h-full object-contain rounded-md select-none"
              style={{
                transform: inlineEditState.active
                  ? `translate(${inlineEditState.temp.x || 0}px, ${inlineEditState.temp.y || 0}px) scale(${inlineEditState.temp.scale || 1})`
                  : (imageTransformData ? `translate(${(imageTransformData.x || 0)}px, ${(imageTransformData.y || 0)}px) scale(${(imageTransformData.scale || 1)})` : undefined),
                transformOrigin: 'center',
                userSelect: 'none'
              }}
              draggable={false}
              onMouseDown={inlineEditState.active ? onEditMouseDown : undefined}
              onDoubleClick={isReadOnly ? undefined : handleDoubleClick}
            />
            {inlineEditState.active && renderResizeHandles()}
          </div>

          {/* 이미지가 있을 때 X 삭제 버튼 표시 */}
          {hasImage && !inlineEditState.active && !isReadOnly && (
            <button
              className="absolute top-2 right-2 bg-white w-6 h-6 rounded-full flex items-center justify-center border border-solid border-[#F0F0F0] z-20 hover:bg-red-50 transition-colors"
              onClick={handleImageDelete}
              title="이미지 삭제"
            >
              <IoClose className="w-4 h-4 text-black" />
            </button>
          )}

          {/* 이미지가 없을 때 GridB 스타일의 비어있는 업로드 안내 영역 표시 (항상 표시) */}
          {!hasImage && !isReadOnly && (
            <div className="absolute inset-0 z-20">
              <div 
                className="absolute inset-0 cursor-pointer"
                style={{
                  WebkitClipPath: effectiveClippingEnabled ? `url(#clip-${clipPathData.id}-${gridId})` : undefined,
                  clipPath: effectiveClippingEnabled ? `url(#clip-${clipPathData.id}-${gridId})` : undefined,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  // 초기 업로드(전체 비어있음)인 경우: 통합 업로드
                  // 이후(하나라도 이미지 존재): 해당 그리드만 단일 업로드
                  if (hasAnyImage && onSingleUpload) {
                    onSingleUpload(gridId);
                  } else if (onIntegratedUpload) {
                    onIntegratedUpload();
                  }
                }}
              >
                {/* GridB와 유사한 밝은 회색 배경 + 업로드 안내 */}
                <div className="absolute inset-0 rounded-md flex flex-col items-center justify-center z-10 gap-y-2" style={{ backgroundColor: "#F9FAFB" }}>
                  <div className="w-[26px] h-[26px] bg-[#E5E7EC] rounded-full flex items-center justify-center">
                    <Image
                      src="/report/upload.svg"
                      width={16}
                      height={16}
                      className="object-contain"
                      alt="Upload icon"
                      unoptimized={true}
                    />
                  </div>
                  <div className="text-[#8F8F8F] text-[14px] font-medium text-center mb-2 px-1">
                    이미지를 드래그하거나
                    <br />
                    클릭하여 업로드
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 클리핑 형태 이름 라벨 */}
      </div>

      {/* GridEditToolbar - element 하단 좌측에 위치 (클리핑 활성화 시에만) */}
      {(toolbarState.show || toolbarModalOpen) && effectiveClippingEnabled && !inlineEditState.active && !isReadOnly && typeof window !== 'undefined' && ReactDOM.createPortal(
        <div 
          className="grid-edit-toolbar fixed"
          style={{
            zIndex: 9999,
            pointerEvents: 'auto',
            left: toolbarPosition.left,
            top: toolbarPosition.top,
          }}
          onMouseEnter={() => {
            if (hoverTimerRef.current) {
              clearTimeout(hoverTimerRef.current);
              hoverTimerRef.current = null;
            }
            isHoveredRef.current = true;
          }}
          onMouseLeave={() => {
            isHoveredRef.current = false;
            const timer = setTimeout(() => {
              if (!isHoveredRef.current) {
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
            onRequestHideToolbar={handleHideToolbar}
            onModalStateChange={setToolbarModalOpen}
          />
        </div>,
        document.body
      )}


      {/* Keyword Input Component - 체크박스 선택 시에만 표시 */}
      {effectiveClippingEnabled && !inlineEditState.active && hasImage && isSelected && !isReadOnly && (
        <div 
          ref={photoDescriptionRef}
          className={`absolute bottom-0 left-0 right-0 z-50 p-2 photo-description-input`}
        >
          <div className="flex flex-col px-3 py-2 text-xs tracking-tight leading-none text-gray-700 bg-white rounded-lg w-full shadow-[1px_1px_10px_rgba(0,0,0,0.1)]" aria-disabled={!isSelected}>
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
                    if (hasDisplayableRecommendedKeywords) {
                      expandOnlyOne(gridId);
                    } else {
                      try { setExpanded(gridId, false); } catch (_) {}
                    }
                  }}
                  onBlur={handleKeywordBlur}
                  onKeyDown={handleKeywordKeyDown}
                  placeholder="활동주제나 관련 키워드를 입력하세요."
                  className="w-full outline-none border-none bg-transparent placeholder-zinc-400 text-zinc-800"
                  onClick={(e) => e.stopPropagation()}
                  disabled={!isSelected}
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
                    className={`flex-shrink-0 p-1 rounded transition-colors ${hasDisplayableRecommendedKeywords ? 'hover:bg-gray-100' : 'opacity-40 cursor-not-allowed'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!hasDisplayableRecommendedKeywords) {
                        return;
                      }
                      if (isRecommendedKeywordsExpanded) {
                        setExpanded(gridId, false);
                      } else {
                        expandOnlyOne(gridId);
                      }
                    }}
                    disabled={!hasDisplayableRecommendedKeywords}
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
                    {filteredRecommendedKeywords.length > 0 && (
                      <div className="max-h-[4.5rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                        <div className="flex flex-wrap gap-1.5 font-medium">
                          {filteredRecommendedKeywords.map((keyword, index) => (
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
                    {/* 모든 추천 키워드가 현재 입력/선택으로 제외된 경우 */}
                    {recommendedKeywords.length > 0 && filteredRecommendedKeywords.length === 0 && (
                      <div className="text-center text-gray-400 text-xs py-2">
                        현재 입력한 키워드를 제외한 추천 키워드가 없습니다.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>
      )}


      {/* 인라인 편집 시 외곽 어둡게 + 우측 플로팅 확대/축소/되돌리기 버튼 포털 */}
      {inlineEditState.active && typeof window !== 'undefined' && (() => {
        const el = canvasContainerRef.current;
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const gap = 8;
        const buttonSize = 40;
        const buttonsCount = 3;
        const totalHeight = buttonsCount * buttonSize + (buttonsCount - 1) * gap;
        let toolsLeft = rect.right + gap;
        let toolsTop = rect.bottom - totalHeight;
        if (toolsLeft + buttonSize > vw) {
          toolsLeft = Math.max(0, rect.left - gap - buttonSize);
        }
        toolsTop = Math.min(Math.max(0, toolsTop), Math.max(0, vh - totalHeight));

        const handleZoomIn = () => {
          setInlineEditState((prev) => ({
            ...prev,
            temp: { ...prev.temp, scale: Math.min(3, (prev.temp.scale || 1) * 1.2) },
          }));
        };
        const handleZoomOut = () => {
          setInlineEditState((prev) => ({
            ...prev,
            temp: { ...prev.temp, scale: Math.max(0.1, (prev.temp.scale || 1) / 1.2) },
          }));
        };
        const handleReset = () => {
          const base = imageTransformData || { x: 0, y: 0, scale: 1 };
          setInlineEditState((prev) => ({ ...prev, temp: { x: base.x || 0, y: base.y || 0, scale: base.scale || 1 } }));
        };

        return ReactDOM.createPortal(
          <>
            {/* 화면 전체 음영 (선택 영역 제외) */}
            <div className="fixed left-0 top-0 bg-black/40 z-[9998]" style={{ width: "100vw", height: Math.max(0, rect.top) }} />
            <div className="fixed left-0 bg-black/40 z-[9998]" style={{ top: rect.bottom, width: "100vw", height: Math.max(0, vh - rect.bottom) }} />
            <div className="fixed top-0 bg-black/40 z-[9998]" style={{ left: 0, top: rect.top, width: Math.max(0, rect.left), height: Math.max(0, rect.height) }} />
            <div className="fixed top-0 bg-black/40 z-[9998]" style={{ left: rect.right, top: rect.top, width: Math.max(0, vw - rect.right), height: Math.max(0, rect.height) }} />

            {/* 도구 버튼 - 선택 컨테이너 바로 옆 */}
            <div className="fixed z-[9999] flex flex-col gap-2" style={{ top: toolsTop, left: toolsLeft }}>
              <button
                onClick={handleZoomIn}
                className="w-10 h-10 border-2 border-[#CCCCCC] bg-white rounded-lg flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors"
                title="확대"
                style={{ pointerEvents: "auto" }}
              >
                <MdZoomIn className="w-5 h-5 text-black" />
              </button>
              <button
                onClick={handleZoomOut}
                className="w-10 h-10 bg-white border-2 border-primary rounded-lg flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors"
                title="축소"
                style={{ pointerEvents: "auto" }}
              >
                <MdZoomOut className="w-5 h-5 text-black" />
              </button>
              <button
                onClick={handleReset}
                className="w-10 h-10 bg-white border-2 border-primary rounded-lg flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors"
                title="초기화"
                style={{ pointerEvents: "auto" }}
              >
                <MdRefresh className="w-5 h-5 text-black" />
              </button>
            </div>
          </>,
          document.body
        );
      })()}

      {/* 인라인 편집 하단 적용/취소 버튼 포털 */}
      {inlineEditState.active && typeof window !== 'undefined' && ReactDOM.createPortal(
        <div className="fixed z-[10000]" style={{ left: 0, top: 0, pointerEvents: "none" }}>
          <div
            className="absolute -translate-x-1/2 flex gap-2"
            style={{
              left: (canvasContainerRef.current?.getBoundingClientRect().left || 0) + (canvasContainerRef.current?.getBoundingClientRect().width || 0) / 2,
              top: (canvasContainerRef.current?.getBoundingClientRect().bottom || 0) + 8,
            }}
          >
            <div className="flex items-center gap-2" style={{ pointerEvents: "auto" }}>
              <CommonButton color="gray" size="small" onClick={cancelInlineEdit}>취소</CommonButton>
              <CommonButton color="primary" size="small" onClick={confirmInlineEdit}>적용</CommonButton>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

export default GridCElement;
