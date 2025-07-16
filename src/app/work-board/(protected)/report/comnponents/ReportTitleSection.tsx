"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import AddPicture from "./AddPicture";

interface ReportTitleSectionProps {
  className?: string;
}

function ReportTitleSection({ className = "" }: ReportTitleSectionProps) {
  // 제목 관련 상태
  const [isFocused, setIsFocused] = useState(false);
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

  // 텍스트 길이에 따라 폰트 사이즈 조절 (제목용)
  useEffect(() => {
    if (text.length === 0) {
      setFontSize("text-4xl");
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
      setTopFontSize("text-lg");
    } else if (topText.length <= 5) {
      setTopFontSize("text-lg");
    } else if (topText.length <= 10) {
      setTopFontSize("text-base");
    } else if (topText.length <= 15) {
      setTopFontSize("text-sm");
    } else {
      setTopFontSize("text-xs");
    }
  }, [topText]);

  // 우측 하단 박스 폰트 사이즈 조절
  useEffect(() => {
    if (bottomText.length === 0) {
      setBottomFontSize("text-lg");
    } else if (bottomText.length <= 5) {
      setBottomFontSize("text-lg");
    } else if (bottomText.length <= 10) {
      setBottomFontSize("text-base");
    } else if (bottomText.length <= 15) {
      setBottomFontSize("text-sm");
    } else {
      setBottomFontSize("text-xs");
    }
  }, [bottomText]);

  // 제목 핸들러
  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleInput = () => {
    if (contentRef.current) {
      setText(contentRef.current.textContent || "");
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

  return (
    <div
      className={`flex flex-row w-full justify-between h-[83px] ${className}`}
    >
      <div className="flex flex-col w-[10%] border-2 border-dashed border-[#B4B4B4] rounded-[15px] items-center justify-center hover:border-gray-400  transition-colors cursor-pointer">
        <AddPicture>
          <Image
            src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage.svg"
            width={18}
            height={18}
            className="object-contain aspect-square"
            alt="no image"
          />
        </AddPicture>
      </div>

      <div 
        className={`flex flex-col w-[60%] border-2 rounded-[15px] items-center justify-center cursor-text transition-colors p-2 ${
          isFocused || text
            ? 'border-primary border-solid' 
            : 'border-[#B4B4B4] border-dashed hover:border-gray-400'
        }`}
        onClick={() => contentRef.current?.focus()}
      >
        <div
          ref={contentRef}
          contentEditable
          className={`w-full h-full outline-none text-center flex items-center justify-center font-medium ${fontSize} transition-all duration-200`}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onInput={handleInput}
          suppressContentEditableWarning={true}
          style={{ minHeight: '1em' }}
          data-placeholder={text === "" ? "제목을 입력하세요" : ""}
        />
        
        {/* 플레이스홀더 스타일 */}
        <style jsx>{`
          div[contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: #9CA3AF;
            pointer-events: none;
          }
        `}</style>
      </div>

      <div className="flex flex-col w-[10%] gap-y-2">
        {/* 상단 박스 */}
        <div 
          className={`flex flex-col w-full h-1/2 border-2 rounded-[15px] items-center justify-center cursor-text transition-colors p-2 ${
            isTopFocused || topText
              ? 'border-primary border-solid' 
              : 'border-[#B4B4B4] border-dashed hover:border-gray-400'
          }`}
          onClick={() => topContentRef.current?.focus()}
        >
          <div
            ref={topContentRef}
            contentEditable
            className={`w-full h-full outline-none text-center flex items-center justify-center font-medium ${topFontSize} transition-all duration-200`}
            onFocus={handleTopFocus}
            onBlur={handleTopBlur}
            onInput={handleTopInput}
            suppressContentEditableWarning={true}
            style={{ minHeight: '1em' }}
            data-placeholder={topText === "" ? "텍스트" : ""}
          />
        </div>

        {/* 하단 박스 */}
        <div 
          className={`flex flex-col w-full h-1/2 border-2 rounded-[15px] items-center justify-center cursor-text transition-colors p-2 ${
            isBottomFocused || bottomText
              ? 'border-primary border-solid' 
              : 'border-[#B4B4B4] border-dashed hover:border-gray-400'
          }`}
          onClick={() => bottomContentRef.current?.focus()}
        >
          <div
            ref={bottomContentRef}
            contentEditable
            className={`w-full h-full outline-none text-center flex items-center justify-center font-medium ${bottomFontSize} transition-all duration-200`}
            onFocus={handleBottomFocus}
            onBlur={handleBottomBlur}
            onInput={handleBottomInput}
            suppressContentEditableWarning={true}
            style={{ minHeight: '1em' }}
            data-placeholder={bottomText === "" ? "텍스트" : ""}
          />
        </div>

        {/* 플레이스홀더 스타일 - 우측 박스들용 */}
        <style jsx>{`
          div[contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: #9CA3AF;
            pointer-events: none;
          }
        `}</style>
      </div>
    </div>
  );
}

export default ReportTitleSection;
