'use client';

import { IThumbnail } from '@/components/common/Thumbnail/types';
import { dateFormat } from '@/lib/dayjs';
import {
  SmartFolderItemResultFileType,
  LecturePlanResult,
  LectureReportResult,
  StoryBoardResult,
  StudentRecordResult,
} from '@/service/file/schemas';
import { formatCompactNumber, getThumbnail, isEmpty, removeFileExtension, validateThumbnail } from '@/utils';
import cx from 'clsx';
import dayjs from 'dayjs';
import Image from 'next/image';
import React, { FunctionComponent, useEffect, useMemo, useRef, useState } from 'react';
import { FloatingButton } from '@/components/common/Thumbnail/_components/FloatingButton/FloatingButton';
import { DropDownMenu } from '@/components/common/Thumbnail/_components/DropDownMenu';
import { Input } from '@/components/common/Input';
import { CardThumbnail } from '@/components/common/Thumbnail/_components/CardThumbnail';
import { createPortal } from 'react-dom';
import { useValidateFileName } from '@/hooks/useValidateFileName';
import { usePathname, useRouter } from 'next/navigation';

const errorImage = '/images/bg_noimage1.png'; // 기본 이미지

/**
 * @component 아이스크림 썸네일 컴포넌트
 * @extends ImageProps
 * @param {string} fileName 파일명 (확장자를 뽑기 위해서 필수 입니다.)
 * @param {string} className 스타일 클래스 명 (width 236시 type-work)
 * @param {string} fallbackSrc 에러 시 출력 이미지
 * @param {string} blurDataURL 로딩 중 불러올 이미지
 * @param {string} alt 파일 대체 텍스 추가
 * @param {string?} thumbUrl 이미지 파일 url
 * @param {boolean?} hover 호버 유무
 * @param {boolean?} isEditActive (체크박스)활성화 유무
 * @param {boolean?} isThumbnailCheckbox 썸네일 전체 영역 선택시 (체크박스)활성화 유무
 * @param {boolean?} floating 플로팅 버튼 fixed 여부 (체크 박스 활성화 시 고정하기 위함)
 * @param {FLOATING_BUTTON_TYPE?} floatingType 썸네일 플로팅버튼 렌더링 타입
 * @param {FLOATING_BUTTON_TYPE?} hoverFloatingType 호버 여부에 따른 썸네일 플로팅버튼 렌더링 변경 타입 - 호버 시 플로팅 버튼 렌더링 타입 변경
 * @param {VoidFunction?} onDownload 다운로드 버튼 이벤트
 * @param {VoidFunction?} onEdit 수정 이벤트
 * @param {VoidFunction?} onEditToggle 체크박스 이벤트
 * @param {VoidFunction?} onClose 닫힘 이벤트
 * @param {VoidFunction?} onFavorite 즐겨찾기 이벤트
 * @param {boolean?} favorite 즐겨찾기 버튼 클릭 여부
 * @param {boolean?} dropDown 드롭다운 버튼 클릭 여부
 * @param {IDropDownMenu?} dropDownMenu 드롭다운 메뉴 리스트
 * @param {boolean?} nameHidden 파일 명 숨김 여부
 * @param {boolean?} favoriteHide 즐겨찾기 헤더영역 숨김 처리
 * @param {boolean?} dropDownHide 드롭다운 헤더영역 숨김 처리
 * @param {string?} desc 파일 디스크립션
 * @param {string?} date 파일 날짜
 * @param {boolean?} likes 좋아요 수
 * @param {boolean?} views 뷰어 수
 * @param {string?} head 헤드 Info
 * @param {number} width 썸네일 width (선택 입니다. 기본 썸네일 : 160, 특이 케이스는 236 grid시 지정 X)
 * @param {'type-format' | 'type-dimmed' | 'type-folder' | 'type-slide' | 'type-card' | 'type-square' | 'type-contain' | undefined} visualClassName
 * 썸네일 이미지에 적용할 시각적 스타일 클래스입니다.
 * - `type-format`: 파일 타입 아이콘 (문서, 이미지 등)
 * - `type-dimmed`: 딤 처리
 * - `type-folder`: 폴더 형태 썸네일 (폴더 아이콘 X 스마트 폴더 용)
 * - `type-slide`: 슬라이드형 썸네일 (좌우 넘김 UI)
 * - `type-card`: 카드형 썸네일
 * - `type-square`: 정사각형 썸네일
 * - `type-contain`: 이미지 비율 유지 (직사각형 가능)
 * @param {boolean} nameEditable // 이름 수정 상태
 * @param {boolean} isProfileImage // 프로필 이미지 표시 여부
 * @parma {boolean} cardFloatingButton //  카드썸네일 호버시 플로팅 버튼 노출 여부
 * @parma {boolean} eagerLoading // 이미지 로딩 조건 eager을 사용할건지 여부
 *
 * 파일 타입이 특수 케이스 일때
 * @param {LecturePlanResult?} lecturePlan 놀이 계획 reponse
 * @param {LectureReportResult?} lecturePlanReport 놀이 보고서 reponse
 * @param {StudentRecordResult?} studentRecord 관찰 기록 reponse
 * @param {StoryBoardResult?} storyBoard 스토리 보드 reponse

 * @returns {JSX.Element|null} - 썸네일 + 플로팅 버튼 단 `floatingType`이 `none`인 경우 플로팅 버튼 렌더링x.
 *
 * @example
 * <Thumbnail
 *   floatingType={'none'}
 *   onDownload={() => console.log('Download clicked')}
 *   onEdit={() => console.log('Edit clicked')}
 *   onClose={() => console.log('Close clicked')}
 *   onFavorite={() => console.log('Favorite clicked')}
 *   onEditToggle={() => console.log('Checkbox toggled')}
 * />
 */

export const Thumbnail: FunctionComponent<IThumbnail> = ({
  fileName,
  fileType,
  fallbackSrc = errorImage,
  blurDataURL = errorImage,
  alt,
  thumbUrl,
  hover = false,
  isEditActive = false,
  isThumbnailCheckbox = false,
  floating = false,
  floatingType = 'default',
  hoverFloatingType = 'none',
  onDownload,
  onEdit,
  onEditToggle,
  onClose,
  onFavorite,
  onDropDown,
  style,
  className,
  tag,
  nameHidden = false,
  desc,
  date,
  likes,
  views,
  head,
  favorite,
  isMine,
  dropDown,
  dropDownMenu,
  width,
  onClick,
  onDoubleClick,
  contentHideen = false,
  favoriteHide = false,
  dropDownHide = false,
  viewType = 'thumbnail',
  visualClassName,
  nameEditable = false,
  userProfileThumbUrl,
  isProfileImage = false,
  lecturePlan,
  lecturePlanReport,
  storyBoard,
  studentRecord,
  makeRenameFile,
  userProfileName,
  showInfo,
  onBadge,
  cardFloatingButton = false,
  dropDownDirection = 'right',
  descWhiteSpace,
  innerCard,
  showIndexOnCheck = false,
  showNumber,
  userEditable = true,
  eagerLoading = false,
  children,
  folderCheckBox,
  inputAutoFocus = true,
  userProfileCode,
  ...props
}) => {
  const router = useRouter();
  const fileNameNoExtension = fileType === 'FOLDER' ? fileName : removeFileExtension(fileName);
  const [isHovered, setIsHovered] = useState<boolean>(false); // 호버 상태

  // 드롭다운 메뉴 포지션
  const menuRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef<{ top: number; left: number }>();

  if (menuRef.current) {
    const rect = menuRef?.current?.getBoundingClientRect();

    positionRef.current = {
      top: (rect?.top as number) + window.scrollY,
      left: (rect?.right as number) + window.scrollX + 1,
    };
  }

  const onMouseEnter = () => {
    if (hover) {
      setIsHovered(true);
    }
  };
  const onMouseLeave = (event: React.MouseEvent<HTMLDivElement> | React.MouseEvent<HTMLButtonElement>) => {
    if (hover) {
      setIsHovered(false);
    }
    if (dropDown) onDropDown?.(event as React.MouseEvent<HTMLButtonElement>);
  };
  const handleWrapperClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;

    const blockedSelectors = [
      '.btn-download', // 다운로드
      '.badge-util', // 대표 뱃지
      '.btn-menu', // 드롭다운 메뉴
      '.btn-favorite', // 즐겨찾기 버튼
      '.btn-delete', // 닫기 버튼
      '.btn-memo', // 수정 버튼
      '#fileName', // 이름 수정
      '.thumb-profile', // 썸네일 이미지
    ];

    // 체크박스 클릭
    if (!isThumbnailCheckbox && target.closest('.item-choice')) {
      event.stopPropagation();
      return;
    }

    if (blockedSelectors.some((selector) => target.closest(selector))) {
      event.stopPropagation();
      return;
    }
    if (!nameEditable) {
      onClick?.(event);
    }
  };
  const thumbnialRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const validateFileName = useValidateFileName();

  const buttonType: IThumbnail['floatingType'] =
    isHovered || floating ? (isHovered && hoverFloatingType !== 'none' ? hoverFloatingType : floatingType) : 'none';

  const { icon, extension } = getThumbnail(fileName, fileType);

  const renderThumbUrl = useMemo(() => {
    const fallback =
      visualClassName && ['type-square', 'type-folder'].includes(visualClassName)
        ? '/images/bg_noimage5.png'
        : fallbackSrc;
    if (fileType === SmartFolderItemResultFileType.FOLDER) {
      if (visualClassName === 'type-folder') {
        if (viewType === 'table') {
          return thumbUrl;
        }
        return thumbUrl || fallback;
      }
      if (!userEditable) {
        return '/images/thumb_folder2.png';
      }
      return thumbUrl || '/images/thumb_folder.png';
    }
    if (fileType === SmartFolderItemResultFileType.IMAGE) return thumbUrl || fallback;
    if (fileType === SmartFolderItemResultFileType.STORY_BOARD) {
      if (visualClassName === 'type-folder' && className === 'type-work') {
        if (thumbUrl) return thumbUrl;
      }
      if (storyBoard?.thumbUrl === 'string' || isEmpty(storyBoard?.thumbUrl)) {
        return fallback;
      }
      return storyBoard?.thumbUrl ?? fallback;
    }
    if (fileType === SmartFolderItemResultFileType.LECTURE_PLAN) {
      if (className === 'type-work') {
        if (thumbUrl) return thumbUrl;
      }
      return lecturePlan?.driveItem?.thumbUrl || undefined;
    }
    if (fileType === SmartFolderItemResultFileType.LECTURE_PLAN_REPORT) {
      if (className === 'type-work') {
        if (thumbUrl) return thumbUrl;
      }
      return undefined;
    }
    if (fileType === SmartFolderItemResultFileType.STUDENT_RECORD) {
      if (className === 'type-work') {
        if (thumbUrl) return thumbUrl;
      }
      return undefined;
    }

    if (visualClassName === 'type-folder' && className === 'type-work') {
      return thumbUrl || fallbackSrc;
    }
    return thumbUrl || undefined;
  }, [
    visualClassName,
    fallbackSrc,
    fileType,
    thumbUrl,
    lecturePlan?.driveItem?.thumbUrl,
    className,
    storyBoard?.thumbUrl,
    userEditable,
    viewType,
  ]);

  const [isImageError, setImageError] = useState(false);

  const [inputFileName, setInputFileName] = useState<string>(fileNameNoExtension);

  // 로딩 여부
  const [isLoaded, setIsLoaded] = useState(false);
  // contain 여부
  const [isContain, setContain] = useState(false);

  if (viewType === 'lecturePlan') {
    return (
      <CardThumbnail
        isHovered={isHovered}
        fileName={fileNameNoExtension}
        isEditActive={isEditActive}
        floating={floating}
        favorite={favorite}
        lecturePlan={lecturePlan}
        dropDown={dropDown}
        dropDownMenu={dropDownMenu}
        onEditToggle={onEditToggle}
        onFavorite={onFavorite}
        onDropDown={onDropDown}
        onEdit={onEdit}
        userProfileName={userProfileName}
        userProfileThumbUrl={userProfileThumbUrl}
        likes={likes}
        views={views}
        handleWrapperClick={handleWrapperClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        showInfo={showInfo}
        innerCard={innerCard}
        cardFloatingButton={cardFloatingButton}
        userProfileCode={userProfileCode}
      />
    );
  }

  // 로딩 실패 핸들러
  const handleError = () => {
    setImageError(true);
  };

  const imageObjectFit = (): React.CSSProperties['objectFit'] => {
    if (fileType === 'FOLDER' || visualClassName === 'type-square') {
      return 'cover';
    }
    return isContain ? 'contain' : 'cover';
  };

  const renderContent = () => {
    /** 업로드 폴더 전용 */
    if ((visualClassName === 'type-folder' || visualClassName === 'type-slide') && !userEditable) {
      return <span className="inner-visual" style={{ backgroundImage: `url(${renderThumbUrl})` }} />;
    }

    if (fileType === 'LECTURE_PLAN' && className !== 'type-work' && visualClassName !== 'type-square') {
      const lecturePlanData = lecturePlan ?? {
        indoorType: 'INDOOR',
        subject: '',
        activityNames: '',
        studentAge: '',
        activityTimeStr: '',
        creationType: 'TYPE_A',
      };
      const lecturePlanIcon = {
        INDOOR: 'ico-home-30',
        OUTDOOR: 'ico-image-30',
        BOTH: 'ico-etc-30',
      } as const;
      return (
        <div className="item-card">
          <div
            className={cx('inner-card', {
              'card-type01': lecturePlanData.creationType === 'TYPE_A',
              'card-type02': lecturePlanData.creationType === 'TYPE_B',
              'card-type03': lecturePlanData.creationType === 'TYPE_C',
            })}
          >
            <div className="head-card">
              <span className="thumbnail-head">
                <span className={cx('ico-comm', lecturePlanIcon[lecturePlanData.indoorType ?? 'INDOOR'])} />
              </span>
              <strong className="title-head">{lecturePlanData.subject}</strong>
            </div>
            <div className="content-card">
              {lecturePlanData.activityNames && (
                <ul className="info-list">
                  {lecturePlanData.activityNames?.split?.('@!,$!').map((name) => <li key={name}>{name}</li>)}
                </ul>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (renderThumbUrl && (!isImageError || fileType === SmartFolderItemResultFileType.IMAGE)) {
      const isPriority = renderThumbUrl.indexOf('/images/bg_noimage') === 0;
      const eagerLoadingType = eagerLoading ? 'eager' : 'lazy';
      const loadingType = !isPriority ? eagerLoadingType : undefined;
      return (
        <Image
          src={isImageError ? fallbackSrc : renderThumbUrl}
          alt={alt ?? `${fileNameNoExtension} 썸네일`}
          blurDataURL={blurDataURL} // 로딩 중 표시할 블러 이미지
          onError={handleError}
          sizes={`(max-width: ${width}px)`} // 적절한 sizes 설정
          fill
          priority={isPriority}
          loading={loadingType}
          onLoad={({ currentTarget }) => {
            const { naturalWidth, naturalHeight } = currentTarget;
            const containType = naturalHeight > naturalWidth;

            // if (naturalWidth / naturalHeight > 1.3) {
            // 비율 조정
            // console.log(5050, naturalWidth, naturalHeight, naturalWidth / naturalHeight);
            // }
            setContain(containType);
            setIsLoaded(true);
          }}
          style={{
            objectFit: imageObjectFit(),
            visibility: isLoaded ? 'visible' : 'hidden',
          }}
          {...props}
        />
      );
    }

    if (fileType === 'URL' && icon === 'file') {
      return <span className={cx('ico-comm', `ico-thumb-icon16`)} />;
    }

    return <span className={cx('ico-comm', `ico-thumb-${icon}`)} />;
  };

  if (viewType === 'table') {
    // 시스템 폴더시
    if (fileType === 'FOLDER' && !userEditable) {
      return (
        <span className="wrap-ico">
          <span className={cx('ico-comm', `ico-thumb-folder2`)}>시스템 폴더</span>
        </span>
      );
    }

    const isStoryBoard = fileType === 'STORY_BOARD';
    const shouldShowThumbnail = !!renderThumbUrl || isStoryBoard;

    if (!shouldShowThumbnail) {
      let classNmText = `ico-thumb-${icon}`;
      if (fileType === 'URL' && icon === 'file') {
        classNmText = `ico-thumb-icon16`;
      }
      return (
        <span className="wrap-ico">
          <span className={cx('ico-comm', `${classNmText}`)}>확장자</span>
        </span>
      );
    }

    return (
      <span className="wrap-ico">
        <div
          style={{ ...style, width }}
          className={cx('item-thumbnail', floating && 'active', className)}
          role="button"
          tabIndex={0}
        >
          <div
            className={cx(
              'visual-thumbnail',
              icon !== 'no-image' && 'type-format',
              isHovered && 'type-dimmed',
              isContain && 'type-contain',
              visualClassName,
            )}
            style={{
              borderRadius: '4.5px',
              paddingTop: '100%',
            }}
          >
            {renderContent()}
          </div>
        </div>
      </span>
    );
  }

  return (
    <div
      ref={thumbnialRef}
      style={{
        ...style,
        width,
        cursor: onClick ? 'pointer' : 'auto',
      }}
      className={cx('item-thumbnail', floating && 'active', className)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="button"
      tabIndex={0}
      onClick={handleWrapperClick}
      onDoubleClick={onDoubleClick}
      onKeyDown={() => {}}
    >
      {head && (
        <div className="head-thumbnail">
          <strong className="title-head">{head}</strong>
          {(!favoriteHide || !dropDownHide) && (
            <div className="util-head">
              {!favoriteHide && (
                <button type="button" className={cx('btn-favorite', favorite && 'active')} onClick={onFavorite}>
                  <span className="ico-comm ico-favorite">즐겨찾기</span>
                </button>
              )}
              {!dropDownHide && (
                <div ref={menuRef}>
                  <button type="button" className={cx('btn-menu', dropDown && 'active')} onClick={onDropDown}>
                    <span className="ico-comm ico-options-vertical">메뉴</span>
                  </button>
                  {dropDown &&
                    dropDownMenu &&
                    createPortal(
                      <DropDownMenu
                        {...dropDownMenu}
                        show={dropDown}
                        direction={dropDownDirection}
                        top={positionRef.current?.top}
                        left={positionRef.current?.left}
                      />,
                      document.body,
                    )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <div className={cx('visual-thumbnail', !isLoaded && 'type-format', visualClassName)}>{renderContent()}</div>
      {!contentHideen && (
        <div className={cx(nameHidden && className === 'type-upload' ? 'screen_out' : 'content-thumbnail')}>
          {tag && <em className={cx('tag-content', `type-${tag.type}`)}>{tag.text}</em>}
          {nameEditable && (
            <Input
              id="fileName"
              ref={inputRef}
              value={inputFileName}
              maxLength={200}
              onChange={(event) => setInputFileName(event.target.value)}
              placeholder="폴더 명"
              autoFocus={inputAutoFocus}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing) return;

                const { key } = e;

                if (key === 'Enter' || key === 'Escape') {
                  e.preventDefault();
                  e.stopPropagation();
                  const name =
                    fileType !== 'FOLDER' && extension ? `${inputFileName.trim()}.${extension}` : inputFileName.trim();
                  if (key === 'Escape') {
                    makeRenameFile?.({ name, type: 'cancel' });
                  } else if (key === 'Enter' && name.trim().length > 0) {
                    if (validateFileName(name, () => inputRef.current?.focus())) return;
                    makeRenameFile?.({
                      name,
                      type: fileNameNoExtension.length > 0 ? 'rename' : 'make',
                    });
                  }
                }
              }}
            />
          )}

          {!nameEditable && isProfileImage && (
            <div className="tit-profile">
              <span
                className="thumb-profile"
                style={{
                  backgroundImage: userProfileThumbUrl ? `url(${userProfileThumbUrl})` : 'url(/images/profile.png)',
                }}
                onClick={() =>
                  router.push(`/my-board/lecture-photo${userProfileCode ? `?user=${userProfileCode}` : ''}`)
                }
                role="button"
                tabIndex={0}
                onKeyDown={() => {}}
              />
              <strong
                title={fileNameNoExtension.length > 8 ? fileNameNoExtension : ''}
                className={cx(nameHidden ? 'screen_out' : 'title-content')}
              >
                {fileNameNoExtension}
              </strong>
            </div>
          )}

          {!nameEditable && !isProfileImage && (
            <strong
              title={fileNameNoExtension.length > 8 ? fileNameNoExtension : ''}
              className={cx(nameHidden ? 'screen_out' : 'title-content')}
            >
              {fileNameNoExtension}
            </strong>
          )}

          {desc && (
            <p className="desc-content" style={descWhiteSpace && { whiteSpace: `${descWhiteSpace}` }}>
              {desc}
            </p>
          )}
          {(date || likes !== undefined || views !== undefined) && (
            <dl className="info-content">
              {date && (
                <>
                  <dt className="screen_out">날짜</dt>
                  <dd className="date-info">{dayjs(date).format(dateFormat.default)}</dd>
                </>
              )}
              {likes !== undefined && (
                <>
                  <dt>
                    <span className="ico-comm ico-heart-16">좋아요</span>
                  </dt>
                  <dd>{formatCompactNumber(likes)}</dd>
                </>
              )}
              {views !== undefined && (
                <>
                  <dt>
                    <span className="ico-comm ico-eye-16-g">조회수</span>
                  </dt>
                  <dd>{formatCompactNumber(views)}</dd>
                </>
              )}
            </dl>
          )}
        </div>
      )}
      {!head && (
        <FloatingButton
          fileName={fileNameNoExtension}
          floating={floating}
          floatingType={buttonType}
          hoverFloatingType={hoverFloatingType}
          favorite={favorite}
          isMine={isMine}
          onEdit={onEdit}
          onDownload={onDownload}
          onFavorite={onFavorite}
          onClose={onClose}
          onEditToggle={onEditToggle}
          dropDown={dropDown}
          dropDownMenu={dropDownMenu}
          dropDownDirection={dropDownDirection}
          onDropDown={onDropDown}
          isEditActive={isEditActive}
          fileType={fileType}
          onBadge={onBadge}
          showIndexOnCheck={showIndexOnCheck}
          showNumber={showNumber}
          hover={hover}
          folderCheckBox={folderCheckBox}
          userEditable={userEditable}
        />
      )}
      {head && hover && <div className="util-thumbnail" />}
      {children}
    </div>
  );
};

Thumbnail.displayName = 'Thumbnail';
