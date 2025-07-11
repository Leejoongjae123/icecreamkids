"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import KinderboardLogo from "./Logo/KinderboardLogo";
import BetaBadge from "./Logo/BetaBadge";
import NotificationIcon from "./Logo/NotificationIcon";
import NotificationDot from "./Logo/NotificationDot";
import UserIcon from "./Logo/UserIcon";
import MenuIcon from "./Logo/MenuIcon";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Link from "next/link";
// Icon components

type MenuType = "service" | "work" | "material" | "my" | null;

interface AppHeaderProps {
  scrollDirection?: string;
  clearHideTimeout?: () => Promise<void>;
  setHideTimeout?: () => Promise<void>;
}

function Navbar({
  scrollDirection,
  clearHideTimeout,
  setHideTimeout,
}: AppHeaderProps) {
  const [openMenu, setOpenMenu] = useState<MenuType>(null);
  const router = useRouter();

  const menuItems = [
    {
      id: "service",
      title: "서비스 소개",
      items: [
        { title: "회사 소개", href: "/company" },
        { title: "기능 소개", href: "/features" },
        { title: "요금 안내", href: "/pricing" },
        { title: "고객 지원", href: "/support" },
      ],
    },
    {
      id: "work",
      title: "업무 보드",
      items: [
        { title: "놀이계획", href: "/work-board/plan" },
        { title: "놀이기록", href: "/work-board/report" },
        { title: "놀이보고서", href: "/work-board/report/list" },
        { title: "놀이보고서 작성", href: "/work-board/report/create" },
      ],
    },
    {
      id: "material",
      title: "자료 보드",
      items: [
        { title: "교육 자료", href: "/material/education" },
        { title: "템플릿", href: "/material/template" },
        { title: "미디어 라이브러리", href: "/material/media" },
        { title: "문서 관리", href: "/material/document" },
      ],
    },
    {
      id: "my",
      title: "마이 보드",
      items: [
        { title: "내 정보", href: "/my/profile" },
        { title: "내 활동", href: "/my/activity" },
        { title: "즐겨찾기", href: "/my/favorites" },
        { title: "설정", href: "/my/settings" },
      ],
    },
  ];

  const handleMenuClick = (menuId: MenuType) => {
    setOpenMenu(openMenu === menuId ? null : menuId);
  };

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
            {menuItems.map((menu) => (
              <Popover 
                key={menu.id} 
                open={openMenu === menu.id}
                onOpenChange={(open) => setOpenMenu(open ? menu.id as MenuType : null)}
              >
                <PopoverTrigger asChild>
                  <div
                    className={`text-base lg:text-sm font-normal leading-6 h-9 cursor-pointer transition-colors flex items-center ${
                      openMenu === menu.id 
                        ? "text-[#FAB83D]" 
                        : "text-[#444] hover:text-gray-600"
                    }`}
                    style={{
                      fontFamily: "Noto Sans KR, sans-serif",
                      letterSpacing: "-0.5px",
                    }}
                  >
                    {menu.title}
                  </div>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-[140px] p-2" 
                  align="start"
                  side="bottom"
                  sideOffset={8}
                >
                  <div className="grid gap-1">
                    {menu.items.map((item) => (
                      <Link
                        key={item.title}
                        className="flex items-center w-full p-2 text-sm rounded-md hover:bg-gray-100 transition-colors text-left"
                        href={item.href}
                      >
                        <span className="text-[#444]" style={{ fontFamily: "Noto Sans KR, sans-serif" }}>
                          {item.title}
                        </span>
                      </Link>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            ))}
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
