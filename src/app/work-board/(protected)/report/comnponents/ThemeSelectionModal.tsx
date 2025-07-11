"use client";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ThemeSelectionModalProps {
  children: React.ReactNode;
}

function ThemeSelectionModal({ children }: ThemeSelectionModalProps) {
  const [activeTab, setActiveTab] = React.useState("테마선택");
  const [selectedCategory, setSelectedCategory] = React.useState("카테고리1");
  const [selectedImage, setSelectedImage] = React.useState<number | null>(null);
  const [selectedBgCategory, setSelectedBgCategory] = React.useState("카테고리1");
  const [selectedBgImage, setSelectedBgImage] = React.useState<number | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const bgScrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [scrollLeft, setScrollLeft] = React.useState(0);

  const handleMouseDown = (e: React.MouseEvent, ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current) return;
    setIsDragging(true);
    setStartX(e.pageX - ref.current.offsetLeft);
    setScrollLeft(ref.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent, ref: React.RefObject<HTMLDivElement>) => {
    if (!isDragging || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX) * 2;
    ref.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const categories = [
    "카테고리1",
    "카테고리2",
    "카테고리3",
    "카테고리4",
    "카테고리5",
    "카테고리6",
  ];

  const bgCategories = [
    "카테고리1",
    "카테고리2",
    "카테고리3",
    "카테고리4",
    "카테고리5",
    "카테고리6",
  ];

  // 3x4 그리드를 위한 12개 이미지 배열
  const imageItems = Array.from({ length: 12 }, (_, index) => ({
    id: index,
    src: "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/sample.png",
    alt: `테마 이미지 ${index + 1}`,
  }));

  // 배경 이미지 배열
  const bgImageItems = Array.from({ length: 12 }, (_, index) => ({
    id: index,
    src: "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/sample.png",
    alt: `배경 이미지 ${index + 1}`,
  }));

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[541px] p-0 border-none bg-transparent shadow-none">
        <div className="flex overflow-hidden flex-col px-10 py-10 leading-none bg-white rounded-3xl max-w-[541px] max-md:px-5">
          <div className="flex gap-5 justify-between items-start w-full max-md:max-w-full mb-10">
            <div className="text-xl font-semibold tracking-tight text-gray-700">
              테마 선택
            </div>
            
            <DialogClose asChild>
              <button className="object-contain shrink-0 w-6 aspect-square rounded-[50px] hover:bg-gray-100 transition-colors">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/ec605318f986481376fc593472df4248aadb01e8?placeholderIfAbsent=true&apiKey=304aa4871c104446b0f8164e96d049f4"
                  className="object-contain shrink-0 w-6 aspect-square rounded-[50px]"
                  alt="닫기"
                />
              </button>
            </DialogClose>
          </div>
          
          {/* 커스텀 탭바 */}
          <div className="w-full flex flex-col gap-y-5">
            {/* 탭 헤더 */}
            <div className="relative border-b border-gray-200">
              <div className="flex w-[200px]">
                <div 
                  onClick={() => setActiveTab("테마선택")}
                  className={`flex-1 text-base font-medium tracking-tight cursor-pointer pb-3 text-center transition-colors ${
                    activeTab === "테마선택" 
                      ? "text-gray-700" 
                      : "text-zinc-400 hover:text-gray-600"
                  }`}
                >
                  테마선택
                </div>
                <div 
                  onClick={() => setActiveTab("배경")}
                  className={`flex-1 text-base font-medium tracking-tight cursor-pointer pb-3 text-center transition-colors ${
                    activeTab === "배경" 
                      ? "text-gray-700" 
                      : "text-zinc-400 hover:text-gray-600"
                  }`}
                >
                  배경
                </div>
              </div>
              {/* Active 표시 선 */}
              <div 
                className={`absolute bottom-0 h-[2px] bg-gray-700 transition-transform duration-200 ${
                  activeTab === "테마선택" ? "w-[100px] transform translate-x-0" : "w-[100px] transform translate-x-[100px]"
                }`}
              />
            </div>
            
            {/* 탭 내용 */}
            {activeTab === "테마선택" && (
              <div className="space-y-0">
                <div 
                  ref={scrollContainerRef}
                  className="flex gap-2.5 text-base font-medium tracking-tight text-gray-700 whitespace-nowrap max-md:max-w-full overflow-x-auto flex-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] mb-5"
                  style={{
                    WebkitOverflowScrolling: 'touch',
                    cursor: isDragging ? 'grabbing' : 'grab'
                  }}
                  onMouseDown={(e) => handleMouseDown(e, scrollContainerRef)}
                  onMouseMove={(e) => handleMouseMove(e, scrollContainerRef)}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                >
                  {categories.map((category, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        if (!isDragging) {
                          setSelectedCategory(category);
                        }
                      }}
                      className={`flex overflow-hidden flex-col justify-center w-[91px] h-[42px] rounded-[50px] transition-colors flex-shrink-0 select-none ${
                        selectedCategory === category
                          ? "text-white bg-primary"
                          : "border border-solid border-zinc-100 hover:bg-gray-50"
                      }`}
                      style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
                    >
                      <div>{category}</div>
                    </button>
                  ))}
                </div>
                
                {/* 이미지 그리드 3x4 - 화면 50vh 높이까지만 보여주고 스크롤 가능 */}
                <div className="grid grid-cols-3 gap-3 w-full max-h-[50vh] overflow-y-auto overflow-x-hidden">
                  {imageItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedImage(item.id)}
                      className={`relative h-[196px] rounded-lg overflow-hidden transition-all duration-200 hover:scale-105 ${
                        selectedImage === item.id
                          ? "ring-2 ring-primary ring-offset-2"
                          : "ring-1 ring-primary hover:ring-primary"
                      }`}
                    >
                      <img
                        src={item.src}
                        alt={item.alt}
                        className="w-full h-full object-cover"
                      />
                      {selectedImage === item.id && (
                        <div className="absolute inset-0 bg-primary bg-opacity-20 flex items-center justify-center">
                          
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === "배경" && (
              <div className="space-y-0">
                <div 
                  ref={bgScrollContainerRef}
                  className="flex gap-2.5 text-base font-medium tracking-tight text-gray-700 whitespace-nowrap max-md:max-w-full overflow-x-auto flex-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] mb-5"
                  style={{
                    WebkitOverflowScrolling: 'touch',
                    cursor: isDragging ? 'grabbing' : 'grab'
                  }}
                  onMouseDown={(e) => handleMouseDown(e, bgScrollContainerRef)}
                  onMouseMove={(e) => handleMouseMove(e, bgScrollContainerRef)}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                >
                  {bgCategories.map((category, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        if (!isDragging) {
                          setSelectedBgCategory(category);
                        }
                      }}
                      className={`flex overflow-hidden flex-col justify-center w-[91px] h-[42px] rounded-[50px] transition-colors flex-shrink-0 select-none ${
                        selectedBgCategory === category
                          ? "text-white bg-primary"
                          : "border border-solid border-zinc-100 hover:bg-gray-50"
                      }`}
                      style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
                    >
                      <div>{category}</div>
                    </button>
                  ))}
                </div>
                
                {/* 배경 이미지 그리드 3x4 - 화면 50vh 높이까지만 보여주고 스크롤 가능 */}
                <div className="grid grid-cols-3 gap-3 w-full max-h-[50vh] overflow-y-auto overflow-x-hidden">
                  {bgImageItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedBgImage(item.id)}
                      className={`relative h-[196px] rounded-lg overflow-hidden transition-all duration-200 hover:scale-105 ${
                        selectedBgImage === item.id
                          ? "ring-2 ring-primary ring-offset-2"
                          : "ring-1 ring-primary hover:ring-primary"
                      }`}
                    >
                      <img
                        src={item.src}
                        alt={item.alt}
                        className="w-full h-full object-cover"
                      />
                      
                      {selectedBgImage === item.id && (
                        <div className="absolute inset-0 bg-primary bg-opacity-20 flex items-center justify-center">
                          
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2.5 self-center mt-6 max-w-full text-base font-medium tracking-tight whitespace-nowrap">
            <DialogClose asChild>
              <button className="flex items-center justify-center w-[100px] h-[42px] text-gray-700 bg-gray-50 rounded-md border border-solid border-zinc-100 hover:bg-gray-100 transition-colors">
                <div>닫기</div>
              </button>
            </DialogClose>
            <button className="flex items-center justify-center w-[100px] h-[42px] text-white bg-amber-400 rounded-md hover:bg-amber-500 transition-colors">
              <div>적용</div>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ThemeSelectionModal;
