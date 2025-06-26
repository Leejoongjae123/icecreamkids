import React, { forwardRef, useEffect, useRef, useState, useMemo } from 'react';
import cx from 'clsx';
import { IDropDownMenu } from '@/components/common/Thumbnail/_components/DropDownMenu/types';

/*
 * list 구성 요소
 * { key: 'share', text: '공유 관리' },
 * { key: 'tag', text: '태그 관리' },
 * { key: 'recommend', text: '다시 추천받지 않기' },
 * { key: 'name', text: '이름변경' },
 * { key: 'delete', text: '삭제' },
 * { key: 'move', text: '이동' },
 * { key: 'copy', text: '복사' },
 * { key: 'save', text: '저장' },
 * */
export const DropDownMenu = forwardRef<HTMLDivElement, IDropDownMenu>(
  (
    { show = false, save = false, text = false, list, direction = 'right', top, left, onDropDown }: IDropDownMenu,
    ref,
  ) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [adjustedDirection, setAdjustedDirection] = useState<'left' | 'right'>(direction);
    const [isVisible, setIsVisible] = useState(false); // 메뉴의 표시 상태 관리
    const [menuDivWoidth, setDivWoidth] = useState<number>(0); // 메뉴의 표시 상태 관리

    useEffect(() => {
      if (show && menuRef.current) {
        const menu = menuRef.current;
        const rect = menu.getBoundingClientRect();
        const windowWidth = window.innerWidth;

        // 메뉴 방향을 계산하고 화면을 벗어나는 경우 반대로 설정
        let newDirection = direction;

        if (direction === 'right' && rect.right > windowWidth) {
          newDirection = 'left';
        } else if (direction === 'left' && rect.left < 0) {
          newDirection = 'right';
        }

        // 방향이 변경되면 메뉴의 방향을 업데이트하고 표시 상태를 true로 설정
        setAdjustedDirection(newDirection);
        setIsVisible(true); // 방향 결정 후 메뉴 표시
        setDivWoidth(menuRef.current.offsetWidth + 1);
      }
    }, [show, direction]);
    return (
      <div
        ref={menuRef} // menuRef를 div에 직접 연결
        className={cx(
          'menu-layer',
          save && 'type-save',
          show && 'show',
          adjustedDirection === 'left' && 'type-left',
          adjustedDirection === 'right' && 'type-right',
        )}
        style={{
          ...(top && left && adjustedDirection === 'right' && { top: `${top}px`, left: `${left}px`, zIndex: 1001 }),
          ...(top &&
            left &&
            adjustedDirection === 'left' && {
              top: `${top}px`,
              left: `${left - menuDivWoidth - 32}px`,
              minWidth: `${menuDivWoidth}px`,
              zIndex: 1001,
            }),
          visibility: isVisible ? 'visible' : 'hidden',
          opacity: isVisible ? 1 : 0,
        }}
      >
        {save && (
          <div className="box-menu">
            <span className="ico-comm ico-folder-28" />
            스마트폴더에 저장 됨
          </div>
        )}
        <ul className="list-menu">
          {/* {save && ( */}
          {/*  <li> */}
          {/*    <span className="txt-menu">다른 위치에 저장</span> */}
          {/*  </li> */}
          {/* )} */}
          {list.map((item) => (
            <li key={item.key}>
              {/* {save && <span className="ico-comm ico-line-12" />} */}
              {text ? (
                <span className="txt-menu">{item.text}</span>
              ) : (
                <button
                  className="btn-menu"
                  type="button"
                  onClick={(event) => {
                    if (onDropDown) {
                      onDropDown(event);
                    }
                    item.action?.();
                  }}
                >
                  {item.text}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  },
);

DropDownMenu.displayName = 'DropDownMenu';
