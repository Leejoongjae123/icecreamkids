import cx from 'clsx';
import React, { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
// import useUserStore from '@/hooks/store/useUserStore';
// import { useGetWidgetFolders } from '@/service/file/fileStore';
import { IMenuList } from '@/const/menu/types';
import { GNB_MENU_LIST } from '@/const/menu';
import useHomeWidgetList from '@//hooks/useHomeWidgetList';

export default function AppGnb({ isActive, handleMenuClick }: { isActive: boolean; handleMenuClick: () => void }) {
  const [gnbMenuList, setGnBMenuList] = useState<IMenuList>(GNB_MENU_LIST);
  const { homeWidgetList } = useHomeWidgetList();
  const pathname = usePathname();

  const activeLinkClass = (menuPath: string, subPath: string) => {
    if (pathname.includes(menuPath)) {
      if (menuPath === '/work-board' && subPath.includes('/playing-plan')) {
        return pathname.includes(`${menuPath}/playing-plan`);
      }
      return pathname.includes(`${menuPath}${subPath}`);
    }
    return false;
  };

  const materialBoardSubMenuLength = useMemo(() => {
    return gnbMenuList?.[1]?.subMenu?.length || 0;
  }, [gnbMenuList]);

  useEffect(() => {
    setGnBMenuList((prevState) => {
      return prevState.map((menu, index) => {
        if (index === 1) {
          // 자료 보드
          const materialBoardSubMenu =
            homeWidgetList?.map((item) => {
              return {
                id: item.id,
                name: item.name,
                path: `/docs/${item.id}`,
              };
            }) || [];
          return { ...menu, ...{ subMenu: [...materialBoardSubMenu, ...(GNB_MENU_LIST[1].subMenu || [])] } };
        }
        return menu;
      });
    });
  }, [homeWidgetList]);

  return (
    <div role="presentation" className={cx('util-menu', `${isActive ? 'active' : ''}`)}>
      <h3 className="screen_out">kinderboard 전체 메뉴</h3>
      <button className="btn-util btn-menu" onClick={handleMenuClick}>
        <span className="ico-comm ico-gnb-menu">전체 메뉴 펼치기 / 접기</span>
      </button>
      <div className="layer-menu layer-mune-indented">
        <div className="sub-layer-menu">
          <ul className="list-menu">
            {gnbMenuList.map((menu) => (
              <li key={menu.id} className={cx(materialBoardSubMenuLength > 8 && 'list-submenu-small')}>
                <Link prefetch={false} href={menu.path} className="link-menu">
                  {menu.name}
                </Link>
                {menu.subMenu && (
                  <ul className="list-submenu">
                    {menu.subMenu.map((sub) => (
                      <li key={sub.id}>
                        <Link
                          prefetch={false}
                          href={sub.name === '내드라이브' ? sub.path : menu.path + sub.path}
                          className={cx('link-submenu', activeLinkClass(menu.path, sub.path) && 'active')}
                        >
                          {/* 현재 Path 에 해당하는 메뉴인 경우 active 클래스 추가 */}
                          <span className="txt-link">{sub.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
