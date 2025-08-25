"use client";

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import * as ReactDOM from "react-dom";
import Link from "next/link";
import Image from "next/image";
import AddPicture from "./AddPicture";
import TitleEditToolbar from "./TitleEditToolbar";
import ApplyModal from "./ApplyModal";
import { UploadModal } from "@/components/modal";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useSavedDataStore } from "@/hooks/store/useSavedDataStore";
import { ReportTitleData } from "./types";
import { Button } from "@/components/common";
import { MdZoomIn, MdZoomOut, MdRefresh } from "react-icons/md";
import { IoClose } from "react-icons/io5";

export type ReportTitleSectionRef = {
  getReportTitleData: () => ReportTitleData;
  setInitial: (data: ReportTitleData) => void;
};

interface ReportTitleSectionProps {
  className?: string;
  initialData?: ReportTitleData;
}

function ReportTitleSectionImpl({ className = "", initialData }: ReportTitleSectionProps, ref: React.Ref<ReportTitleSectionRef>) {
  // 저장 상태 가져오기
  const { isSaved } = useSavedDataStore();

  // 제목 관련 상태
  const [isFocused, setIsFocused] = useState(false);
  const [isTextSelected, setIsTextSelected] = useState(false);
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState("text-4xl");
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // 우측 상단 박스 관련 상태
  const [isTopFocused, setIsTopFocused] = useState(false);
  const [topText, setTopText] = useState("");
  const [topFontSize, setTopFontSize] = useState("text-lg");
  const topContentRef = useRef<HTMLInputElement>(null);

  // 우측 하단 박스 관련 상태
  const [isBottomFocused, setIsBottomFocused] = useState(false);
  const [bottomText, setBottomText] = useState("");
  const [bottomFontSize, setBottomFontSize] = useState("text-lg");
  const bottomContentRef = useRef<HTMLInputElement>(null);

  // 이미지 추가 상태
  const [hasImage, setHasImage] = useState(false);
  const [isImageSelected, setIsImageSelected] = useState(false);

  // 이미지 업로드 관련 상태 (GridAElement 참고)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [imageMetadata, setImageMetadata] = useState<{url: string, driveItemKey?: string}[]>([]);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("");
  // 이미지 위치(확대/이동) 저장 상태
  const [imagePosition, setImagePosition] = useState<{ x: number; y: number; scale: number }>({ x: 0, y: 0, scale: 1 });
  // 인라인 편집 상태
  const [inlineEditState, setInlineEditState] = useState<{
    active: boolean;
    tempPosition: { x: number; y: number; scale: number };
    startPointer: { x: number; y: number } | null;
    mode: "drag" | "resize" | null;
  }>({ active: false, tempPosition: { x: 0, y: 0, scale: 1 }, startPointer: null, mode: null });
  const suppressClickRef = useRef<boolean>(false);
  
  // 드래그앤드롭을 위한 ref
  const dropRef = useRef<HTMLDivElement>(null);
  // 편집을 위한 이미지 컨테이너 ref (오버레이 계산용)
  const imageEditContainerRef = useRef<HTMLDivElement>(null);

  // 이미지 업로드 훅 (GridAElement 참고)
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
      
      if (files.length > 0) {
        const item = files[0]; // 첫 번째 파일만 사용 (single 이미지)
        
        if (item instanceof File) {
          // File 타입인 경우
          const fileUrl = URL.createObjectURL(item);
          setCurrentImageUrl(fileUrl);
          setImageMetadata([{ url: fileUrl, driveItemKey: `local_${Date.now()}_${Math.random()}` }]);
          setUploadedFiles([item]);
          setHasImage(true);
        } else if (item && typeof item === 'object' && item.thumbUrl) {
          // SmartFolderItemResult 타입인 경우
          setCurrentImageUrl(item.thumbUrl);
          setImageMetadata([{ url: item.thumbUrl, driveItemKey: item.driveItemKey }]);
          setHasImage(true);
        }
      }
    },
    maxDataLength: 1, // 단일 이미지만 허용
  });

  // ref를 drop에 연결
  useEffect(() => {
    if (dropRef.current) {
      drop(dropRef);
    }
  }, [drop]);

  // 각 컨테이너의 표시 상태를 독립적으로 관리 (초기화 순서 중요)
  const [isImageContainerVisible, setIsImageContainerVisible] = useState(true);
  const [isTextContainerVisible, setIsTextContainerVisible] = useState(true);
  const [isDateContainerVisible, setIsDateContainerVisible] = useState(true);

  // 초기 데이터 주입
  useEffect(() => {
    if (!initialData) {
      return;
    }
    try {
      setIsImageContainerVisible(initialData.visible?.image ?? true);
      setIsTextContainerVisible(initialData.visible?.text ?? true);
      setIsDateContainerVisible(initialData.visible?.date ?? true);

      const nextTitle = initialData.titleText || "";
      const nextTop = initialData.topText || "";
      const nextBottom = initialData.bottomText || "";

      setText(nextTitle);
      setTopText(nextTop);
      setBottomText(nextBottom);

      // textarea DOM 동기화
      if (contentRef.current) {
        contentRef.current.value = nextTitle;
      }
      if (topContentRef.current) {
        topContentRef.current.value = nextTop;
      }
      if (bottomContentRef.current) {
        bottomContentRef.current.value = nextBottom;
      }

      if (initialData.image && initialData.image.url) {
        setCurrentImageUrl(initialData.image.url);
        setImageMetadata([{ url: initialData.image.url, driveItemKey: initialData.image.driveItemKey }]);
        setHasImage(true);
      } else {
        setCurrentImageUrl("");
        setImageMetadata([]);
        setHasImage(false);
      }
    } catch {}
  }, [initialData]);

  useImperativeHandle(ref, () => ({
    getReportTitleData: () => ({
      image: hasImage && currentImageUrl ? { url: currentImageUrl, driveItemKey: imageMetadata?.[0]?.driveItemKey } : null,
      titleText: text,
      topText,
      bottomText,
      visible: {
        image: isImageContainerVisible,
        text: isTextContainerVisible,
        date: isDateContainerVisible,
      },
    }),
    setInitial: (data: ReportTitleData) => {
      try {
        setIsImageContainerVisible(data.visible?.image ?? true);
        setIsTextContainerVisible(data.visible?.text ?? true);
        setIsDateContainerVisible(data.visible?.date ?? true);

        const nextTitle = data.titleText || "";
        const nextTop = data.topText || "";
        const nextBottom = data.bottomText || "";

        setText(nextTitle);
        setTopText(nextTop);
        setBottomText(nextBottom);

        // textarea DOM 동기화
        if (contentRef.current) {
          contentRef.current.value = nextTitle;
        }
        if (topContentRef.current) {
          topContentRef.current.value = nextTop;
        }
        if (bottomContentRef.current) {
          bottomContentRef.current.value = nextBottom;
        }

        if (data.image && data.image.url) {
          setCurrentImageUrl(data.image.url);
          setImageMetadata([{ url: data.image.url, driveItemKey: data.image.driveItemKey }]);
          setHasImage(true);
          // 위치 초기화
          setImagePosition({ x: 0, y: 0, scale: 1 });
        } else {
          setCurrentImageUrl("");
          setImageMetadata([]);
          setHasImage(false);
          setImagePosition({ x: 0, y: 0, scale: 1 });
        }
      } catch {}
    },
  }), [hasImage, currentImageUrl, imageMetadata, text, topText, bottomText, isImageContainerVisible, isTextContainerVisible, isDateContainerVisible]);

  // 날짜 컨테이너 선택 상태
  const [isDateSelected, setIsDateSelected] = useState(false);

  // Hover 기반 툴바/하이라이트 상태
  const [hoveredSection, setHoveredSection] = useState<"image" | "text" | "date" | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const hoverHideTimerRef = useRef<number | null>(null);

  const showToolbarFor = (section: "image" | "text" | "date") => {
    if (hoverHideTimerRef.current) {
      window.clearTimeout(hoverHideTimerRef.current);
      hoverHideTimerRef.current = null;
    }
    setHoveredSection(section);
    setShowToolbar(true);
  };

  const scheduleHideToolbar = () => {
    if (hoverHideTimerRef.current) {
      window.clearTimeout(hoverHideTimerRef.current);
    }
    hoverHideTimerRef.current = window.setTimeout(() => {
      setShowToolbar(false);
      setHoveredSection(null);
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (hoverHideTimerRef.current) {
        window.clearTimeout(hoverHideTimerRef.current);
        hoverHideTimerRef.current = null;
      }
    };
  }, []);

  // 외부 클릭 감지를 위한 ref
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const dateContainerRef = useRef<HTMLDivElement>(null);

  // 틀 삭제 확인 모달 상태
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<
    "image" | "text" | "date" | null
  >(null);

  // 텍스트 길이와 줄바꿈에 따라 폰트 사이즈 조절 (제목용)
  useEffect(() => {
    const hasLineBreaks = text.includes('\n');
    if (text.length === 0) {
      setFontSize("text-4xl");
    } else if (hasLineBreaks) {
      setFontSize("text-2xl");
    } else if (text.length <= 10) {
      setFontSize("text-4xl");
    } else if (text.length <= 20) {
      setFontSize("text-3xl");
    } else if (text.length <= 30) {
      setFontSize("text-2xl");
    } else if (text.length <= 40) {
      setFontSize("text-xl");
    } else {
      setFontSize("text-lg");
    }
  }, [text]);

  // 우측 상단 박스 폰트 사이즈 조절
  useEffect(() => {
    if (topText.length === 0) {
      setTopFontSize("text-sm");
    } else if (topText.length <= 3) {
      setTopFontSize("text-sm");
    } else if (topText.length <= 6) {
      setTopFontSize("text-xs");
    } else if (topText.length <= 10) {
      setTopFontSize("text-xs");
    } else if (topText.length <= 15) {
      setTopFontSize("text-[10px]");
    } else if (topText.length <= 20) {
      setTopFontSize("text-[9px]");
    } else {
      setTopFontSize("text-[8px]");
    }
  }, [topText]);

  // 우측 하단 박스 폰트 사이즈 조절
  useEffect(() => {
    if (bottomText.length === 0) {
      setBottomFontSize("text-sm");
    } else if (bottomText.length <= 3) {
      setBottomFontSize("text-sm");
    } else if (bottomText.length <= 6) {
      setBottomFontSize("text-xs");
    } else if (bottomText.length <= 10) {
      setBottomFontSize("text-xs");
    } else if (bottomText.length <= 15) {
      setBottomFontSize("text-[10px]");
    } else if (bottomText.length <= 20) {
      setBottomFontSize("text-[9px]");
    } else {
      setBottomFontSize("text-[8px]");
    }
  }, [bottomText]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        imageContainerRef.current &&
        !imageContainerRef.current.contains(event.target as Node)
      ) {
        setIsImageSelected(false);
      }

      if (
        textContainerRef.current &&
        !textContainerRef.current.contains(event.target as Node)
      ) {
        setIsTextSelected(false);
      }

      if (
        dateContainerRef.current &&
        !dateContainerRef.current.contains(event.target as Node)
      ) {
        setIsDateSelected(false);
      }
    };

    if (isImageSelected || isTextSelected || isDateSelected) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isImageSelected, isTextSelected, isDateSelected]);

  // 제목 핸들러
  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const raw = e.target.value || "";
    let normalized = raw.replace(/\r\n/g, '\n');
    normalized = normalized.split('\n').slice(0, 2).join('\n');

    let charCount = 0;
    let limited = "";
    for (const ch of normalized) {
      if (ch === '\n') {
        limited += ch;
        continue;
      }
      if (charCount >= 48) {
        break;
      }
      limited += ch;
      charCount += 1;
    }

    setText(limited);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      const current = e.currentTarget.value || "";
      const lineCount = current.split('\n').length;
      if (lineCount >= 2) {
        e.preventDefault();
      }
    }
  };

  // 우측 상단 박스 핸들러
  const handleTopFocus = () => {
    setIsTopFocused(true);
  };

  const handleTopBlur = () => {
    setIsTopFocused(false);
  };

  const handleTopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = (e.target.value || "").replace(/\r?\n/g, " ");
    setTopText(next);
  };

  // 우측 하단 박스 핸들러
  const handleBottomFocus = () => {
    setIsBottomFocused(true);
  };

  const handleBottomBlur = () => {
    setIsBottomFocused(false);
  };

  const handleBottomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = (e.target.value || "").replace(/\r?\n/g, " ");
    setBottomText(next);
  };

  // 이미지 추가 상태 처리
  const handleImageAdded = (imageAdded: boolean) => {
    setHasImage(imageAdded);
    if (!imageAdded) {
      setIsImageSelected(false); // 이미지가 삭제되면 선택 상태도 해제
    }
  };

  // 이미지 클릭 핸들러 - UploadModal 열기
  const handleImageClick = () => {
    if (hasImage) {
      setIsImageSelected(!isImageSelected);
    } else {
      // 이미지가 없으면 업로드 모달 열기
      handleOpenUploadModal();
    }
  };

  // 이미지 삭제 핸들러 (GridBElement 패턴 차용)
  const handleImageDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageUrl("");
    setImageMetadata([]);
    setHasImage(false);
    setImagePosition({ x: 0, y: 0, scale: 1 });
  };

  // 인라인 편집 진입/종료/드래그 핸들러 (GridAElement 참고, 단일 이미지용)
  const beginInlineEdit = () => {
    if (!hasImage || isSaved) return;
    setInlineEditState((prev) => ({
      ...prev,
      active: true,
      tempPosition: { ...imagePosition },
    }));
  };

  const endInlineEditConfirm = () => {
    setImagePosition((prev) => ({ ...inlineEditState.tempPosition }));
    setInlineEditState((prev) => ({ ...prev, active: false, startPointer: null, mode: null }));
  };

  const endInlineEditCancel = () => {
    setInlineEditState((prev) => ({ ...prev, active: false, tempPosition: { ...imagePosition }, startPointer: null, mode: null }));
  };

  const onEditMouseDown = (e: React.MouseEvent) => {
    if (!inlineEditState.active) return;
    e.preventDefault();
    e.stopPropagation();
    suppressClickRef.current = false;
    setInlineEditState((prev) => ({ ...prev, startPointer: { x: e.clientX, y: e.clientY }, mode: "drag" }));
    const onMove = (ev: MouseEvent) => {
      setInlineEditState((prev) => {
        if (!prev.startPointer) return prev;
        const dx = ev.clientX - prev.startPointer.x;
        const dy = ev.clientY - prev.startPointer.y;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) suppressClickRef.current = true;
        return {
          ...prev,
          startPointer: { x: ev.clientX, y: ev.clientY },
          tempPosition: { x: prev.tempPosition.x + dx, y: prev.tempPosition.y + dy, scale: prev.tempPosition.scale },
        };
      });
    };
    const onUp = () => {
      setInlineEditState((prev) => ({ ...prev, startPointer: null, mode: null }));
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // 포털: 외부 음영 + 우측 도구 버튼(확대/축소/되돌리기)
  const EditToolsPortal: React.FC = () => {
    const [tick, setTick] = useState(0);
    useEffect(() => {
      const onUpdate = () => setTick((v) => v + 1);
      window.addEventListener("scroll", onUpdate, true);
      window.addEventListener("resize", onUpdate);
      return () => {
        window.removeEventListener("scroll", onUpdate, true);
        window.removeEventListener("resize", onUpdate);
      };
    }, []);

    if (!inlineEditState.active) return null;
    const el = imageEditContainerRef.current;
    if (!el || typeof window === "undefined") return null;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = 8;
    const buttonSize = 40;
    const buttonsCount = 3;
    const totalHeight = buttonsCount * buttonSize + (buttonsCount - 1) * gap;
    let toolsLeft = rect.right + gap;
    let toolsTop = rect.bottom - totalHeight;
    if (toolsLeft + buttonSize > vw) toolsLeft = Math.max(0, rect.left - gap - buttonSize);
    toolsTop = Math.min(Math.max(0, toolsTop), Math.max(0, vh - totalHeight));

    const handleZoomIn = () => {
      setInlineEditState((prev) => ({ ...prev, tempPosition: { ...prev.tempPosition, scale: Math.min(3, prev.tempPosition.scale * 1.2) } }));
    };
    const handleZoomOut = () => {
      setInlineEditState((prev) => ({ ...prev, tempPosition: { ...prev.tempPosition, scale: Math.max(0.1, prev.tempPosition.scale / 1.2) } }));
    };
    const handleReset = () => {
      setInlineEditState((prev) => ({ ...prev, tempPosition: { ...imagePosition } }));
    };

    return ReactDOM.createPortal(
      <>
        <div className="fixed left-0 top-0 bg-black/40 z-[9998]" style={{ width: "100vw", height: Math.max(0, rect.top) }} />
        <div className="fixed left-0 bg-black/40 z-[9998]" style={{ top: rect.bottom, width: "100vw", height: Math.max(0, vh - rect.bottom) }} />
        <div className="fixed top-0 bg-black/40 z-[9998]" style={{ left: 0, top: rect.top, width: Math.max(0, rect.left), height: Math.max(0, rect.height) }} />
        <div className="fixed top-0 bg-black/40 z-[9998]" style={{ left: rect.right, top: rect.top, width: Math.max(0, vw - rect.right), height: Math.max(0, rect.height) }} />

        <div className="fixed z-[9999] flex flex-col gap-2" style={{ top: toolsTop, left: toolsLeft }}>
          <button onClick={handleZoomIn} className="w-10 h-10 border-1 border-[#CCCCCC] bg-white border-2 rounded-lg flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors" title="확대">
            <MdZoomIn className="w-5 h-5 text-black" />
          </button>
          <button onClick={handleZoomOut} className="w-10 h-10 bg-white border-2 border-primary rounded-lg flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors" title="축소">
            <MdZoomOut className="w-5 h-5 text-black" />
          </button>
          <button onClick={handleReset} className="w-10 h-10 bg-white border-2 border-primary rounded-lg flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors" title="초기화">
            <MdRefresh className="w-5 h-5 text-black" />
          </button>
        </div>
      </>,
      document.body
    );
  };

  // 텍스트 클릭 핸들러
  const handleTextClick = () => {
    if (text || isFocused) {
      setIsTextSelected(!isTextSelected);
    }
  };

  // 날짜 클릭 핸들러
  const handleDateClick = () => {
    if (topText || bottomText || isTopFocused || isBottomFocused) {
      setIsDateSelected(!isDateSelected);
    }
  };

  // 이미지 컨테이너 삭제 요청 핸들러
  const handleImageDeleteRequest = () => {
    setDeleteTarget("image");
    setShowDeleteConfirmModal(true);
  };

  // 텍스트 컨테이너 삭제 요청 핸들러
  const handleTextDeleteRequest = () => {
    setDeleteTarget("text");
    setShowDeleteConfirmModal(true);
  };

  // 날짜 컨테이너 삭제 요청 핸들러
  const handleDateDeleteRequest = () => {
    setDeleteTarget("date");
    setShowDeleteConfirmModal(true);
  };

  // 틀 삭제 확인 핸들러
  const handleDeleteConfirm = () => {
    if (deleteTarget === "image") {
      // 이미지 컨테이너만 삭제
      setIsImageContainerVisible(false);
      setHasImage(false);
      setIsImageSelected(false);
    } else if (deleteTarget === "text") {
      // 텍스트 컨테이너만 삭제
      setIsTextContainerVisible(false);
      setText("");
      setIsFocused(false);
      setIsTextSelected(false);

      // contentRef 초기화
      if (contentRef.current) {
        contentRef.current.value = "";
      }
    } else if (deleteTarget === "date") {
      // 날짜 컨테이너만 삭제
      setIsDateContainerVisible(false);
      setTopText("");
      setBottomText("");
      setIsTopFocused(false);
      setIsBottomFocused(false);
      setIsDateSelected(false);

      // topContentRef, bottomContentRef 초기화
      if (topContentRef.current) {
        topContentRef.current.textContent = "";
      }
      if (bottomContentRef.current) {
        bottomContentRef.current.textContent = "";
      }
    }

    // 삭제 타겟 초기화
    setDeleteTarget(null);
    setShowDeleteConfirmModal(false);
  };

  // 틀 추가 핸들러들
  const handleAddImageFrame = () => {
    setIsImageContainerVisible(true);
  };

  const handleAddTextFrame = () => {
    setIsTextContainerVisible(true);
  };

  const handleAddDateFrame = () => {
    setIsDateContainerVisible(true);
  };
  console.log("isSaved:", isSaved);

  return (
    <div
      className={`flex flex-row w-full justify-between h-[72px] ${className}`}
    >
      <div
        className="relative title-image-container w-[84px]"
        ref={imageContainerRef}
      >
        {isImageContainerVisible ? (
          <>
            <div
              ref={dropRef}
              className={`flex flex-col w-full h-full border rounded-[15px] transition-colors cursor-pointer ${
                isSaved ? 'bg-transparent border-transparent' : 'bg-white'
              } ${
                !isSaved && (
                  hasImage && isImageSelected
                    ? "border-primary border-solid border-2"
                    : hasImage
                      ? "border-transparent "
                      : "border-dashed border-zinc-400 hover:border-gray-400"
                )
              } ${
                isSaved && !hasImage ? 'opacity-0' : ''
              } ${!isSaved && hoveredSection === 'image' ? 'border-primary border-solid border-2' : ''}`}
              style={{
                backgroundColor: canDrop && isOver ? '#f0f0f0' : (isSaved ? 'transparent' : 'white'),
                transition: 'background-color 0.2s ease'
              }}
              onClick={handleImageClick}
              onMouseEnter={() => { if (!hasImage) { showToolbarFor('image'); } }}
              onMouseLeave={scheduleHideToolbar}
            >
              {hasImage && currentImageUrl ? (
                <div
                  className="w-full h-full relative overflow-hidden rounded-[15px]"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    beginInlineEdit();
                  }}
                  ref={imageEditContainerRef}
                >
                  <Image
                    src={currentImageUrl}
                    fill
                    className="object-contain"
                    alt="Uploaded image"
                    style={{
                      transform: inlineEditState.active
                        ? `translate(${inlineEditState.tempPosition.x}px, ${inlineEditState.tempPosition.y}px) scale(${inlineEditState.tempPosition.scale})`
                        : `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${imagePosition.scale})`,
                      transformOrigin: 'center',
                    }}
                    onMouseDown={inlineEditState.active ? onEditMouseDown : undefined}
                  />
                  {/* X 삭제 버튼 - GridBElement와 동일 스타일 */}
                  <button
                    className={`absolute top-1 right-1 bg-white w-5 h-5 rounded-full flex items-center justify-center border border-solid border-[#F0F0F0] ${isSaved ? "invisible pointer-events-none" : ""}`}
                    onClick={handleImageDelete}
                    title="이미지 삭제"
                  >
                    <IoClose className="w-4 h-4 text-black" />
                  </button>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image
                    src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage.svg"
                    width={18}
                    height={18}
                    className="object-contain aspect-square"
                    alt="no image"
                  />
                </div>
              )}
            </div>

            {/* 이미지 편집 툴바 - 비이미지 상태 hover 또는 이미지 선택 시 노출 */}
            {(isImageSelected || (!isSaved && !hasImage && showToolbar && hoveredSection === 'image')) && (
              <div
                onMouseEnter={() => {
                  if (hoverHideTimerRef.current) {
                    window.clearTimeout(hoverHideTimerRef.current);
                    hoverHideTimerRef.current = null;
                  }
                }}
                onMouseLeave={scheduleHideToolbar}
              >
                <TitleEditToolbar
                  show={true}
                  isExpanded={true}
                  position={{ left: "0px", top: "calc(100% + 8px)" }}
                  onIconClick={(index, data) => {
                    switch (index) {
                      case 4:
                        handleImageDeleteRequest();
                        break;
                      default:
                        break;
                    }
                  }}
                  limitedMode={true}
                  allowedIcons={[4]}
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full gap-y-2 opacity-100 transition-opacity duration-200">
            <div 
              className="group cursor-pointer flex flex-col items-center justify-center"
              onClick={handleAddImageFrame}
            >
              <div className="w-[38px] h-[38px] bg-primary group-hover:bg-primary/80 transition-colors duration-200 rounded-full flex items-center justify-center">
                <Image
                  src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/fix6.svg"
                  width={18}
                  height={18}
                  className="object-contain aspect-square"
                  alt="no image"
                />
              </div>
              <div className="text-sm text-white bg-primary group-hover:text-white group-hover:bg-primary/80 transition-colors duration-200 text-center mt-2 rounded-lg px-2 py-1">
                틀 추가
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        className="relative title-text-container w-[60%]"
        ref={textContainerRef}
      >
        {isTextContainerVisible ? (
          <>
            <div
              className={`flex flex-col w-full h-full border rounded-[15px] items-center justify-center cursor-text transition-colors p-2 ${
                isSaved ? 'bg-white/90 border-transparent' : 'bg-white'
              } ${
                !isSaved && (
                  isTextSelected
                    ? "border-primary border-solid border-2"
                    : isFocused
                      ? "border-primary border-solid border-2"
                      : text
                        ? "border-transparent hover:border-gray-400"
                        : "border-zinc-400 border-dashed hover:border-gray-400"
                )
              } ${
                isSaved && !text ? 'opacity-0' : ''
              } ${!isSaved && hoveredSection === 'text' ? 'border-primary border-solid border-2' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                if (!isFocused) {
                  contentRef.current?.focus();
                }
                handleTextClick();
              }}
              onMouseEnter={() => showToolbarFor('text')}
              onMouseLeave={scheduleHideToolbar}
            >
              <textarea
                ref={contentRef}
                value={text}
                onChange={handleTitleChange}
                onKeyDown={handleTitleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={text === "" && !isSaved ? "제목을 입력하세요" : ""}
                className={`w-[401px] outline-none text-center font-medium ${fontSize} transition-all duration-200 leading-tight resize-none bg-transparent`}
                style={{ 
                  fontFamily: "'MaplestoryOTFBold', sans-serif",
                  minHeight: "100%", 
                  height: "100%",
                  wordWrap: "break-word",
                  whiteSpace: "pre-wrap",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  padding: "8px",
                  overflow: "hidden",
                  backgroundColor: 'transparent'
                }}
                rows={2}
                maxLength={48}
              />
            </div>

            {/* 제목 편집 툴바 - hover 시 노출 및 2초 유지 */}
            {(isFocused || isTextSelected || (!isSaved && showToolbar && hoveredSection === 'text')) && (
              <div
                className="absolute z-50"
                style={{
                  left: "0%",
                  top: "calc(100% + 8px)",
                  transform: "translateX(-50%)",
                }}
                onMouseEnter={() => {
                  if (hoverHideTimerRef.current) {
                    window.clearTimeout(hoverHideTimerRef.current);
                    hoverHideTimerRef.current = null;
                  }
                }}
                onMouseLeave={scheduleHideToolbar}
              >
                <TitleEditToolbar
                  show={true}
                  isExpanded={true}
                  position={{ left: "0px", top: "0px" }}
                  onIconClick={(index, data) => {
                    switch (index) {
                      case 4:
                        handleTextDeleteRequest();
                        break;
                      default:
                        break;
                    }
                  }}
                  limitedMode={true}
                  allowedIcons={[4]}
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full gap-y-2 opacity-100 transition-opacity duration-200">
            <div 
              className="group cursor-pointer flex flex-col items-center justify-center"
              onClick={handleAddTextFrame}
            >
              <div className="w-[38px] h-[38px] bg-primary group-hover:bg-primary/80 transition-colors duration-200 rounded-full flex items-center justify-center">
                <Image
                  src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/fix6.svg"
                  width={18}
                  height={18}
                  className="object-contain aspect-square"
                  alt="no image"
                />
              </div>
              <div className="text-sm text-white bg-primary group-hover:text-white group-hover:bg-primary/80 transition-colors duration-200 text-center mt-2 rounded-lg px-2 py-1">
                틀 추가
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        className="relative flex flex-col w-[108px] h-full gap-y-2 title-date-container"
        ref={dateContainerRef}
      >
        {isDateContainerVisible ? (
          <>
            {/* 상단 박스 */}
            <div
              className={`flex flex-col w-full h-1/2 border rounded-[15px] items-center justify-center cursor-text transition-colors p-1 overflow-hidden ${
                isSaved ? 'bg-white/90 border-transparent' : 'bg-white'
              } ${
                !isSaved && (
                  isDateSelected
                    ? "border-primary border-solid border-2"
                    : isTopFocused
                      ? "border-primary border-solid border-2"
                      : topText
                        ? "border-transparent hover:border-gray-400"
                        : "border-zinc-400 border-dashed hover:border-gray-400"
                )
              } ${
                isSaved && !topText ? 'opacity-0' : ''
              } ${!isSaved && hoveredSection === 'date' ? 'border-primary border-solid border-2' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                topContentRef.current?.focus();
                handleDateClick();
              }}
              onMouseEnter={() => showToolbarFor('date')}
              onMouseLeave={scheduleHideToolbar}
            >
              <input
                ref={topContentRef}
                type="text"
                value={topText}
                onChange={handleTopChange}
                onFocus={handleTopFocus}
                onBlur={handleTopBlur}
                placeholder={topText === "" && !isSaved ? "텍스트" : ""}
                className={`w-full h-full outline-none text-center font-medium ${topFontSize} transition-all duration-200 overflow-hidden bg-transparent`}
                style={{
                  minHeight: "1em",
                  maxHeight: "100%",
                  lineHeight: "1.2",
                  backgroundColor: 'transparent'
                }}
              />
            </div>

            {/* 하단 박스 */}
            <div
              className={`flex flex-col w-full h-1/2 border rounded-[15px] items-center justify-center cursor-text transition-colors p-1 overflow-hidden ${
                isSaved ? 'bg-white/90 border-transparent' : 'bg-white'
              } ${
                !isSaved && (
                  isDateSelected
                    ? "border-primary border-solid border-2"
                    : isBottomFocused
                      ? "border-primary border-solid border-2"
                      : bottomText
                        ? "border-transparent hover:border-gray-400"
                        : "border-zinc-400 border-dashed hover:border-gray-400"
                )
              } ${
                isSaved && !bottomText ? 'opacity-0' : ''
              } ${!isSaved && hoveredSection === 'date' ? 'border-primary border-solid border-2' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                bottomContentRef.current?.focus();
                handleDateClick();
              }}
              onMouseEnter={() => showToolbarFor('date')}
              onMouseLeave={scheduleHideToolbar}
            >
              <input
                ref={bottomContentRef}
                type="text"
                value={bottomText}
                onChange={handleBottomChange}
                onFocus={handleBottomFocus}
                onBlur={handleBottomBlur}
                placeholder={bottomText === "" && !isSaved ? "텍스트" : ""}
                className={`w-full h-full outline-none text-center font-medium ${bottomFontSize} transition-all duration-200 overflow-hidden bg-transparent`}
                style={{
                  minHeight: "1em",
                  maxHeight: "100%",
                  lineHeight: "1.2",
                  backgroundColor: 'transparent'
                }}
              />
            </div>

            

            {/* 날짜 편집 툴바 - hover 시 노출 및 2초 유지 (absolute로 고정) */}
            {(isTopFocused || isBottomFocused || isDateSelected || (!isSaved && showToolbar && hoveredSection === 'date')) && (
              <div
                className="absolute z-50"
                style={{
                  left: "50%",
                  top: "calc(100% + 8px)",
                  transform: "translateX(-50%)",
                }}
                onMouseEnter={() => {
                  if (hoverHideTimerRef.current) {
                    window.clearTimeout(hoverHideTimerRef.current);
                    hoverHideTimerRef.current = null;
                  }
                }}
                onMouseLeave={scheduleHideToolbar}
              >
                <TitleEditToolbar
                  show={true}
                  isExpanded={true}
                  position={{ left: "0px", top: "0px" }}
                  onIconClick={(index, data) => {
                    switch (index) {
                      case 4:
                        handleDateDeleteRequest();
                        break;
                      default:
                        break;
                    }
                  }}
                  limitedMode={true}
                  allowedIcons={[4]}
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full gap-y-2 opacity-100 transition-opacity duration-200">
            <div 
              className="group cursor-pointer flex flex-col items-center justify-center"
              onClick={handleAddDateFrame}
            >
              <div className="w-[38px] h-[38px] bg-primary group-hover:bg-primary/80 transition-colors duration-200 rounded-full flex items-center justify-center">
                <Image
                  src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/fix6.svg"
                  width={18}
                  height={18}
                  className="object-contain aspect-square"
                  alt="no image"
                />
              </div>
              <div className="text-sm text-white bg-primary group-hover:text-white group-hover:bg-primary/80 transition-colors duration-200 text-center mt-2 rounded-lg px-2 py-1">
                틀 추가
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 틀 삭제 확인 모달 */}
      <ApplyModal
        open={showDeleteConfirmModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowDeleteConfirmModal(false);
            setDeleteTarget(null);
          }
        }}
        description={
          deleteTarget === "image"
            ? "입력틀 삭제 시, 입력한 내용이 모두 초기화됩니다.\n입력틀을 삭제하시겠습니까?"
            : deleteTarget === "text"
              ? "입력틀 삭제 시, 입력한 내용이 모두 초기화됩니다.\n입력틀을 삭제하시겠습니까?"
              : "입력틀 삭제 시, 입력한 내용이 모두 초기화됩니다.\n입력틀을 삭제하시겠습니까?"
        }
        cancelText="취소"
        confirmText="확인"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteConfirmModal(false);
          setDeleteTarget(null);
        }}
      >
        <button style={{ display: "none" }} />
      </ApplyModal>

      {/* 인라인 편집 확인/취소 버튼 포털 */}
      {inlineEditState.active && typeof window !== 'undefined' && ReactDOM.createPortal(
        <div className="fixed z-[10000]" style={{ left: 0, top: 0, pointerEvents: 'none' }}>
          <div
            className="absolute -translate-x-1/2 flex gap-2"
            style={{
              left: (imageEditContainerRef.current?.getBoundingClientRect().left || 0) + (imageEditContainerRef.current?.getBoundingClientRect().width || 0) / 2,
              top: (imageEditContainerRef.current?.getBoundingClientRect().bottom || 0) + 8,
            }}
          >
            <div className="flex items-center gap-2" style={{ pointerEvents: 'auto' }}>
              <Button color="gray" size="small" onClick={endInlineEditCancel}>취소</Button>
              <Button color="primary" size="small" onClick={endInlineEditConfirm}>적용</Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 우측 확대/축소/되돌리기 + 외부 음영 포털 */}
      <EditToolsPortal />

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
              console.log('📁 파일 선택됨:', files);
              processUploadedFiles(files);
            }
          }}
          isMultiUpload={false} // 단일 이미지만 업로드
          allowsFileTypes={['IMAGE']}
        />
      )}
    </div>
  );
}

const ReportTitleSection = forwardRef<ReportTitleSectionRef, ReportTitleSectionProps>(ReportTitleSectionImpl);
export default ReportTitleSection;
