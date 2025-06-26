import React, { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FLOATING_BUTTON_TYPE } from '@/const';
import { Checkbox } from '@/components/common/Checkbox';
import cx from 'clsx';
import { IFloatingButton } from '@/components/common/Thumbnail/_components/FloatingButton/types';
import { DropDownMenu } from '@/components/common/Thumbnail/_components/DropDownMenu';

/**
 * 플로팅 버튼 표시
 *
 * 1.기본
 *
 * 업로드
 *
 * 2. 다운로드 + 드롭다운 메뉴
 *
 * 자료보기
 *
 * 검색 결과
 *
 * 하단 추천 영역
 *
 * 공개 자료
 *
 * 3. 드롭다운
 *
 * 스마트 폴더 (메뉴)
 *
 * 아이별 분류-폴더
 *
 * 최근 작업
 *
 * 4. 체크박스 + close 버튼 + 수정 버튼(우측 하단)
 *
 * 놀이보고서
 *
 * 5. 대표 뱃지 + close 버튼 + 수정 버튼(우측 하단)
 *
 * 아이관찰기록 - 대표사진
 *
 * 6. 체크박스 + 즐겨찾기 + 드롭다운
 *
 * 마이보드 > 스토리보드
 *
 * LNB,공통 파일 업로드 시
 *
 * 7. 체크박스 + 즐겨찾기 + 드롭 다운 + 수정 버튼 (우측 하단)
 *
 * 아이별 분류-파일 > 상세 메뉴1
 *
 * 자료보드 빠른작업 사진
 *
 * 놀이사진: 파일 메뉴 6
 *
 * 8. 체크박스 + 드롭다운
 *
 * 스마트폴더 (문서 상세)
 *
 * 9.체크박스 + 다운로드 + 드롭다운
 *
 * 마이보드 > 스토리보드: 파일 메뉴6
 *
 * 10.즐겨찾기 + 다운로드 + 드롭다운
 *
 * 11. none (아무것도 없음)
 *
 * 빠른작업 사진
 */

export const FloatingButton: React.FC<IFloatingButton> = ({
  fileName,
  floating,
  floatingType,
  onDownload,
  onEdit,
  onClose,
  onFavorite,
  onEditToggle,
  dropDown,
  dropDownMenu,
  dropDownDirection,
  onDropDown,
  isEditActive,
  favorite,
  isMine = false,
  fileType,
  hoverFloatingType,
  onBadge,
  showIndexOnCheck = false,
  showNumber,
  checkNum,
  hover,
  folderCheckBox,
  userEditable,
}) => {
  const uniqueId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef<{ top: number; left: number }>();

  if (menuRef.current) {
    const rect = menuRef?.current?.getBoundingClientRect();

    positionRef.current = {
      top: (rect?.top as number) + window.scrollY,
      left: (rect?.right as number) + window.scrollX + 1,
    };
  }

  // 조건 정의
  const conditions = {
    hasDropdown:
      floatingType === FLOATING_BUTTON_TYPE.DownloadDropdown ||
      floatingType === FLOATING_BUTTON_TYPE.Dropdown ||
      floatingType === FLOATING_BUTTON_TYPE.CheckFavoriteDropdown ||
      floatingType === FLOATING_BUTTON_TYPE.CheckFavoriteDropdownEdit ||
      floatingType === FLOATING_BUTTON_TYPE.CheckboxDropdown ||
      floatingType === FLOATING_BUTTON_TYPE.CheckboxDownloadDropdown ||
      floatingType === FLOATING_BUTTON_TYPE.FavoriteDropdownEdit ||
      floatingType === FLOATING_BUTTON_TYPE.FavoriteDropdown,
    hasFavorite:
      floatingType === FLOATING_BUTTON_TYPE.CheckFavoriteDropdown ||
      floatingType === FLOATING_BUTTON_TYPE.CheckFavoriteDropdownEdit ||
      floatingType === FLOATING_BUTTON_TYPE.FavoriteDropdownEdit ||
      floatingType === FLOATING_BUTTON_TYPE.FavoriteDropdown,
    hasCheckBox:
      floatingType === FLOATING_BUTTON_TYPE.CheckCloseEdit ||
      floatingType === FLOATING_BUTTON_TYPE.CheckFavoriteDropdown ||
      floatingType === FLOATING_BUTTON_TYPE.CheckFavoriteDropdownEdit ||
      floatingType === FLOATING_BUTTON_TYPE.CheckboxDownloadDropdown ||
      floatingType === FLOATING_BUTTON_TYPE.CheckboxDropdown ||
      floatingType === FLOATING_BUTTON_TYPE.Default ||
      floatingType === FLOATING_BUTTON_TYPE.CheckClose,
    hasDownload:
      floatingType === FLOATING_BUTTON_TYPE.DownloadDropdown ||
      floatingType === FLOATING_BUTTON_TYPE.CheckboxDownloadDropdown,
    hasBadge:
      floatingType === FLOATING_BUTTON_TYPE.BadgeCloseEdit ||
      floatingType === FLOATING_BUTTON_TYPE.BadgeClose ||
      floatingType === FLOATING_BUTTON_TYPE.Badge,
    hasClose:
      floatingType === FLOATING_BUTTON_TYPE.CheckCloseEdit ||
      floatingType === FLOATING_BUTTON_TYPE.BadgeCloseEdit ||
      floatingType === FLOATING_BUTTON_TYPE.CloseEdit ||
      floatingType === FLOATING_BUTTON_TYPE.BadgeClose ||
      floatingType === FLOATING_BUTTON_TYPE.Close ||
      floatingType === FLOATING_BUTTON_TYPE.CheckClose,
    hasEdit:
      floatingType === FLOATING_BUTTON_TYPE.CheckCloseEdit ||
      floatingType === FLOATING_BUTTON_TYPE.BadgeCloseEdit ||
      floatingType === FLOATING_BUTTON_TYPE.CheckFavoriteDropdownEdit ||
      floatingType === FLOATING_BUTTON_TYPE.FavoriteDropdownEdit ||
      floatingType === FLOATING_BUTTON_TYPE.CloseEdit ||
      floatingType === FLOATING_BUTTON_TYPE.Edit,
  };

  const isMenuDisabled = floating && conditions.hasCheckBox;
  const isFolder = fileType === 'FOLDER';

  const folderOpacity = (): React.CSSProperties['opacity'] => {
    if (folderCheckBox) {
      return hover === false ? 0 : undefined;
    }
    return floating ? 0 : undefined;
  };

  if (isFolder) {
    return (
      <div
        className="util-thumbnail"
        style={{
          opacity: folderOpacity(), // 체크박스 활성화 시 폴더는 체크 안됨
        }}
      >
        {/* 좌측 상단: 체크박스 */}
        {folderCheckBox && (
          <Checkbox
            name="checkItems"
            className={cx(showIndexOnCheck && 'type-num')}
            id={uniqueId}
            checked={isEditActive}
            onChange={onEditToggle}
            label={showIndexOnCheck ? showNumber : `${fileName} 선택`}
            labHidden={!showIndexOnCheck}
            checkNum={checkNum}
          />
        )}
        {!isMenuDisabled && conditions.hasDropdown && userEditable && (
          <div ref={menuRef} className="wrap-menu">
            <button type="button" className={cx('btn-menu', dropDown && 'active')} onClick={onDropDown}>
              <span className="ico-comm ico-options-vertical-16-w">메뉴</span>
            </button>
            {dropDown &&
              dropDownMenu &&
              createPortal(
                <DropDownMenu
                  direction={dropDownDirection}
                  show={dropDown}
                  top={positionRef.current?.top}
                  left={positionRef.current?.left}
                  onDropDown={onDropDown}
                  {...dropDownMenu}
                />,
                document.body,
              )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="util-thumbnail"
      style={{
        opacity: hover === false ? 0 : undefined, // false일 때만 명시적으로 0
      }}
    >
      {!(!floatingType || floatingType === FLOATING_BUTTON_TYPE.None) && (
        <>
          {/* 좌측 상단: 체크박스 */}
          {conditions.hasCheckBox && (
            <Checkbox
              name="checkItems"
              className={cx(showIndexOnCheck && 'type-num')}
              id={uniqueId}
              checked={isEditActive}
              onChange={onEditToggle}
              label={showIndexOnCheck ? showNumber : `${fileName} 선택`}
              labHidden={!showIndexOnCheck}
              checkNum={checkNum}
            />
          )}

          {/* 좌측 상단: 다운로드 버튼 */}
          {!isMenuDisabled && conditions.hasDownload && (
            <button type="button" onClick={onDownload} className="btn-download">
              <span className="ico-comm ico-download-16-w">다운로드</span>
            </button>
          )}

          {/* 좌측 상단: 대표 뱃지 */}
          {!isMenuDisabled &&
            conditions.hasBadge &&
            (hoverFloatingType !== 'none' ? (
              <em className="badge-util">대표</em>
            ) : (
              <button type="button" onClick={onBadge} className="badge-util">
                대표
              </button>
            ))}

          {/* 우측 상단: 드롭다운 */}
          {!isMenuDisabled && conditions.hasDropdown && (
            <div ref={menuRef} className="wrap-menu">
              <button type="button" className={cx('btn-menu', dropDown && 'active')} onClick={onDropDown}>
                <span className="ico-comm ico-options-vertical-16-w">메뉴</span>
              </button>
              {dropDown &&
                dropDownMenu &&
                createPortal(
                  <DropDownMenu
                    show={dropDown}
                    direction={dropDownDirection}
                    top={positionRef.current?.top}
                    left={positionRef.current?.left}
                    onDropDown={onDropDown}
                    {...dropDownMenu}
                  />,
                  document.body,
                )}
            </div>
          )}

          {/* 우측 상단: 즐겨찾기 */}
          {!isMenuDisabled && conditions.hasFavorite && (
            <button type="button" onClick={onFavorite} className={cx('btn-favorite', favorite && 'active')}>
              <span className="ico-comm ico-favorite-16-w">즐겨찾기</span>
            </button>
          )}

          {/* 우측 상단: 닫기 버튼 */}
          {!isMenuDisabled && conditions.hasClose && (
            <button type="button" className="btn-delete" onClick={onClose}>
              <span className="ico-comm ico-close-solid-20">삭제</span>
            </button>
          )}

          {/* 우측 하단: 수정 버튼 */}
          {!isMenuDisabled && conditions.hasEdit && isMine && (
            <button type="button" onClick={onEdit} className="btn-memo">
              <span className="ico-comm ico-message-16-w">메모</span>
            </button>
          )}
        </>
      )}
    </div>
  );
};
