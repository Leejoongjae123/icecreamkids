"use client";
import * as React from "react";
import { IoClose } from "react-icons/io5";
import Image from "next/image";
import { ReportBottomSectionProps, ReportBottomData, DecorationItemRemote } from "./types";

export interface ReportBottomSectionRef {
  getReportBottomData: () => ReportBottomData;
}
import TextStickerModal from "./TextStickerModal";
import DecorationStickerModal from "./DecorationStickerModal";
import TableModal from "./TableModal";
import ApplyModal from "./ApplyModal";
import BottomEditToolbar from "./BottomEditToolbar";
import usePlayRecordStore from "@/hooks/store/usePlayRecordStore";
import { useSavedDataStore } from "@/hooks/store/useSavedDataStore";

const ReportBottomSection = React.forwardRef<ReportBottomSectionRef, ReportBottomSectionProps>(({ type, initialData }, ref) => {
  const { playRecordResult } = usePlayRecordStore();
  const { isSaved } = useSavedDataStore();
  const [activeSection, setActiveSection] = React.useState<string | null>(null);
  const [playActivityText, setPlayActivityText] = React.useState(initialData?.playActivityText || "");
  const [teacherSupportText, setTeacherSupportText] = React.useState(initialData?.teacherSupportText || "");
  const [homeConnectionText, setHomeConnectionText] = React.useState(initialData?.homeConnectionText || "");
  const [llmFilled, setLlmFilled] = React.useState({ playActivity: false, teacherSupport: false, homeConnection: false });
  const [showToolbar, setShowToolbar] = React.useState(false);
  const [toolbarPosition, setToolbarPosition] = React.useState({
    left: "8px",
    top: "calc(100% + 8px)",
  });
  const hoverHideTimerRef = React.useRef<number | null>(null);
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
    playActivity: initialData?.visibleGrids?.playActivity ?? (type === "C"),
    teacherSupport: initialData?.visibleGrids?.teacherSupport ?? true,
    homeConnection: initialData?.visibleGrids?.homeConnection ?? true,
  });

  const containerRef = React.useRef<HTMLDivElement>(null);
  const MAX_PLAY_ACTIVITY = 300; // 이렇게 놀이 했어요
  const MAX_LEARNING_POINT = 300; // 놀이속 배움
  const MAX_TEACHER_SUPPORT = 200; // 교사 지원

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const targetEl = event.target as Element;
      if (targetEl && targetEl.closest && targetEl.closest('.bottom-edit-toolbar')) {
        return;
      }
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

  React.useEffect(() => {
    return () => {
      if (hoverHideTimerRef.current) {
        window.clearTimeout(hoverHideTimerRef.current);
        hoverHideTimerRef.current = null;
      }
    };
  }, []);

  // API로부터 initialData가 갱신되면 내부 상태 동기화
  React.useEffect(() => {
    if (!initialData) {
      return;
    }
    try {
      setPlayActivityText((initialData.playActivityText || "").slice(0, MAX_PLAY_ACTIVITY));
      // objective -> 놀이속 배움(teacherSupportText로 관리)
      setTeacherSupportText((initialData.teacherSupportText || "").slice(0, MAX_LEARNING_POINT));
      // support -> 교사 지원(homeConnectionText로 관리)
      setHomeConnectionText((initialData.homeConnectionText || "").slice(0, MAX_TEACHER_SUPPORT));
      setVisibleGrids({
        playActivity: initialData.visibleGrids?.playActivity ?? (type === "C"),
        teacherSupport: initialData.visibleGrids?.teacherSupport ?? true,
        homeConnection: initialData.visibleGrids?.homeConnection ?? true,
      });
      // 초기 데이터가 있으면 편집 가능하도록 플래그 설정
      setLlmFilled({
        playActivity: !!(initialData.playActivityText && initialData.playActivityText.trim()),
        teacherSupport: !!(initialData.teacherSupportText && initialData.teacherSupportText.trim()),
        homeConnection: !!(initialData.homeConnectionText && initialData.homeConnectionText.trim()),
      });
    } catch {}
  }, [initialData, type]);

  // 타입 변경 시 하단 요약 textarea 및 관련 상태 초기화
  React.useEffect(() => {
    if (initialData) {
      return;
    }
    try {
      setPlayActivityText("");
      setTeacherSupportText("");
      setHomeConnectionText("");
      setVisibleGrids({
        playActivity: type === "C",
        teacherSupport: true,
        homeConnection: true,
      });
      setLlmFilled({ playActivity: false, teacherSupport: false, homeConnection: false });
      setActiveSection(null);
      setShowToolbar(false);
    } catch {}
  }, [type, initialData]);

  // 놀이기록 결과가 변경될 때마다 텍스트 필드에 반영
  React.useEffect(() => {
    console.log('ReportBottomSection - playRecordResult 변경됨:', playRecordResult);
    if (playRecordResult) {
      console.log('ReportBottomSection - 각 필드 확인:', {
        subject: playRecordResult.subject,
        objective: playRecordResult.objective, 
        support: playRecordResult.support
      });
      
      if (playRecordResult.subject && playRecordResult.subject.trim()) {
        console.log('playActivity 텍스트 설정:', playRecordResult.subject);
        setPlayActivityText(playRecordResult.subject.slice(0, MAX_PLAY_ACTIVITY));
        setLlmFilled(prev => ({ ...prev, playActivity: true }));
      }
      // LLM 결과를 섹션 간 교체: objective -> 놀이속 배움, support -> 교사지원
      if (playRecordResult.objective && playRecordResult.objective.trim()) {
        console.log('teacherSupport(놀이속 배움) 텍스트 설정:', playRecordResult.objective);
        setTeacherSupportText(playRecordResult.objective.slice(0, MAX_LEARNING_POINT));
        setLlmFilled(prev => ({ ...prev, teacherSupport: true }));
      }
      if (playRecordResult.support && playRecordResult.support.trim()) {
        console.log('homeConnection(교사지원) 텍스트 설정:', playRecordResult.support);
        setHomeConnectionText(playRecordResult.support.slice(0, MAX_TEACHER_SUPPORT));
        setLlmFilled(prev => ({ ...prev, homeConnection: true }));
      }
    }
  }, [playRecordResult]);

  const handleSectionClick = (section: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setActiveSection(section);
    setShowToolbar(true);

    // 포털 기준 고정 좌표로 툴바 위치 계산
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setToolbarPosition({
      left: `${rect.left + 8}px`,
      top: `${rect.bottom + 8}px`,
    });
  };

  const showToolbarForSection = (section: string, targetEl: HTMLElement) => {
    if (hoverHideTimerRef.current) {
      window.clearTimeout(hoverHideTimerRef.current);
      hoverHideTimerRef.current = null;
    }
    setActiveSection(section);
    setShowToolbar(true);
    const rect = targetEl.getBoundingClientRect();
    setToolbarPosition({
      left: `${rect.left + 8}px`,
      top: `${rect.bottom + 8}px`,
    });
  };

  const scheduleHideToolbar = () => {
    if (hoverHideTimerRef.current) {
      window.clearTimeout(hoverHideTimerRef.current);
    }
    hoverHideTimerRef.current = window.setTimeout(() => {
      setShowToolbar(false);
      setActiveSection(null);
    }, 2000);
  };

  const handleTextChange = (section: string, value: string) => {
    switch (section) {
      case "playActivity":
        // LLM 입력 전에는 자유 입력 비활성화
        if (!llmFilled.playActivity) {
          return;
        }
        setPlayActivityText(value.slice(0, MAX_PLAY_ACTIVITY));
        break;
      case "teacherSupport":
        // LLM 입력 전에는 자유 입력 비활성화
        if (!llmFilled.teacherSupport) {
          return;
        }
        setTeacherSupportText(value.slice(0, MAX_LEARNING_POINT));
        break;
      case "homeConnection":
        // LLM 입력 전에는 자유 입력 비활성화
        if (!llmFilled.homeConnection) {
          return;
        }
        setHomeConnectionText(value.slice(0, MAX_TEACHER_SUPPORT));
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
  const handleDecorationStickerApply = (selectedSticker: DecorationItemRemote) => {
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

  // ReportBottom 데이터 수집 함수
  const getReportBottomData = React.useCallback((): ReportBottomData => {
    return {
      playActivityText,
      teacherSupportText,
      homeConnectionText,
      visibleGrids: { ...visibleGrids },
    };
  }, [playActivityText, teacherSupportText, homeConnectionText, visibleGrids]);

  // ref를 통해 함수 expose
  React.useImperativeHandle(ref, () => ({
    getReportBottomData
  }), [getReportBottomData]);

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
          onMouseEnter={(e) => showToolbarForSection("playActivity", e.currentTarget)}
          onMouseLeave={() => scheduleHideToolbar()}
        >
            <h3 className="text-[11px] font-semibold p-2 text-primary flex items-center gap-1">
            <div className="flex items-center gap-2">
              <Image
                src="/report/play.svg"
                alt="play"
                width={16}
                height={16}
              />
            </div>
            놀이의 흐름
          </h3>
          {(activeSection === "playActivity" || playActivityText.length > 0) && (
            <textarea
              value={playActivityText}
              onChange={(e) => handleTextChange("playActivity", e.target.value)}
              placeholder=""
              className="flex-1 mx-2 mb-1 px-1 py-0.5 border-none outline-none resize-none text-[12px] leading-[1.1] bg-transparent scrollbar-hide"
              autoFocus={activeSection === "playActivity"}
              readOnly={!llmFilled.playActivity}
              maxLength={MAX_PLAY_ACTIVITY}
            />
          )}
          {/* 그리드 삭제 버튼 */}

          {!isSaved && (
            <div className="absolute bottom-1 right-2 text-[10px] font-bold">
              <span className="text-[#444444]">{playActivityText.length}</span>
              <span className="text-[#B3B3B3]">/{MAX_PLAY_ACTIVITY}</span>
            </div>
          )}

          {/* 툴바 표시 */}
          {showToolbar && activeSection === "playActivity" && (
            <BottomEditToolbar
              show={true}
              isExpanded={true}
              position={toolbarPosition}
              onIconClick={handleToolbarIconClick}
              canAdd={
                // 삭제된 틀이 있을 때만 '틀 추가' 노출
                (type === "C" && (!visibleGrids.teacherSupport || !visibleGrids.homeConnection || !visibleGrids.playActivity)) ||
                (type !== "C" && (!visibleGrids.teacherSupport || !visibleGrids.homeConnection))
              }
              usePortal={true}
              onMouseEnter={() => {
                if (hoverHideTimerRef.current) {
                  window.clearTimeout(hoverHideTimerRef.current);
                  hoverHideTimerRef.current = null;
                }
              }}
              onMouseLeave={() => scheduleHideToolbar()}
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
                  ? "60%"
                  : "100%",
              height: "100%", // 전체 높이 차지
            }}
            onClick={(e) => handleSectionClick("teacherSupport", e)}
            onMouseEnter={(e) => showToolbarForSection("teacherSupport", e.currentTarget)}
            onMouseLeave={() => scheduleHideToolbar()}
          >
            <h3 className="text-[11px] font-semibold p-2 text-primary flex items-center gap-1">
              <div className="flex items-center gap-2">
                <Image
                  src="/report/bulb.svg"
                  alt="bulb"
                  width={16}
                  height={16}
                />
              </div>
              놀이속 배움 
            </h3>
            {(activeSection === "teacherSupport" || teacherSupportText.length > 0) && (
              <textarea
                value={teacherSupportText}
                onChange={(e) =>
                  handleTextChange("teacherSupport", e.target.value)
                }
                placeholder=""
                className="flex-1 mx-2 mb-1 px-1 py-0.5 border-none outline-none resize-none text-[12px] leading-[1.1] bg-transparent scrollbar-hide"
                autoFocus={activeSection === "teacherSupport"}
                readOnly={!llmFilled.teacherSupport}
                maxLength={MAX_LEARNING_POINT}
              />
            )}
            {/* 그리드 삭제 버튼 */}

            {!isSaved && (
              <div className="absolute bottom-1 right-2 text-[10px] font-bold">
                <span className="text-[#444444]">{teacherSupportText.length}</span>
                <span className="text-[#B3B3B3]">/{MAX_LEARNING_POINT}</span>
              </div>
            )}

            {/* 툴바 표시 */}
            {showToolbar && activeSection === "teacherSupport" && (
              <BottomEditToolbar
                show={true}
                isExpanded={true}
                position={toolbarPosition}
                onIconClick={handleToolbarIconClick}
                canAdd={
                  (type === "C" && (!visibleGrids.teacherSupport || !visibleGrids.homeConnection || !visibleGrids.playActivity)) ||
                  (type !== "C" && (!visibleGrids.teacherSupport || !visibleGrids.homeConnection))
                }
                usePortal={true}
                onMouseEnter={() => {
                  if (hoverHideTimerRef.current) {
                    window.clearTimeout(hoverHideTimerRef.current);
                    hoverHideTimerRef.current = null;
                  }
                }}
                onMouseLeave={() => scheduleHideToolbar()}
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
                  ? "40%"
                  : "100%",
              height: "100%", // 전체 높이 차지
            }}
            onClick={(e) => handleSectionClick("homeConnection", e)}
            onMouseEnter={(e) => showToolbarForSection("homeConnection", e.currentTarget)}
            onMouseLeave={() => scheduleHideToolbar()}
          >
            <h3 className="text-[11px] font-semibold p-2 text-primary flex items-center gap-1">
            <div className="flex items-center gap-2">
                <Image
                  src="/report/home.svg"
                  alt="home"
                  width={16}
                  height={16}
                />
              </div>
              교사 지원
            </h3>
            {(activeSection === "homeConnection" || homeConnectionText.length > 0) && (
              <textarea
                value={homeConnectionText}
                onChange={(e) =>
                  handleTextChange("homeConnection", e.target.value)
                }
                placeholder=""
                className="flex-1 mx-2 mb-1 px-1 py-0.5 border-none outline-none resize-none text-[12px] leading-[1.1] bg-transparent scrollbar-hide"
                autoFocus={activeSection === "homeConnection"}
                readOnly={!llmFilled.homeConnection}
                maxLength={MAX_TEACHER_SUPPORT}
              />
            )}
            {/* 그리드 삭제 버튼 */}

            {!isSaved && (
              <div className="absolute bottom-2 right-2 text-xs font-bold">
                <span className="text-[#444444]">{homeConnectionText.length}</span>
                <span className="text-[#B3B3B3]">/{MAX_TEACHER_SUPPORT}</span>
              </div>
            )}

            {/* 툴바 표시 */}
            {showToolbar && activeSection === "homeConnection" && (
              <BottomEditToolbar
                show={true}
                isExpanded={true}
                position={toolbarPosition}
                onIconClick={handleToolbarIconClick}
                canAdd={
                  (type === "C" && (!visibleGrids.teacherSupport || !visibleGrids.homeConnection || !visibleGrids.playActivity)) ||
                  (type !== "C" && (!visibleGrids.teacherSupport || !visibleGrids.homeConnection))
                }
                usePortal={true}
                onMouseEnter={() => {
                  if (hoverHideTimerRef.current) {
                    window.clearTimeout(hoverHideTimerRef.current);
                    hoverHideTimerRef.current = null;
                  }
                }}
                onMouseLeave={() => scheduleHideToolbar()}
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
                src="/report/fix6.svg"
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
});

ReportBottomSection.displayName = 'ReportBottomSection';

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
      src: "/report/fix2.svg",
      tooltip: "텍스트 스티커",
    },
    {
      src: "/report/fix3.svg",
      tooltip: "꾸미기 스티커",
    },
    {
      src: "/report/fix6.svg",
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
