import cx from 'clsx';
import type React from 'react';
import { useState, useEffect, useMemo } from 'react';
import type { LecturePlanResult } from '@/service/aiAndProxy/schemas';
import getIndoorOrOutdoorIcon from '@/utils/DragAndDrop/getIndoorOrOutdoorIcon';

export function NoOptionPlayingCard({
  playingCardData,
  isSelected,
  isDetail = false,
  onClick,
  ...props
}: {
  playingCardData: LecturePlanResult;
  isSelected?: boolean;
  isDetail?: boolean;
  onClick?: (event: React.MouseEvent | React.KeyboardEvent) => void;
}) {
  // 놀이 이름 파싱 (예: "단풍나무 술래잡기@!,$!낙엽나무 만들기@!,$!낙엽물감찍기")
  const activityContentsList = playingCardData?.activityNames?.split('@!,$!') || [];

  const [isHovered, setIsHovered] = useState<boolean>(false);

  const parsedCardColor = (creationType: any) => {
    switch (creationType) {
      case 'TYPE_A':
        return 'card-type01';
      case 'TYPE_B':
        return 'card-type02';
      case 'TYPE_C':
        return 'card-type03';
      default:
        return '';
    }
  };

  // 학생 나이 표시
  const playingAgeOption = [
    { value: 2, text: '0-2세' },
    { value: 3, text: '3세' },
    { value: 4, text: '4세' },
    { value: 5, text: '5세' },
  ];
  const studentAge = useMemo(() => {
    if (playingCardData?.studentAge) {
      const targetItem = playingAgeOption.find((age) => age.value === playingCardData.studentAge);
      if (targetItem) return targetItem.text;
    }
    return '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playingCardData?.studentAge]);

  // 키보드 이벤트 핸들러
  const handleKeyDown = (event: React.KeyboardEvent) => {
    // 엔터나 스페이스가 눌렸을 때 onClick 핸들러를 호출
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick?.(event);
    }
  };

  const handleMouseEnter = () => {
    // if (!isSelected) {
    // }
    if (!isDetail) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  useEffect(() => {
    setIsHovered(false);
  }, [isSelected]);

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={playingCardData?.subject}
      className={cx('item-card', isSelected ? 'select' : 'unselect', isHovered && 'item-card-hover')}
      role="button" // 이 요소가 버튼 역할을 한다고 명시
      tabIndex={0} // 키보드로 포커스 가능하게 설정
      aria-pressed={isSelected} // 선택 상태를 스크린 리더에 알림
      style={{ cursor: 'pointer' }}
    >
      <div className="visual-card">
        <div className={cx('inner-card', parsedCardColor(playingCardData?.creationType))}>
          <div className="head-card" style={{ minHeight: '24px' }}>
            {/* {props.checkType && (hover || props.checkOn) && (
            <Checkbox
              name="checkItems"
              id={uniqueId}
              label={props.head.title + ' 선택'}
              labHidden={true}
              checked={isChecked || props.checkOn}
              onChange={handleCheckboxChange}
            />
          )} */}
            {playingCardData?.indoorType && (
              <span className="thumbnail-head">
                <span className={cx('ico-comm', getIndoorOrOutdoorIcon(playingCardData?.indoorType || ''))} />
              </span>
            )}
            {/* 제목 */}
            <strong className="title-head">{playingCardData?.subject}</strong>
          </div>

          {/* 놀이 카드 내용 */}
          <div className="content-card">
            <ul className="info-list">
              {activityContentsList.map((content: string) => (
                <li key={content}>{content}</li>
              ))}
            </ul>
          </div>

          {/* 놀이 나이 & 놀이 연령 */}
          <div className="info-card">
            <div className="badge-info">
              {studentAge && (
                <span className="badge">
                  <span className="badge-text">{studentAge}</span>
                </span>
              )}
              {playingCardData?.activityTimeStr && (
                <span className="badge">
                  <span className="badge-text">{playingCardData?.activityTimeStr}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
