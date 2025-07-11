import React from "react";

export default function TypeB() {
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
            <div className="flex overflow-hidden gap-1 px-2 py-2.5 bg-gray-50 rounded-lg">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/9c832fa84362326a4008f38ba63a9196f4de3f2f?placeholderIfAbsent=true&apiKey=304aa4871c104446b0f8164e96d049f4"
                className="object-contain shrink-0 aspect-square w-[15px]"
              />
              <div>인쇄</div>
            </div>
            <img
              src="https://cdn.builder.io/api/v1/image/assets/TEMP/05e4faa4bdb620ecf9ebc98589682e07bd60f0e6?placeholderIfAbsent=true&apiKey=304aa4871c104446b0f8164e96d049f4"
              className="object-contain shrink-0 rounded-lg aspect-[1.8] w-[61px]"
            />
            <div className="flex overflow-hidden gap-1 p-2 bg-gray-50 rounded-lg">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/eda64a0b600b5259f4e23eb5356ce027f32e3e94?placeholderIfAbsent=true&apiKey=304aa4871c104446b0f8164e96d049f4"
                className="object-contain shrink-0 aspect-square w-[18px]"
              />
              <div className="my-auto">다운로드</div>
            </div>
            <div className="flex overflow-hidden flex-col justify-center px-3.5 py-2.5 font-semibold text-white bg-amber-400 rounded-lg">
              <div>저장</div>
            </div>
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
          <div className="flex-1 flex-row w-full">

          </div>
          <div className="flex flex-col w-full gap-y-3">
            <div className="flex flex-col w-full h-[174px] border-2 border-dashed border-[#B4B4B4] rounded-[15px] "></div>
            <div className="flex flex-row w-full h-[174px] gap-x-3">
              <div className="flex flex-col w-full h-full border-2 border-dashed border-[#B4B4B4] rounded-[15px] "></div>
              <div className="flex flex-col w-full h-full border-2 border-dashed border-[#B4B4B4] rounded-[15px] "></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}