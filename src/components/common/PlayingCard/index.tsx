import { useAddItem, useRejectRecommendationItem, useStarred } from '@/service/file/fileStore';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { ParsedRecommendedPlayingCardData } from '@/app/work-board/(protected)/playing-plan/utils/extractRecommendedPlayingCardData/types';
import type React from 'react';
import { DownloadModal, ShareLinkModal } from '@/components/modal';
import type { SmartFolderItemResult } from '@/service/file/schemas';
import cx from 'clsx';
import getColorByAiGenerationFocusType from '@/utils/getColorByAiGenerationFocusType';
import getIndoorOrOutdoorIcon from '@/utils/DragAndDrop/getIndoorOrOutdoorIcon';
import { useDrag } from 'react-dnd';
import { useHandleFile } from '@/hooks/useHandleFile';
import { useToast } from '@/hooks/store/useToastStore';
import useUserStore from '@/hooks/store/useUserStore';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import { createPortal } from 'react-dom';
import { IP_ADDRESS } from '@/const';
import { useHomeWidgetListStore } from '@/hooks/store/useHomeWidgetListStore';
import { KebabMenu } from '../KebabMenu';

// 상수로 분리하여 타입 안전성 및 재사용성 향상
const FOLDER_TYPE = {
  LECTURE_PLAN: 'LECTURE_PLAN',
} as const;

export function PlayingCard({
  playingCardData,
  onFetch,
  onRemove,
}: {
  playingCardData: ParsedRecommendedPlayingCardData;
  onFetch?: () => void;
  onRemove?: (id: number, driveItemKey: string) => void;
}) {
  const [isShareLinkModalOpen, setIsShareLinkModalOpen] = useState(false);
  const [shareLinkModalItem, setShareLinkModalItem] = useState<any | null>();

  const [openMenu, setOpenMenu] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [openDownloadMenu, setOpenDownloadMenu] = useState<boolean>(false);

  /* 선택한 폴더에 저장 & 이동 & 복사 */
  const [currentAction, setCurrentAction] = useState<'save' | 'copy' | null>(null);
  const [currentActionItem, setCurrentActionItem] = useState<SmartFolderItemResult | null>(null);

  // 파일 저장 (다운로드 모달)
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  // 체크 박스 핸들링
  const [selectedItems, setSelectedItems] = useState<SmartFolderItemResult[]>([]);

  const { handleSave, handleCopy } = useHandleFile();

  /*
   * 다운로드 모달 닫기
   */
  const handleCloseDownloadModal = () => {
    setIsDownloadModalOpen(false);
  };

  /*
   * 다운로드 저장 버튼 클릭시
   */
  const initCurrentAction = useCallback(() => {
    setCurrentAction(null);
    setCurrentActionItem(null);
    // refetch();
  }, []);

  const handleFileData = useCallback(
    (selectFolder: SmartFolderItemResult | null, pathString?: string) => {
      if (!selectFolder) return;
      if (currentAction === 'save') {
        handleSave(selectFolder, [currentActionItem?.driveItemKey || ''], pathString).then(() => {
          initCurrentAction();
        });
      }
      if (currentAction === 'copy') {
        handleCopy(selectFolder, [currentActionItem?.id || 0], 'EducationalData', pathString).then(() => {
          initCurrentAction();
        });
      }
    },
    [currentAction, currentActionItem, handleCopy, handleSave, initCurrentAction],
  );
  const handleConfirmDownloadModal = (selectFolder?: SmartFolderItemResult | null, pathString?: string) => {
    if (selectFolder) {
      handleFileData(selectFolder, pathString);
    }
    handleCloseDownloadModal();
  };

  // 토스트 메시지
  const addToast = useToast((state) => state.add);

  /**
   * * 드래그 옵션 추가
   * ! 추천 놀이카드에서만 사용
   * ! 추천 놀이카드에 대한 분기처리가 안되어있어서 selectedIds 값 임시로 추가하였음 (다른곳의 에러 해결차)
   */
  const draggedCardRef = useRef<HTMLDivElement | null>(null);
  const [{ isDragging }, dragRef] = useDrag({
    type: 'PLAYING_CARD',
    item: {
      playingCardData,
      selectedIds: playingCardData.recommendedPlayingCardId,
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  // 드래그할 요소에 대한 참조를 전달
  dragRef(draggedCardRef);

  /**
   * * 케밥 메뉴
   */
  const handleKebabMenuClose = () => {
    setOpenMenu(false);
    setOpenDownloadMenu(false);
  };

  /**
   * * 공유 관리리 모달
   */

  const handleClickShareLinkButton = (item: any) => {
    setShareLinkModalItem(item);
    setIsShareLinkModalOpen(true);
  };

  const handleCloseShareLinkModal = () => {
    setShareLinkModalItem(null);
    setIsShareLinkModalOpen(false);
  };

  /**
   * * 다시 추천받지 않기
   */
  const { mutate: doNotRecommendAgain, isPending: doNotRecommendationAgainIsPending } = useRejectRecommendationItem();
  const handleDoNotRecommendAgain = () => {
    doNotRecommendAgain(
      {
        data: {
          // Swagger상에는 필수값이라고 나와있으나, orval로 가져온 schemas상에는 프로퍼티가 존재하지 않음.
          // request body에서 accountId & profileId를 제거한 부분 > orval.config.ts 참고
          // profileId: userInfo?.id,
          driveItemKey: playingCardData.driveItemKey,
        },
      },
      {
        onSuccess: (response) => {
          /**
           * * 다시 추천받지 않기 성공
           */
          console.log('다시 추천받지 않기 성공:', response);

          if (onRemove) {
            onRemove(playingCardData.recommendedPlayingCardId, playingCardData.driveItemKey);
          }
          // TODO: "해당 자료를 더 이상 추천하지 않습니다."로 변경해야 합니다.
          addToast({ message: '다시 추천받지 않습니다.' });
        },
        onError: (error) => {
          console.error('다시 추천받지 않기 실패:', error);
        },
      },
    );
  };

  /**
   * * 케밥 메늄 > 다른이름으로 저장
   */
  const { showAlert } = useAlertStore();

  const handleDownload = (type: 'save' | 'copy', item?: SmartFolderItemResult) => {
    if (!item) {
      showAlert({ message: '파일 다운로드를 실패했습니다.' });
      return;
    }
    setCurrentAction(type);
    const itemWithName = { ...item, name: (item as any).fileName };

    setCurrentActionItem(itemWithName);
    setIsDownloadModalOpen(true);
  };

  const cardMenu = [
    {
      path: 'share-management',
      text: '공유관리',
      action: () => {
        // 공유 관리 모달 열기
        handleClickShareLinkButton(playingCardData as unknown as SmartFolderItemResult);
        // 메뉴 닫기
        setOpenMenu(false);
      },
    },
    {
      path: 'do-not-recommend-again',
      text: '다시 추천받지 않기',
      action: () => {
        // 다시 추천받지 않기
        handleDoNotRecommendAgain();

        // 메뉴 닫기
        setOpenMenu(false);
      },
    },
    {
      path: 'save',
      text: '다른 위치에 저장',
      action: () => {
        handleDownload('save', playingCardData as unknown as SmartFolderItemResult);

        // 메뉴 닫기
        setOpenMenu(false);
      },
    },
  ];

  // 나머지
  const imgUrl = '/images/profile.png';
  const [hover, setHover] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const handleMouseOver = () => {
    setHover(true);
  };
  const handleMouseOut = () => {
    if (isChecked) {
      setHover(true);
    } else {
      setHover(false);
    }
  };
  // const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
  //   setIsChecked(e.target.checked);
  // };

  /**
   * * 즐겨찾기
   * ! optimistic UI pattern 적용
   */
  const { userInfo } = useUserStore();
  const router = useRouter();

  // 초기 즐겨찾기 상태 (API에서 받은 현재 상태로 초기화하면 더 좋음)
  const [isBookmarked, setIsBookmarked] = useState(false);

  // API 실패 케이스 처리를 위한 pending
  const [isBookmarkPending, setIsBookmarkPending] = useState(false);

  // 즐겨찾기 API 훅 사용
  const { mutate: toggleBookmark, isPending: isTogglingBookmark } = useStarred();
  const handleBookmark = useCallback(() => {
    if (!userInfo || isTogglingBookmark) return;

    // API request 실패시 이전 상태로 복원하기 위해 이전 상태 저장
    const previousState = isBookmarked;

    // 낙관적으로 UI 업데이트
    setIsBookmarked(!isBookmarked);
    setIsBookmarkPending(true);

    toggleBookmark(
      {
        data: {
          driveItemKey: playingCardData.driveItemKey,
        },
      },
      {
        onSuccess: (response) => {
          // API 호출 성공 시, 결과 값으로 즐겨찾기 상태 업데이트
          if (response?.result !== undefined && response.result !== !previousState) {
            setIsBookmarked(response.result);
          }
          setIsBookmarkPending(false);
        },
        onError: (error) => {
          console.error('즐겨찾기 설정 중 오류 발생:', error);

          // API 호출 실패 시, 이전 상태로 복원
          setIsBookmarked(previousState);
          setIsBookmarkPending(false);
        },
      },
    );
  }, [isBookmarked, toggleBookmark, isTogglingBookmark, playingCardData.driveItemKey, userInfo]);

  /**
   * * 추천 카드 > (저장 이모지 클릭을 통해) 스마트폴더에 저장
   * ! 1) API 요청시 필요한 Id값을 받아오는 로직, 2) 실제 저장 함수 => 총 2개의 메서드가 사용됨
   */

  // 스마트 폴더에 자료 추가 API 요청시 사용될 Id값 받아오기
  // const { data } = useGetWidgetFolders();
  const { homeWidgetList } = useHomeWidgetListStore();

  // useMemo로 계산 결과 캐싱 - 불필요한 재계산 방지 (lecturePlanFolderId는 저장 API상 targetFolderId로 사용됨)
  const lecturePlanFolderId = useMemo(
    () => homeWidgetList?.find((item) => item.rootType === FOLDER_TYPE.LECTURE_PLAN),
    [homeWidgetList],
  )?.id;

  // 실제로 스마트폴더에 저장하는 함수
  const { mutate: saveCardToPlayingPlanFolder, isPending: isSavingCardToPlayingPlanFolder } = useAddItem();

  const handleSavingCardInSmartFolder = useCallback(() => {
    if (!lecturePlanFolderId) {
      console.error('놀이계획서 폴더를 찾을 수 없습니다');
      return;
    }

    // mutate 함수 호출
    saveCardToPlayingPlanFolder(
      {
        data: {
          folderOwnerAccountId: userInfo?.accountId as number,
          folderOwnerProfileId: userInfo?.id as number,
          folderOwnerIp: IP_ADDRESS,
          targetSmartFolderApiType: 'EducationalData',
          targetFolderId: lecturePlanFolderId,
          originalDriveItemKeys: [playingCardData.driveItemKey],
        },
      },
      {
        onSuccess: (response) => {
          addToast({
            message: `저장되었습니다. <br />스마트 폴더 &gt; 자료 &gt; 놀이계획서`,
          });
          console.log('저장 성공:', response);
        },
        onError: (error) => {
          addToast({ message: '저장 실패' });
          console.error('저장 실패:', error);
        },
      },
    );
  }, [
    saveCardToPlayingPlanFolder,
    lecturePlanFolderId,
    playingCardData.driveItemKey,
    userInfo?.accountId,
    userInfo?.id,
    addToast,
  ]);

  const handleHoverStart = () => {
    setHover(true);
  };

  const handleHoverEnd = () => {
    if (isChecked) {
      setHover(true);
    } else {
      setHover(false);
    }
  };

  // 놀이카드 클릭 시 상세 보기 페이지로 이동
  const handleCardClick = useCallback(
    (e?: React.MouseEvent | React.KeyboardEvent) => {
      if (e && 'clientX' in e) {
        // 클릭한 요소가 버튼이나 특정 영역인지 확인
        const target = e.target as HTMLElement;

        // 즐겨찾기, 저장, 메뉴 버튼 또는 그 자식 요소인지 확인
        if (
          target.closest('.btn-favorite') ||
          target.closest('.btn-download') ||
          target.closest('.wrap-menu') ||
          target.closest('.thumb-profile') ||
          openMenu // 메뉴가 열려있는 경우에도 라우팅 방지
        ) {
          return; // 특정 버튼 영역이면 라우팅하지 않음
        }

        // API에서 받은 데이터가 존재하는지 확인
        if (playingCardData?.driveItemKey) {
          const { smartFolderApiType, smartFolderItemId } = playingCardData;

          router.push(`/preview?smartFolderItemId=${smartFolderItemId}&smartFolderApiType=${smartFolderApiType}`);
        }
      }
    },
    [playingCardData, router, openMenu],
  );

  // 키보드 이벤트 핸들러
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.stopPropagation(); // 이벤트 전파 방지
      e.preventDefault(); // 기본 동작 방지
      // 클릭 이벤트 핸들러 호출
      handleCardClick(e);
    }
  };

  return (
    <>
      <div
        className={cx('item-card item-card-ready ', hover && 'item-card-upper')}
        ref={draggedCardRef}
        onMouseOver={handleHoverStart}
        onFocus={handleHoverStart}
        onMouseOut={handleHoverEnd}
        onBlur={handleHoverEnd}
        onClick={handleCardClick} // 클릭 이벤트 추가
        onKeyDown={handleKeyDown}
        onMouseLeave={handleKebabMenuClose}
        tabIndex={0} // 키보드 포커스 가능
        role="button" // 접근성 향상
        aria-pressed={isChecked} // 현재 선택 상태를 나타내는 속성
        style={{ cursor: 'pointer' }} // 마우스 오버시 커서 변경
      >
        <div className="visual-card">
          <div className={cx(getColorByAiGenerationFocusType(playingCardData.aiGenerationFocusType) || 'inner-card')}>
            <div className="head-card">
              <span className="thumbnail-head">
                <span className={cx('ico-comm', getIndoorOrOutdoorIcon(playingCardData.indoorOrOutdoor))} />
              </span>
              <strong className="title-head">{playingCardData.recommendedPlayingCardSubject}</strong>
            </div>
            <div className="content-card">
              <ul className="info-list">
                {playingCardData.activityContentsList.map((content: string) => (
                  <li key={content}>{content}</li>
                ))}
              </ul>
            </div>

            <div className="info-card">
              {/* 놀이 나이 & 놀이 연령 */}
              <div className="badge-info">
                <span className="badge">
                  <span className="badge-text">{playingCardData.activityAgeWithHangulSuffix}</span>
                </span>
                <span className="badge">
                  <span className="badge-text">{playingCardData.activityTimeWithHangulSuffix}</span>
                </span>
              </div>

              <div className="util-info">
                {/* 즐겨찾기 클릭여부에 따른 active 적용여부 전환 필요 */}
                <button
                  type="button"
                  className={cx('btn-favorite', isBookmarked && 'active')}
                  disabled={isBookmarkPending}
                  onClick={handleBookmark}
                >
                  <span className="ico-comm ico-favorite-20">즐겨찾기</span>
                </button>
                <div className="wrap-menu">
                  <button
                    type="button"
                    className={cx('btn-download', openDownloadMenu && 'active')}
                    onClick={handleSavingCardInSmartFolder}
                  >
                    <span className="ico-comm ico-download-20">다운로드</span>
                  </button>
                </div>
                <div className="wrap-menu">
                  <button
                    type="button"
                    className={cx('btn-menu', openMenu && 'active')}
                    onClick={() => setOpenMenu(!openMenu)}
                  >
                    <span className="ico-comm ico-options-vertical-20-g">메뉴</span>
                  </button>
                  <KebabMenu
                    ref={menuRef}
                    list={cardMenu}
                    show={openMenu}
                    onOpen={() => setOpenMenu(true)}
                    onClose={() => setOpenMenu(false)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* 프로필 영역 */}
        <div className="profile-card">
          <span
            className="thumb-profile"
            style={{
              backgroundImage: `url(${playingCardData.profileImageUrl || imgUrl})`,
            }}
            onClick={() =>
              router.push(
                `/my-board/lecture-photo${playingCardData.profileCode ? `?user=${playingCardData.profileCode}` : ''}`,
              )
            }
            role="button"
            tabIndex={0}
            onKeyDown={() => {}}
          />
          <em className="name-profile">{playingCardData.profileName}</em>
          <dl className="info-profile">
            <dt>
              <span className="ico-comm ico-heart-16">좋아요</span>
            </dt>
            <dd>{playingCardData.numOfLike}</dd>
            <dt>
              <span className="ico-comm ico-eye-16-g">조회수</span>
            </dt>
            <dd>{playingCardData.numOfViews}</dd>
          </dl>
        </div>
      </div>

      {/* 모달
      {isShareLinkModalOpen && (
        <ShareLinkModal item={shareLinkModalItem} onCloseRefetch={onFetch} onCancel={handleCloseShareLinkModal} />
      )} */}
      {isShareLinkModalOpen &&
        createPortal(
          <ShareLinkModal item={shareLinkModalItem} onCloseRefetch={onFetch} onCancel={handleCloseShareLinkModal} />,
          document.getElementById('modal-root') || document.body,
        )}
      {isDownloadModalOpen && (
        <DownloadModal
          isOpen={isDownloadModalOpen}
          itemData={currentActionItem ? [currentActionItem] : []}
          onCancel={handleCloseDownloadModal}
          onConfirm={handleConfirmDownloadModal}
          action={currentAction}
        />
      )}
    </>
  );
}
