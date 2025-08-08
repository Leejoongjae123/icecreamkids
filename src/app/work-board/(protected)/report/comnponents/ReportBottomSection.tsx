"use client";
import * as React from "react";
import { IoClose } from "react-icons/io5";
import Image from "next/image";
import { ReportBottomSectionProps } from "./types";
import TextStickerModal from "./TextStickerModal";
import DecorationStickerModal from "./DecorationStickerModal";
import TableModal from "./TableModal";
import ApplyModal from "./ApplyModal";
import BottomEditToolbar from "./BottomEditToolbar";

const ReportBottomSection: React.FC<ReportBottomSectionProps> = ({ type }) => {
  const [activeSection, setActiveSection] = React.useState<string | null>(null);
  const [playActivityText, setPlayActivityText] = React.useState("");
  const [teacherSupportText, setTeacherSupportText] = React.useState("");
  const [homeConnectionText, setHomeConnectionText] = React.useState("");
  const [showToolbar, setShowToolbar] = React.useState(false);
  const [toolbarPosition, setToolbarPosition] = React.useState({
    left: "8px",
    top: "calc(100% + 8px)",
  });
  const [isTextStickerModalOpen, setIsTextStickerModalOpen] =
    React.useState(false);
  const [isDecorationStickerModalOpen, setIsDecorationStickerModalOpen] =
    React.useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = React.useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] =
    React.useState(false);
  const [gridToDelete, setGridToDelete] = React.useState<string | null>(null);

  // 그리드 표시 상태 관리
  const [visibleGrids, setVisibleGrids] = React.useState({
    playActivity: type === "C",
    teacherSupport: true,
    homeConnection: true,
  });

  const containerRef = React.useRef<HTMLDivElement>(null);
  const maxLength = 300; // 최대 글자수

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setActiveSection(null);
        setShowToolbar(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSectionClick = (section: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setActiveSection(section);
    setShowToolbar(true);

    // 툴바 위치 계산
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setToolbarPosition({
      left: "8px",
      top: "calc(100% + 8px)",
    });
  };

  const handleTextChange = (section: string, value: string) => {
    switch (section) {
      case "playActivity":
        setPlayActivityText(value);
        break;
      case "teacherSupport":
        setTeacherSupportText(value);
        break;
      case "homeConnection":
        setHomeConnectionText(value);
        break;
    }
  };

  // 툴바 아이콘 클릭 핸들러 - 제한된 기능만 처리
  const handleToolbarIconClick = (index: number | string, data?: any) => {
    // 문자열로 전달된 경우 (limitedMode)
    if (typeof index === "string") {
      switch (index) {
        case "addFrame": // 틀 추가 (표 추가)
          setIsTableModalOpen(true);
          break;
        case "deleteFrame": // 틀 삭제
          if (activeSection) {
            setGridToDelete(activeSection);
            setIsDeleteConfirmModalOpen(true);
          }
          break;
      }
      return;
    }

    // 기존 숫자 인덱스 처리 (일반 모드)
    switch (index) {
      case 2: // 틀 추가 (표 추가)
        setIsTableModalOpen(true);
        break;
      case 4: // 틀 삭제
        if (activeSection) {
          setGridToDelete(activeSection);
          setIsDeleteConfirmModalOpen(true);
        }
        break;
    }
  };

  // 텍스트 스티커 적용
  const handleTextStickerApply = (selectedSticker: number) => {
    // 텍스트 스티커 적용 로직 구현
  };

  // 꾸미기 스티커 적용
  const handleDecorationStickerApply = (selectedSticker: number) => {
    // 꾸미기 스티커 적용 로직 구현
  };

  // 그리드 삭제 기능
  const handleDeleteGrid = (gridType: string) => {
    setVisibleGrids((prev) => ({
      ...prev,
      [gridType]: false,
    }));

    // 해당 그리드의 텍스트도 초기화
    if (gridType === "playActivity") {
      setPlayActivityText("");
    } else if (gridType === "teacherSupport") {
      setTeacherSupportText("");
    } else if (gridType === "homeConnection") {
      setHomeConnectionText("");
    }

    // 활성 섹션이 삭제된 그리드였다면 초기화
    if (activeSection === gridType) {
      setActiveSection(null);
      setShowToolbar(false);
    }
  };

  // 그리드 영역 추가 적용
  const handleTableApply = (targetGrid: string) => {
    console.log("Grid area added:", targetGrid);
    // 선택된 그리드 영역을 화면에 표시
    setVisibleGrids((prev) => ({
      ...prev,
      [targetGrid]: true,
    }));
  };

  // 틀 추가 버튼 클릭 핸들러 - BottomEditToolbar의 틀 추가 기능과 동일
  const handleAddImageFrame = () => {
    setIsTableModalOpen(true);
  };

  // 틀 삭제 확인 핸들러
  const handleDeleteConfirm = () => {
    if (gridToDelete) {
      handleDeleteGrid(gridToDelete);
      setGridToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setGridToDelete(null);
  };

  const getSectionStyle = (section: string) => {
    const isActive = activeSection === section;
    const hasText = section === "teacherSupport" ? teacherSupportText.length > 0 : 
                   section === "homeConnection" ? homeConnectionText.length > 0 : false;
    
    return `relative flex flex-col w-full h-full border rounded-[15px] cursor-pointer ${
      isActive
        ? "border-solid border-primary border-2"
        : hasText
        ? "border-none"
        : "border-dashed border-zinc-400"
    }`;
  };

  // C타입에서 동적 높이 계산
  const getBottomSectionHeight = () => {
    if (type === "C") {
      // 놀이활동이 표시되지 않으면 전체 높이 사용
      if (!visibleGrids.playActivity) {
        return "287px"; // 전체 높이 차지
      }
      return "136px"; // C타입에서 교사지원+가정연계 높이
    }
    return "174px";
  };

  // playActivity 영역의 동적 높이 계산
  const getPlayActivityHeight = () => {
    if (type === "C") {
      // 다른 그리드들이 모두 숨겨져 있으면 전체 높이 사용
      if (!visibleGrids.teacherSupport && !visibleGrids.homeConnection) {
        return "287px"; // 혼자 남으면 전체 높이 차지
      }
      return "143px"; // C타입에서 놀이활동 높이 (총 287px - 136px - 8px gap)
    }
    return "174px";
  };

  return (
    <div 
      ref={containerRef} 
      className="flex flex-col w-full gap-y-2"
      style={{ 
        height: type === "C" ? "287px" : "174px" 
      }}
    >
      {/* "이렇게 놀이했어요" 부분 - typeC에서만 보임 */}
      {type === "C" && visibleGrids.playActivity && (
        <div
          className="bg-white relative flex flex-col w-full border rounded-[15px] cursor-pointer"
          style={{ 
            height: getPlayActivityHeight(),
            borderWidth: activeSection === "playActivity" ? "2px" : playActivityText.length > 0 ? "0px" : "1px",
            borderStyle: activeSection === "playActivity" ? "solid" : playActivityText.length > 0 ? "none" : "dashed",
            borderColor: activeSection === "playActivity" ? "#FAB83D" : "rgb(161 161 170)"
          }}
          onClick={(e) => handleSectionClick("playActivity", e)}
        >
          <h3 className="text-[12px] font-semibold p-3 text-primary flex items-center gap-1">
            <div className="flex items-center gap-2">
              <Image
                src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/play.svg"
                alt="play"
                width={16}
                height={16}
              />
            </div>
            이렇게 놀이 했어요
          </h3>
          {(activeSection === "playActivity" || playActivityText) && (
            <textarea
              value={playActivityText}
              onChange={(e) => handleTextChange("playActivity", e.target.value)}
              placeholder="놀이 내용을 입력해주세요..."
              className="flex-1 mx-3 mb-8 p-2 border-none outline-none resize-none text-sm"
              autoFocus={activeSection === "playActivity"}
              maxLength={maxLength}
            />
          )}
          {/* 그리드 삭제 버튼 */}

          <div className="absolute bottom-2 right-2 text-xs font-bold text-primary">
            ({playActivityText.length}/{maxLength})
          </div>

          {/* 툴바 표시 */}
          {showToolbar && activeSection === "playActivity" && (
            <BottomEditToolbar
              show={true}
              isExpanded={true}
              position={toolbarPosition}
              onIconClick={handleToolbarIconClick}
            />
          )}
        </div>
      )}

      {/* 교사지원과 가정연계 부분 - 모든 타입에서 보임 */}
      {(visibleGrids.teacherSupport || visibleGrids.homeConnection) && (
        <div 
          className="flex flex-row w-full gap-3"
          style={{ height: getBottomSectionHeight() }}
        >
        {/* 교사지원 */}
        {visibleGrids.teacherSupport && (
          <div
            className={`${getSectionStyle("teacherSupport")} bg-white`}
            style={{
              width:
                visibleGrids.teacherSupport && visibleGrids.homeConnection
                  ? "50%"
                  : "100%",
              height: "100%", // 전체 높이 차지
            }}
            onClick={(e) => handleSectionClick("teacherSupport", e)}
          >
            <h3 className="text-[12px] font-semibold p-3 text-primary flex items-center gap-1">
              <div className="flex items-center gap-2">
                <Image
                  src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/bulb.svg"
                  alt="bulb"
                  width={16}
                  height={16}
                />
              </div>
              놀이속 배움 / 교사지원
            </h3>
            {(activeSection === "teacherSupport" || teacherSupportText) && (
              <textarea
                value={teacherSupportText}
                onChange={(e) =>
                  handleTextChange("teacherSupport", e.target.value)
                }
                placeholder="교사지원 내용을 입력해주세요..."
                className="flex-1 mx-3 mb-8 p-2 border-none outline-none resize-none text-sm"
                autoFocus={activeSection === "teacherSupport"}
                maxLength={maxLength}
              />
            )}
            {/* 그리드 삭제 버튼 */}

            <div className="absolute bottom-2 right-2 text-xs font-bold text-primary">
              ({teacherSupportText.length}/{maxLength})
            </div>

            {/* 툴바 표시 */}
            {showToolbar && activeSection === "teacherSupport" && (
              <BottomEditToolbar
                show={true}
                isExpanded={true}
                position={toolbarPosition}
                onIconClick={handleToolbarIconClick}
              />
            )}
          </div>
        )}

        {/* 가정연계 */}
        {visibleGrids.homeConnection && (
          <div
            className={`${getSectionStyle("homeConnection")} bg-white`}
            style={{
              width:
                visibleGrids.teacherSupport && visibleGrids.homeConnection
                  ? "50%"
                  : "100%",
              height: "100%", // 전체 높이 차지
            }}
            onClick={(e) => handleSectionClick("homeConnection", e)}
          >
            <h3 className="text-[12px] font-semibold p-3 text-primary flex items-center gap-1">
              <div className="flex items-center gap-2">
                <Image
                  src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/home.svg"
                  alt="home"
                  width={16}
                  height={16}
                />
              </div>
              가정연계
            </h3>
            {(activeSection === "homeConnection" || homeConnectionText) && (
              <textarea
                value={homeConnectionText}
                onChange={(e) =>
                  handleTextChange("homeConnection", e.target.value)
                }
                placeholder="가정연계 내용을 입력해주세요..."
                className="flex-1 mx-3 mb-8 p-2 border-none outline-none resize-none text-sm"
                autoFocus={activeSection === "homeConnection"}
                maxLength={maxLength}
              />
            )}
            {/* 그리드 삭제 버튼 */}

            <div className="absolute bottom-2 right-2 text-xs font-bold text-primary">
              ({homeConnectionText.length}/{maxLength})
            </div>

            {/* 툴바 표시 */}
            {showToolbar && activeSection === "homeConnection" && (
              <BottomEditToolbar
                show={true}
                isExpanded={true}
                position={toolbarPosition}
                onIconClick={handleToolbarIconClick}
              />
            )}
          </div>
        )}
        </div>
      )}

      {/* 모든 그리드가 삭제되었을 때 빈 영역 표시 */}
      {((type === "C" && !visibleGrids.playActivity && !visibleGrids.teacherSupport && !visibleGrids.homeConnection) ||
        (type !== "C" && !visibleGrids.teacherSupport && !visibleGrids.homeConnection)) && (
        <div 
          className="flex flex-col items-center justify-center w-full transition-opacity duration-200"
          style={{ height: getBottomSectionHeight() }}
        >
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

      {/* 모달들 */}
      <TextStickerModal
        isOpen={isTextStickerModalOpen}
        onClose={() => setIsTextStickerModalOpen(false)}
        onApply={handleTextStickerApply}
      />

      <DecorationStickerModal
        isOpen={isDecorationStickerModalOpen}
        onClose={() => setIsDecorationStickerModalOpen(false)}
        onApply={handleDecorationStickerApply}
      />

      <TableModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        onApply={handleTableApply}
        type={type}
        visibleGrids={visibleGrids}
      />

      <ApplyModal
        open={isDeleteConfirmModalOpen}
        onOpenChange={setIsDeleteConfirmModalOpen}
        title="입력틀 삭제"
        description="입력틀 삭제 시, 입력한 내용이 모두 초기화됩니다.&#13;&#10;입력틀을 삭제하시겠습니까?"
        cancelText="취소"
        confirmText="삭제"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      >
        <div></div>
      </ApplyModal>
    </div>
  );
};

// 제한된 기능만 표시하는 툴바 컴포넌트
const LimitedGridEditToolbar: React.FC<{
  show: boolean;
  position: { left: string; top: string };
  onIconClick: (index: number) => void;
}> = ({ show, position, onIconClick }) => {
  const [internalExpanded, setInternalExpanded] = React.useState(false);

  React.useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        setInternalExpanded(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setInternalExpanded(false);
    }
  }, [show]);

  if (!show) {
    return null;
  }

  const icons = [
    {
      src: "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/fix2.svg",
      tooltip: "텍스트 스티커",
    },
    {
      src: "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/fix3.svg",
      tooltip: "꾸미기 스티커",
    },
    {
      src: "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/fix6.svg",
      tooltip: "표 추가",
    },
  ];

  return (
    <div
      className="absolute z-50"
      style={{
        left: position.left,
        top: position.top,
      }}
    >
      <div
        className="relative flex items-center justify-center"
        style={{ width: "174px", height: "38px" }}
      >
        {icons.map((icon, index) => (
          <div
            key={index}
            className="w-[38px] h-[38px] bg-black hover:bg-primary rounded-full absolute flex items-center justify-center cursor-pointer hover:-translate-y-1"
            style={{
              left: `${index * (38 + 12)}px`,
              opacity: internalExpanded ? 1 : 0,
              transform: internalExpanded
                ? "scale(1) translateY(0)"
                : "scale(0.3) translateY(10px)",
              transition:
                "opacity 0.4s ease-out, transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), background-color 0.2s ease-in-out",
              transitionDelay: internalExpanded ? `${index * 100}ms` : "0ms",
              zIndex: 6 - index,
            }}
            onClick={() => onIconClick(index)}
            title={icon.tooltip}
          >
            <Image
              src={icon.src}
              alt={`icon-${index}`}
              width={18}
              height={18}
              className="object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportBottomSection;
