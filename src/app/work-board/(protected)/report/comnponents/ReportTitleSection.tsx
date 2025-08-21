"use client";

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import Link from "next/link";
import Image from "next/image";
import AddPicture from "./AddPicture";
import TitleEditToolbar from "./TitleEditToolbar";
import ApplyModal from "./ApplyModal";
import { UploadModal } from "@/components/modal";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useSavedDataStore } from "@/hooks/store/useSavedDataStore";
import { ReportTitleData } from "./types";

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
  const contentRef = useRef<HTMLDivElement>(null);

  // 우측 상단 박스 관련 상태
  const [isTopFocused, setIsTopFocused] = useState(false);
  const [topText, setTopText] = useState("");
  const [topFontSize, setTopFontSize] = useState("text-lg");
  const topContentRef = useRef<HTMLDivElement>(null);

  // 우측 하단 박스 관련 상태
  const [isBottomFocused, setIsBottomFocused] = useState(false);
  const [bottomText, setBottomText] = useState("");
  const [bottomFontSize, setBottomFontSize] = useState("text-lg");
  const bottomContentRef = useRef<HTMLDivElement>(null);

  // 이미지 추가 상태
  const [hasImage, setHasImage] = useState(false);
  const [isImageSelected, setIsImageSelected] = useState(false);

  // 이미지 업로드 관련 상태 (GridAElement 참고)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [imageMetadata, setImageMetadata] = useState<{url: string, driveItemKey?: string}[]>([]);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("");
  
  // 드래그앤드롭을 위한 ref
  const dropRef = useRef<HTMLDivElement>(null);

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

      // contentEditable 영역 DOM 동기화
      if (contentRef.current) {
        contentRef.current.textContent = nextTitle;
      }
      if (topContentRef.current) {
        topContentRef.current.textContent = nextTop;
      }
      if (bottomContentRef.current) {
        bottomContentRef.current.textContent = nextBottom;
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

        // contentEditable 영역 DOM 동기화
        if (contentRef.current) {
          contentRef.current.textContent = nextTitle;
        }
        if (topContentRef.current) {
          topContentRef.current.textContent = nextTop;
        }
        if (bottomContentRef.current) {
          bottomContentRef.current.textContent = nextBottom;
        }

        if (data.image && data.image.url) {
          setCurrentImageUrl(data.image.url);
          setImageMetadata([{ url: data.image.url, driveItemKey: data.image.driveItemKey }]);
          setHasImage(true);
        } else {
          setCurrentImageUrl("");
          setImageMetadata([]);
          setHasImage(false);
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
    // 개행 감지 - textContent와 innerHTML 모두 확인
    const hasLineBreaks = text.includes('\n') || 
                         (contentRef.current && 
                          (contentRef.current.innerHTML.includes('<br>') || 
                           contentRef.current.innerHTML.includes('<div>') ||
                           contentRef.current.innerHTML.includes('\n')));
    
    if (text.length === 0) {
      setFontSize("text-4xl");
    } else if (hasLineBreaks) {
      // 개행이 있으면 바로 작은 크기로
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

  const handleInput = () => {
    if (contentRef.current) {
      // textContent와 innerHTML을 모두 확인하여 개행 감지
      const textContent = contentRef.current.textContent || "";
      const innerHTML = contentRef.current.innerHTML || "";
      
      // innerHTML에서 <br>이나 <div> 태그가 있으면 개행으로 간주
      const hasHTMLLineBreaks = innerHTML.includes('<br>') || innerHTML.includes('<div>');
      
      // textContent에 실제 줄바꿈 문자가 있거나 HTML에 줄바꿈 태그가 있으면
      // textContent에 줄바꿈 문자를 추가하여 상태 동기화
      if (hasHTMLLineBreaks && !textContent.includes('\n')) {
        setText(textContent + '\n');
      } else {
        setText(textContent);
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

  const handleTopInput = () => {
    if (topContentRef.current) {
      setTopText(topContentRef.current.textContent || "");
    }
  };

  // 우측 하단 박스 핸들러
  const handleBottomFocus = () => {
    setIsBottomFocused(true);
  };

  const handleBottomBlur = () => {
    setIsBottomFocused(false);
  };

  const handleBottomInput = () => {
    if (bottomContentRef.current) {
      setBottomText(bottomContentRef.current.textContent || "");
    }
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
        contentRef.current.textContent = "";
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
              onMouseEnter={() => showToolbarFor('image')}
              onMouseLeave={scheduleHideToolbar}
            >
              {hasImage && currentImageUrl ? (
                <div className="w-full h-full relative overflow-hidden rounded-[15px]">
                  <Image
                    src={currentImageUrl}
                    fill
                    className="object-cover"
                    alt="Uploaded image"
                  />
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

            {/* 이미지 편집 툴바 - hover 시 노출 및 2초 유지 */}
            {hasImage && (isImageSelected || (!isSaved && showToolbar && hoveredSection === 'image')) && (
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
                isSaved ? 'bg-transparent border-transparent' : 'bg-white'
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
              <div
                ref={contentRef}
                contentEditable
                className={`w-[401px] outline-none text-center font-medium ${fontSize} transition-all duration-200 leading-tight`}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onInput={handleInput}
                suppressContentEditableWarning={true}
                style={{ 
                  minHeight: "100%", 
                  height: "100%",
                  wordWrap: "break-word",
                  whiteSpace: "pre-wrap",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  padding: "8px",
                  overflow: "hidden"
                }}
                data-placeholder={text === "" && !isSaved ? "제목을 입력하세요" : ""}
              />

              {/* 플레이스홀더 스타일 */}
              <style jsx>{`
                div[contenteditable]:empty:before {
                  content: attr(data-placeholder);
                  color: #9ca3af;
                  pointer-events: none;
                }
              `}</style>
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
        className="relative flex flex-col w-[108px] gap-y-2 title-date-container"
        ref={dateContainerRef}
      >
        {isDateContainerVisible ? (
          <>
            {/* 상단 박스 */}
            <div
              className={`flex flex-col w-full h-1/2 border rounded-[15px] items-center justify-center cursor-text transition-colors p-1 overflow-hidden ${
                isSaved ? 'bg-transparent border-transparent' : 'bg-white'
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
              <div
                ref={topContentRef}
                contentEditable
                className={`w-full h-full outline-none text-center flex items-center justify-center font-medium ${topFontSize} transition-all duration-200 overflow-hidden break-words`}
                onFocus={handleTopFocus}
                onBlur={handleTopBlur}
                onInput={handleTopInput}
                suppressContentEditableWarning={true}
                style={{
                  minHeight: "1em",
                  maxHeight: "100%",
                  lineHeight: "1.2",
                  wordBreak: "break-all",
                }}
                data-placeholder={topText === "" && !isSaved ? "텍스트" : ""}
              />
            </div>

            {/* 하단 박스 */}
            <div
              className={`flex flex-col w-full h-1/2 border rounded-[15px] items-center justify-center cursor-text transition-colors p-1 overflow-hidden ${
                isSaved ? 'bg-transparent border-transparent' : 'bg-white'
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
              <div
                ref={bottomContentRef}
                contentEditable
                className={`w-full h-full outline-none text-center flex items-center justify-center font-medium ${bottomFontSize} transition-all duration-200 overflow-hidden break-words`}
                onFocus={handleBottomFocus}
                onBlur={handleBottomBlur}
                onInput={handleBottomInput}
                suppressContentEditableWarning={true}
                style={{
                  minHeight: "1em",
                  maxHeight: "100%",
                  lineHeight: "1.2",
                  wordBreak: "break-all",
                }}
                data-placeholder={bottomText === "" && !isSaved ? "텍스트" : ""}
              />
            </div>

            {/* 플레이스홀더 스타일 - 우측 박스들용 */}
            <style jsx>{`
              div[contenteditable]:empty:before {
                content: attr(data-placeholder);
                color: #9ca3af;
                pointer-events: none;
              }
            `}</style>

            {/* 날짜 편집 툴바 - hover 시 노출 및 2초 유지 */}
            {(isTopFocused || isBottomFocused || isDateSelected || (!isSaved && showToolbar && hoveredSection === 'date')) && (
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
