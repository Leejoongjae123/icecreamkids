"use client";
import * as React from "react";
import { IoClose } from "react-icons/io5";
import { HiOutlinePrinter, HiOutlineDownload } from "react-icons/hi";
import { HiOutlineViewColumns } from "react-icons/hi2";
import Image from "next/image";
import HomeIcon from "@/components/common/Icons/HomeIcon";
import { Button } from "@/components/ui/button";

function ReportA() {
  // 이미지 로드 상태 확인을 위한 핸들러
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log("이미지 로드 실패:", e.currentTarget.src);
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log("이미지 로드 성공:", e.currentTarget.src);
  };

  return (
    <div className="w-full">
      {/* Header with A4 Template */}
      <div className="w-full shadow-custom border border-gray-200 rounded-xl bg-white p-4">
        <div className="flex flex-row justify-between mb-4">
          <div className="flex gap-1 my-auto text-base tracking-tight">
            <img
              src="https://cdn.builder.io/api/v1/image/assets/TEMP/4f51a14975a94c7325e6dc9e46203e3be3439720?placeholderIfAbsent=true&apiKey=304aa4871c104446b0f8164e96d049f4"
              className="object-contain shrink-0 w-5 aspect-square"
            />
            <div className="my-auto">놀이보고서</div>
          </div>
          <div className="flex gap-1.5 text-sm tracking-tight">
            <Button
              size="sm"
              className="gap-1 bg-[#F9FAFB] hover:bg-gray-100 text-[14px] text-black shadow-none font-semibold h-[34px]"
            >
              <Image
                src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/print.svg"
                alt="print"
                width={16}
                height={16}
              />
              인쇄
            </Button>
            <Button
              size="sm"
              className="gap-1 bg-[#F9FAFB] hover:bg-gray-100 text-[14px] text-black shadow-none font-semibold h-[34px]"
            >
              <Image
                src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/share.svg"
                alt="share"
                width={16}
                height={16}
              />
              공유
            </Button>
            <Button
              size="sm"
              className="gap-1 bg-[#F9FAFB] hover:bg-gray-100 text-[14px] text-black shadow-none font-semibold h-[34px]"
            >
              <Image
                src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/download.svg"
                alt="download"
                width={16}
                height={16}
              />
              다운로드
            </Button>
            <Button
              size="sm"
              className="bg-amber-400 hover:bg-amber-500 text-[14px] text-white font-semibold shadow-none h-[34px]"
            >
              저장
            </Button>
          </div>
        </div>

        <div className="flex flex-col w-full min-h-[1130px] justify-between gap-y-3">
          <div className="flex flex-row w-full justify-between h-[83px]">
            <div className="flex flex-col w-[10%] border-2 border-dashed border-[#B4B4B4] rounded-[15px] "></div>
            <div className="flex flex-col w-[60%] border-2 border-dashed border-[#B4B4B4] rounded-[15px] "></div>
            <div className="flex flex-col w-[10%] gap-y-2">
              <div className="flex flex-col w-full h-1/2 border-2 border-dashed border-[#B4B4B4] rounded-[15px] "></div>
              <div className="flex flex-col w-full h-1/2 border-2 border-dashed border-[#B4B4B4] rounded-[15px] "></div>
            </div>
          </div>
          <div className="flex-1 flex-row w-full"></div>
          <div className="flex flex-col w-full gap-y-3">
            <div className="relative flex flex-col w-full h-[174px] border-2 border-dashed border-[#B4B4B4] rounded-[15px] ">
              <div className="flex items-center gap-2">
                <Image
                  src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/play.svg"
                  alt="home"
                  width={16}
                  height={16}
                />
              </div>
              <h3 className="text-[12px] font-semibold  p-3 text-primary ">
                이렇게 놀이 했어요
              </h3>
              <button className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full bg-[#F0F0F0] hover:bg-gray-300 text-gray-600">
                <IoClose
                  className="bg-white border border-gray-200 rounded-full"
                  size={20}
                />
              </button>
            </div>
            <div className="flex flex-row w-full h-[174px] gap-x-3">
              <div className="relative flex flex-col w-full h-full border-2 border-dashed border-[#B4B4B4] rounded-[15px] ">
                <h3 className="text-[12px] font-semibold p-3 text-primary flex items-center gap-1">
                  <div className="flex items-center gap-2">
                    <Image
                      src="https://icecreamkids.s3.ap-northeast-2.amazonaws.com/bulb.svg"
                      alt="home"
                      width={16}
                      height={16}
                    />
                  </div>
                  교사지원
                </h3>
                <button className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full bg-[#F0F0F0] hover:bg-gray-300 text-gray-600">
                  <IoClose
                    className="bg-white border border-gray-200 rounded-full"
                    size={20}
                  />
                </button>
              </div>
              <div className="relative flex flex-col w-full h-full border-2 border-dashed border-[#B4B4B4] rounded-[15px] ">
                <h3 className="text-[12px] font-semibold p-3 text-primary flex items-center gap-1">
                  {/* 다양한 방법으로 이미지 테스트 */}
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
                <button className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full bg-[#F0F0F0] hover:bg-gray-300 text-gray-600">
                  <IoClose
                    className="bg-white border border-gray-200 rounded-full"
                    size={20}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportA;
