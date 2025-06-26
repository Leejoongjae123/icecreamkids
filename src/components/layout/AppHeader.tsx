'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import cx from 'clsx';
import useUserStore from '@/hooks/store/useUserStore';
import { MENU_LIST, PROFILE_MENU_LIST } from '@/const/menu';
import Link from 'next/link';
import { Avatar, Button } from '@/components/common';
import { usePathname, useRouter } from 'next/navigation';
import AppLogo from '@/components/layout/AppLogo';
import AppGnb from '@/components/layout/AppGnb';
import { useAuth } from '@/hooks/useAuth';
import useClassManageStore from '@/hooks/store/useClassManageStore';
import { prefix } from '@/const';
import { useClickOutside } from '@/hooks/useClickOutside';

type AppHeaderProps = {
  scrollDirection?: string | undefined;
  clearHideTimeout?: () => void;
  setHideTimeout?: () => void;
};

export default function AppHeader({ scrollDirection = '', clearHideTimeout, setHideTimeout }: AppHeaderProps) {
  const { logout } = useAuth();
  const { userInfo } = useUserStore();
  const [isActive, setIsActive] = useState('');
  const [isHover, setIsHover] = useState<boolean>(false);
  const { openModal } = useClassManageStore();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useClickOutside(userMenuRef, () => {
    setIsActive((prev) => (prev === 'user' ? '' : prev));
  });

  const router = useRouter();
  const handleRoute = (href: string) => {
    router.push(href);
  };

  // 레이어 open
  // const handleAlarmClick = () => {
  //   if (isActive !== 'alarm') setIsActive('alarm');
  //   else setIsActive('');
  // };

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling up to document
    if (isActive !== 'user') setIsActive('user');
    else setIsActive('');
  };
  const handleMenuClick = () => {
    if (!['menuButton', 'menu'].includes(isActive)) setIsActive('menuButton');
    else setIsActive('');
  };

  // 우리반관리 레이어 열림
  const handleOpenMyClassModal = () => {
    openModal();
    setIsActive('');
  };
  const handleLogout = async () => {
    await logout();
    handleRoute(prefix.login);
  };

  // 페이지 이동
  const handlePageMove = (menuPath: string) => {
    const isAuth = menuPath.startsWith('/material-board') || menuPath.startsWith('/my-board');
    if (!userInfo && isAuth) {
      handleRoute('/login');
    }
    handleRoute(menuPath);
  };

  const menuListItems = useMemo(() => {
    return MENU_LIST.map((munu) => {
      const isAuth = munu.path.startsWith('/material-board') || munu.path.startsWith('/my-board');
      if (!userInfo && isAuth) return { ...munu, path: '/login' };
      return munu;
    });
  }, [userInfo]);

  const pathName = usePathname();
  const currentPath = `/${pathName.split('/')[1]}`;

  useEffect(() => {
    setIsActive(''); // 경로 이동시 GNB 닫기
  }, [pathName]);

  // 마운트 직후 첫 onMouseEnter 무시용 플래그
  const ignoreFirstEnter = useRef(true);

  useEffect(() => {
    ignoreFirstEnter.current = true;
    const timer = window.setTimeout(() => {
      ignoreFirstEnter.current = false;
    }, 0);
    return () => clearTimeout(timer);
  }, []); // Header 가 재마운트될 때마다 다시 실행

  const handleNavOnMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation(); // Prevent event from bubbling up to document
    if (ignoreFirstEnter.current) {
      ignoreFirstEnter.current = false; // 마운트 직후의 첫 이벤트일 땐 무조건 무시
      return;
    }

    if (isActive !== 'menuButton') setIsActive('menu');
  };

  const handleNavOnMouseLeave = () => {
    if (userInfo && isActive === 'menu') setIsActive('');
    setIsHover(false);
    setHideTimeout?.();
  };

  const handleOnMouseOver = () => {
    setIsHover(true);
    clearHideTimeout?.();
  };

  useEffect(() => {
    if (scrollDirection === 'down') {
      if (isActive) setIsActive('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollDirection]);

  return (
    <header
      className={cx('doc-header', isHover && 'hover', isActive && 'isActive')}
      onMouseEnter={handleOnMouseOver}
      onMouseLeave={handleNavOnMouseLeave}
    >
      <div className="inner-header">
        <AppLogo />
        <nav id="gnbContent" className="doc-gnb" onMouseEnter={handleNavOnMouseEnter}>
          <h2 className="screen_out">kinderboard 메인 메뉴</h2>
          <ul className="list-gnb">
            {menuListItems.map((menu) => {
              const rootPath = menu.path.startsWith('/my-board') ? '/my-board' : menu.path;
              const isCurrentMenu = currentPath.startsWith(rootPath);
              return (
                <li key={menu.id}>
                  {/* <button onClick={() => handlePageMove(menu.path)} className={cx('link-gnb', {
                      active: isCurrentMenu,
                    })}>
                    {menu.name}
                  </button> */}
                  <Link
                    href={menu.path}
                    prefetch={false}
                    className={cx('link-gnb', {
                      active: isCurrentMenu,
                    })}
                  >
                    {menu.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="search-header">
          <h3 className="screen_out">검색</h3>
          {/* TODO: markup 헤더 검색 영역 */}
        </div>
        {userInfo ? (
          <div className="util-header">
            {/* <div role="presentation" className={cx('util-alarm', `${isActive === 'alarm' ? 'active' : ''}`)}>
              <h3 className="screen_out">알림 정보</h3>
              <button className="btn-util btn-alarm" onClick={handleAlarmClick}>
                <span className="ico-comm ico-gnb-alarm">알림 레이어 펼치기 / 접기</span>
              </button>
              <div className="layer-alarm">
                <div>tab area</div>
                <div className="tab-panel">list / empty case</div>
              </div>
            </div> */}
            <div
              ref={userMenuRef}
              role="presentation"
              className={cx('util-user', `${isActive === 'user' ? 'active' : ''}`)}
            >
              <h3 className="screen_out">사용자 정보</h3>
              <button className="btn-util btn-user" onClick={handleUserClick}>
                <Avatar icon src={userInfo?.photoUrl} classNames={cx({ 'ico-comm ico-gnb-user': !userInfo?.photoUrl })}>
                  <span className="screen_out">마이 메뉴 펼치기 / 접기</span>
                </Avatar>
              </button>
              <div className="layer-user">
                <div className="profile-user">
                  <div className="thumb-profile">
                    <Avatar
                      icon
                      src={userInfo?.photoUrl}
                      classNames={cx({ 'ico-comm ico-gnb-user': !userInfo?.photoUrl })}
                    />
                  </div>
                  <div className="info-profile">
                    <strong className="name-info" title={userInfo.name}>
                      {userInfo.name}
                    </strong>
                    {userInfo.email && (
                      <p className="mail-info">
                        {/* <span className="account-mail">{userInfo.email?.split('@')[0]}</span> */}
                        <span className="domain-mail" title={userInfo.email}>
                          {userInfo.email}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
                <ul className="menu-user">
                  {PROFILE_MENU_LIST.map((item) => (
                    <li key={item.id}>
                      {item.name === '우리 반 관리' ? (
                        <button type="button" onClick={handleOpenMyClassModal} className="link-menu">
                          {item.name}
                        </button>
                      ) : (
                        <a href={item.path} className="link-menu">
                          {item.name}
                        </a>
                      )}
                    </li>
                  ))}
                  <li>
                    <a
                      href="/"
                      className="link-menu link-logout"
                      onClick={(e) => {
                        e.preventDefault();
                        handleLogout();
                      }}
                    >
                      로그아웃
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            {/*<AppGnb handleMenuClick={handleMenuClick} isActive={['menuButton', 'menu'].includes(isActive)} />*/}
          </div>
        ) : (
          <div className="util-header">
            <Button size="medium" color="black" onClick={() => handleRoute(prefix.signup)}>
              회원가입
            </Button>
            <Button size="medium" color="line" onClick={() => handleRoute(prefix.login)}>
              로그인
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
