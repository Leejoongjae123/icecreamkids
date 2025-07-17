"use client";
import * as React from "react";

interface AddButtonProps {
  onClick?: () => void;
}

function AddButton({ onClick }: AddButtonProps) {
  return (
    <div className="flex items-center justify-center h-full ">
      <div
        onClick={onClick}
        className="w-8 h-8 bg-white rounded-full border border-gray-100 transition-shadow duration-200 flex items-center justify-center hover:bg-gray-50 cursor-pointer"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-gray-600"
        >
          <path
            d="M8 3.5V12.5M3.5 8H12.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

export default AddButton; 