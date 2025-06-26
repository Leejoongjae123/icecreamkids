import { forwardRef, useRef, useEffect, useState } from 'react';
import cx from 'clsx';
import { createPortal } from 'react-dom';

export interface KebabMenuProps {
  show?: boolean;
  save?: boolean;
  text?: boolean;
  list: {
    path?: string;
    key?: string;
    text: string;
    action?: () => void;
  }[];
  onOpen?: () => void;
  onClose?: () => void;
}
export const KebabMenu = forwardRef<HTMLDivElement, KebabMenuProps>(
  ({ show = false, save = false, text = false, list, onOpen, onClose }: KebabMenuProps, ref) => {
    /**
     * * 공유 관리
     */

    /**
     * * 다시 추천받지 않기
     */

    /**
     * * 복사
     */

    /**
     * * 저장
     */

    // 메뉴의 위치를 계산하는 로직
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

    // 메뉴가 표시될 때 위치 계산
    useEffect(() => {
      if (show && ref && 'current' in ref && ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const menuWidth = 180; // 메뉴 예상 너비
        const menuHeight = 250; // 메뉴 예상 높이

        // 기본 위치 (버튼 오른쪽)
        let left = rect.right;
        let { top } = rect;

        // 화면 오른쪽 경계 확인
        if (left + menuWidth > window.innerWidth) {
          // 오른쪽 공간이 부족하면 왼쪽에 배치
          left = rect.left - menuWidth + 40;
        }

        // 화면 하단 경계 확인
        if (top + menuHeight > window.innerHeight) {
          // 하단 공간이 부족하면 위로 조정
          top = window.innerHeight - menuHeight - 10;
        }

        setPosition({ top, left });
      } else {
        setPosition(null);
      }
    }, [show, ref]);

    // Portal을 사용하여 메뉴를 body에 렌더링
    const menuContent = show && (
      <div
        className={cx('menu-layer', save && 'type-save', 'show')}
        style={{
          position: 'fixed',
          zIndex: 9999,
          top: position?.top,
          left: position?.left,
        }}
      >
        {save && (
          <div className="box-menu">
            <span className="ico-comm ico-folder-28" />
            스마트폴더에 저장 됨
          </div>
        )}
        <ul className="list-menu">
          {save && (
            <li>
              <span className="txt-menu">다른 위치에 저장</span>
            </li>
          )}
          {list.map((item) => (
            <li key={item.path ? item.path : item.key}>
              {save && <span className="ico-comm ico-line-12" />}
              {text ? (
                <span className="txt-menu">{item.text}</span>
              ) : (
                <button
                  type="button"
                  className="btn-menu"
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    }
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

    return (
      <>
        <div ref={ref} />
        {position && createPortal(menuContent, document.body)}
      </>
    );
  },
);

KebabMenu.displayName = 'KebabMenu';
