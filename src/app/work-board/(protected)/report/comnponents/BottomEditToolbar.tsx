"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BottomEditToolbarProps {
  show: boolean;
  isExpanded: boolean;
  position?: {
    left: string;
    top: string;
  };
  onIconClick: (action: string) => void;
}

const BottomEditToolbar: React.FC<BottomEditToolbarProps> = ({
  show,
  isExpanded,
  position = { left: "8px", top: "calc(100% + 8px)" },
  onIconClick,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);



  // show가 true가 되면 약간의 지연 후 펼치기
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        setInternalExpanded(true);
      }, 100); // 100ms 후 펼치기
      return () => clearTimeout(timer);
    } else {
      setInternalExpanded(false);
    }
  }, [show]);

  // 툴팁 텍스트
  const tooltipTexts = [
    "틀 추가",
    "틀 삭제",
  ];

  // 아이콘 URL
  const iconUrls = [
    "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/fix6.svg", // 틀 추가
    "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/fix5.svg", // 틀 삭제
  ];

  const iconCount = 2;
  const containerWidth = `${iconCount * (38 + 12) - 12}px`;

  // 아이콘 클릭 핸들러
  const handleIconClick = (index: number) => {
    if (index === 0) {
      // 틀 추가
      onIconClick('addFrame');
    } else if (index === 1) {
      // 틀 삭제
      onIconClick('deleteFrame');
    }
  };



  if (!show) {
    return null;
  }

  return (
    <>
      <div
        className="absolute z-50"
        style={{
          left: position.left,
          top: position.top,
        }}
      >
        <div
          className="relative flex items-center justify-center"
          style={{ width: containerWidth, height: "38px" }}
        >
          {[...Array(iconCount)].map((_, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div
                  className="w-[38px] h-[38px] bg-primary hover:opacity-80 rounded-full absolute flex items-center justify-center cursor-pointer hover:-translate-y-1"
                  style={{
                    left: `${index * (38 + 12)}px`,
                    opacity: internalExpanded ? 1 : 0,
                    transform: internalExpanded ? "scale(1) translateY(0)" : "scale(0.3) translateY(10px)",
                    transition: "opacity 0.4s ease-out, transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), background-color 0.2s ease-in-out",
                    transitionDelay: internalExpanded ? `${index * 100}ms` : "0ms",
                    zIndex: 6 - index,
                  }}
                  onClick={() => handleIconClick(index)}
                >
                  <Image
                    src={iconUrls[index]}
                    alt={`icon-${index}`}
                    width={18}
                    height={18}
                    className="object-contain"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="bg-primary text-white text-sm px-2 py-1"
              >
                {tooltipTexts[index]}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

    </>
  );
};

export default BottomEditToolbar; 