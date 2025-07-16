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
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveSection(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const getSectionStyle = (section: string) => {
    const isActive = activeSection === section;
    return `relative flex flex-col w-full h-full border-2 rounded-[15px] cursor-pointer ${
      isActive
        ? "border-solid border-primary" 
        : "border-dashed border-[#B4B4B4]"
    }`;
  };

  return (
    <div ref={containerRef} className="flex flex-col w-full gap-y-3">
      {/* "이렇게 놀이했어요" 부분 - typeC에서만 보임 */}
      {type === "C" && (
        <div 
          className={`relative flex flex-col w-full h-[174px] border-2 rounded-[15px] cursor-pointer ${
            activeSection === "playActivity"
              ? "border-solid border-primary" 
              : "border-dashed border-[#B4B4B4]"
          }`}
          onClick={() => handleSectionClick("playActivity")}
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
              className="flex-1 mx-3 mb-3 p-2 border-none outline-none resize-none text-sm"
              autoFocus={activeSection === "playActivity"}
            />
          )}
          {playActivityText && (
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
          )}
        </div>
      )}
      
      {/* 교사지원과 가정연계 부분 - 모든 타입에서 보임 */}
      <div className="flex flex-row w-full h-[174px] gap-x-3">
        <div 
          className={getSectionStyle("teacherSupport")}
          onClick={() => handleSectionClick("teacherSupport")}
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
            교사지원
          </h3>
          {(activeSection === "teacherSupport" || teacherSupportText) && (
            <textarea
              value={teacherSupportText}
              onChange={(e) => handleTextChange("teacherSupport", e.target.value)}
              placeholder="교사지원 내용을 입력해주세요..."
              className="flex-1 mx-3 mb-3 p-2 border-none outline-none resize-none text-sm"
              autoFocus={activeSection === "teacherSupport"}
            />
          )}
          {teacherSupportText && (
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
          )}
        </div>
        <div 
          className={getSectionStyle("homeConnection")}
          onClick={() => handleSectionClick("homeConnection")}
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
              className="flex-1 mx-3 mb-3 p-2 border-none outline-none resize-none text-sm"
              autoFocus={activeSection === "homeConnection"}
            />
          )}
          {homeConnectionText && (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportBottomSection; 