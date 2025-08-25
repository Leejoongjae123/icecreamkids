"use client";
import * as React from "react";
import * as ReactDOM from "react-dom";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import GridEditToolbar from "./GridEditToolbar";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/common/Button";
import { ImagePosition } from "../types";
import { IoClose } from "react-icons/io5";
import { MdRefresh } from "react-icons/md";
import { MdZoomIn, MdZoomOut } from "react-icons/md";
import { useSavedDataStore } from "@/hooks/store/useSavedDataStore";
import useUserStore from "@/hooks/store/useUserStore";
import useGridContentStore from "@/hooks/store/useGridContentStore";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useMemoCheck } from "@/hooks/useMemoCheck";
import MemoIndicator from "../components/MemoIndicator";
import { MemoEditModal } from "@/components/modal/memo-edit";
import { UploadModal } from "@/components/modal";
import {
  useGetDriveItemMemos,
  useUpdateDriveItemMemo,
} from "@/service/file/fileStore";
import { useToast } from "@/hooks/store/useToastStore";
import { useAlertStore } from "@/hooks/store/useAlertStore";
import { DriveItemMemoUpdateRequest } from "@/service/file/schemas";
import { IEditMemoData } from "@/components/modal/memo-edit/types";
import { useSearchParams } from "next/navigation";
import useS3FileUpload from "@/hooks/useS3FileUpload";
import { useImageEditModalStore } from "@/hooks/store/useImageEditModalStore";
import { useGridToolbarStore } from "@/hooks/store/useGridToolbarStore";

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
  highlightMode?: 'none' | 'full' | 'split';
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
  placeholderText = "(선택)놀이 키워드 입력 또는 메모 파일 업로드",
  isExpanded = false,
  isHidden = false,
  imageCount: propsImageCount = 1, // 초기 이미지 개수
  onImageCountChange, // 이미지 개수 변경 콜백
  highlightMode = 'none',
}: GridBElementProps) {
  // 사용자 정보 가져오기
  const { isSaved } = useSavedDataStore();
  const { userInfo } = useUserStore();
  const profileId = React.useMemo(() => userInfo?.id || null, [userInfo?.id]);
  const accountId = React.useMemo(
    () => userInfo?.accountId || null,
    [userInfo?.accountId]
  );

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
    updateAiGenerated,
    updateDriveItemKeys,
    gridContents,
  } = useGridContentStore();

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

  // 이미지 개수 상태 관리
  const [imageCount, setImageCount] = React.useState(propsImageCount);

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
    console.log("🏁 GridB 초기 currentImages 설정:", {
      원본이미지: images,
      새이미지: newImages,
      초기이미지: initialImages,
      imageCount: imageCount,
    });
    return initialImages;
  });

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
    onFilesUpload: async (files: File[] | any[]) => {
      console.log("📥 GridB 이미지 업로드 완료:", files);

      const imageUrls: string[] = [];
      const metadata: { url: string; driveItemKey?: string }[] = [];

      // 1) 자료보드 선택(이미 업로드된 항목)
      const smartItems = files.filter((f: any) => !(f instanceof File));
      smartItems.forEach((item: any) => {
        const url = item?.thumbUrl || item?.driveItemResult?.thumbUrl;
        if (url) {
          imageUrls.push(url);
          metadata.push({ url, driveItemKey: item?.driveItemKey });
        }
      });

      // 2) 로컬 파일 업로드 처리 (S3 업로드 후 thumbUrl/driveItemKey 반영)
      const localFiles = files.filter((f: any) => f instanceof File) as File[];
      if (localFiles.length > 0) {
        const uploadResults = await Promise.all(
          localFiles.map(async (file) => {
            const res = await postFile({
              file,
              fileType: "IMAGE",
              taskType: "ETC",
              source: "FILE",
              // 이미지의 경우 썸네일도 함께 업로드해 thumbUrl 생성
              thumbFile: file,
            });
            if (res && !Array.isArray(res)) {
              const anyRes = res as any;
              const url = anyRes?.thumbUrl || anyRes?.driveItemResult?.thumbUrl;
              const key = anyRes?.driveItemKey || anyRes?.driveItemResult?.driveItemKey;
              if (url) {
                imageUrls.push(url);
                metadata.push({ url, driveItemKey: key });
              }
              setUploadedFiles((prev) => [...prev, file]);
            }
          })
        );
        void uploadResults;
      }

      if (metadata.length > 0) {
        setImageMetadata((prev) => [...prev, ...metadata]);
      }
      if (imageUrls.length > 0) {
        handleImagesAdded(imageUrls);
      }
    },
    maxDataLength: imageCount, // 현재 이미지 개수만큼 제한
  });

  // ref를 drop에 연결
  React.useEffect(() => {
    if (dropRef.current) {
      drop(dropRef);
    }
  }, [drop]);

  // 네이티브 파일 드래그앤드롭 지원 (react-dnd 외부 파일 허용 없이도 동작)
  React.useEffect(() => {
    const el = dropRef.current;
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
        processUploadedFiles(files as File[]);
      }
    };

    el.addEventListener("dragover", onDragOver as any);
    el.addEventListener("drop", onDrop as any);
    return () => {
      el.removeEventListener("dragover", onDragOver as any);
      el.removeEventListener("drop", onDrop as any);
    };
  }, [processUploadedFiles]);

  // 이미지 URL로 driveItemKey 찾기
  const getDriveItemKeyByImageUrl = React.useCallback(
    (imageUrl: string): string | undefined => {
      const metadata = imageMetadata.find((item) => item.url === imageUrl);
      return metadata?.driveItemKey;
    },
    [imageMetadata]
  );

  // 이미지 메타데이터가 변경될 때마다 메모 상태 체크
  React.useEffect(() => {
    const checkMemosForImages = async () => {
      if (!userInfo?.accountId) {
        return;
      }

      const memoCheckPromises = imageMetadata.map(async (metadata) => {
        if (
          metadata.driveItemKey &&
          metadata.driveItemKey.startsWith("local_")
        ) {
          // 로컬 이미지(직접 업로드)는 메모 체크하지 않음
          return null;
        }

        if (metadata.driveItemKey) {
          try {
            const response = await fetch(
              `/api/file/v1/drive-items/${metadata.driveItemKey}/memos?owner_account_id=${userInfo.accountId}`,
              {
                method: "GET",
                headers: {
                  accept: "*/*",
                },
              }
            );

            if (response.ok) {
              const data = await response.json();
              const memoExists = Array.isArray(data.result)
                ? data.result.length > 0
                : false;
              return {
                driveItemKey: metadata.driveItemKey,
                hasMemo: memoExists,
              };
            }
          } catch (error) {
            console.log("메모 체크 실패:", error);
          }
        }
        return null;
      });

      const results = await Promise.all(memoCheckPromises);
      const newMemoStatuses: { [key: string]: boolean } = {};

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
      console.log(
        "🔄 GridBElement props.images 변경됨, currentImages 업데이트:",
        {
          propsImages: images,
          이전currentImages: currentImages,
          imageCount: imageCount,
        }
      );

      // props images가 비어있으면 currentImages도 초기화
      if (images.length === 0 || images.every((img) => !img || img === "")) {
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
    return currentImages.filter(
      (img) =>
        img &&
        img !== "" &&
        img !==
          "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg"
    ).length;
  }, [currentImages]);

  // 남은 선택 가능한 이미지 개수 계산
  const getRemainingImageCount = React.useCallback((): number => {
    const currentCount = getCurrentImageCount();
    return Math.max(0, imageCount - currentCount);
  }, [getCurrentImageCount, imageCount]);

  // 이미지 위치 정보 상태
  const [imagePositions, setImagePositions] = React.useState<ImagePosition[]>(
    () => Array(imageCount).fill({ x: 0, y: 0, scale: 1 })
  );

  // 인라인 편집 상태 및 레퍼런스
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
  const { setImageEditModalOpen } = useImageEditModalStore();

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
        cropRect: null,
        cropDraggingEdge: null,
        cropStartPointer: null,
        cropBounds: null,
      });
      // 전역 플래그로 보드 DnD 비활성화
      setImageEditModalOpen(true);
    },
    [imagePositions, setImageEditModalOpen]
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
      setImageEditModalOpen(false);
      return;
    }
    const idx = inlineEditState.imageIndex;
    const nextPositions = [...imagePositions];
    nextPositions[idx] = {
      ...nextPositions[idx],
      ...inlineEditState.tempPosition,
    } as ImagePosition;
    setImagePositions(nextPositions);
    setInlineEditState((prev) => ({
      ...prev,
      active: false,
      imageIndex: null,
      mode: null,
      cropActive: false,
    }));
    // 전역 플래그로 보드 DnD 재활성화
    setImageEditModalOpen(false);
  }, [inlineEditState, imagePositions, setImageEditModalOpen]);

  const endInlineEditCancel = React.useCallback(() => {
    setInlineEditState((prev) => ({
      ...prev,
      active: false,
      imageIndex: null,
      mode: null,
      cropActive: false,
    }));
    setImageEditModalOpen(false);
  }, [setImageEditModalOpen]);

  // 크롭 제어 (신규 컨셉: 비활성화)
  const beginCrop = React.useCallback(() => {
    const idx = inlineEditState.imageIndex;
    const container = idx !== null ? imageContainerRefs.current[idx] : null;
    const imageUrl = idx !== null ? currentImages[idx] : undefined;
    // 비활성화: 아무 동작도 하지 않음
    return;
  }, [
    inlineEditState.imageIndex,
    inlineEditState.tempPosition,
    imagePositions,
    isEditingIndex,
    currentImages,
  ]);

  const { postFile } = useS3FileUpload();
  const finishCropAndUpload = React.useCallback(async () => {
    // 신규 컨셉: 크롭 비활성화 → 상태만 정리
    setInlineEditState((prev) => ({ ...prev, cropActive: false, cropRect: null }));
  }, []);

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
          }
          return { ...prev, startPointer: null, mode: null };
        });
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [inlineEditState.active, inlineEditState.imageIndex, imagePositions]
  );

  const onResizeHandleDown = React.useCallback(
    (e: React.MouseEvent) => {
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
          }
          return { ...prev, startPointer: null, mode: null };
        });
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [inlineEditState.active, imagePositions]
  );

  const renderResizeHandles = React.useCallback(() => {
    // A타입 컨셉: 핸들 제거
    return null;
  }, []);

  // GridA와 동일하게 키보드 +/-로 확대/축소
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!inlineEditState.active) return;
      const target = e.target as HTMLElement | null;
      const tag = target ? target.tagName.toLowerCase() : "";
      if (target && (tag === "input" || tag === "textarea" || target.isContentEditable)) return;
      const isZoomIn = e.key === "+" || (e.code === "Equal" && e.shiftKey) || e.code === "NumpadAdd";
      const isZoomOut = e.key === "-" || e.code === "Minus" || e.code === "NumpadSubtract";
      if (isZoomIn) {
        e.preventDefault();
        setInlineEditState((prev) => ({
          ...prev,
          tempPosition: { ...prev.tempPosition, scale: Math.min(3, prev.tempPosition.scale * 1.2) },
        }));
      } else if (isZoomOut) {
        e.preventDefault();
        setInlineEditState((prev) => ({
          ...prev,
          tempPosition: { ...prev.tempPosition, scale: Math.max(0.1, prev.tempPosition.scale / 1.2) },
        }));
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [inlineEditState.active, setInlineEditState]);

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

  // 여러 이미지 추가 핸들러
  const handleImagesAdded = React.useCallback(
    (imageUrls: string[]) => {
      console.log("📥 GridBElement에서 여러 이미지 받음:", imageUrls);
      console.log("📏 현재 imageCount:", imageCount);

      setCurrentImages((prev) => {
        const newImages = [...prev];

        // 받은 이미지 개수를 imageCount로 제한
        const limitedImageUrls = imageUrls.slice(0, imageCount);

        // 받은 이미지들을 순서대로 빈 슬롯에 배치
        let imageUrlIndex = 0;
        for (
          let i = 0;
          i < newImages.length && imageUrlIndex < limitedImageUrls.length;
          i++
        ) {
          if (
            !newImages[i] ||
            newImages[i] === "" ||
            newImages[i] ===
              "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg"
          ) {
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

        console.log("📊 GridB 이미지 배치 결과:", {
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
      console.log(`📥 GridB 개별 이미지 ${imageIndex} 변경:`, hasImage);
    },
    []
  );

  // imageCount 변경 시 currentImages와 imagePositions 업데이트
  React.useEffect(() => {
    console.log("🔄 GridB imageCount 변경됨:", imageCount);

    setCurrentImages((prev) => {
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
          gridTemplateRows: "1fr", // 높이는 모두 같음
        },
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
              cellX = containerRect.left + imageIndex * (cellWidth + gap);
              break;
            case 3:
              // 3개 이미지는 가로로 분할 (grid-cols-3)
              cellWidth = (containerRect.width - gap * 2) / 3;
              cellX = containerRect.left + imageIndex * (cellWidth + gap);
              break;
            case 4:
              // 2x2 그리드 (grid-cols-2)
              cellWidth = (containerRect.width - gap) / 2;
              cellHeight = (containerRect.height - gap) / 2;
              cellX = containerRect.left + (imageIndex % 2) * (cellWidth + gap);
              cellY =
                containerRect.top +
                Math.floor(imageIndex / 2) * (cellHeight + gap);
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
        }

        const targetFrame = {
          width: Math.round(cellWidth),
          height: Math.round(cellHeight),
          x: Math.round(cellX),
          y: Math.round(cellY),
        };

        console.log(`📏 GridB 이미지 ${imageIndex} 실제 측정된 셀 크기:`, {
          imageCount,
          isExpanded,
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
    [imageCount, isExpanded]
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
  }, [measureSingleImageCellSize, isExpanded, imageCount]);

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
        aspectRatio: imageWidth / imageHeight,
      };
    },
    [measureImageCellSize, isExpanded, imageCount]
  );

  // 키워드 입력 (소형 Input)
  const [keywords, setKeywords] = React.useState("");
  // LLM 생성/설명 텍스트 (description-area textarea)
  const [descriptionText, setDescriptionText] = React.useState("");

  // Grid content store에서 해당 그리드의 playSubjectText 값 변경 시 descriptionText 업데이트 (초기화 반영)
  React.useEffect(() => {
    if (gridId && gridContents[gridId]) {
      const storePlaySubjectText = gridContents[gridId].playSubjectText || "";
      console.log(`🔄 GridBElement ${gridId} store playSubjectText 변경됨:`, {
        storeValue: storePlaySubjectText,
        currentDescription: descriptionText,
      });

      // store에서 값이 초기화된 경우 descriptionText도 초기화
      if (storePlaySubjectText === "" && descriptionText !== "") {
        setDescriptionText("");
      } else if (storePlaySubjectText !== descriptionText) {
        setDescriptionText(storePlaySubjectText);
        if (
          typeof storePlaySubjectText === "string" &&
          storePlaySubjectText.trim() !== ""
        ) {
          setHasClickedAIGenerate(true);
          setIsDescriptionExpanded(true);
          // 스토어의 AI 생성 플래그도 업데이트
          updateAiGenerated(gridId, true);
        }
      }
    }
  }, [gridContents, gridId, descriptionText]);

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
  // hover 및 포털 위치 상태 (GridAElement와 동일 패턴)
  const [isHovered, setIsHovered] = React.useState(false);
  const isHoveredRef = React.useRef(false);
  const hoverTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const [toolbarPosition, setToolbarPosition] = React.useState({
    left: 0,
    top: 0,
  });
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // Default images if none provided - imageCount에 맞게 동적으로 생성
  const defaultImages = React.useMemo(() => {
    return Array(imageCount).fill(
      "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg"
    );
  }, [imageCount]);

  const displayImages = images.length > 0 ? images : defaultImages;

  // currentImages가 변경될 때 store 업데이트
  React.useEffect(() => {
    if (gridId && currentImages.length > 0) {
      // 기본 이미지가 아닌 실제 업로드된 이미지들만 필터링
      const validImages = currentImages.filter(
        (img) =>
          img &&
          img !==
            "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg"
      );
      updateImages(gridId, validImages);
    }
  }, [currentImages, gridId, updateImages]);

  // 키워드 입력 변경 (store에 반영하지 않음)
  const handleKeywordChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
    console.log("🤖 GridB AI 생성 조건 체크:", {
      profileId,
      이미지개수: getCurrentImageCount(),
      키워드: keywords?.trim(),
    });

    // profileId 체크 - 로그인 상태 확인
    if (!profileId) {
      console.log("❌ AI 생성 조건 실패: 로그인 필요");
      addToast({ message: "로그인 후 사용해주세요." });
      return;
    }

    // 그리드에서 이미지의 data-id 값들 수집
    const photoDriveItemKeys: string[] = [];
    currentImages.forEach((imageUrl) => {
      if (
        imageUrl &&
        imageUrl !== "" &&
        imageUrl !==
          "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg"
      ) {
        const driveItemKey = getDriveItemKeyByImageUrl(imageUrl);
        if (driveItemKey && !driveItemKey.startsWith("local_")) {
          photoDriveItemKeys.push(driveItemKey);
        }
      }
    });

    if (photoDriveItemKeys.length === 0) {
      console.log("❌ AI 생성 조건 실패: 유효한 이미지가 없음");
      addToast({ message: "먼저 이미지를 업로드해주세요." });
      return;
    }

    // searchParams에서 age 값 가져오기
    const ageParam = searchParams?.get("age");
    const age = ageParam ? parseInt(ageParam, 10) : 3; // 기본값: 3 (6세)

    const requestData = {
      profileId,
      subject: "놀이 활동", // GridB는 categoryValue가 없으므로 기본값 사용
      age,
      startsAt: new Date().toISOString().split("T")[0], // 오늘 날짜
      endsAt: new Date().toISOString().split("T")[0], // 오늘 날짜
      photoDriveItemKeys,
      keywords: keywords.trim() || "", // 현재 입력된 키워드 사용
    };

    console.log("GridB LLM API 호출 데이터:", requestData);

    try {
      const response = await fetch("/api/ai/v2/report/type-b/analyze-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log("API 오류:", errorData);
        showAlert({ message: "AI 생성에 실패했습니다. 다시 시도해주세요." });
        return;
      }

      const result = (await response.json()) as any;
      console.log("GridB LLM API 응답:", result);

      // API 응답 구조에서 텍스트 추출
      let generatedText = "";

      console.log("응답 구조 분석:", {
        hasSuccess: !!result.success,
        hasData: !!result.data,
        hasDataResult: !!result.data?.result,
        hasDataResultContents: !!result.data?.result?.contents,
        fullResponse: result,
      });

      if (result.success && result.data?.result?.contents) {
        // type-b API 응답 구조: { success: true, data: { result: { contents: "..." } } }
        generatedText = result.data.result.contents;
      } else if (result.success && result.data?.contents) {
        generatedText = result.data.contents;
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

      addToast({ message: "AI 텍스트가 생성되었습니다." });
    } catch (error) {
      console.log("API 호출 오류:", error);
      showAlert({ message: "AI 생성 중 오류가 발생했습니다." });
    }
  }, [
    profileId,
    currentImages,
    getDriveItemKeyByImageUrl,
    searchParams,
    keywords,
    gridId,
    updatePlaySubject,
    updateAiGenerated,
    getCurrentImageCount,
    showAlert,
    addToast,
  ]);

  const handleAIGenerate = () => {
    console.log("🎯 GridB AI 생성 버튼 클릭됨");
    console.log("현재 isDescriptionExpanded:", isDescriptionExpanded);
    console.log("현재 이미지 개수:", getCurrentImageCount());

    // 추가 조건 체크 (안전장치)
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
    console.log("GridB 이미지 업로드 버튼 클릭됨");
    // 새로운 이미지 업로드 모달 열기
    handleOpenUploadModal();

    // 기존 핸들러도 호출 (필요시)
    if (onImageUpload) {
      onImageUpload();
    }
  };

  // 텍스트 파일 업로드 핸들러
  const handleTextFileUpload = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".txt";
    fileInput.style.display = "none";

    fileInput.onchange = (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];

      if (file && file.type === "text/plain") {
        const reader = new FileReader();

        reader.onload = (e) => {
          const content = e.target?.result as string;
          if (content) {
            // 텍스트 파일은 키워드 입력으로 설정 (store 미반영)
            setKeywords(content);
          }
        };

        reader.readAsText(file, "UTF-8");
      } else {
        alert("텍스트 파일(.txt)만 업로드 가능합니다.");
      }

      document.body.removeChild(fileInput);
    };

    document.body.appendChild(fileInput);
    fileInput.click();
  };

  // 이미지 더블클릭 시 인라인 편집 시작
  const handleImageAdjustClick = (imageIndex: number, imageUrl: string) => {
    if (
      imageUrl &&
      imageUrl !==
        "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg"
    ) {
      beginInlineEdit(imageIndex);
    }
  };

  // ImageEditModal에서 편집된 이미지 적용 핸들러
  const handleImageEditApply = (processedImages: {
    imageUrls: string[];
    imagePositions: any[];
  }) => {
    console.log(
      "📸 GridB 편집된 이미지 데이터 받음:",
      processedImages.imageUrls
    );
    console.log(
      "📸 GridB 편집된 이미지 위치 데이터:",
      processedImages.imagePositions
    );

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

    // 모달 닫기
    setImageEditModal((prev) => ({ ...prev, isOpen: false }));
  };

  // ImageEditModal에서 이미지 순서 변경 핸들러
  const handleImageOrderChange = (newOrder: string[]) => {
    console.log("🔄 GridB 이미지 순서 변경:", newOrder);
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
          console.log(`GridB 이미지 ${imageIndex + 1} 배경 제거 실패`);
          return null;
        }

        const result = await response.json();
        console.log(
          `🖼️ GridB 이미지 ${imageIndex + 1} 배경 제거 API 응답:`,
          result
        );

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
              console.log(`🖼️ GridB 이미지 ${imageIndex + 1} 배경 제거 완료:`, {
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
        console.log(`GridB 이미지 ${imageIndex + 1} 배경 제거 오류:`, error);
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
      if (
        imageUrl &&
        imageUrl !== "" &&
        imageUrl !==
          "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg"
      ) {
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
      `🖼️ GridB ${validImages.length}개 이미지의 배경 제거 시작:`,
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
      console.log("GridB 배경 제거 API 호출 오류:", error);
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

  // 텍스트 새로고침 핸들러 - LLM API 호출
  const handleTextRefresh = (event: React.MouseEvent) => {
    event.stopPropagation(); // 이벤트 전파 방지

    console.log("🔄 GridB 텍스트 새로고침 조건 체크:", {
      profileId,
      currentImageCount: getCurrentImageCount(),
      키워드: keywords?.trim(),
    });

    // LLM 호출 조건 확인
    if (!profileId) {
      console.log("❌ 새로고침 조건 실패: 로그인 필요");
      addToast({ message: "로그인 후 사용해주세요." });
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

  const handleDelete = () => {
    if (onDelete) {
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

      console.log(`🗑️ GridB 이미지 ${imageIndex} 삭제:`, {
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
    // 위치 갱신
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setToolbarPosition({ left: rect.left + 8, top: rect.bottom + 8 });
    }

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

  // hover 진입/이탈 핸들러 (GridAElement 참고)
  const handleMouseEnter = () => {
    setIsHovered(true);
    isHoveredRef.current = true;
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    // 툴바 표시 및 위치 업데이트
    setToolbarState({ show: true, isExpanded: true });
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setToolbarPosition({ left: rect.left + 8, top: rect.bottom + 8 });
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

  // 툴바 아이콘 클릭 핸들러
  const handleToolbarIconClick = (iconIndex: number, data?: any) => {
    console.log(`툴바 아이콘 ${iconIndex} 클릭됨, Grid ${index}`, data);

    // 이미지 개수 변경 처리
    if (data && data.action === "changeImageCount") {
      console.log(
        `그리드 ${data.gridId}의 이미지 개수를 ${data.count}개로 변경`
      );
      setImageCount(data.count);
      // 부모 컴포넌트에 이미지 개수 변경 알림
      if (onImageCountChange) {
        onImageCountChange(data.count);
      }
    }

    // 사진 배경 제거 처리 (인덱스 3) - 새로운 배경 제거 API 사용
    if (iconIndex === 3) {
      console.log(`GridB 그리드 ${index}의 배경 제거 API 호출`);
      callRemoveBackgroundAPI();

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

  // 언마운트 시 hover 타이머 정리
  React.useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  // 스크롤/리사이즈 시 포지션 업데이트
  React.useEffect(() => {
    const updateToolbarPosition = () => {
      if (toolbarState.show && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setToolbarPosition({ left: rect.left + 8, top: rect.bottom + 8 });
      }
    };

    if (toolbarState.show) {
      updateToolbarPosition();
      window.addEventListener("scroll", updateToolbarPosition, true);
      window.addEventListener("resize", updateToolbarPosition);
    }

    return () => {
      window.removeEventListener("scroll", updateToolbarPosition, true);
      window.removeEventListener("resize", updateToolbarPosition);
    };
  }, [toolbarState.show]);

  // 툴바 표시 상태 또는 기존 선택 상태에 따른 border 스타일 결정
  const borderClass = isSaved
    ? ""
    : toolbarState.show || isSelected
      ? "border-solid border-primary border-2"
      : "border-dashed border-zinc-400";

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className={`relative overflow-hidden px-2.5 py-2.5 bg-white rounded-2xl ${isSaved ? "border-0" : `border ${borderClass}`} w-full h-full flex flex-col ${className} gap-y-1.5 cursor-pointer`}
        style={style}
        onClick={handleNonImageClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-grid-id={gridId}
      >
        {/* Hover 미리보기 오버레이 (합치기: 전체, 쪼개기: 반반) */}
        {highlightMode !== 'none' && !isSaved && (
          <div className="absolute inset-0 pointer-events-none z-[1]">
            {highlightMode === 'full' ? (
              <div
                className="absolute inset-0 rounded-2xl"
                style={{ backgroundColor: '#FAB83D66' }}
              />
            ) : (
              // split 미리보기: 좌/우 색상 분리 표시
              <div className="absolute inset-0 flex rounded-2xl overflow-hidden">
                <div
                  className="flex-1 h-full rounded-2xl"
                  style={{ backgroundColor: '#FA6F3D66' }}
                />
                <div className="w-[12px]" />
                <div
                  className="flex-1 h-full rounded-2xl"
                  style={{ backgroundColor: '#3D8FFA66' }}
                />
              </div>
            )}
          </div>
        )}
        {/* 이미지 그리드 - 계산된 높이로 설정하여 공간 최적화 */}
        <div
          ref={dropRef}
          className={`grid gap-1 w-full relative ${getImageGridLayout(imageCount).className}`}
          style={{
            height: "110px",
            backgroundColor: canDrop && isOver ? "#f0f0f0" : "transparent",
            transition: "background-color 0.2s ease",
            ...getImageGridLayout(imageCount).style,
          }}
        >
          {currentImages.map((imageSrc, index) => {
            // 합친 경우이고 이미지가 3개일 때 각 이미지의 grid-area 지정
            let gridAreaStyle = {};
            if (isExpanded && imageCount === 3) {
              switch (index) {
                case 0:
                  gridAreaStyle = { gridArea: "left-left" };
                  break;
                case 1:
                  gridAreaStyle = { gridArea: "left-right" };
                  break;
                case 2:
                  gridAreaStyle = { gridArea: "right" };
                  break;
              }
            }

            return (
              <div key={index} className="w-full h-full">
                <div
                  className={`relative cursor-pointer hover:opacity-80 transition-opacity group w-full h-[110px] rounded-md ${isSaved ? "border-none" : "border border-dashed border-[#AAACB4]"} ${isSaved && !(imageSrc && imageSrc !== "" && imageSrc !== "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg") ? "invisible" : ""}`}
                  style={gridAreaStyle}
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
                      className={`absolute inset-0 ${isEditingIndex(index) ? "overflow-visible border-2 border-primary" : "overflow-hidden"} rounded-md cursor-pointer group`}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        beginInlineEdit(index);
                      }}
                      ref={(el) => {
                        imageContainerRefs.current[index] = el;
                      }}
                    >
                      <img
                        src={imageSrc}
                        alt={`Image ${index + 1}`}
                        className="absolute inset-0 w-full h-full object-contain rounded-md"
                        style={{
                          transform: isEditingIndex(index)
                            ? `translate(${inlineEditState.tempPosition.x}px, ${inlineEditState.tempPosition.y}px) scale(${inlineEditState.tempPosition.scale})`
                            : `translate(${imagePositions[index]?.x || 0}px, ${imagePositions[index]?.y || 0}px) scale(${imagePositions[index]?.scale || 1})`,
                          transformOrigin: "center",
                        }}
                        data-id={getDriveItemKeyByImageUrl(imageSrc)}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          beginInlineEdit(index);
                        }}
                        onMouseDown={
                          isEditingIndex(index) ? onEditMouseDown : undefined
                        }
                        draggable={false}
                      />
                      {renderResizeHandles()}
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
                      {/* X 삭제 버튼 */}
                      <button
                        className={`absolute top-1 right-1 bg-white w-5 h-5 rounded-full flex items-center justify-center border border-solid border-[#F0F0F0] ${isSaved ? "invisible pointer-events-none" : ""}`}
                        onClick={(e) => handleImageDelete(index, e)}
                        title="이미지 삭제"
                      >
                        <IoClose className="w-4 h-4 text-black" />
                      </button>
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
                        style={{ backgroundColor: "#F9FAFB" }}
                      />
                      {/* Overlay - GridAElement와 동일한 안내 UI (클릭 불가) */}
                      <div className="absolute inset-0 rounded-md flex flex-col items-center justify-center opacity-100 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none gap-y-2">
                        <div className={`${imageCount >= 2 ? "w-[17px] h-[17px]" : "w-[26px] h-[26px]"} bg-[#E5E7EC] rounded-full flex items-center justify-center`}>
                          <Image
                            src="/report/upload.svg"
                            width={imageCount >= 2 ? 11 : 16}
                            height={imageCount >= 2 ? 11 : 16}
                            className="object-contain"
                            alt="Upload icon"
                            unoptimized={true}
                          />
                        </div>
                        <div className={`text-[#8F8F8F] ${imageCount >= 2 ? "text-[10px]" : "text-[14px]"} font-medium text-center mb-2 px-1`}>
                          이미지를 드래그하거나
                          <br />
                          클릭하여 업로드
                        </div>
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
          <div className="flex flex-col gap-y-2 items-center justify-center px-2 py-2 w-full leading-none bg-white rounded-md border border-dashed border-zinc-400 h-[100px] flex-shrink-0">
            <Loader size="default" />
            <div className="text-[#B4B4B4] text-xs">내용을 생성중입니다...</div>
          </div>
        ) : isDescriptionExpanded ? (
          // 확장된 textarea 모드
          <div
            className={`flex overflow-hidden flex-col px-1 py-1 w-full leading-none bg-white rounded-md h-[100px] justify-center flex-shrink-0 relative transition-colors ${
              isSaved
                ? ""
                : isTextareaFocused
                  ? "border border-solid border-primary"
                  : "border border-dashed border-zinc-400"
            }`}
          >
            <textarea
              value={descriptionText}
              onChange={handleDescriptionChange}
              onFocus={() => setIsTextareaFocused(true)}
              onBlur={() => setIsTextareaFocused(false)}
              placeholder={placeholderText}
              className="w-full h-full px-1 py-0.5  text-xs tracking-tight bg-transparent border-0 text-zinc-600 placeholder-zinc-400 shadow-none rounded-md focus:ring-0 focus:outline-none resize-none flex-1 scrollbar-hide description-area"
              style={{
                borderRadius: "6px",
                fontSize: "12px",
                lineHeight: "1.2",
                scrollbarWidth: "none" /* Firefox */,
                msOverflowStyle: "none" /* IE and Edge */,
                backgroundColor: 'transparent'
              }}
              onClick={handleImageClick}
            />

            {/* 글자수 + 새로고침 - 우측하단 */}
            {hasClickedAIGenerate && !isSaved && (
              <div className="absolute bottom-2 right-3 flex items-center gap-2 z-10">
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
            )}
          </div>
        ) : (
          // 기본 모드 (GridAElement와 동일 UI, category 입력 제외)
          <div
            className="w-full h-full flex flex-col gap-y-2"
          >
            <div
              className={`description-area flex overflow-hidden flex-col px-2 py-2 w-full leading-none bg-[#F9FAFB] rounded-md ${isSaved ? "border-none" : "border border-dashed border-zinc-400"} flex-1 relative`}
            >
              {/* 저장 상태일 때는 읽기 전용 텍스트 표시, 편집 상태일 때는 입력 영역 표시 */}
              {isSaved ? (
                descriptionText && (
                  <div className="w-full mb-1.5 px-2 py-1 text-xs tracking-tight text-zinc-600 min-h-[26px]">
                    {descriptionText}
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center gap-1 h-full input-area">
                  <textarea
                    value={keywords}
                    onChange={handleKeywordChange}
                    onMouseDown={(e) => e.stopPropagation()}
                    onDragStart={(e) => e.preventDefault()}
                    onKeyDown={(e) => e.stopPropagation()}
                    onKeyUp={(e) => e.stopPropagation()}
                    onKeyPress={(e) => e.stopPropagation()}
                    placeholder={placeholderText}
                    className="h-full flex-1  text-xs tracking-tight bg-transparent border-none placeholder-zinc-400  shadow-none rounded-md "
                    style={{
                      borderRadius: "6px",
                      fontSize: "13px",
                      lineHeight: "1",
                      backgroundColor: 'transparent'
                    }}
                    onClick={handleImageClick}
                    draggable={false}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
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

              {/* 글자수 + 새로고침 - 우측하단 (저장 상태가 아닐 때만 표시) */}
              {!isSaved && hasClickedAIGenerate && (
                <div className="absolute bottom-2 right-3 flex items-center gap-2 z-10">
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
              )}
            </div>
            {!isSaved && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAIGenerate();
                }}
                disabled={(() => {
                  const hasImages = getCurrentImageCount() > 0;
                  const isNotLoading = !isLoading;
                  const disabled = !hasImages || !isNotLoading;
                  return disabled;
                })()}
                className={`flex overflow-hidden gap-0.5 text-xs font-semibold tracking-tight rounded-md justify-center items-center w-[90px] h-[34px] self-end transition-all ${(() => {
                  const hasImages = getCurrentImageCount() > 0;
                  const isNotLoading = !isLoading;
                  return !hasImages || !isNotLoading
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
                        const hasImages = getCurrentImageCount() > 0;
                        const isNotLoading = !isLoading;
                        return !hasImages || !isNotLoading
                          ? "filter brightness-0 saturate-100 opacity-70"
                          : "filter brightness-0 saturate-100";
                      })()}`}
                      style={(() => {
                        const hasImages = getCurrentImageCount() > 0;
                        const isNotLoading = !isLoading;
                        return !hasImages || !isNotLoading
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
                        const hasImages = getCurrentImageCount() > 0;
                        const isNotLoading = !isLoading;
                        return !hasImages || !isNotLoading
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

      {/* GridEditToolbar - Portal로 렌더링하여 최상위에 위치 (GridAElement 참고) */}
      {!isSaved &&
        (toolbarState.show || toolbarModalOpen) &&
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
              targetIsExpanded={isExpanded}
              onRequestHideToolbar={handleHideToolbar}
              onModalStateChange={setToolbarModalOpen}
            />
          </div>,
          document.body
        )}

      {/* 인라인 편집 컨트롤 포털 제거: 하단 인라인 "취소/적용"만 사용 */}

      {/* GridA 스타일의 우측 플로팅 확대/축소/되돌리기 버튼 포털 */}
      {inlineEditState.active && typeof window !== "undefined" &&
        (() => {
          const activeIdx = inlineEditState.imageIndex;
          const el =
            activeIdx !== null ? imageContainerRefs.current[activeIdx] : null;
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

          return ReactDOM.createPortal(
            <>
              {/* 화면 전체 음영 (선택 영역 제외) */}
              <div
                className="fixed left-0 top-0 bg-black/40 z-[9998]"
                style={{ width: "100vw", height: Math.max(0, rect.top) }}
              />
              <div
                className="fixed left-0 bg-black/40 z-[9998]"
                style={{ top: rect.bottom, width: "100vw", height: Math.max(0, vh - rect.bottom) }}
              />
              <div
                className="fixed top-0 bg-black/40 z-[9998]"
                style={{ left: 0, top: rect.top, width: Math.max(0, rect.left), height: Math.max(0, rect.height) }}
              />
              <div
                className="fixed top-0 bg-black/40 z-[9998]"
                style={{ left: rect.right, top: rect.top, width: Math.max(0, vw - rect.right), height: Math.max(0, rect.height) }}
              />

              {/* 도구 버튼 - 선택 컨테이너 바로 옆 */}
              <div className="fixed z-[9999] flex flex-col gap-2" style={{ top: toolsTop, left: toolsLeft }}>
                <button
                  onClick={handleZoomIn}
                  className="w-10 h-10 border-1 border-[#CCCCCC] bg-white border-2 rounded-lg flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors"
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

      {/* 인라인 편집 컨트롤 포털 (A타입과 동일하게 배치/스타일) */}
      {inlineEditState.active &&
        typeof window !== "undefined" &&
        ReactDOM.createPortal(
          <div className="fixed z-[10000]" style={{ left: 0, top: 0, pointerEvents: "none" }}>
            <div
              className="absolute -translate-x-1/2 flex gap-2"
              style={{
                left:
                  (imageContainerRefs.current[inlineEditState.imageIndex ?? -1]?.getBoundingClientRect().left || 0) +
                  (imageContainerRefs.current[inlineEditState.imageIndex ?? -1]?.getBoundingClientRect().width || 0) / 2,
                top:
                  (imageContainerRefs.current[inlineEditState.imageIndex ?? -1]?.getBoundingClientRect().bottom || 0) + 8,
              }}
            >
              <div className="flex items-center gap-2" style={{ pointerEvents: "auto" }}>
                <Button color="gray" size="small" onClick={endInlineEditCancel}>
                  취소
                </Button>
                <Button color="primary" size="small" onClick={endInlineEditConfirm}>
                  적용
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}

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
