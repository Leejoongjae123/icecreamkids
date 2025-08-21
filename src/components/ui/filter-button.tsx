"use client";
import * as React from "react";

interface FilterButtonProps {
  hasValidContent?: boolean;
  hasPlayRecordResult?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

function FilterButton({ 
  hasValidContent = false, 
  hasPlayRecordResult = false,
  onClick,
  disabled = false
}: FilterButtonProps) {
  return (
    <div
      className={`flex relative flex-col gap-1 justify-center items-center w-32 h-32 rounded-xl max-md:h-[120px] max-md:w-[120px] max-sm:gap-0.5 max-sm:h-[100px] max-sm:w-[100px] cursor-pointer ${
        hasValidContent && !disabled
          ? "bg-primary hover:bg-primary/80" 
          : "bg-gray-400 hover:bg-gray-400/80 cursor-not-allowed"
      }`}
      onClick={() => {
        if (hasValidContent && !disabled && onClick) {
          onClick();
        }
      }}
    >
      <div>
        <div
          dangerouslySetInnerHTML={{
            __html:
              "<svg id=\"I700:1009;2242:264016\" layer-name=\"lines-sparkle\" width=\"40\" height=\"40\" viewBox=\"0 0 40 40\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"sparkle-icon\" style=\"width: 40px; height: 40px; flex-shrink: 0; aspect-ratio: 1/1; position: relative\"> <g clip-path=\"url(#clip0_700_1011)\"> <path d=\"M33.3517 33.4106C34.268 34.747 33.852 36.5808 32.4487 37.391V37.391C31.0453 38.2012 29.2493 37.6446 28.55 36.1828L22.1143 22.7283C21.7484 21.9635 22.0328 21.0458 22.767 20.6219V20.6219C23.5013 20.198 24.4382 20.4105 24.9176 21.1098L33.3517 33.4106Z\" fill=\"url(#paint0_linear_700_1011)\"></path> <path d=\"M12.1345 5.68596C12.2467 4.29037 13.7213 3.43905 14.986 4.03964L18.256 5.59249C18.6678 5.78804 19.134 5.83705 19.5775 5.73138L23.0988 4.89234C24.4608 4.56781 25.7261 5.70711 25.5457 7.09554L25.0794 10.6853C25.0206 11.1374 25.1181 11.596 25.3556 11.9851L27.2418 15.0748C27.9713 16.2698 27.2788 17.8253 25.9025 18.0828L22.3444 18.7485C21.8963 18.8324 21.4903 19.0668 21.1936 19.4129L18.8379 22.1615C17.9268 23.2246 16.2335 23.0466 15.5633 21.8173L13.8306 18.639C13.6124 18.2388 13.264 17.9251 12.8431 17.7499L9.50113 16.3589C8.20853 15.8209 7.85453 14.1555 8.81656 13.1382L11.3039 10.5082C11.6171 10.1769 11.8078 9.74865 11.8443 9.29425L12.1345 5.68596Z\" fill=\"url(#paint1_linear_700_1011)\"></path> <path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M34.378 11.1527C35.1084 11.4403 35.1084 12.471 34.378 12.7586L33.223 13.2136L32.7681 14.3657C32.4799 15.0943 31.4462 15.0943 31.1581 14.3657L30.7031 13.213L29.5481 12.7586C28.8178 12.4716 28.8178 11.4403 29.5481 11.1527L30.7031 10.6983L31.1581 9.54623C31.4462 8.81707 32.4799 8.81707 32.7681 9.54623L33.223 10.6983L34.378 11.1527Z\" fill=\"url(#paint2_linear_700_1011)\"></path> <path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M6.37804 6.15271C7.10836 6.44029 7.10836 7.47103 6.37804 7.75861L5.22305 8.21361L4.76805 9.36568C4.47989 10.0943 3.44623 10.0943 3.15807 9.36568L2.70308 8.21302L1.54809 7.75861C0.817763 7.47161 0.817763 6.44029 1.54809 6.15271L2.70308 5.6983L3.15807 4.54623C3.44623 3.81707 4.47989 3.81707 4.76805 4.54623L5.22305 5.6983L6.37804 6.15271Z\" fill=\"url(#paint3_linear_700_1011)\"></path> </g> <defs> <linearGradient id=\"paint0_linear_700_1011\" x1=\"33.0872\" y1=\"38.0702\" x2=\"28.8481\" y2=\"14.8855\" gradientUnits=\"userSpaceOnUse\"> <stop offset=\"0.66\" stop-color=\"white\"></stop> <stop offset=\"1\" stop-color=\"#FFC183\"></stop> </linearGradient> <linearGradient id=\"paint1_linear_700_1011\" x1=\"11.1107\" y1=\"2.26653\" x2=\"23.0715\" y2=\"29.539\" gradientUnits=\"userSpaceOnUse\"> <stop offset=\"0.66\" stop-color=\"white\"></stop> <stop offset=\"1\" stop-color=\"#FFC183\"></stop> </linearGradient> <linearGradient id=\"paint2_linear_700_1011\" x1=\"34.5\" y1=\"12\" x2=\"20.9258\" y2=\"15.9986\" gradientUnits=\"userSpaceOnUse\"> <stop stop-color=\"#FFCF83\"></stop> <stop offset=\"0.34\" stop-color=\"white\"></stop> </linearGradient> <linearGradient id=\"paint3_linear_700_1011\" x1=\"6.5\" y1=\"6.5\" x2=\"-7.07422\" y2=\"10.9986\" gradientUnits=\"userSpaceOnUse\"> <stop stop-color=\"#FFCF83\"></stop> <stop offset=\"0.34\" stop-color=\"white\"></stop> </linearGradient> <clipPath id=\"clip0_700_1011\"> <rect width=\"40\" height=\"40\" fill=\"white\"></rect> </clipPath> </defs> </svg>",
          }}
        />
      </div>
      <div
        className={`relative text-base font-medium tracking-tight leading-6 text-center max-md:text-base max-md:leading-6 max-sm:text-sm max-sm:tracking-tight max-sm:leading-5 ${
          hasValidContent && !disabled ? "text-white" : "text-gray-200"
        }`}
      >
        <span className={`text-base max-md:text-base max-sm:text-sm ${
          hasValidContent && !disabled ? "text-white" : "text-gray-200"
        }`}>
          {hasPlayRecordResult ? "놀이기록\n재생성" : "놀이기록\n생성하기"}
        </span>
      </div>
    </div>
  );
}

export default FilterButton;
