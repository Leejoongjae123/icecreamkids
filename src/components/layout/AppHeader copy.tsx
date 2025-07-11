"use client";

import React from "react";
import KinderboardLogo from "./Logo/KinderboardLogo";
import BetaBadge from "./Logo/BetaBadge";
import NotificationIcon from "./Logo/NotificationIcon";
import NotificationDot from "./Logo/NotificationDot";
import UserIcon from "./Logo/UserIcon";
import MenuIcon from "./Logo/MenuIcon";
// Icon components



function Navbar() {
  return (
    <div
      className="w-full h-20 relative bg-white"
      style={{ backdropFilter: "blur(10px)" }}
    >
      <div className="flex max-w-[1440px] justify-between items-center mx-auto h-20 ">
        {/* Logo and Menu */}
        <div className="flex h-20 items-center gap-20 xl:gap-20 lg:gap-10 md:gap-8 sm:gap-5">
          {/* Logo */}
          <div className="flex h-24 py-6 items-center gap-2.5">
            <div className="flex items-center gap-1">
              <div className="scale-90 sm:scale-100">
                <KinderboardLogo />
              </div>
              <BetaBadge />
            </div>
          </div>

          {/* Menu - Hidden on mobile (sm and below) */}
          <div className="hidden md:flex items-center gap-16 xl:gap-16 lg:gap-8">
            <div
              className="text-[#444] text-base lg:text-sm font-normal leading-6 h-9 cursor-pointer hover:text-gray-600 transition-colors flex items-center"
              style={{
                fontFamily: "Noto Sans KR, sans-serif",
                letterSpacing: "-0.5px",
              }}
            >
              업무 보드
            </div>
            <div
              className="text-[#444] text-base lg:text-sm font-normal leading-6 h-9 cursor-pointer hover:text-gray-600 transition-colors flex items-center"
              style={{
                fontFamily: "Noto Sans KR, sans-serif",
                letterSpacing: "-0.5px",
              }}
            >
              자료 보드
            </div>
            <div
              className="text-[#444] text-base lg:text-sm font-normal leading-6 h-9 cursor-pointer hover:text-gray-600 transition-colors flex items-center"
              style={{
                fontFamily: "Noto Sans KR, sans-serif",
                letterSpacing: "-0.5px",
              }}
            >
              마이 보드
            </div>
          </div>
        </div>

        {/* Utilities */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Notification Button */}
          <div className="w-12 h-12 relative cursor-pointer hover:bg-gray-50 rounded-full border border-gray-200 bg-white transition-colors flex items-center justify-center">
            <div className="relative">
              <NotificationIcon />
              <NotificationDot />
            </div>
          </div>

          {/* User Button */}
          <div className="w-12 h-12 cursor-pointer hover:bg-gray-50 rounded-full border border-gray-200 bg-white transition-colors flex items-center justify-center">
            <UserIcon />
          </div>

          {/* Menu Button */}
          <div className="w-12 h-12 cursor-pointer hover:bg-gray-50 rounded-full bg-white transition-colors flex items-center justify-center">
            <MenuIcon />
          </div>
        </div>
      </div>

      {/* Bottom border */}
      <div className="w-full h-px absolute bottom-0 left-0 bg-gray-200" />
    </div>
  );
}

export default Navbar;
