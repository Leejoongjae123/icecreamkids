"use client";
import * as React from "react";
import * as ReactDOM from "react-dom";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import GridEditToolbar from "./GridEditToolbar";
import { Loader } from "@/components/ui/loader";
import ImageEditModal from "./ImageEditModal";
import { ImagePosition } from "../types";
import { IoClose } from "react-icons/io5";
import { MdZoomIn, MdZoomOut, MdRefresh } from "react-icons/md";
import { Button } from "@/components/common/Button";
import useUserStore from "@/hooks/store/useUserStore";
import useGridContentStore from "@/hooks/store/useGridContentStore";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useMemoCheck } from "@/hooks/useMemoCheck";
import MemoIndicator from "../components/MemoIndicator";
import { MemoEditModal } from "@/components/modal/memo-edit";
import { UploadModal } from "@/components/modal";
import useS3FileUpload from "@/hooks/useS3FileUpload";
import {
  useGetDriveItemMemos,
  useUpdateDriveItemMemo,
} from "@/service/file/fileStore";
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
  cardType?: "large" | "small"; // 카드 타입 추가
  isExpanded?: boolean; // 확장 상태 추가
  isWideCard?: boolean; // col-span-2인 경우를 위한 prop 추가
  imageCount?: number; // 초기 이미지 개수
  mode?: "single" | "multiple"; // 이미지 편집 모드
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
  mode = "single", // 이미지 편집 모드
  onDecreaseSubject, // subject 감소 함수 추가
  imagePositions: externalImagePositions = [], // 외부에서 전달받은 이미지 위치 정보
  onImagePositionsUpdate, // 이미지 위치 업데이트 핸들러
  gridCount, // 그리드 갯수
}: GridAElementProps) {
  // 사용자 정보 가져오기
  const { userInfo } = useUserStore();
  const profileId = React.useMemo(() => userInfo?.id || null, [userInfo?.id]);
  const accountId = React.useMemo(
    () => userInfo?.accountId || null,
    [userInfo?.accountId]
  );

  // 저장 상태 가져오기
  const { isSaved } = useSavedDataStore();

  // URL 파라미터 가져오기
  const searchParams = useSearchParams();

  // 각 이미지의 메모 존재 여부를 체크하는 상태
  const [memoStatuses, setMemoStatuses] = React.useState<{
    [key: string]: boolean;
  }>({});

  // 현재 메모를 편집하고자 하는 driveItemKey 상태 관리
  const [currentDriveItemKey, setCurrentDriveItemKey] =
    React.useState<string>("");
  const [isMemoOpen, setIsMemoOpen] = React.useState<boolean>(false);
  const [memoData, setMemoData] = React.useState<IEditMemoData>({
    title: "",
    memo: "",
  });

  // Grid content store 사용
  const {
    updatePlaySubject,
    updateImages,
    updateCategoryValue,
    updateDriveItemKeys,
    updateAiGenerated,
    gridContents,
  } = useGridContentStore();

  // 현재 gridId의 AI 생성 상태 확인
  const hasAiGeneratedContent = gridId
    ? gridContents[gridId]?.hasAiGenerated || false
    : false;

  // 저장 모드에서 LLM 콘텐츠가 없는 경우 숨김 처리 여부 결정
  const shouldHideInSavedMode = isSaved && !hasAiGeneratedContent;

  // Toast 및 Alert hook
  const addToast = useToast((state) => state.add);
  const { showAlert } = useAlertStore();

  // 메모 조회 및 업데이트 hooks
  const { data: driveItemMemo, refetch: refetchMemo } = useGetDriveItemMemos(
    currentDriveItemKey,
    {
      owner_account_id: accountId?.toString() || "0",
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
        title: existingMemo.title || "",
        memo: existingMemo.memo || "",
      });
    } else {
      // 메모가 없으면 초기화
      setMemoData({ title: "", memo: "" });
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
    setCurrentDriveItemKey("");
    setMemoData({ title: "", memo: "" });
  };

  // 메모 데이터 업데이트 함수
  const updateMemoData = (data: Partial<IEditMemoData>) => {
    setMemoData((prev) => ({ ...prev, ...data }));
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
          setMemoStatuses((prev) => ({
            ...prev,
            [currentDriveItemKey]: true,
          }));
        } else {
          showAlert({ message: "메모 수정에 실패하였습니다." });
        }
      } else {
        // 새 메모 생성 - API 호출
        const response = await fetch(
          `/api/file/v1/drive-items/${currentDriveItemKey}/memos?owner_account_id=${accountId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              accept: "*/*",
            },
            body: JSON.stringify({
              title: memoData.title,
              memo: memoData.memo,
            }),
          }
        );

        if (response.ok) {
          addToast({ message: "메모가 저장되었습니다." });
          await refetchMemo();
          // 메모 상태 업데이트
          setMemoStatuses((prev) => ({
            ...prev,
            [currentDriveItemKey]: true,
          }));
        } else {
          showAlert({ message: "메모 저장에 실패하였습니다." });
        }
      }
    } catch {
      showAlert({ message: "메모 저장 중 오류가 발생했습니다." });
    } finally {
      closeMemoModal();
    }
  };

  console.log("GridAElement profileId:", profileId);
  console.log("GridAElement accountId:", accountId);

  // 이미지 개수 상태 관리
  const [imageCount, setImageCount] = React.useState(propsImageCount);

  // 부모에서 전달한 이미지 개수(props)가 변경되면 내부 상태 동기화
  React.useEffect(() => {
    setImageCount(propsImageCount);
  }, [propsImageCount]);

  // 카테고리 편집 상태 관리
  const [isEditingCategory, setIsEditingCategory] = React.useState(false);
  const [categoryValue, setCategoryValue] = React.useState(category);

  // props.category 변경 시 카테고리 동기화 (API 주입 반영)
  React.useEffect(() => {
    if (typeof category === "string" && category !== categoryValue) {
      setCategoryValue(category);
    }
  }, [category]);

  // description-area 확장 상태 관리
  const [isDescriptionExpanded, setIsDescriptionExpanded] =
    React.useState(false);

  // AI 생성 로딩 상태 관리
  const [isLoading, setIsLoading] = React.useState(false);

  // 배경 제거 로딩 상태 관리 - 각 이미지별로 관리
  const [isRemoveBackgroundLoading, setIsRemoveBackgroundLoading] =
    React.useState(false);
  const [imageRemoveLoadingStates, setImageRemoveLoadingStates] =
    React.useState<{ [index: number]: boolean }>({});

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
      imageCount: imageCount,
    });
    return initialImages;
  });

  // props.images 변경 시 currentImages 동기화 (API 주입 반영)
  React.useEffect(() => {
    if (!Array.isArray(images)) {
      return;
    }
    const desired = [...images].slice(0, imageCount);
    while (desired.length < imageCount) {
      desired.push("");
    }
    const isDifferent =
      desired.length !== currentImages.length ||
      desired.some((v, i) => v !== currentImages[i]);
    if (isDifferent) {
      setCurrentImages(desired);
    }
  }, [images, imageCount]);

  // 현재 선택된 이미지 개수 계산 함수
  const getCurrentImageCount = React.useCallback((): number => {
    return currentImages.filter((img) => img && img !== "").length;
  }, [currentImages]);

  // 남은 선택 가능한 이미지 개수 계산
  const getRemainingImageCount = React.useCallback((): number => {
    const currentCount = getCurrentImageCount();
    return Math.max(0, imageCount - currentCount);
  }, [getCurrentImageCount, imageCount]);

  // 이미지 위치 정보 상태 - 외부에서 전달받은 데이터 우선 사용
  const [imagePositions, setImagePositions] = React.useState<ImagePosition[]>(
    () => {
      if (externalImagePositions.length > 0) {
        return externalImagePositions;
      }
      return Array(imageCount).fill({ x: 0, y: 0, scale: 1 });
    }
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
    originalImageIndex: 0,
  });

  // 인라인 편집 상태
  const [inlineEditState, setInlineEditState] = React.useState<{
    active: boolean;
    imageIndex: number | null;
    tempPosition: { x: number; y: number; scale: number };
    startPointer: { x: number; y: number } | null;
    mode: "drag" | "resize" | null;
    cropActive: boolean;
    cropRect?: {
      left: number;
      top: number;
      right: number;
      bottom: number;
    } | null;
    cropDraggingEdge?: "left" | "right" | "top" | "bottom" | null;
    cropStartPointer?: { x: number; y: number } | null;
    cropBounds?: {
      left: number;
      top: number;
      right: number;
      bottom: number;
    } | null;
  }>({
    active: false,
    imageIndex: null,
    tempPosition: { x: 0, y: 0, scale: 1 },
    startPointer: null,
    mode: null,
    cropActive: false,
    cropRect: null,
    cropDraggingEdge: null,
    cropStartPointer: null,
    cropBounds: null,
  });

  const imageContainerRefs = React.useRef<
    Record<number, HTMLDivElement | null>
  >({});
  const suppressClickRef = React.useRef<boolean>(false);

  const isEditingIndex = React.useCallback(
    (idx: number) =>
      inlineEditState.active && inlineEditState.imageIndex === idx,
    [inlineEditState]
  );

  const beginInlineEdit = React.useCallback(
    (imageIndex: number) => {
      const base = imagePositions[imageIndex] || { x: 0, y: 0, scale: 1 };
      setInlineEditState({
        active: true,
        imageIndex,
        tempPosition: {
          x: base.x || 0,
          y: base.y || 0,
          scale: base.scale || 1,
        },
        startPointer: null,
        mode: null,
        cropActive: false,
      });
    },
    [imagePositions]
  );

  const endInlineEditConfirm = React.useCallback(() => {
    if (!inlineEditState.active || inlineEditState.imageIndex === null) {
      setInlineEditState((prev) => ({
        ...prev,
        active: false,
        imageIndex: null,
        mode: null,
        cropActive: false,
      }));
      return;
    }
    const idx = inlineEditState.imageIndex;
    const nextPositions = [...imagePositions];
    nextPositions[idx] = {
      ...nextPositions[idx],
      ...inlineEditState.tempPosition,
    } as ImagePosition;
    setImagePositions(nextPositions);
    if (onImagePositionsUpdate) {
      onImagePositionsUpdate(nextPositions);
    }
    setInlineEditState((prev) => ({
      ...prev,
      active: false,
      imageIndex: null,
      mode: null,
      cropActive: false,
    }));
  }, [inlineEditState, imagePositions, onImagePositionsUpdate]);

  const endInlineEditCancel = React.useCallback(() => {
    setInlineEditState((prev) => ({
      ...prev,
      active: false,
      imageIndex: null,
      mode: null,
      cropActive: false,
    }));
  }, []);

  // 크롭 제어 핸들러
  const beginCrop = React.useCallback(() => {
    const idx = inlineEditState.imageIndex;
    const container = idx !== null ? imageContainerRefs.current[idx] : null;
    const imageUrl = idx !== null ? currentImages[idx] : undefined;
    if (!container || !imageUrl || idx === null) {
      setInlineEditState((prev) => ({ ...prev, cropActive: true }));
      return;
    }
    const img = document.createElement("img");
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";
    img.src = imageUrl;
    img.onload = () => {
      const rect = container.getBoundingClientRect();
      const containerW = rect.width;
      const containerH = rect.height;
      const position = isEditingIndex(idx)
        ? inlineEditState.tempPosition
        : imagePositions[idx] || { x: 0, y: 0, scale: 1 };
      const { x = 0, y = 0, scale = 1 } = position;
      // object-cover 계산 (finishCropAndUpload와 동일 로직)
      const imgAspect = img.width / img.height;
      const boxAspect = containerW / containerH;
      let drawW = containerW;
      let drawH = containerH;
      if (imgAspect > boxAspect) {
        drawH = containerH;
        drawW = drawH * imgAspect;
      } else {
        drawW = containerW;
        drawH = drawW / imgAspect;
      }
      // 스케일이 중앙 기준으로 적용되므로, 최종 좌표는 center 보정이 필요
      const scaledW = drawW * (scale || 1);
      const scaledH = drawH * (scale || 1);
      // CSS transform: translate(x, y) scale(s) 는 scale이 먼저 적용되고 translate가 마지막에 적용되므로
      // 실제 픽셀 상의 이동량은 x, y 그대로 사용해야 함 (x, y에 scale을 곱하지 않음)
      const imageLeft = containerW / 2 - scaledW / 2 + x;
      const imageTop = containerH / 2 - scaledH / 2 + y;
      const imageRight = imageLeft + scaledW;
      const imageBottom = imageTop + scaledH;
      const cropLeft = Math.max(0, imageLeft);
      const cropTop = Math.max(0, imageTop);
      const cropRight = Math.min(containerW, imageRight);
      const cropBottom = Math.min(containerH, imageBottom);
      // 초기 cropRect는 가시 이미지 외곽 그대로 설정
      const finalLeft = cropLeft;
      const finalTop = cropTop;
      const finalRight = cropRight;
      const finalBottom = cropBottom;
      setInlineEditState((prev) => ({
        ...prev,
        cropActive: true,
        cropRect: {
          left: finalLeft,
          top: finalTop,
          right: finalRight,
          bottom: finalBottom,
        },
        cropDraggingEdge: null,
        cropStartPointer: null,
        cropBounds: {
          left: cropLeft,
          top: cropTop,
          right: cropRight,
          bottom: cropBottom,
        },
      }));
    };
    img.onerror = () => {
      setInlineEditState((prev) => ({ ...prev, cropActive: true }));
    };
  }, [
    inlineEditState.imageIndex,
    inlineEditState.tempPosition,
    imagePositions,
    isEditingIndex,
    currentImages,
  ]);

  const { postFile } = useS3FileUpload();
  const finishCropAndUpload = React.useCallback(async () => {
    // 1) 현재 이미지 컨테이너 캔버스에 그려서 cropRect 기준으로 잘라 파일 생성
    const idx = inlineEditState.imageIndex;
    if (idx === null) {
      setInlineEditState((prev) => ({ ...prev, cropActive: false }));
      return;
    }
    const container = imageContainerRefs.current[idx];
    const imageUrl = currentImages[idx];
    if (!container || !imageUrl || !inlineEditState.cropRect) {
      setInlineEditState((prev) => ({ ...prev, cropActive: false }));
      return;
    }
    try {
      // 원본 이미지 로드
      const img = document.createElement("img");
      img.crossOrigin = "anonymous";
      img.referrerPolicy = "no-referrer";
      img.src = imageUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });

      // 컨테이너 크기와 이미지 렌더링 transform으로 실제 그려진 픽셀 영역 추정
      const containerRect = container.getBoundingClientRect();
      const scale = isEditingIndex(idx)
        ? inlineEditState.tempPosition.scale
        : imagePositions[idx]?.scale || 1;
      const transX = isEditingIndex(idx)
        ? inlineEditState.tempPosition.x
        : imagePositions[idx]?.x || 0;
      const transY = isEditingIndex(idx)
        ? inlineEditState.tempPosition.y
        : imagePositions[idx]?.y || 0;

      // 캔버스에 컨테이너 크기로 그린 뒤 cropRect를 캡처
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(containerRect.width));
      canvas.height = Math.max(1, Math.floor(containerRect.height));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setInlineEditState((prev) => ({ ...prev, cropActive: false }));
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // 이미지 중앙 기준으로 object-cover 비슷한 효과를 위해 scale 적용
      const imgAspect = img.width / img.height;
      const boxAspect = canvas.width / canvas.height;
      let drawW = canvas.width;
      let drawH = canvas.height;
      if (imgAspect > boxAspect) {
        drawH = canvas.height;
        drawW = drawH * imgAspect;
      } else {
        drawW = canvas.width;
        drawH = drawW / imgAspect;
      }
      // 기존 위치 변환 고려
      const dx = (canvas.width - drawW) / 2 + transX;
      const dy = (canvas.height - drawH) / 2 + transY;
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(scale || 1, scale || 1);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
      ctx.drawImage(img, dx, dy, drawW, drawH);
      ctx.restore();

      // cropRect 영역만 잘라서 새 캔버스에 복사
      const c = inlineEditState.cropRect;
      const cropW = Math.max(1, Math.floor(c.right - c.left));
      const cropH = Math.max(1, Math.floor(c.bottom - c.top));
      const cropCanvas = document.createElement("canvas");
      cropCanvas.width = cropW;
      cropCanvas.height = cropH;
      const cropCtx = cropCanvas.getContext("2d");
      if (!cropCtx) {
        setInlineEditState((prev) => ({ ...prev, cropActive: false }));
        return;
      }
      cropCtx.drawImage(
        canvas,
        Math.floor(c.left),
        Math.floor(c.top),
        cropW,
        cropH,
        0,
        0,
        cropW,
        cropH
      );

      // Blob → File 변환
      const blob: Blob | null = await new Promise((res) =>
        cropCanvas.toBlob((b) => res(b), "image/jpeg", 0.9)
      );
      if (!blob) {
        setInlineEditState((prev) => ({ ...prev, cropActive: false }));
        return;
      }
      const croppedFile = new File([blob], `cropped_${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      // 2) S3 업로드 (UploadModal에서 쓰는 동일 훅)
      const uploadRes = await postFile({
        file: croppedFile,
        fileType: "IMAGE",
        taskType: "ETC",
        thumbFile: croppedFile,
      });
      // uploadRes는 SmartFolderItemResult | FileObjectResult[]
      // SmartFolderItemResult일 때 thumbUrl/driveItemKey 사용
      let newThumbUrl: string | undefined;
      let newDriveItemKey: string | undefined;
      if (Array.isArray(uploadRes)) {
        // 썸네일 업로드 응답일 가능성. 본 파일 업로드 시에는 SmartFolderItemResult로 반환됨
      } else if (uploadRes) {
        const anyRes = uploadRes as any;
        newThumbUrl =
          anyRes.thumbUrl || anyRes?.driveItemResult?.thumbUrl || undefined;
        newDriveItemKey =
          anyRes.driveItemKey || anyRes?.driveItemResult?.key || undefined;
      }

      if (newThumbUrl) {
        setCurrentImages((prev) => {
          const next = [...prev];
          next[idx] = newThumbUrl as string;
          return next;
        });
        // 메타데이터 동기화
        setImageMetadata((prev) => {
          const next = [...prev];
          const currentUrl = currentImages[idx];
          const filtered = next.filter((m) => m.url !== currentUrl);
          return [
            ...filtered,
            { url: newThumbUrl as string, driveItemKey: newDriveItemKey },
          ];
        });
        // 외부 store 동기화 (항상 배열로 업데이트)
        if (gridId && newThumbUrl) {
          const existingImages = Array.isArray(gridContents[gridId]?.imageUrls)
            ? [...(gridContents[gridId]?.imageUrls as string[])]
            : [];
          while (existingImages.length < imageCount) existingImages.push("");
          if (idx < existingImages.length)
            existingImages[idx] = newThumbUrl as string;
          updateImages(gridId, existingImages.slice(0, imageCount));

          if (newDriveItemKey) {
            const existingKeys = Array.isArray(
              gridContents[gridId]?.driveItemKeys
            )
              ? [...(gridContents[gridId]?.driveItemKeys as string[])]
              : [];
            while (existingKeys.length < imageCount) existingKeys.push("");
            if (idx < existingKeys.length)
              existingKeys[idx] = newDriveItemKey as string;
            updateDriveItemKeys(gridId, existingKeys.slice(0, imageCount));
          }
        }
        // 크롭 완료 후 현재 프레임(위치/스케일)을 그대로 유지하여 사용자가 보던 상태를 보존
        // 별도의 위치/스케일 초기화를 수행하지 않습니다.
      } else {
        // thumbUrl이 없을 경우, 업로드 직후 일시적으로 로컬 미리보기 유지
        const localUrl = URL.createObjectURL(croppedFile);
        setCurrentImages((prev) => {
          const next = [...prev];
          next[idx] = localUrl;
          return next;
        });
        // 로컬 미리보기인 경우도 동일하게 현재 위치/스케일을 유지합니다.
      }
    } finally {
      setInlineEditState((prev) => ({
        ...prev,
        cropActive: false,
        cropRect: null,
      }));
    }
  }, [
    inlineEditState.imageIndex,
    inlineEditState.cropRect,
    inlineEditState.tempPosition,
    imagePositions,
    isEditingIndex,
    currentImages,
    postFile,
    gridId,
    updateImages,
    updateDriveItemKeys,
  ]);

  const cancelCrop = React.useCallback(() => {
    setInlineEditState((prev) => ({
      ...prev,
      cropActive: false,
      cropRect: null,
      cropDraggingEdge: null,
      cropStartPointer: null,
    }));
  }, []);

  const onEditMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      if (!inlineEditState.active || inlineEditState.imageIndex === null)
        return;
      const target = e.target as HTMLElement;
      if (target?.dataset?.handle) return;
      e.preventDefault();
      e.stopPropagation();
      suppressClickRef.current = false;
      setInlineEditState((prev) => ({
        ...prev,
        startPointer: { x: e.clientX, y: e.clientY },
        mode: "drag",
      }));
      const onMove = (ev: MouseEvent) => {
        setInlineEditState((prev) => {
          if (!prev.startPointer) return prev;
          const dx = ev.clientX - prev.startPointer.x;
          const dy = ev.clientY - prev.startPointer.y;
          if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
            suppressClickRef.current = true;
          }
          return {
            ...prev,
            startPointer: { x: ev.clientX, y: ev.clientY },
            tempPosition: {
              x: prev.tempPosition.x + dx,
              y: prev.tempPosition.y + dy,
              scale: prev.tempPosition.scale,
            },
          };
        });
      };
      const onUp = () => {
        setInlineEditState((prev) => {
          if (prev.imageIndex !== null) {
            const idx = prev.imageIndex;
            const nextPositions = [...imagePositions];
            nextPositions[idx] = {
              ...nextPositions[idx],
              ...prev.tempPosition,
            } as ImagePosition;
            setImagePositions(nextPositions);
            if (onImagePositionsUpdate) {
              onImagePositionsUpdate(nextPositions);
            }
          }
          return { ...prev, startPointer: null, mode: null };
        });
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [
      inlineEditState.active,
      inlineEditState.imageIndex,
      imagePositions,
      onImagePositionsUpdate,
    ]
  );

  const onResizeHandleDown = React.useCallback(
    (e: React.MouseEvent, corner: "tl" | "tr" | "bl" | "br") => {
      if (!inlineEditState.active) return;
      e.preventDefault();
      e.stopPropagation();
      setInlineEditState((prev) => ({
        ...prev,
        startPointer: { x: e.clientX, y: e.clientY },
        mode: "resize",
      }));
      const onMove = (ev: MouseEvent) => {
        setInlineEditState((prev) => {
          if (!prev.startPointer) return prev;
          if (prev.cropActive && prev.cropRect) {
            // 크롭 모드에서는 핸들 대신 바를 드래그해 조절하므로 여기서는 패스
            return prev;
          }
          const dy = ev.clientY - prev.startPointer.y;
          const dx = ev.clientX - prev.startPointer.x;
          const delta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
          const newScale = Math.max(
            0.2,
            Math.min(5, prev.tempPosition.scale + delta * 0.005)
          );
          return {
            ...prev,
            startPointer: { x: ev.clientX, y: ev.clientY },
            tempPosition: { ...prev.tempPosition, scale: newScale },
          };
        });
      };
      const onUp = () => {
        setInlineEditState((prev) => {
          if (prev.imageIndex !== null) {
            const idx = prev.imageIndex;
            const nextPositions = [...imagePositions];
            nextPositions[idx] = {
              ...nextPositions[idx],
              ...prev.tempPosition,
            } as ImagePosition;
            setImagePositions(nextPositions);
            if (onImagePositionsUpdate) {
              onImagePositionsUpdate(nextPositions);
            }
          }
          return { ...prev, startPointer: null, mode: null };
        });
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [inlineEditState.active, imagePositions, onImagePositionsUpdate]
  );

  // 편집 도구 버튼 + 화면 오버레이 (선택 영역 제외) Portal 컴포넌트
  const EditToolsPortal: React.FC = () => {
    const [viewportTick, setViewportTick] = React.useState(0);

    // 스크롤/리사이즈 시 버튼/오버레이 재계산
    React.useEffect(() => {
      const onUpdate = () => setViewportTick((v) => v + 1);
      window.addEventListener("scroll", onUpdate, true);
      window.addEventListener("resize", onUpdate);
      return () => {
        window.removeEventListener("scroll", onUpdate, true);
        window.removeEventListener("resize", onUpdate);
      };
    }, []);

    if (!inlineEditState.active || inlineEditState.imageIndex === null)
      return null;

    const activeIdx = inlineEditState.imageIndex;
    const el = imageContainerRefs.current[activeIdx];
    if (!el) return null;

    const rect = el.getBoundingClientRect();
    const vw = typeof window !== "undefined" ? window.innerWidth : 0;
    const vh = typeof window !== "undefined" ? window.innerHeight : 0;
    const gap = 8;
    const buttonSize = 40; // 40px 버튼 폭
    const buttonsCount = 3; // 확대/축소/리셋 버튼 수
    const totalHeight = buttonsCount * buttonSize + (buttonsCount - 1) * gap;

    // 오버레이 내측 라운드를 위한 요소의 border-radius 추출 (없으면 md 수준 기본값)
    const computedStyle =
      typeof window !== "undefined"
        ? window.getComputedStyle(el)
        : ({} as CSSStyleDeclaration);
    const parsePx = (v: string | undefined) => {
      const n = v ? parseFloat(v) : 0;
      return Number.isFinite(n) ? n : 0;
    };
    const defaultRadius = 6; // rounded-md 대략 6px
    const rTL = parsePx(computedStyle?.borderTopLeftRadius) || defaultRadius;
    const rTR = parsePx(computedStyle?.borderTopRightRadius) || defaultRadius;
    const rBL = parsePx(computedStyle?.borderBottomLeftRadius) || defaultRadius;
    const rBR =
      parsePx(computedStyle?.borderBottomRightRadius) || defaultRadius;

    // 기본은 우측에 배치. 공간이 부족하면 좌측으로 배치
    let toolsLeft = rect.right + gap;
    let toolsTop = rect.bottom - totalHeight; // 마지막(리프레시) 버튼의 하단을 요소 하단과 정렬
    if (toolsLeft + buttonSize > vw) {
      toolsLeft = Math.max(0, rect.left - gap - buttonSize);
    }
    // 화면 경계 보정
    toolsTop = Math.min(Math.max(0, toolsTop), Math.max(0, vh - totalHeight));

    const handleZoomIn = () => {
      setInlineEditState((prev) => ({
        ...prev,
        tempPosition: {
          ...prev.tempPosition,
          scale: Math.min(3, prev.tempPosition.scale * 1.2),
        },
      }));
    };
    const handleZoomOut = () => {
      setInlineEditState((prev) => ({
        ...prev,
        tempPosition: {
          ...prev.tempPosition,
          scale: Math.max(0.1, prev.tempPosition.scale / 1.2),
        },
      }));
    };
    const handleReset = () => {
      const imageIdx = inlineEditState.imageIndex;
      if (imageIdx === null) return;
      const originalPosition = imagePositions[imageIdx] || {
        x: 0,
        y: 0,
        scale: 1,
      };
      setInlineEditState((prev) => ({
        ...prev,
        tempPosition: { ...originalPosition },
      }));
    };

    // 키보드 + / - 로 확대/축소
    React.useEffect(() => {
      const onKeyDown = (e: KeyboardEvent) => {
        if (!inlineEditState.active) return;
        const target = e.target as HTMLElement | null;
        const tag = target ? target.tagName.toLowerCase() : "";
        if (
          target &&
          (tag === "input" || tag === "textarea" || target.isContentEditable)
        )
          return;

        const isZoomIn =
          e.key === "+" ||
          (e.code === "Equal" && e.shiftKey) ||
          e.code === "NumpadAdd";
        const isZoomOut =
          e.key === "-" || e.code === "Minus" || e.code === "NumpadSubtract";

        if (isZoomIn) {
          e.preventDefault();
          setInlineEditState((prev) => ({
            ...prev,
            tempPosition: {
              ...prev.tempPosition,
              scale: Math.min(3, prev.tempPosition.scale * 1.2),
            },
          }));
        } else if (isZoomOut) {
          e.preventDefault();
          setInlineEditState((prev) => ({
            ...prev,
            tempPosition: {
              ...prev.tempPosition,
              scale: Math.max(0.1, prev.tempPosition.scale / 1.2),
            },
          }));
        }
      };
      document.addEventListener("keydown", onKeyDown);
      return () => {
        document.removeEventListener("keydown", onKeyDown);
      };
    }, [inlineEditState.active, setInlineEditState]);

    return ReactDOM.createPortal(
      <>
        {/* 화면 전체 음영 (선택 영역 제외) */}
        {/* 상단 */}
        <div
          className="fixed left-0 top-0 bg-black/40 z-[9998]"
          style={{
            width: "100vw",
            height: Math.max(0, rect.top),
          }}
        />
        {/* 하단 */}
        <div
          className="fixed left-0 bg-black/40 z-[9998]"
          style={{
            top: rect.bottom,
            width: "100vw",
            height: Math.max(0, vh - rect.bottom),
          }}
        />
        {/* 좌측 */}
        <div
          className="fixed top-0 bg-black/40 z-[9998]"
          style={{
            left: 0,
            top: rect.top,
            width: Math.max(0, rect.left),
            height: Math.max(0, rect.height),
          }}
        />
        {/* 우측 */}
        <div
          className="fixed top-0 bg-black/40 z-[9998]"
          style={{
            left: rect.right,
            top: rect.top,
            width: Math.max(0, vw - rect.right),
            height: Math.max(0, rect.height),
          }}
        />

        {/* 도구 버튼 - 선택 컨테이너 바로 옆 */}
        <div
          className="fixed z-[9999] flex flex-col gap-2"
          style={{ top: toolsTop, left: toolsLeft }}
        >
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 border-1 border-[#CCCCCC] bg-white border-2 rounded-lg flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors"
            title="확대"
          >
            <MdZoomIn className="w-5 h-5 text-black" />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 bg-white border-2 border-primary rounded-lg flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors"
            title="축소"
          >
            <MdZoomOut className="w-5 h-5 text-black" />
          </button>
          <button
            onClick={handleReset}
            className="w-10 h-10 bg-white border-2 border-primary rounded-lg flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors"
            title="초기화"
          >
            <MdRefresh className="w-5 h-5 text-black" />
          </button>
        </div>
      </>,
      document.body
    );
  };

  const renderResizeHandles = React.useCallback(
    (idx: number) => {
      if (!isEditingIndex(idx)) return null;

      // 드래그 핸들을 이용한 사이즈 수정 기능은 제거
      // 크롭 기능만 유지
      if (inlineEditState.cropActive && inlineEditState.cropRect) {
        return (
          <div className="absolute inset-0 z-50 pointer-events-none">
            {/* 크롭 사각형 윤곽선 */}
            <div
              className="absolute border-2 border-dotted border-[#3D8BFF] rounded-sm pointer-events-none"
              style={{
                left: inlineEditState.cropRect.left,
                top: inlineEditState.cropRect.top,
                width: Math.max(
                  0,
                  inlineEditState.cropRect.right - inlineEditState.cropRect.left
                ),
                height: Math.max(
                  0,
                  inlineEditState.cropRect.bottom - inlineEditState.cropRect.top
                ),
              }}
            />
            {/* 상단 핸들 */}
            <div
              className="absolute bg-white border-2 border-[#3D8BFF] rounded-sm shadow-sm pointer-events-auto cursor-n-resize"
              style={{
                width: 15,
                height: 8,
                top: inlineEditState.cropRect.top - 4,
                left:
                  (inlineEditState.cropRect.left +
                    inlineEditState.cropRect.right) /
                    2 -
                  7.5,
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setInlineEditState((prev) => ({
                  ...prev,
                  cropDraggingEdge: "top",
                  cropStartPointer: { x: e.clientX, y: e.clientY },
                }));
                const onMove = (ev: MouseEvent) => {
                  setInlineEditState((prev) => {
                    if (
                      !prev.cropRect ||
                      prev.cropDraggingEdge !== "top" ||
                      !prev.cropStartPointer
                    )
                      return prev;
                    const dy = ev.clientY - prev.cropStartPointer.y;
                    const boundTop = prev.cropBounds ? prev.cropBounds.top : 0;
                    const nextTop = Math.max(
                      boundTop,
                      Math.min(
                        prev.cropRect.top + dy,
                        prev.cropRect.bottom - 15
                      )
                    );
                    return {
                      ...prev,
                      cropRect: { ...prev.cropRect, top: nextTop },
                      cropStartPointer: { x: ev.clientX, y: ev.clientY },
                    };
                  });
                };
                const onUp = () => {
                  setInlineEditState((prev) => ({
                    ...prev,
                    cropDraggingEdge: null,
                    cropStartPointer: null,
                  }));
                  window.removeEventListener("mousemove", onMove);
                  window.removeEventListener("mouseup", onUp);
                };
                window.addEventListener("mousemove", onMove);
                window.addEventListener("mouseup", onUp);
              }}
            />
            {/* 하단 핸들 */}
            <div
              className="absolute bg-white border-2 border-[#3D8BFF] rounded-sm shadow-sm pointer-events-auto cursor-s-resize"
              style={{
                width: 15,
                height: 8,
                top: inlineEditState.cropRect.bottom - 4,
                left:
                  (inlineEditState.cropRect.left +
                    inlineEditState.cropRect.right) /
                    2 -
                  7.5,
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setInlineEditState((prev) => ({
                  ...prev,
                  cropDraggingEdge: "bottom",
                  cropStartPointer: { x: e.clientX, y: e.clientY },
                }));
                const onMove = (ev: MouseEvent) => {
                  setInlineEditState((prev) => {
                    if (
                      !prev.cropRect ||
                      prev.cropDraggingEdge !== "bottom" ||
                      !prev.cropStartPointer
                    )
                      return prev;
                    const dy = ev.clientY - prev.cropStartPointer.y;
                    const boundBottom = prev.cropBounds
                      ? prev.cropBounds.bottom
                      : Number.POSITIVE_INFINITY;
                    const nextBottom = Math.min(
                      boundBottom,
                      Math.max(
                        prev.cropRect.top + 15,
                        prev.cropRect.bottom + dy
                      )
                    );
                    return {
                      ...prev,
                      cropRect: { ...prev.cropRect, bottom: nextBottom },
                      cropStartPointer: { x: ev.clientX, y: ev.clientY },
                    };
                  });
                };
                const onUp = () => {
                  setInlineEditState((prev) => ({
                    ...prev,
                    cropDraggingEdge: null,
                    cropStartPointer: null,
                  }));
                  window.removeEventListener("mousemove", onMove);
                  window.removeEventListener("mouseup", onUp);
                };
                window.addEventListener("mousemove", onMove);
                window.addEventListener("mouseup", onUp);
              }}
            />
            {/* 좌측 핸들 */}
            <div
              className="absolute bg-white border-2 border-[#3D8BFF] rounded-sm shadow-sm pointer-events-auto cursor-w-resize"
              style={{
                width: 8,
                height: 15,
                left: inlineEditState.cropRect.left - 4,
                top:
                  (inlineEditState.cropRect.top +
                    inlineEditState.cropRect.bottom) /
                    2 -
                  7.5,
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setInlineEditState((prev) => ({
                  ...prev,
                  cropDraggingEdge: "left",
                  cropStartPointer: { x: e.clientX, y: e.clientY },
                }));
                const onMove = (ev: MouseEvent) => {
                  setInlineEditState((prev) => {
                    if (
                      !prev.cropRect ||
                      prev.cropDraggingEdge !== "left" ||
                      !prev.cropStartPointer
                    )
                      return prev;
                    const dx = ev.clientX - prev.cropStartPointer.x;
                    const boundLeft = prev.cropBounds
                      ? prev.cropBounds.left
                      : 0;
                    const nextLeft = Math.max(
                      boundLeft,
                      Math.min(
                        prev.cropRect.left + dx,
                        prev.cropRect.right - 15
                      )
                    );
                    return {
                      ...prev,
                      cropRect: { ...prev.cropRect, left: nextLeft },
                      cropStartPointer: { x: ev.clientX, y: ev.clientY },
                    };
                  });
                };
                const onUp = () => {
                  setInlineEditState((prev) => ({
                    ...prev,
                    cropDraggingEdge: null,
                    cropStartPointer: null,
                  }));
                  window.removeEventListener("mousemove", onMove);
                  window.removeEventListener("mouseup", onUp);
                };
                window.addEventListener("mousemove", onMove);
                window.addEventListener("mouseup", onUp);
              }}
            />
            {/* 우측 핸들 */}
            <div
              className="absolute bg-white border-2 border-[#3D8BFF] rounded-sm shadow-sm pointer-events-auto cursor-e-resize"
              style={{
                width: 8,
                height: 15,
                left: inlineEditState.cropRect.right - 4,
                top:
                  (inlineEditState.cropRect.top +
                    inlineEditState.cropRect.bottom) /
                    2 -
                  7.5,
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setInlineEditState((prev) => ({
                  ...prev,
                  cropDraggingEdge: "right",
                  cropStartPointer: { x: e.clientX, y: e.clientY },
                }));
                const onMove = (ev: MouseEvent) => {
                  setInlineEditState((prev) => {
                    if (
                      !prev.cropRect ||
                      prev.cropDraggingEdge !== "right" ||
                      !prev.cropStartPointer
                    )
                      return prev;
                    const dx = ev.clientX - prev.cropStartPointer.x;
                    const boundRight = prev.cropBounds
                      ? prev.cropBounds.right
                      : Number.POSITIVE_INFINITY;
                    const nextRight = Math.min(
                      boundRight,
                      Math.max(
                        prev.cropRect.left + 15,
                        prev.cropRect.right + dx
                      )
                    );
                    return {
                      ...prev,
                      cropRect: { ...prev.cropRect, right: nextRight },
                      cropStartPointer: { x: ev.clientX, y: ev.clientY },
                    };
                  });
                };
                const onUp = () => {
                  setInlineEditState((prev) => ({
                    ...prev,
                    cropDraggingEdge: null,
                    cropStartPointer: null,
                  }));
                  window.removeEventListener("mousemove", onMove);
                  window.removeEventListener("mouseup", onUp);
                };
                window.addEventListener("mousemove", onMove);
                window.addEventListener("mouseup", onUp);
              }}
            />
          </div>
        );
      }

      return null;
    },
    [isEditingIndex, inlineEditState]
  );

  // 이미지 업로드 관련 상태
  const [uploadedFiles, setUploadedFiles] = React.useState<File[]>([]);

  // 이미지 메타데이터 상태 (driveItemKey 포함)
  const [imageMetadata, setImageMetadata] = React.useState<
    { url: string; driveItemKey?: string }[]
  >([]);

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
      console.log("📥 이미지 업로드 완료:", files);

      const imageUrls: string[] = [];
      const metadata: { url: string; driveItemKey?: string }[] = [];

      files.forEach((item) => {
        if (item instanceof File) {
          // File 타입인 경우
          const fileUrl = URL.createObjectURL(item);
          imageUrls.push(fileUrl);
          metadata.push({
            url: fileUrl,
            driveItemKey: `local_${Date.now()}_${Math.random()}`,
          });
          setUploadedFiles((prev) => [...prev, item]);
        } else if (item && typeof item === "object" && item.thumbUrl) {
          // SmartFolderItemResult 타입인 경우
          imageUrls.push(item.thumbUrl);
          metadata.push({
            url: item.thumbUrl,
            driveItemKey: item.driveItemKey,
          });
        }
      });

      // 이미지 메타데이터 업데이트
      setImageMetadata((prev) => [...prev, ...metadata]);

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
  const getDriveItemKeyByImageUrl = React.useCallback(
    (imageUrl: string): string | undefined => {
      const metadata = imageMetadata.find((item) => item.url === imageUrl);
      return metadata?.driveItemKey;
    },
    [imageMetadata]
  );

  // 이미지 메타데이터가 변경될 때마다 메모 상태 체크 (동일 키 세트는 스킵)
  const lastMemoKeysRef = React.useRef<string>("");
  React.useEffect(() => {
    const keys = imageMetadata
      .map((m) => m.driveItemKey)
      .filter(
        (k): k is string =>
          typeof k === "string" && k.length > 0 && !k.startsWith("local_")
      )
      .sort();

    if (!userInfo?.accountId || keys.length === 0) {
      return;
    }

    const signature = keys.join(",");
    if (signature === lastMemoKeysRef.current) {
      return;
    }
    lastMemoKeysRef.current = signature;

    let aborted = false;
    const controller = new AbortController();

    const checkMemosForImages = async () => {
      try {
        const promises = keys.map(async (driveItemKey) => {
          try {
            const response = await fetch(
              `/api/file/v1/drive-items/${driveItemKey}/memos?owner_account_id=${userInfo.accountId}`,
              {
                method: "GET",
                headers: { accept: "*/*" },
                signal: controller.signal,
              }
            );
            if (!response.ok) return null;
            const data = await response.json();
            const memoExists = Array.isArray(data.result)
              ? data.result.length > 0
              : false;
            return { driveItemKey, hasMemo: memoExists } as {
              driveItemKey: string;
              hasMemo: boolean;
            } | null;
          } catch {
            return null;
          }
        });

        const results = await Promise.all(promises);
        if (aborted) return;

        setMemoStatuses((prev) => {
          let changed = false;
          const next = { ...prev } as { [key: string]: boolean };
          results.forEach((r) => {
            if (!r) return;
            if (next[r.driveItemKey] !== r.hasMemo) {
              next[r.driveItemKey] = r.hasMemo;
              changed = true;
            }
          });
          return changed ? next : prev;
        });
      } catch {}
    };
    checkMemosForImages();

    return () => {
      aborted = true;
      controller.abort();
    };
  }, [imageMetadata, userInfo?.accountId]);

  // 여러 이미지 추가 핸들러
  const handleImagesAdded = React.useCallback(
    (imageUrls: string[]) => {
      console.log("📥 GridAElement에서 여러 이미지 받음:", imageUrls);
      console.log("📏 현재 imageCount:", imageCount);

      setCurrentImages((prev) => {
        const newImages = [...prev];

        // 받은 이미지 개수를 imageCount로 제한
        const limitedImageUrls = Array.isArray(imageUrls)
          ? imageUrls.slice(0, imageCount)
          : [];

        // 받은 이미지들을 순서대로 빈 슬롯에 배치
        let imageUrlIndex = 0;
        for (
          let i = 0;
          i < newImages.length && imageUrlIndex < limitedImageUrls.length;
          i++
        ) {
          if (!newImages[i] || newImages[i] === "") {
            newImages[i] = limitedImageUrls[imageUrlIndex];
            imageUrlIndex++;
          }
        }

        // 아직 배치할 이미지가 남아있다면, 기존 이미지가 있는 슬롯도 덮어씀
        if (imageUrlIndex < limitedImageUrls.length) {
          for (
            let i = 0;
            i < newImages.length && imageUrlIndex < limitedImageUrls.length;
            i++
          ) {
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
          imageCount: imageCount,
        });

        // driveItemKeys도 함께 업데이트
        const driveItemKeys = finalImages
          .map((imageUrl) => {
            if (!imageUrl || imageUrl === "") {
              return "";
            }
            return getDriveItemKeyByImageUrl(imageUrl) || "";
          })
          .filter((key) => key !== "");

        console.log("📊 driveItemKeys 추출:", {
          finalImages,
          driveItemKeys,
          imageMetadata,
        });

        // Grid content store 업데이트
        if (gridId) {
          updateDriveItemKeys(gridId, driveItemKeys);
        }

        return finalImages;
      });
    },
    [imageCount, getDriveItemKeyByImageUrl, updateDriveItemKeys, gridId]
  );

  // 개별 이미지 추가 핸들러
  const handleSingleImageAdded = React.useCallback(
    (hasImage: boolean, imageIndex: number) => {
      console.log(`📥 개별 이미지 ${imageIndex} 변경:`, hasImage);
    },
    []
  );

  // imageCount 변경 시 currentImages와 imagePositions, imageMetadata 업데이트
  React.useEffect(() => {
    console.log("🔄 imageCount 변경됨:", imageCount);

    setCurrentImages((prev) => {
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
        imageCount: imageCount,
      });

      return limitedImages;
    });

    setImagePositions((prev) => {
      const newPositions = [...prev];
      // 이미지 개수가 증가한 경우 기본 위치 정보 추가
      while (newPositions.length < imageCount) {
        newPositions.push({ x: 0, y: 0, scale: 1 });
      }
      // 이미지 개수가 감소한 경우 배열 크기 조정
      return newPositions.slice(0, imageCount);
    });

    // 이미지 메타데이터도 imageCount에 맞게 조정
    setImageMetadata((prev) => {
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
        return cardType === "small" ? "grid-cols-2 grid-rows-2" : "grid-cols-3";
      case 4:
        // A타입 large 카드일 때는 가로로 4개 배치
        return cardType === "large" ? "grid-cols-4" : "grid-cols-2";
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
  const [actualTargetFrame, setActualTargetFrame] = React.useState<
    { width: number; height: number; x: number; y: number } | undefined
  >(undefined);

  // 개별 이미지 셀 크기 측정 함수 - 특정 인덱스의 이미지 크기 계산
  const measureImageCellSize = React.useCallback(
    (imageIndex: number) => {
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
          cellX = containerRect.left + imageIndex * (cellWidth + gap);

          const targetFrame = {
            width: Math.round(cellWidth),
            height: Math.round(cellHeight),
            x: Math.round(cellX),
            y: Math.round(cellY),
          };

          console.log(
            `📏 gridCount=2, imageCount=4 이미지 ${imageIndex} 실제 측정된 셀 크기:`,
            {
              imageCount,
              gridCount,
              imageIndex,
              containerSize: {
                width: containerRect.width,
                height: containerRect.height,
              },
              cellSize: targetFrame,
            }
          );

          return targetFrame;
        }

        switch (imageCount) {
          case 1:
            // 단일 이미지는 전체 영역 사용
            break;
          case 2:
            // 2개 이미지는 가로로 분할 (grid-cols-2)
            cellWidth = (containerRect.width - gap) / 2;
            cellX = containerRect.left + imageIndex * (cellWidth + gap);
            break;
          case 3:
            if (cardType === "small") {
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
              cellX = containerRect.left + imageIndex * (cellWidth + gap);
            }
            break;
          case 4:
            if (cardType === "large") {
              // large 카드는 가로 4개 (grid-cols-4)
              cellWidth = (containerRect.width - gap * 3) / 4;
              cellX = containerRect.left + imageIndex * (cellWidth + gap);
            } else {
              // 일반 카드는 2x2 (grid-cols-2)
              cellWidth = (containerRect.width - gap) / 2;
              cellHeight = (containerRect.height - gap) / 2;
              cellX = containerRect.left + (imageIndex % 2) * (cellWidth + gap);
              cellY =
                containerRect.top +
                Math.floor(imageIndex / 2) * (cellHeight + gap);
            }
            break;
          case 6:
            // 3x2 그리드 (grid-cols-3)
            cellWidth = (containerRect.width - gap * 2) / 3;
            cellHeight = (containerRect.height - gap) / 2;
            cellX = containerRect.left + (imageIndex % 3) * (cellWidth + gap);
            cellY =
              containerRect.top +
              Math.floor(imageIndex / 3) * (cellHeight + gap);
            break;
          case 9:
            // 3x3 그리드 (grid-cols-3)
            cellWidth = (containerRect.width - gap * 2) / 3;
            cellHeight = (containerRect.height - gap * 2) / 3;
            cellX = containerRect.left + (imageIndex % 3) * (cellWidth + gap);
            cellY =
              containerRect.top +
              Math.floor(imageIndex / 3) * (cellHeight + gap);
            break;
        }

        const targetFrame = {
          width: Math.round(cellWidth),
          height: Math.round(cellHeight),
          x: Math.round(cellX),
          y: Math.round(cellY),
        };

        console.log(`📏 이미지 ${imageIndex} 실제 측정된 셀 크기:`, {
          imageCount,
          cardType,
          imageIndex,
          containerSize: {
            width: containerRect.width,
            height: containerRect.height,
          },
          cellSize: targetFrame,
        });

        return targetFrame;
      }
      return undefined;
    },
    [imageCount, cardType]
  );

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

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [measureSingleImageCellSize, cardType, isWideCard, imageCount]);

  // 특정 이미지 인덱스의 영역 크기를 계산하여 비율 반환
  const getImageAreaRatio = React.useCallback(
    (imageIndex: number = 0) => {
      // 실제 측정된 크기가 있으면 그것을 사용
      const actualFrame = measureImageCellSize(imageIndex);
      if (actualFrame) {
        return {
          width: actualFrame.width,
          height: actualFrame.height,
          aspectRatio: actualFrame.width / actualFrame.height,
        };
      }

      // 실제 측정 크기가 없을 때만 추정 크기 사용 (fallback)
      let baseWidth = 180; // 기본 카드 폭
      let baseHeight = 120; // 기본 카드 높이

      // cardType에 따른 크기 조정
      if (cardType === "large") {
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
          aspectRatio: imageWidth / imageHeight,
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
          if (cardType === "small") {
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
          if (cardType === "large") {
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
        aspectRatio: imageWidth / imageHeight,
      };
    },
    [measureImageCellSize, cardType, isWideCard, imageCount]
  );

  // 키워드 입력 (소형 Input)
  const [keywords, setKeywords] = React.useState("");
  // LLM 생성/설명 텍스트 (description-area textarea)
  const [descriptionText, setDescriptionText] = React.useState("");

  // store의 playSubjectText 변화 시 descriptionText 동기화 (API 주입 반영)
  React.useEffect(() => {
    if (!gridId) return;
    const storeText = gridContents[gridId]?.playSubjectText ?? "";
    if (storeText !== descriptionText) {
      setDescriptionText(storeText);
      if (typeof storeText === "string" && storeText.trim() !== "") {
        setHasClickedAIGenerate(true);
        setIsDescriptionExpanded(true);
        // 스토어의 AI 생성 플래그도 업데이트
        updateAiGenerated(gridId, true);
      }
    }
  }, [gridId, gridContents, descriptionText, updateAiGenerated]);

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
  const [toolbarPosition, setToolbarPosition] = React.useState({
    left: 0,
    top: 0,
  });

  // 컨테이너 ref
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Default images if none provided - imageCount에 맞게 동적으로 생성
  const defaultImages = React.useMemo(() => {
    return Array(imageCount).fill("");
  }, [imageCount]);

  const displayImages = images.length > 0 ? images : defaultImages;

  // currentImages가 변경될 때에만 store 업데이트 (gridContents 변경으로 인한 재호출 방지)
  React.useEffect(() => {
    if (!gridId) return;
    const validImages = currentImages.filter((img) => img && img !== "");

    // API에서 주입된 이미지가 이미 store에 존재하는 경우, 빈 값으로 덮어쓰지 않음 (API 우선)
    if (validImages.length === 0) {
      const existingStoreImagesRaw = gridContents[gridId]?.imageUrls;
      const existingStoreImages = Array.isArray(existingStoreImagesRaw)
        ? existingStoreImagesRaw
        : [];
      if (existingStoreImages.length > 0) {
        return;
      }
      // store에도 아무 이미지가 없으면 굳이 업데이트하지 않음
      return;
    }

    const storeImagesRaw = gridContents[gridId]?.imageUrls;
    const storeImages = Array.isArray(storeImagesRaw) ? storeImagesRaw : [];
    // 스토어(=API 주입)의 이미지 개수보다 적은 수로는 덮어쓰지 않음 (다운사이즈 방지)
    if (storeImages.length > validImages.length) {
      return;
    }
    const imagesEqual =
      storeImages.length === validImages.length &&
      storeImages.every((v: string, i: number) => v === validImages[i]);
    if (!imagesEqual) {
      updateImages(gridId, validImages);
    }

    const driveItemKeys = validImages
      .map((imageUrl) => getDriveItemKeyByImageUrl(imageUrl) || "")
      .filter((key) => key !== "");
    if (driveItemKeys.length > 0) {
      const storeKeysRaw = gridContents[gridId]?.driveItemKeys;
      const storeKeys = Array.isArray(storeKeysRaw) ? storeKeysRaw : [];
      const keysEqual =
        storeKeys.length === driveItemKeys.length &&
        storeKeys.every((v: string, i: number) => v === driveItemKeys[i]);
      if (!keysEqual) {
        updateDriveItemKeys(gridId, driveItemKeys);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentImages]);

  // 스토어(API 주입)의 이미지 개수가 현재 imageCount보다 많으면 imageCount를 올려 동기화 (최대 3)
  React.useEffect(() => {
    if (!gridId) return;
    const storeImagesRaw = gridContents[gridId]?.imageUrls;
    const storeImages = Array.isArray(storeImagesRaw) ? storeImagesRaw : [];
    const storeCount = storeImages.length;
    if (storeCount > 0) {
      const desired = Math.min(3, storeCount);
      if (desired !== imageCount) {
        setImageCount(desired);
      }
    }
  }, [gridId, gridContents, imageCount]);

  // store의 driveItemKeys와 imageUrls를 imageMetadata에 주입 (API 초기값 반영)
  React.useEffect(() => {
    if (!gridId) return;
    const content = gridContents[gridId];
    // imageCount를 초과하는 항목은 주입하지 않음 (무한 루프 방지)
    const urls = Array.isArray(content?.imageUrls)
      ? content.imageUrls.slice(0, imageCount)
      : [];
    const keys = Array.isArray(content?.driveItemKeys)
      ? content.driveItemKeys.slice(0, imageCount)
      : [];
    if (urls.length === 0 || keys.length === 0) {
      return;
    }
    // 현재 imageMetadata와 비교하여 필요한 경우에만 업데이트
    let needUpdate = false;
    for (let i = 0; i < Math.min(urls.length, keys.length); i++) {
      const u = urls[i];
      const k = keys[i];
      if (!u || !k || k.startsWith("local_")) continue;
      const existing = imageMetadata.find((m) => m.url === u);
      if (!existing || existing.driveItemKey !== k) {
        needUpdate = true;
        break;
      }
    }
    if (!needUpdate) return;
    setImageMetadata((prev) => {
      const map = new Map<string, { url: string; driveItemKey?: string }>();
      prev.forEach((m) => map.set(m.url, m));
      for (let i = 0; i < Math.min(urls.length, keys.length); i++) {
        const u = urls[i];
        const k = keys[i];
        if (u && k && !k.startsWith("local_")) {
          map.set(u, { url: u, driveItemKey: k });
        }
      }
      return Array.from(map.values());
    });
  }, [gridContents, gridId, imageCount, imageMetadata]);

  // categoryValue가 변경될 때 store 업데이트 (무한 루프 방지를 위한 ref 사용)
  const isUpdatingFromStore = React.useRef(false);

  React.useEffect(() => {
    if (gridId && !isUpdatingFromStore.current) {
      console.log("📝 categoryValue store 업데이트:", {
        gridId,
        categoryValue,
      });
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
          스토어값: storeCategoryValue,
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
      setKeywords("");
      setDescriptionText("");
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

  // 키워드 입력 변경 (store에 반영하지 않음)
  const handleKeywordChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    const newValue = e.target.value;
    setKeywords(newValue);
  };

  // description textarea 변경 (store에 반영)
  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const newValue = e.target.value;
    setDescriptionText(newValue);
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
      isValidCategory:
        categoryValue &&
        categoryValue.trim() !== "" &&
        categoryValue !== "Text",
    });

    // profileId 체크 - 로그인 상태 확인
    if (!profileId) {
      console.log("❌ AI 생성 조건 실패: 로그인 필요");
      addToast({ message: "로그인 후 사용해주세요." });
      return;
    }

    // categoryValue 체크 - 타이틀 입력 상태 확인
    if (
      !categoryValue ||
      categoryValue.trim() === "" ||
      categoryValue === "Text"
    ) {
      console.log("❌ AI 생성 조건 실패: 타이틀이 유효하지 않음");
      addToast({ message: "먼저 타이틀을 입력해주세요." });
      return;
    }

    // 그리드에서 이미지의 data-id 값들 수집
    const photoDriveItemKeys: string[] = [];
    currentImages.forEach((imageUrl) => {
      if (imageUrl && imageUrl !== "") {
        const driveItemKey = getDriveItemKeyByImageUrl(imageUrl);
        if (driveItemKey && !driveItemKey.startsWith("local_")) {
          photoDriveItemKeys.push(driveItemKey);
        }
      }
    });

    if (photoDriveItemKeys.length === 0) {
      return;
    }

    // searchParams에서 age 값 가져오기
    const ageParam = searchParams?.get("age");
    const age = ageParam ? parseInt(ageParam, 10) : 3; // 기본값: 3 (6세)

    const requestData = {
      profileId,
      subject: categoryValue,
      age,
      startsAt: new Date().toISOString().split("T")[0], // 오늘 날짜
      endsAt: new Date().toISOString().split("T")[0], // 오늘 날짜
      photoDriveItemKeys,
      keywords: keywords.trim() || "", // 현재 입력된 키워드 사용
    };

    console.log("LLM API 호출 데이터:", requestData);

    try {
      const response = await fetch("/api/ai/v2/report/type-a/analyze-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        showAlert({ message: "AI 생성에 실패했습니다. 다시 시도해주세요." });
        return;
      }

      const result = (await response.json()) as any;
      console.log("LLM API 응답:", result);

      // API 응답 구조에서 텍스트 추출
      let generatedText = "";

      console.log("응답 구조 분석:", {
        hasStatus: !!result.status,
        status: result.status,
        hasResult: !!result.result,
        hasContents: !!result.result?.contents,
        fullResponse: result,
      });

      if (result.status === 200 && result.result?.contents) {
        // 실제 API 응답 구조: { status: 200, result: { contents: "..." } }
        generatedText = result.result.contents;
      } else if (result.success && result.data?.result?.contents) {
        // 기존 구조 지원
        generatedText = result.data.result.contents;
      } else if (result.data && typeof result.data === "string") {
        generatedText = result.data;
      } else if (result.data && result.data.content) {
        generatedText = result.data.content;
      } else if (result.data && result.data.text) {
        generatedText = result.data.text;
      } else if (result.contents) {
        // 직접 contents 필드가 있는 경우
        generatedText = result.contents;
      } else if (typeof result === "string") {
        generatedText = result;
      } else {
        console.warn("예상하지 못한 응답 구조:", result);
        generatedText =
          "AI 텍스트 생성에 성공했지만 내용을 추출할 수 없습니다."; // 기본값
      }

      // 생성된 텍스트를 description으로 업데이트
      setDescriptionText(generatedText);

      // Grid content store에도 업데이트 (gridId가 있을 때만)
      if (gridId) {
        updatePlaySubject(gridId, generatedText);
        // AI 생성된 콘텐츠임을 표시
        updateAiGenerated(gridId, true);
      }

      // addToast({ message: 'AI 텍스트가 생성되었습니다.' });
    } catch (error) {
      showAlert({ message: "AI 생성 중 오류가 발생했습니다." });
    }
  }, [
    profileId,
    categoryValue,
    currentImages,
    getDriveItemKeyByImageUrl,
    searchParams,
    keywords,
    gridId,
    updatePlaySubject,
    showAlert,
    addToast,
  ]);

  const handleAIGenerate = () => {
    console.log("🎯 AI 생성 버튼 클릭됨");
    console.log("현재 isDescriptionExpanded:", isDescriptionExpanded);
    console.log("현재 categoryValue:", categoryValue);
    console.log("현재 이미지 개수:", getCurrentImageCount());

    // 추가 조건 체크 (안전장치)
    if (
      !categoryValue ||
      categoryValue.trim() === "" ||
      categoryValue === "Text"
    ) {
      console.log("❌ AI 생성 실패: 카테고리 값이 유효하지 않음");
      addToast({ message: "먼저 타이틀을 입력해주세요." });
      return;
    }

    if (getCurrentImageCount() === 0) {
      console.log("❌ AI 생성 실패: 이미지가 없음");
      addToast({ message: "먼저 이미지를 업로드해주세요." });
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
    console.log("이미지 업로드 버튼 클릭됨");
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
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".txt";
    fileInput.style.display = "none";

    // 파일 선택 시 이벤트 핸들러
    fileInput.onchange = (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];

      if (file && file.type === "text/plain") {
        const reader = new FileReader();

        reader.onload = (e) => {
          const content = e.target?.result as string;
          if (content) {
            // 읽은 텍스트를 키워드 입력으로 설정 (store에는 반영하지 않음)
            setKeywords(content);
          }
        };

        reader.readAsText(file, "UTF-8");
      } else {
        alert("텍스트 파일(.txt)만 업로드 가능합니다.");
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
    if (imageUrl && imageUrl !== "") {
      beginInlineEdit(imageIndex);
    }
  };

  // ImageEditModal에서 편집된 이미지 적용 핸들러
  const handleImageEditApply = (processedImages: {
    imageUrls: string[];
    imagePositions: any[];
  }) => {
    console.log("📸 편집된 이미지 데이터 받음:", processedImages.imageUrls);
    console.log(
      "📸 편집된 이미지 위치 데이터:",
      processedImages.imagePositions
    );

    // 편집된 이미지로 원래 위치의 이미지 교체
    // selectedImageIndex는 필터링된 배열에서의 인덱스이므로
    // 실제 원래 이미지 URL을 찾아서 교체해야 함
    const selectedImageUrl =
      imageEditModal.imageUrls[imageEditModal.selectedImageIndex];

    // 편집된 이미지들로 교체
    if (processedImages.imageUrls && processedImages.imageUrls.length > 0) {
      setCurrentImages((prev) => {
        const newImages = [...prev];
        processedImages.imageUrls.forEach((editedUrl, index) => {
          if (index < newImages.length) {
            newImages[index] = editedUrl;
          }
        });
        return newImages;
      });
    }

    // 이미지 위치 정보가 있다면 imagePositions 업데이트
    if (
      processedImages.imagePositions &&
      processedImages.imagePositions.length > 0
    ) {
      setImagePositions(processedImages.imagePositions);
      console.log(
        "📍 이미지 위치 정보 업데이트:",
        processedImages.imagePositions
      );

      // 상위 컴포넌트로 위치 정보 전달
      if (onImagePositionsUpdate) {
        onImagePositionsUpdate(processedImages.imagePositions);
      }
    }

    // 모달 닫기
    setImageEditModal((prev) => ({ ...prev, isOpen: false }));
  };

  // ImageEditModal에서 이미지 순서 변경 핸들러
  const handleImageOrderChange = (newOrder: string[]) => {
    console.log("🔄 이미지 순서 변경:", newOrder);
    setCurrentImages((prev) => {
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
      isValidCategory:
        categoryValue &&
        categoryValue.trim() !== "" &&
        categoryValue !== "Text",
    });

    // LLM 호출 조건 확인
    if (
      !profileId ||
      !categoryValue ||
      categoryValue.trim() === "" ||
      categoryValue === "Text"
    ) {
      console.log("❌ 새로고침 조건 실패: 타이틀이 유효하지 않음");
      addToast({ message: "먼저 타이틀을 입력해주세요." });
      return;
    }

    if (getCurrentImageCount() === 0) {
      console.log("❌ 새로고침 조건 실패: 이미지가 없음");
      addToast({ message: "먼저 이미지를 업로드해주세요." });
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
    if (window.confirm("정말로 이 카드를 삭제하시겠습니까?") && onDelete) {
      onDelete();
    }
  };

  // 개별 이미지 삭제 핸들러
  const handleImageDelete = (imageIndex: number, event: React.MouseEvent) => {
    event.stopPropagation(); // 이벤트 전파 방지

    setCurrentImages((prev) => {
      const deletedImageUrl = prev[imageIndex];
      const newImages = [...prev];
      newImages[imageIndex] = ""; // 해당 인덱스의 이미지를 빈 문자열로 설정

      // 이미지 메타데이터에서도 해당 URL을 가진 메타데이터 삭제
      if (deletedImageUrl) {
        setImageMetadata((prevMetadata) =>
          prevMetadata.filter((metadata) => metadata.url !== deletedImageUrl)
        );
      }

      console.log(`🗑️ 이미지 ${imageIndex} 삭제:`, {
        이전이미지: prev,
        새이미지: newImages,
        삭제된URL: deletedImageUrl,
      });
      return newImages;
    });

    // 해당 인덱스의 이미지 위치 정보도 초기화
    setImagePositions((prev) => {
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
      console.log(
        "⏰ Timer callback - checking hover state",
        isHoveredRef.current
      );
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
  const removeBackgroundForSingleImage = React.useCallback(
    async (imageIndex: number, imageUrl: string, driveItemKey: string) => {
      try {
        setImageRemoveLoadingStates((prev) => ({
          ...prev,
          [imageIndex]: true,
        }));

        const response = await fetch("/api/ai/v1/remove-background", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "*/*",
          },
          body: JSON.stringify({
            profileId,
            driveItemKeys: [driveItemKey], // 단일 이미지만 처리
            threshold: 0.8,
            responseWithFolder: false,
          }),
        });

        if (!response.ok) {
          console.log(`이미지 ${imageIndex + 1} 배경 제거 실패`);
          return null;
        }

        const result = await response.json();
        console.log(`🖼️ 이미지 ${imageIndex + 1} 배경 제거 API 응답:`, result);

        // 응답에서 새로운 이미지 정보 추출
        if (result?.result) {
          const processedImage = Array.isArray(result.result)
            ? result.result[0]
            : result.result;

          if (processedImage?.driveItemKey && processedImage?.thumbUrl) {
            const newDriveItemKey = processedImage.driveItemKey;
            const newThumbUrl = processedImage.thumbUrl;

            // 이미지 교체
            setCurrentImages((prev) => {
              const newImages = [...prev];
              newImages[imageIndex] = newThumbUrl;
              console.log(`🖼️ 이미지 ${imageIndex + 1} 배경 제거 완료:`, {
                원본: prev[imageIndex],
                신규: newThumbUrl,
                원본DriveItemKey: driveItemKey,
                신규DriveItemKey: newDriveItemKey,
              });
              return newImages;
            });

            // 이미지 메타데이터도 업데이트
            setImageMetadata((prev) => {
              const newMetadata = [...prev];
              // 해당 인덱스의 메타데이터 업데이트
              const metaIndex = newMetadata.findIndex(
                (meta) => meta.url === imageUrl
              );
              if (metaIndex >= 0) {
                newMetadata[metaIndex] = {
                  url: newThumbUrl,
                  driveItemKey: newDriveItemKey,
                };
              } else {
                // 새로운 메타데이터 추가
                newMetadata.push({
                  url: newThumbUrl,
                  driveItemKey: newDriveItemKey,
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
        setImageRemoveLoadingStates((prev) => ({
          ...prev,
          [imageIndex]: false,
        }));
      }
    },
    [profileId, setCurrentImages, setImageMetadata]
  );

  // 모든 이미지의 배경 제거 API 호출 함수 (병렬 처리)
  const callRemoveBackgroundAPI = React.useCallback(async () => {
    if (!profileId) {
      addToast({ message: "로그인 후 사용해주세요." });
      return;
    }

    // 현재 이미지들에서 유효한 이미지와 driveItemKey 수집
    const validImages: Array<{
      index: number;
      url: string;
      driveItemKey: string;
    }> = [];

    currentImages.forEach((imageUrl, index) => {
      if (imageUrl && imageUrl !== "") {
        const driveItemKey = getDriveItemKeyByImageUrl(imageUrl);
        if (driveItemKey && !driveItemKey.startsWith("local_")) {
          validImages.push({ index, url: imageUrl, driveItemKey });
        }
      }
    });

    if (validImages.length === 0) {
      addToast({ message: "배경 제거에 필요한 정보가 없습니다." });
      return;
    }

    console.log(
      `🖼️ ${validImages.length}개 이미지의 배경 제거 시작:`,
      validImages
    );

    try {
      setIsRemoveBackgroundLoading(true);

      // 모든 이미지에 대해 병렬로 배경 제거 처리
      const promises = validImages.map(({ index, url, driveItemKey }) =>
        removeBackgroundForSingleImage(index, url, driveItemKey)
      );

      const results = await Promise.all(promises);

      // 성공한 이미지 개수 계산
      const successCount = results.filter((result) => result === true).length;

      if (successCount > 0) {
        addToast({
          message: `${successCount}개 이미지의 배경 제거가 완료되었습니다.`,
        });
      } else {
        showAlert({ message: "배경 제거된 이미지를 찾을 수 없습니다." });
      }
    } catch (error) {
      console.log("배경 제거 API 호출 오류:", error);
      showAlert({ message: "배경 제거 중 오류가 발생했습니다." });
    } finally {
      setIsRemoveBackgroundLoading(false);
    }
  }, [
    profileId,
    currentImages,
    getDriveItemKeyByImageUrl,
    addToast,
    showAlert,
    removeBackgroundForSingleImage,
  ]);

  // 툴바 아이콘 클릭 핸들러
  const handleToolbarIconClick = (iconIndex: number, data?: any) => {
    console.log(`툴바 아이콘 ${iconIndex} 클릭됨, Grid ${index}`, data);

    // 이미지 개수 변경 처리
    if (data && data.action === "changeImageCount") {
      console.log(
        `그리드 ${data.gridId}의 이미지 개수를 ${data.count}개로 변경`
      );
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
      if (
        !target.closest(`[data-grid-id="${gridId}"]`) &&
        !target.closest(".grid-edit-toolbar")
      ) {
        // hover 타이머도 정리
        if (hoverTimerRef.current) {
          clearTimeout(hoverTimerRef.current);
          hoverTimerRef.current = null;
        }
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
      if (toolbarState.show && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setToolbarPosition({
          left: rect.left + 8,
          top: rect.bottom + 8,
        });
      }
    };

    if (toolbarState.show) {
      // 초기 위치 설정
      updateToolbarPosition();

      window.addEventListener("scroll", updateToolbarPosition, true);
      window.addEventListener("resize", updateToolbarPosition);
    }

    return () => {
      window.removeEventListener("scroll", updateToolbarPosition, true);
      window.removeEventListener("resize", updateToolbarPosition);
    };
  }, [toolbarState.show]);

  // 툴바 표시 상태에 따른 border 스타일 결정
  const borderClass = toolbarState.show
    ? "border-solid border-2 border-primary"
    : isSaved
      ? "border-none"
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
    const newValue = e.target.value;
    console.log("📝 카테고리 값 변경:", {
      이전값: categoryValue,
      새값: newValue,
    });
    setCategoryValue(newValue);
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 드래그 관련 키 이벤트 전파 방지
    e.stopPropagation();

    if (e.key === "Enter") {
      setIsEditingCategory(false);
    }
    if (e.key === "Escape") {
      setCategoryValue(category); // 원래 값으로 복원
      setIsEditingCategory(false);
    }
  };

  const handleCategoryBlur = () => {
    setIsEditingCategory(false);
  };

  // 저장 모드에서 LLM 콘텐츠가 없는 경우 레이아웃 영향 없이 시각적으로만 숨김 처리

  return (
    <div
      className={`relative w-full h-full flex flex-col ${shouldHideInSavedMode ? "invisible pointer-events-none" : ""}`}
    >
      <div
        ref={containerRef}
        className={`drag-contents overflow-hidden px-2.5 py-2.5 ${
          isSaved ? "bg-[#FFFFFF]" : "bg-[#FFFFFF]"
        } rounded-2xl ${containerClass} w-full h-full flex flex-col ${className} gap-y-1.5 ${isDragging ? "opacity-90" : ""} transition-all duration-200 cursor-grab active:cursor-grabbing`}
        style={style}
        onClick={handleNonImageClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-grid-id={gridId}
        {...(inlineEditState.active ? {} : dragAttributes)}
        {...(inlineEditState.active ? {} : dragListeners)}
      >
        {/* 카테고리 섹션 - 고정 높이 */}
        <div className="flex gap-2.5 text-sm font-bold tracking-tight leading-none text-amber-400 whitespace-nowrap flex-shrink-0 mb-1">
          <div
            className={`flex overflow-hidden flex-col grow shrink-0 justify-center items-start px-2 py-1 rounded-md border border-solid basis-0 w-fit transition-colors ${
              isSaved
                ? "cursor-default bg-white border-transparent"
                : "cursor-text hover:bg-gray-50"
            } ${
              isSaved
                ? "border-transparent bg-white"
                : isEditingCategory
                  ? "border-primary"
                  : "border-gray-300"
            }`}
            onClick={
              !isEditingCategory && !isSaved ? handleCategoryClick : undefined
            }
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
                placeholder="Text"
                className="text-[16px] font-bold text-primary bg-transparent border-0 p-0 h-auto leading-tight focus:ring-0 focus-visible:ring-0 focus:outline-none focus:border-primary shadow-none min-w-[60px] w-auto placeholder:text-gray-400 focus:text-primary"
                style={{
                  borderRadius: "0px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: "#3b82f6 !important", // primary color 강제 적용
                }}
                autoFocus
                draggable={false} // 드래그 완전 비활성화
              />
            ) : (
              <div
                className={`text-[16px] leading-tight px-1 py-0.5 rounded transition-colors ${
                  categoryValue ? "text-primary" : "text-gray-400"
                }`}
              >
                {categoryValue || "Text"}
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
              height: "60%",
              backgroundColor: canDrop && isOver ? "#f0f0f0" : "transparent",
              transition: "background-color 0.2s ease",
            }}
          >
            {[0, 1, 2, 3].map((imageIndex) => (
              <div key={imageIndex} className="flex-1 h-full">
                <div
                  className="relative cursor-pointer hover:opacity-80 transition-opacity group w-full h-full border-solid border-2 border-gray-300"
                  onClick={(e) => {
                    measureImageCellSize(imageIndex);
                    if (
                      !currentImages[imageIndex] ||
                      currentImages[imageIndex] === ""
                    ) {
                      handleOpenUploadModal();
                    }
                    handleImageClick(e);
                  }}
                >
                  {currentImages[imageIndex] &&
                  currentImages[imageIndex] !== "" ? (
                    <div
                      className={`absolute inset-0 ${isEditingIndex(imageIndex) ? "overflow-visible border-2 border-primary" : "overflow-hidden"} ${inlineEditState.active && !isEditingIndex(imageIndex) ? "bg-black/20" : ""} rounded-md cursor-pointer group`}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        beginInlineEdit(imageIndex);
                      }}
                      ref={(el) => {
                        imageContainerRefs.current[imageIndex] = el;
                      }}
                    >
                      <img
                        src={currentImages[imageIndex]}
                        alt={`Image ${imageIndex + 1}`}
                        className="absolute inset-0 w-full h-full object-cover rounded-md image-target"
                        style={{
                          transform: isEditingIndex(imageIndex)
                            ? `translate(${inlineEditState.tempPosition.x}px, ${inlineEditState.tempPosition.y}px) scale(${inlineEditState.tempPosition.scale})`
                            : `translate(${imagePositions[imageIndex]?.x || 0}px, ${imagePositions[imageIndex]?.y || 0}px) scale(${imagePositions[imageIndex]?.scale || 1})`,
                          transformOrigin: "center",
                        }}
                        data-id={getDriveItemKeyByImageUrl(
                          currentImages[imageIndex]
                        )}
                        onMouseDown={
                          isEditingIndex(imageIndex)
                            ? onEditMouseDown
                            : undefined
                        }
                        draggable={false}
                      />
                      {/* Hover overlay - 이미지가 있을 때만 표시 */}
                      <div className="absolute inset-0 bg-black bg-opacity-40 rounded-md flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none">
                        <Image
                          src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/imageupload3.svg"
                          width={20}
                          height={20}
                          className="object-contain mb-2"
                          alt="Upload icon"
                          unoptimized={true}
                        />
                        <div className="text-white text-[8px] font-medium text-center mb-2 px-1">
                          이미지를 드래그하거나
                          <br />
                          클릭하여 업로드
                        </div>
                      </div>
                      {renderResizeHandles(imageIndex)}
                      {renderResizeHandles(imageIndex)}
                      {/* 개별 이미지 배경 제거 로딩 오버레이 */}
                      {imageRemoveLoadingStates[imageIndex] && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 rounded-md">
                          <div className="flex flex-col items-center gap-1">
                            <Loader size="sm" />
                            <div className="text-white text-xs">
                              배경 제거 중...
                            </div>
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
                      <div
                        className="absolute inset-0 w-full h-full rounded-md"
                        style={{ backgroundColor: "#F9FAFB" }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-40 rounded-md flex flex-col items-center justify-center opacity-100 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none">
                        <Image
                          src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/imageupload3.svg"
                          width={20}
                          height={20}
                          className="object-cover mb-2"
                          alt="Upload icon"
                          unoptimized={true}
                        />
                        <div className="text-white text-[8px] font-medium text-center mb-2 px-1">
                          이미지를 드래그하거나
                          <br />
                          클릭하여 업로드
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : /* 그리드가 2개이고 이미지가 3개일 때: 가로로 3개 일렬 배치 */
        gridCount === 2 && imageCount === 3 ? (
          <div
            ref={dropRef}
            className="flex gap-1 w-full relative"
            style={{
              height: "60%",
              backgroundColor: canDrop && isOver ? "#f0f0f0" : "transparent",
              transition: "background-color 0.2s ease",
            }}
          >
            {[0, 1, 2].map((imageIndex) => (
              <div key={imageIndex} className="flex-1 h-full">
                <div
                  className="relative cursor-pointer hover:opacity-80 transition-opacity group w-full h-full"
                  onClick={(e) => {
                    measureImageCellSize(imageIndex);
                    if (
                      !currentImages[imageIndex] ||
                      currentImages[imageIndex] === ""
                    ) {
                      handleOpenUploadModal();
                    }
                    handleImageClick(e);
                  }}
                >
                  {currentImages[imageIndex] &&
                  currentImages[imageIndex] !== "" ? (
                    <div
                      className={`absolute inset-0 ${isEditingIndex(imageIndex) ? "overflow-visible border-2 border-primary" : "overflow-hidden"} ${inlineEditState.active && !isEditingIndex(imageIndex) ? "bg-black/20" : ""} rounded-md cursor-pointer group`}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        beginInlineEdit(imageIndex);
                      }}
                      ref={(el) => {
                        imageContainerRefs.current[imageIndex] = el;
                      }}
                    >
                      <Image
                        src={currentImages[imageIndex]}
                        alt={`Image ${imageIndex + 1}`}
                        fill
                        className="object-cover rounded-md"
                        style={{
                          transform: isEditingIndex(imageIndex)
                            ? `translate(${inlineEditState.tempPosition.x}px, ${inlineEditState.tempPosition.y}px) scale(${inlineEditState.tempPosition.scale})`
                            : `translate(${imagePositions[imageIndex]?.x || 0}px, ${imagePositions[imageIndex]?.y || 0}px) scale(${imagePositions[imageIndex]?.scale || 1})`,
                          transformOrigin: "center",
                        }}
                        data-id={getDriveItemKeyByImageUrl(
                          currentImages[imageIndex]
                        )}
                        unoptimized={true}
                        onMouseDown={
                          isEditingIndex(imageIndex)
                            ? onEditMouseDown
                            : undefined
                        }
                      />
                      {/* Hover overlay - 이미지가 있을 때만 표시 */}
                      <div className="absolute inset-0 bg-black bg-opacity-40 rounded-md flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none">
                        <Image
                          src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/imageupload3.svg"
                          width={20}
                          height={20}
                          className="object-contain mb-2"
                          alt="Upload icon"
                          unoptimized={true}
                        />
                        <div className="text-white text-[8px] font-medium text-center mb-2 px-1">
                          이미지를 드래그하거나
                          <br />
                          클릭하여 업로드
                        </div>
                      </div>
                      {/* 개별 이미지 배경 제거 로딩 오버레이 */}
                      {imageRemoveLoadingStates[imageIndex] && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 rounded-md">
                          <div className="flex flex-col items-center gap-1">
                            <Loader size="sm" />
                            <div className="text-white text-xs">
                              배경 제거 중...
                            </div>
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
                      <div
                        className="absolute inset-0 w-full h-full rounded-md"
                        style={{ backgroundColor: "#F9FAFB" }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-40 rounded-md flex flex-col items-center justify-center opacity-100 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none">
                        <Image
                          src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/imageupload3.svg"
                          width={20}
                          height={20}
                          className="object-cover mb-2"
                          alt="Upload icon"
                          unoptimized={true}
                        />
                        <div className="text-white text-[8px] font-medium text-center mb-2 px-1">
                          이미지를 드래그하거나
                          <br />
                          클릭하여 업로드
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : /* 작은 그리드이고 이미지가 3개일 때는 flex 레이아웃 사용 (기존 로직) */
        cardType === "small" && imageCount === 3 ? (
          <div
            ref={dropRef}
            className="flex gap-1 w-full relative"
            style={{
              height: "60%",
              backgroundColor: canDrop && isOver ? "#f0f0f0" : "transparent",
              transition: "background-color 0.2s ease",
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
                세번째: currentImages[2],
              });
              return null;
            })()}
            {/* 왼쪽: 첫 번째 이미지 */}
            <div className="flex-1 h-full">
              <div
                className="relative cursor-pointer hover:opacity-80 transition-opacity group w-full h-full"
                onClick={(e) => {
                  measureImageCellSize(0);
                  if (!currentImages[0] || currentImages[0] === "") {
                    handleOpenUploadModal();
                  }
                  handleImageClick(e);
                }}
              >
                {currentImages[0] && currentImages[0] !== "" ? (
                  <div
                    className={`absolute inset-0 ${isEditingIndex(0) ? "overflow-visible border-2 border-primary" : "overflow-hidden"} ${inlineEditState.active && !isEditingIndex(0) ? "bg-black/20" : ""} rounded-md cursor-pointer `}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      beginInlineEdit(0);
                    }}
                    ref={(el) => {
                      imageContainerRefs.current[0] = el;
                    }}
                  >
                    <img
                      src={currentImages[0]}
                      alt="Image 1"
                      className="absolute inset-0 w-full h-full object-cover rounded-md"
                      style={{
                        transform: isEditingIndex(0)
                          ? `translate(${inlineEditState.tempPosition.x}px, ${inlineEditState.tempPosition.y}px) scale(${inlineEditState.tempPosition.scale})`
                          : `translate(${imagePositions[0]?.x || 0}px, ${imagePositions[0]?.y || 0}px) scale(${imagePositions[0]?.scale || 1})`,
                        transformOrigin: "center",
                      }}
                      data-id={getDriveItemKeyByImageUrl(currentImages[0])}
                      onMouseDown={
                        isEditingIndex(0) ? onEditMouseDown : undefined
                      }
                      draggable={false}
                    />
                    {renderResizeHandles(0)}
                    {/* 개별 이미지 배경 제거 로딩 오버레이 */}
                    {imageRemoveLoadingStates[0] && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 rounded-md">
                        <div className="flex flex-col items-center gap-1">
                          <Loader size="sm" />
                          <div className="text-white text-xs">
                            배경 제거 중...
                          </div>
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
                      show={Boolean(
                        getDriveItemKeyByImageUrl(currentImages[0]) &&
                          memoStatuses[
                            getDriveItemKeyByImageUrl(currentImages[0]) || ""
                          ]
                      )}
                      driveItemKey={getDriveItemKeyByImageUrl(currentImages[0])}
                      onMemoClick={() => {
                        const driveItemKey = getDriveItemKeyByImageUrl(
                          currentImages[0]
                        );
                        if (driveItemKey) {
                          openMemoModal(driveItemKey);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <div
                      className="absolute inset-0 w-full h-full rounded-md"
                      style={{ backgroundColor: "#F9FAFB" }}
                    />
                    {/* Black overlay - 이미지가 없을 때만 표시 */}
                    <div className="absolute inset-0 bg-black bg-opacity-40 rounded-md flex flex-col items-center justify-center opacity-100 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none">
                      <Image
                        src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/imageupload3.svg"
                        width={20}
                        height={20}
                        className="object-cover mb-2"
                        alt="Upload icon"
                        unoptimized={true}
                      />
                      <div className="text-white text-[8px] font-medium text-center mb-2 px-1">
                        이미지를 드래그하거나
                        <br />
                        클릭하여 업로드
                      </div>
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
                    if (!currentImages[1] || currentImages[1] === "") {
                      handleOpenUploadModal();
                    }
                    handleImageClick(e);
                  }}
                >
                  {currentImages[1] && currentImages[1] !== "" ? (
                    <div
                      className={`absolute inset-0 ${isEditingIndex(1) ? "overflow-visible border-2 border-primary" : "overflow-hidden"} ${inlineEditState.active && !isEditingIndex(1) ? "bg-black/20" : ""} rounded-md cursor-pointer group`}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        beginInlineEdit(1);
                      }}
                      ref={(el) => {
                        imageContainerRefs.current[1] = el;
                      }}
                    >
                      <img
                        src={currentImages[1]}
                        alt="Image 2"
                        className="absolute inset-0 w-full h-full object-cover rounded-md"
                        style={{
                          transform: isEditingIndex(1)
                            ? `translate(${inlineEditState.tempPosition.x}px, ${inlineEditState.tempPosition.y}px) scale(${inlineEditState.tempPosition.scale})`
                            : `translate(${imagePositions[1]?.x || 0}px, ${imagePositions[1]?.y || 0}px) scale(${imagePositions[1]?.scale || 1})`,
                          transformOrigin: "center",
                        }}
                        data-id={getDriveItemKeyByImageUrl(currentImages[1])}
                        onMouseDown={
                          isEditingIndex(1) ? onEditMouseDown : undefined
                        }
                        draggable={false}
                      />
                      {/* Hover overlay - 이미지가 있을 때만 표시 */}
                      <div className="absolute inset-0 bg-black bg-opacity-40 rounded-md flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none">
                        <Image
                          src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/imageupload3.svg"
                          width={20}
                          height={20}
                          className="object-contain mb-2"
                          alt="Upload icon"
                          unoptimized={true}
                        />
                        <div className="text-white text-[8px] font-medium text-center mb-2 px-1">
                          이미지를 드래그하거나
                          <br />
                          클릭하여 업로드
                        </div>
                      </div>
                      {renderResizeHandles(1)}
                      {/* 개별 이미지 배경 제거 로딩 오버레이 */}
                      {imageRemoveLoadingStates[1] && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 rounded-md">
                          <div className="flex flex-col items-center gap-1">
                            <Loader size="sm" />
                            <div className="text-white text-xs">
                              배경 제거 중...
                            </div>
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
                        show={Boolean(
                          getDriveItemKeyByImageUrl(currentImages[1]) &&
                            memoStatuses[
                              getDriveItemKeyByImageUrl(currentImages[1]) || ""
                            ]
                        )}
                        driveItemKey={getDriveItemKeyByImageUrl(
                          currentImages[1]
                        )}
                        onMemoClick={() => {
                          const driveItemKey = getDriveItemKeyByImageUrl(
                            currentImages[1]
                          );
                          if (driveItemKey) {
                            openMemoModal(driveItemKey);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <div
                        className="absolute inset-0 w-full h-full rounded-md"
                        style={{ backgroundColor: "#F9FAFB" }}
                      />
                      {/* Black overlay - 이미지가 없을 때 기본 표시 */}
                      <div className="absolute inset-0 bg-black bg-opacity-40 rounded-md flex flex-col items-center justify-center opacity-100 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none">
                        <Image
                          src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/imageupload3.svg"
                          width={20}
                          height={20}
                          className="object-contain mb-2"
                          alt="Upload icon"
                          unoptimized={true}
                        />
                        <div className="text-white text-[8px] font-medium text-center mb-2 px-1">
                          이미지를 드래그하거나
                          <br />
                          클릭하여 업로드
                        </div>
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
                    if (!currentImages[2] || currentImages[2] === "") {
                      handleOpenUploadModal();
                    }
                    handleImageClick(e);
                  }}
                >
                  {currentImages[2] && currentImages[2] !== "" ? (
                    <div
                      className={`absolute inset-0 ${isEditingIndex(2) ? "overflow-visible border-2 border-primary" : "overflow-hidden"} ${inlineEditState.active && !isEditingIndex(2) ? "bg-black/20" : ""} rounded-md cursor-pointer`}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        beginInlineEdit(2);
                      }}
                      ref={(el) => {
                        imageContainerRefs.current[2] = el;
                      }}
                    >
                      <img
                        src={currentImages[2]}
                        alt="Image 3"
                        className="absolute inset-0 w-full h-full object-cover rounded-md"
                        style={{
                          transform: isEditingIndex(2)
                            ? `translate(${inlineEditState.tempPosition.x}px, ${inlineEditState.tempPosition.y}px) scale(${inlineEditState.tempPosition.scale})`
                            : `translate(${imagePositions[2]?.x || 0}px, ${imagePositions[2]?.y || 0}px) scale(${imagePositions[2]?.scale || 1})`,
                          transformOrigin: "center",
                        }}
                        data-id={getDriveItemKeyByImageUrl(currentImages[2])}
                        onMouseDown={
                          isEditingIndex(2) ? onEditMouseDown : undefined
                        }
                        draggable={false}
                      />
                      {/* Hover overlay - 이미지가 있을 때만 표시 */}
                      <div className="absolute inset-0 bg-black bg-opacity-40 rounded-md flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none">
                        <Image
                          src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/imageupload3.svg"
                          width={20}
                          height={20}
                          className="object-contain mb-2"
                          alt="Upload icon"
                          unoptimized={true}
                        />
                        <div className="text-white text-[8px] font-medium text-center mb-2 px-1">
                          이미지를 드래그하거나
                          <br />
                          클릭하여 업로드
                        </div>
                      </div>
                      {renderResizeHandles(2)}
                      {/* 개별 이미지 배경 제거 로딩 오버레이 */}
                      {imageRemoveLoadingStates[2] && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 rounded-md">
                          <div className="flex flex-col items-center gap-1">
                            <Loader size="sm" />
                            <div className="text-white text-xs">
                              배경 제거 중...
                            </div>
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
                        show={Boolean(
                          getDriveItemKeyByImageUrl(currentImages[2]) &&
                            memoStatuses[
                              getDriveItemKeyByImageUrl(currentImages[2]) || ""
                            ]
                        )}
                        driveItemKey={getDriveItemKeyByImageUrl(
                          currentImages[2]
                        )}
                        onMemoClick={() => {
                          const driveItemKey = getDriveItemKeyByImageUrl(
                            currentImages[2]
                          );
                          if (driveItemKey) {
                            openMemoModal(driveItemKey);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <div
                        className="absolute inset-0 w-full h-full rounded-md"
                        style={{ backgroundColor: "#F9FAFB" }}
                      />
                      {/* Black overlay - 이미지가 없을 때만 표시 */}
                      <div className="absolute inset-0 bg-black bg-opacity-40 rounded-md flex flex-col items-center justify-center opacity-100 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none">
                        <Image
                          src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/imageupload3.svg"
                          width={20}
                          height={20}
                          className="object-contain mb-2"
                          alt="Upload icon"
                          unoptimized={true}
                        />
                        <div className="text-white text-[8px] font-medium text-center mb-2 px-1">
                          이미지를 드래그하거나
                          <br />
                          클릭하여 업로드
                        </div>
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
                : cardType === "large"
                  ? `${getImageGridClass(imageCount, cardType)}` // large 카드는 이미지 개수에 따라 배치
                  : `${getImageGridClass(imageCount, cardType)}` // small 카드도 이미지 개수에 따라 배치
            }`}
            style={{
              height: "60%",
              backgroundColor: canDrop && isOver ? "#f0f0f0" : "transparent",
              transition: "background-color 0.2s ease",
            }}
          >
            {(() => {
              const imagesToRender = Array.isArray(currentImages)
                ? currentImages.slice(0, imageCount)
                : [];
              console.log("🎨 일반 그리드 렌더링:", {
                cardType,
                imageCount,
                currentImages,
                imagesToRender,
                gridClass: getImageGridClass(imageCount, cardType),
              });
              return imagesToRender;
            })().map((imageSrc, index) => (
              <div key={index} className="w-full h-full">
                <div
                  className="relative cursor-pointer hover:opacity-80 transition-opacity group w-full h-full"
                  onClick={(e) => {
                    // 클릭 시에도 크기 측정
                    measureImageCellSize(index);
                    if (
                      !imageSrc ||
                      imageSrc === "" ||
                      imageSrc ===
                        "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg"
                    ) {
                      handleOpenUploadModal();
                    }
                    handleImageClick(e);
                  }}
                >
                  {imageSrc &&
                  imageSrc !== "" &&
                  imageSrc !==
                    "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg" ? (
                    <div
                      className={`absolute inset-0 ${isEditingIndex(index) ? "overflow-visible border-2 border-primary" : "overflow-hidden"} ${inlineEditState.active && !isEditingIndex(index) ? "bg-black/20" : ""} rounded-md cursor-pointer group`}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        beginInlineEdit(index);
                      }}
                      ref={(el) => {
                        imageContainerRefs.current[index] = el;
                      }}
                    >
                      <Image
                        src={imageSrc}
                        alt={`Image ${index + 1}`}
                        fill
                        className="object-cover rounded-md"
                        style={{
                          transform: isEditingIndex(index)
                            ? `translate(${inlineEditState.tempPosition.x}px, ${inlineEditState.tempPosition.y}px) scale(${inlineEditState.tempPosition.scale})`
                            : `translate(${imagePositions[index]?.x || 0}px, ${imagePositions[index]?.y || 0}px) scale(${imagePositions[index]?.scale || 1})`,
                          transformOrigin: "center",
                        }}
                        data-id={getDriveItemKeyByImageUrl(imageSrc)}
                        unoptimized={true}
                        onMouseDown={
                          isEditingIndex(index) ? onEditMouseDown : undefined
                        }
                      />
                      {renderResizeHandles(index)}
                      {/* 개별 이미지 배경 제거 로딩 오버레이 */}
                      {imageRemoveLoadingStates[index] && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 rounded-md">
                          <div className="flex flex-col items-center gap-1">
                            <Loader size="sm" />
                            <div className="text-white text-xs">
                              배경 제거 중...
                            </div>
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
                        show={Boolean(
                          getDriveItemKeyByImageUrl(imageSrc) &&
                            memoStatuses[
                              getDriveItemKeyByImageUrl(imageSrc) || ""
                            ]
                        )}
                        driveItemKey={getDriveItemKeyByImageUrl(imageSrc)}
                        onMemoClick={() => {
                          const driveItemKey =
                            getDriveItemKeyByImageUrl(imageSrc);
                          if (driveItemKey) {
                            openMemoModal(driveItemKey);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <div
                        className="absolute inset-0 w-full h-full rounded-md"
                        style={{
                          backgroundColor: "#F9FAFB",
                          border: "1px dashed #AAACB4",
                        }}
                      />
                      {/* Black overlay - 이미지가 없을 때 기본 표시 */}
                      <div className="absolute inset-0  rounded-md flex flex-col items-center justify-center opacity-100 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none gap-y-2">
                        {/* Upload icon */}
                        <div className="flex items-center justify-center rounded-full bg-[#E5E7EC] w-[26px] h-[26px]">
                          <Image
                            src="/report/upload.svg"
                            width={16}
                            height={16}
                            className="object-contain "
                            alt="Upload icon"
                            unoptimized={true}
                          />
                        </div>
                        {/* Upload text */}
                        <div className="text-[#8F8F8F] text-[14px] font-medium text-center mb-2 px-1">
                          이미지를 드래그하거나
                          <br />
                          클릭하여 업로드
                        </div>
                        {/* File select button */}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 하단 입력 영역 - 남은 공간(약 40%)을 차지 */}
        {console.log(
          "렌더링 시점 isDescriptionExpanded:",
          isDescriptionExpanded
        )}
        {isLoading ? (
          // 로딩 중일 때
          <div
            className={`description-area gap-y-3 flex flex-col items-center justify-center px-2 py-2 w-full leading-none ${
              isSaved && hasAiGeneratedContent ? "bg-[F9FAFB]" : "bg-[#F9FAFB]"
            } rounded-md border border-dashed border-zinc-400 flex-1 mt-1`}
          >
            <Loader size="default" />
            <div className="text-[#B4B4B4] text-xs">내용을 생성중입니다...</div>
          </div>
        ) : isDescriptionExpanded ? (
          // 확장된 textarea 모드
          <div
            className={`description-area flex overflow-hidden flex-col px-2 py-2 w-full leading-none ${
              isSaved ? "bg-[F9FAFB]" : "bg-[#F9FAFB]"
            } rounded-md  flex-1 mt-1 relative transition-colors ${
              isSaved
                ? "border-none"
                : isTextareaFocused
                  ? "border border-solid border-primary"
                  : "border border-dashed border-zinc-400"
            }`}
          >
            {/* 저장 상태일 때는 읽기 전용 텍스트, 편집 상태일 때는 textarea */}
            {isSaved ? (
              <div
                className="w-full h-full px-2 py-1 text-xs tracking-tight text-zinc-600 flex-1 overflow-auto"
                style={{
                  fontSize: "12px",
                  lineHeight: "1.4",
                  minHeight: "74px",
                }}
              >
                {descriptionText || ""}
              </div>
            ) : (
              <textarea
                value={descriptionText}
                onChange={handleDescriptionChange}
                onFocus={() => setIsTextareaFocused(true)}
                onBlur={() => setIsTextareaFocused(false)}
                onMouseDown={(e) => e.stopPropagation()} // 드래그 이벤트 방지
                onDragStart={(e) => e.preventDefault()} // 드래그 시작 방지
                onKeyDown={(e) => e.stopPropagation()} // 키보드 이벤트 전파 방지 (스페이스바 포함)
                onKeyUp={(e) => e.stopPropagation()} // 키업 이벤트 전파 방지
                onKeyPress={(e) => e.stopPropagation()} // 키프레스 이벤트 전파 방지
                placeholder={placeholderText}
                className="w-full h-full px-1 py-1 text-xs tracking-tight bg-[#F9FAFB] border-0 text-zinc-600 placeholder-zinc-400 shadow-none rounded-md focus:ring-0 focus:outline-none resize-none flex-1 scrollbar-hide"
                style={{
                  borderRadius: "6px",
                  fontSize: "13px",
                  lineHeight: "1",

                  scrollbarWidth: "none" /* Firefox */,
                  msOverflowStyle: "none" /* IE and Edge */,
                }}
                onClick={handleImageClick}
                draggable={false} // 드래그 완전 비활성화
              />
            )}

            {/* 글자수 카운팅 - 우측하단 (저장 상태가 아닐 때만 표시) */}
            {!isSaved && hasClickedAIGenerate && (
              <div className="flex justify-end items-center gap-x-1 w-full">
                <div className="flex items-center gap-x-1">
                  <div className="text-[12px] text-right">
                    <span className="text-black">{descriptionText.length}</span>
                    <span className="text-[#B3B3B3]"> / 150</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTextRefresh(e);
                      if (onAIGenerate) onAIGenerate();
                    }}
                    className="ml-auto"
                    title="새로 생성"
                  >
                    <MdRefresh className="w-4 h-4 text-black" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // 기본 모드
          <div className="flex w-full gap-1.5 mt-1 flex-col">
            <div
              className={`description-area flex overflow-hidden flex-col px-2 py-2 w-full leading-none ${
                isSaved ? "bg-[F9FAFB]" : "bg-[#F9FAFB]"
              } rounded-md ${
                isSaved ? "border-none" : "border border-dashed border-zinc-400"
              }  flex-1 relative`}
            >
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
                descriptionText && (
                  <div className="w-full mb-1.5 px-2 py-1 text-xs tracking-tight text-zinc-600 min-h-[26px]">
                    {descriptionText}
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center gap-1">
                  <Input
                    value={keywords}
                    onChange={handleKeywordChange}
                    onMouseDown={(e) => e.stopPropagation()} // 드래그 이벤트 방지
                    onDragStart={(e) => e.preventDefault()} // 드래그 시작 방지
                    onKeyDown={(e) => e.stopPropagation()} // 키보드 이벤트 전파 방지 (스페이스바 포함)
                    onKeyUp={(e) => e.stopPropagation()} // 키업 이벤트 전파 방지
                    onKeyPress={(e) => e.stopPropagation()} // 키프레스 이벤트 전파 방지
                    placeholder={placeholderText}
                    className="h-[26px] min-h-[26px] max-h-[26px] text-xs tracking-tight bg-[#F9FAFB] border-none placeholder-zinc-400 flex-1 shadow-none rounded-md "
                    style={{
                      borderRadius: "6px",
                      fontSize: "13px",
                      lineHeight: "1",
                    }}
                    onClick={handleImageClick}
                    draggable={false} // 드래그 완전 비활성화
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // 이벤트 전파 방지
                      handleTextFileUpload();
                    }}
                    className="flex overflow-hidden justify-center items-center w-[26px] h-[26px] "
                    title="텍스트 파일 업로드"
                  >
                    <Image
                      src="/report/upload2.svg"
                      className="object-contain"
                      width={14}
                      height={14}
                      alt="Upload icon"
                      unoptimized={true}
                    />
                  </button>
                </div>
              )}

              {/* 글자수 카운팅 - 우측하단 (저장 상태가 아닐 때만 표시) */}
              {!isSaved && hasClickedAIGenerate && (
                <div className="absolute bottom-2 right-3 text-[9px] font-medium text-primary">
                  ({descriptionText.length}/200)
                </div>
              )}
            </div>
            {!isSaved && (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // 이벤트 전파 방지
                  handleAIGenerate();
                }}
                disabled={(() => {
                  const hasValidCategory =
                    categoryValue &&
                    categoryValue.trim() !== "" &&
                    categoryValue !== "Text";
                  const hasImages = getCurrentImageCount() > 0;
                  const isNotLoading = !isLoading;
                  const disabled =
                    !hasValidCategory || !hasImages || !isNotLoading;

                  return disabled;
                })()}
                className={`flex overflow-hidden gap-0.5 text-xs font-semibold tracking-tight rounded-md justify-center items-center w-[90px] h-[34px] self-end transition-all ${(() => {
                  const hasValidCategory =
                    categoryValue &&
                    categoryValue.trim() !== "" &&
                    categoryValue !== "Text";
                  const hasImages = getCurrentImageCount() > 0;
                  const isNotLoading = !isLoading;
                  return !hasValidCategory || !hasImages || !isNotLoading
                    ? "cursor-not-allowed bg-[#F5F5F5] text-[#B3B3B3] border border-solid border-[#CCCCCC]"
                    : "text-black bg-white hover:opacity-90 border border-solid border-[#CCCCCC]";
                })()}`}
              >
                {isLoading ? (
                  <Loader size="sm" className="text-white" />
                ) : (
                  <div className="flex items-center gap-x-1 ">
                    <Image
                      src="/report/create.svg"
                      className={`object-contain ${(() => {
                        const hasValidCategory =
                          categoryValue &&
                          categoryValue.trim() !== "" &&
                          categoryValue !== "Text";
                        const hasImages = getCurrentImageCount() > 0;
                        const isNotLoading = !isLoading;
                        return !hasValidCategory || !hasImages || !isNotLoading
                          ? "filter brightness-0 saturate-100 opacity-70"
                          : "filter brightness-0 saturate-100";
                      })()}`}
                      style={(() => {
                        const hasValidCategory =
                          categoryValue &&
                          categoryValue.trim() !== "" &&
                          categoryValue !== "Text";
                        const hasImages = getCurrentImageCount() > 0;
                        const isNotLoading = !isLoading;
                        return !hasValidCategory || !hasImages || !isNotLoading
                          ? {
                              filter:
                                "brightness(0) saturate(100%) invert(70%) sepia(0%) saturate(0%) hue-rotate(229deg) brightness(96%) contrast(89%)",
                            }
                          : { filter: "brightness(0) saturate(100%)" };
                      })()}
                      width={14}
                      height={14}
                      alt="AI icon"
                      unoptimized={true}
                    />
                    <span
                      className={`text-[13px] tracking-[-0.03em] ${(() => {
                        const hasValidCategory =
                          categoryValue &&
                          categoryValue.trim() !== "" &&
                          categoryValue !== "Text";
                        const hasImages = getCurrentImageCount() > 0;
                        const isNotLoading = !isLoading;
                        return !hasValidCategory || !hasImages || !isNotLoading
                          ? "text-[#B3B3B3]"
                          : "text-black";
                      })()}`}
                    >
                      AI 생성
                    </span>
                  </div>
                )}
              </button>
            )}
          </div>
        )}

        {children && <div className="mt-1 flex-shrink-0">{children}</div>}
      </div>

      {/* GridEditToolbar - Portal로 렌더링하여 최상위에 위치 */}
      {toolbarState.show &&
        typeof window !== "undefined" &&
        ReactDOM.createPortal(
          <div
            className="grid-edit-toolbar fixed"
            style={{
              zIndex: 9999,
              pointerEvents: "auto",
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

      {/* 인라인 편집 확인/취소 포털 */}
      {inlineEditState.active &&
        typeof window !== "undefined" &&
        ReactDOM.createPortal(
          <div
            className="fixed z-[10000]"
            style={{ left: 0, top: 0, pointerEvents: "none" }}
          >
            <div
              className="absolute flex gap-2"
              style={{
                left:
                  (imageContainerRefs.current[
                    inlineEditState.imageIndex ?? -1
                  ]?.getBoundingClientRect().right || 0) - 160,
                top:
                  (imageContainerRefs.current[
                    inlineEditState.imageIndex ?? -1
                  ]?.getBoundingClientRect().bottom || 0) + 8,
              }}
            >
              <div
                className="px-2 py-1 flex gap-2"
                style={{ pointerEvents: "auto" }}
              >
                <Button color="gray" size="small" onClick={endInlineEditCancel}>
                  취소
                </Button>
                <Button
                  color="primary"
                  size="small"
                  onClick={endInlineEditConfirm}
                >
                  적용
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 기존 모달은 사용 중지 */}

      {/* 이미지 업로드 모달 */}
      {isUploadModalOpen && (
        <UploadModal
          isOpen={isUploadModalOpen}
          onCancel={handleCloseUploadModal}
          onConfirm={handleConfirmUploadModal}
          setItemData={handleSetItemData}
          isMultiUpload
          allowsFileTypes={["IMAGE"]}
          isUploadS3
          isReturnS3UploadedItemData
        />
      )}

      {/* 편집 도구 Portal */}
      <EditToolsPortal />

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
