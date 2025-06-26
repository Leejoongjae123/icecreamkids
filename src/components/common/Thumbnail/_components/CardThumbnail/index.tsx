import type React from 'react';
import { FunctionComponent, useId, useMemo } from 'react';
import cx from 'clsx';
import { Checkbox } from '@/components/common/Checkbox';
import { IThumbnail } from '@/components/common/Thumbnail/types';
import { DropDownMenu } from '@/components/common/Thumbnail/_components/DropDownMenu';
import { formatCompactNumber } from '@/utils';
import getIndoorOrOutdoorIcon from '@/utils/DragAndDrop/getIndoorOrOutdoorIcon';
import useUserStore from '@/hooks/store/useUserStore';
import { useRouter } from 'next/navigation';

export interface ICardThumbnail
  extends Pick<
    IThumbnail,
    | 'isEditActive'
    | 'onEditToggle'
    | 'fileName'
    | 'floating'
    | 'lecturePlan'
    | 'favorite'
    | 'onFavorite'
    | 'dropDown'
    | 'dropDownMenu'
    | 'onDropDown'
    | 'onEdit'
    | 'userProfileName'
    | 'userProfileThumbUrl'
    | 'likes'
    | 'views'
    | 'innerCard'
    | 'userProfileCode'
  > {
  isHovered: boolean;
  handleWrapperClick?: React.MouseEventHandler<HTMLDivElement>;
  onDoubleClick?: React.MouseEventHandler<HTMLDivElement>;
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
  showInfo?: boolean;
  cardFloatingButton?: boolean;
}

export const CardThumbnail: FunctionComponent<ICardThumbnail> = ({
  fileName,
  isEditActive,
  onEditToggle,
  isHovered,
  floating,
  lecturePlan,
  favorite,
  onFavorite,
  dropDown,
  dropDownMenu,
  onDropDown,
  onEdit,
  userProfileName,
  userProfileThumbUrl,
  likes,
  views,
  handleWrapperClick,
  onDoubleClick,
  onMouseEnter,
  onMouseLeave,
  showInfo = true,
  cardFloatingButton = false,
  innerCard,
  userProfileCode,
}) => {
  const router = useRouter();
  const uniqueId = useId();
  const { userInfo } = useUserStore();

  const lecturePlanIcon = {
    INDOOR: 'ico-home-16',
    OUTDOOR: 'ico-image-16',
    BOTH: 'ico-etc-16',
  } as const;

  // const lecturePlanData = lecturePlan!;

  const lecturePlanData = lecturePlan ?? {
    indoorType: '',
    subject: '',
    activityNames: '',
    studentAge: '',
    activityTimeStr: '',
  };

  const cardColor = useMemo(() => {
    return cx({
      'inner-card': true,
      'card-type01': innerCard === 'TYPE_A',
      'card-type02': innerCard === 'TYPE_B',
      'card-type03': innerCard === 'TYPE_C',
    });
  }, [innerCard]); // 의존성 배열

  return (
    <div
      style={{ cursor: handleWrapperClick ? 'pointer' : 'auto' }}
      className={cx('item-card', 'type-check', (isHovered || floating) && 'active')}
      role="button"
      tabIndex={0}
      onClick={handleWrapperClick}
      onDoubleClick={onDoubleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onKeyDown={() => {}}
    >
      <div className="visual-card">
        <div className={cardColor} title={lecturePlanData.subject.length > 6 ? lecturePlanData.subject : ''}>
          <div className="head-card">
            {(isHovered || floating) && (
              <Checkbox
                name="checkItems"
                id={uniqueId}
                checked={isEditActive}
                onChange={onEditToggle}
                label={`${fileName} 선택`}
                labHidden
              />
            )}
            <span className="thumbnail-head">
              <span className={cx('ico-comm', getIndoorOrOutdoorIcon(lecturePlanData.indoorType ?? 'INDOOR'))} />
            </span>
            <strong className="title-head">{lecturePlanData.subject}</strong>
          </div>
          <div className="content-card">
            {lecturePlan?.activityNames && (
              <ul className="info-list">
                {lecturePlan?.activityNames?.split?.('@!,$!').map((name) => <li key={name}>{name}</li>)}
              </ul>
            )}
          </div>
          <div className="info-card">
            <div className="badge-info">
              {lecturePlanData.studentAge !== null && (
                <span className="badge">
                  <span className="badge-text">{lecturePlanData.studentAge}세</span>
                </span>
              )}
              {lecturePlanData.activityTimeStr && (
                <span className="badge">
                  <span className="badge-text">{lecturePlanData.activityTimeStr}</span>
                </span>
              )}
            </div>
            {!cardFloatingButton && (
              <div className="util-info">
                <button type="button" onClick={onFavorite} className={cx('btn-favorite', favorite && 'active')}>
                  <span className="ico-comm ico-favorite-20">즐겨찾기</span>
                </button>
                {/* TODO: 다운로드 버튼 노출 조건 분기처리 예정 */}
                {/* <div className="wrap-menu"> */}
                {/*  <button type='button' className={cx('btn-menu', dropDown && 'active')} onClick={onDropDown}> */}
                {/*    <span className="ico-comm ico-download-20">다운로드</span> */}
                {/*  </button> */}
                {/* </div> */}
                <div className="wrap-menu">
                  <button type="button" onClick={onDropDown} className="btn-menu">
                    <span className="ico-comm ico-options-vertical-20-g">메뉴</span>
                  </button>
                  {dropDown && dropDownMenu && <DropDownMenu show={dropDown} {...dropDownMenu} />}
                </div>
              </div>
            )}
          </div>
          {cardFloatingButton && (
            <div className="util-card">
              <button type="button" onClick={onFavorite} className={cx('btn-favorite', favorite && 'active')}>
                <span className="ico-comm ico-favorite-16-w">즐겨찾기</span>
              </button>
              <div className="wrap-menu">
                <button type="button" onClick={onDropDown} className="btn-menu">
                  <span className="ico-comm ico-options-vertical-16-w">메뉴</span>
                </button>
                {dropDown && dropDownMenu && <DropDownMenu show={dropDown} {...dropDownMenu} />}
              </div>
            </div>
          )}
        </div>
      </div>
      {showInfo && (
        <div className="profile-card">
          <span
            className="thumb-profile"
            style={{
              backgroundImage: userProfileThumbUrl ? `url(${userProfileThumbUrl})` : 'url(/images/profile.png)',
            }}
            onClick={() => router.push(`/my-board/lecture-photo${userProfileCode ? `?user=${userProfileCode}` : ''}`)}
            role="button"
            tabIndex={0}
            onKeyDown={() => {}}
          />
          <em className="name-profile">{userProfileName || userInfo?.name}</em>
          <dl className="info-profile">
            <dt>
              <span className="ico-comm ico-heart-16">좋아요</span>
            </dt>
            <dd>{formatCompactNumber(likes)}</dd>
            <dt>
              <span className="ico-comm ico-eye-16-g">조회수</span>
            </dt>
            <dd>{formatCompactNumber(views)}</dd>
          </dl>
        </div>
      )}
    </div>
  );
};

CardThumbnail.displayName = 'CardThumbnail';
