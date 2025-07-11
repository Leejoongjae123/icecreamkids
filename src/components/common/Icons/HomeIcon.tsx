import React from 'react';

interface HomeIconProps {
  width?: number;
  height?: number;
  className?: string;
  color?: string;
}

const HomeIcon: React.FC<HomeIconProps> = ({ 
  width = 16, 
  height = 16, 
  className = "", 
  color = "#FAB83D" 
}) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 18 18" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        d="M3.16667 9.00024H1.5L9 1.50024L16.5 9.00024H14.8333M3.16667 9.00024V14.8336C3.16667 15.2756 3.34226 15.6995 3.65482 16.0121C3.96738 16.3246 4.39131 16.5002 4.83333 16.5002H13.1667C13.6087 16.5002 14.0326 16.3246 14.3452 16.0121C14.6577 15.6995 14.8333 15.2756 14.8333 14.8336V9.00024" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M6.5 16.5002V11.5002C6.5 11.0581 6.6756 10.6342 6.98816 10.3217C7.30072 10.0091 7.72464 9.8335 8.16667 9.8335H9.83333C10.2754 9.8335 10.6993 10.0091 11.0118 10.3217C11.3244 10.6342 11.5 11.0581 11.5 11.5002V16.5002" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default HomeIcon; 