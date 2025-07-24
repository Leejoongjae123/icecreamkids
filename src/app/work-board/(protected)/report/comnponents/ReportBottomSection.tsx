"use client";
import * as React from "react";
import { IoClose } from "react-icons/io5";
import Image from "next/image";
import { ReportBottomSectionProps } from "./types";

const ReportBottomSection: React.FC<ReportBottomSectionProps> = ({ type }) => {
  const [activeSection, setActiveSection] = React.useState<string | null>(null);
  const [playActivityText, setPlayActivityText] = React.useState("");
  const [teacherSupportText, setTeacherSupportText] = React.useState("");
  const [homeConnectionText, setHomeConnectionText] = React.useState("");
  const [leftWidth, setLeftWidth] = React.useState(50); // 왼쪽 영역 비율 (%)
  const [isResizing, setIsResizing] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const resizeContainerRef = React.useRef<HTMLDivElement>(null);
  const maxLength = 300; // 최대 글자수

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveSection(null);
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizing || !resizeContainerRef.current) return;
      
      const containerRect = resizeContainerRef.current.getBoundingClientRect();
      const newLeftWidth = ((event.clientX - containerRect.left) / containerRect.width) * 100;
      
      // 최소/최대 너비 제한 (20% ~ 80%)
      if (newLeftWidth >= 20 && newLeftWidth <= 80) {
        setLeftWidth(newLeftWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleSectionClick = (section: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setActiveSection(section);
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

  const handleResizeStart = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsResizing(true);
  };

  const getSectionStyle = (section: string) => {
    const isActive = activeSection === section;
    return `relative flex flex-col w-full h-full border rounded-[15px] cursor-pointer ${
      isActive
        ? "border-solid border-primary border-2" 
        : "border-dashed border-zinc-400"
    }`;
  };

  return (
    <div ref={containerRef} className="flex flex-col w-full gap-y-3">
      {/* "이렇게 놀이했어요" 부분 - typeC에서만 보임 */}
      {type === "C" && (
        <div 
          className={`bg-white relative flex flex-col w-full h-[174px] border rounded-[15px] cursor-pointer ${
            activeSection === "playActivity"
              ? "border-solid border-primary border-2" 
              : "border-dashed border-zinc-400"
          }`}
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
          <button 
            className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full bg-[#F0F0F0] hover:bg-gray-300 text-gray-600"
            onClick={(e) => {
              e.stopPropagation();
              setActiveSection(null);
              setPlayActivityText("");
            }}
          >
            <IoClose
              className="bg-white border border-gray-200 rounded-full"
              size={20}
            />
          </button>
          <div className="absolute bottom-2 right-2 text-xs font-bold text-primary">
            ({playActivityText.length}/{maxLength})
          </div>
        </div>
      )}
      
      {/* 교사지원과 가정연계 부분 - 모든 타입에서 보임 */}
      <div ref={resizeContainerRef} className="flex flex-row w-full h-[174px] relative">
        {/* 교사지원 */}
        <div 
          className={`${getSectionStyle("teacherSupport")} bg-white`}
          style={{ width: `calc(${leftWidth}% - 6px)` }}
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
              onChange={(e) => handleTextChange("teacherSupport", e.target.value)}
              placeholder="교사지원 내용을 입력해주세요..."
              className="flex-1 mx-3 mb-8 p-2 border-none outline-none resize-none text-sm"
              autoFocus={activeSection === "teacherSupport"}
              maxLength={maxLength}
            />
          )}
          <button 
            className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full bg-[#F0F0F0] hover:bg-gray-300 text-gray-600"
            onClick={(e) => {
              e.stopPropagation();
              setActiveSection(null);
              setTeacherSupportText("");
            }}
          >
            <IoClose
              className="bg-white border border-gray-200 rounded-full"
              size={20}
            />
          </button>
          <div className="absolute bottom-2 right-2 text-xs font-bold text-primary">
            ({teacherSupportText.length}/{maxLength})
          </div>
        </div>

        {/* 리사이저 핸들 */}
        <div 
          className={`flex items-center justify-center w-3 h-full cursor-col-resize select-none ${
            isResizing ? '' : 'hover:'
          }`}
          onMouseDown={handleResizeStart}
        >
          <div className="w-1 h-8 bg-gray-300 rounded-full"></div>
        </div>

        {/* 가정연계 */}
        <div 
          className={`${getSectionStyle("homeConnection")} bg-white`}
          style={{ width: `calc(${100 - leftWidth}% - 6px)` }}
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
              onChange={(e) => handleTextChange("homeConnection", e.target.value)}
              placeholder="가정연계 내용을 입력해주세요..."
              className="flex-1 mx-3 mb-8 p-2 border-none outline-none resize-none text-sm"
              autoFocus={activeSection === "homeConnection"}
              maxLength={maxLength}
            />
          )}
          <button 
            className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full bg-[#F0F0F0] hover:bg-gray-300 text-gray-600"
            onClick={(e) => {
              e.stopPropagation();
              setActiveSection(null);
              setHomeConnectionText("");
            }}
          >
            <IoClose
              className="bg-white border border-gray-200 rounded-full"
              size={20}
            />
          </button>
          <div className="absolute bottom-2 right-2 text-xs font-bold text-primary">
            ({homeConnectionText.length}/{maxLength})
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportBottomSection; 