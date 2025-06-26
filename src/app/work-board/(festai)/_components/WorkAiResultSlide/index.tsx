'use client';

import React, { useCallback, useEffect, useMemo, useState, memo, useRef, Children } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Navigation, Pagination } from 'swiper/modules';
import type { PaginationOptions } from 'swiper/types';
import Image from 'next/image';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/navigation';
import cx from 'clsx';
import { DownloadModal } from '@/components/modal';
import { getIncludedPhotoItems, moveItem1, moveItemToTrash1 } from '@/service/file/fileStore';
import { SmartFolderItemResult } from '@/service/file/schemas';
import { useToast } from '@/hooks/store/useToastStore';
import { useHandleFile } from '@/hooks/useHandleFile';
import { IActionButton } from '@/components/common/FloatingMenu/types';
import { ShareLinkModal } from '@/components/modal/share-link';
import { prefix } from '@/const';
import { useRouter } from 'next/navigation';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import { debounce } from '@/utils';
import { useFileContext } from '@/context/fileContext';

const SWIPER_CONFIG = {
  COVERFLOW_EFFECT: {
    rotate: 0,
    stretch: 0, // 조정
    depth: 200, // 증가
    modifier: 3.14, // 1.5배 크기로 조정
    slideShadows: false,
  },
  NAVIGATION: {
    prevEl: '.preview_fastAi_prev',
    nextEl: '.preview_fastAi_next',
  },
};

const BG_COLORS: Record<'face' | 'edit' | 'sort', string> = {
  sort: '#E5E7EC', // '#f8e9eb',
  face: '#E5E7EC', // '#E2F1EB',
  edit: '#E5E7EC', // '#E2F0FB',
};

const CONSTANTS = {
  PAGINATION: { INITIAL_OFFSET: 0, LIMIT: 19 },
};

interface WorkAiResultSlideProps {
  type: 'face' | 'edit' | 'sort';
  onClosePreview: () => void;
  folderId: string;
  folderName: string;
  onScrollMove?: () => void;
  hasErrorMessage?: boolean;
}

const WorkAiResultSlideClient: React.FC<WorkAiResultSlideProps> = ({
  type,
  onClosePreview,
  folderId,
  folderName,
  onScrollMove,
  hasErrorMessage,
}) => {
  const router = useRouter();
  const { showAlert } = useAlertStore();
  const [images, setImages] = useState<SmartFolderItemResult[]>([]);
  const [offset, setOffset] = useState(CONSTANTS.PAGINATION.INITIAL_OFFSET);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const { handleSave, handleMove, handleCopy } = useHandleFile();
  const [currentAction, setCurrentAction] = useState<'COPY' | 'MOVE' | 'SAVE' | null>(null);
  const [currentActionItem, setCurrentActionItem] = useState<SmartFolderItemResult | null>(null);
  const [folderNameText, setFolderNameText] = useState<string>('');
  const [currentActionIdx] = useState(0);
  const currentActionIndexRef = useRef(currentActionIdx);

  // 폴더 데이터(다운로드 모달 관련)와 alert/toast
  const addToast = useToast((state) => state.add);
  const swiperRef = useRef<any>(null);

  // images가 존재하는지 여부
  const hasImages = images.length > 0;
  const currentItem = useMemo(() => (hasImages ? images[currentIndex] : null), [images, currentIndex, hasImages]);

  // 헤더 스크롤 중지 이벤트
  const { handleStopHeaderScroll: setStopHeaderScroll } = useFileContext();

  // 초기 이미지 로드 로직을 useCallback으로 분리
  const loadInitialImages = useCallback(async (): Promise<any> => {
    if (!folderId) {
      return 0;
    }

    setIsLoading(true);
    try {
      const limit =
        currentActionIndexRef.current > CONSTANTS.PAGINATION.LIMIT
          ? CONSTANTS.PAGINATION.LIMIT + offset * (CONSTANTS.PAGINATION.LIMIT + 1)
          : CONSTANTS.PAGINATION.LIMIT;
      const { result } = await getIncludedPhotoItems(folderId, {
        offsetWithLimit: `${CONSTANTS.PAGINATION.INITIAL_OFFSET},${limit}`,
        sorts: 'createdAt.desc',
      });

      if (result && result.length > 0) {
        if (currentActionIndexRef.current <= CONSTANTS.PAGINATION.LIMIT) {
          await setOffset(0);
        }
        setCurrentIndex(0);
        await setImages(result);
        if (swiperRef?.current?.slideTo) {
          if (currentActionIndexRef.current < 1) {
            swiperRef.current.slideTo(0, 0);
          } else {
            setCurrentIndex(currentActionIndexRef.current);
            swiperRef.current.slideTo(currentActionIndexRef.current, 300);
            currentActionIndexRef.current = 0;
          }
        }
        onScrollMove?.();
        return result;
      }

      if (!result || result.length === 0) {
        if (hasErrorMessage) {
          addToast({ message: '폴더에 등록된 이미지가 없습니다.' });
        }
      }
      return 0;
    } catch (error) {
      console.error('초기 이미지 로드 에러:', error);
      if (hasErrorMessage) {
        addToast({ message: '이미지 로드 중 오류가 발생했습니다.' });
      }
      return 0;
    } finally {
      await setIsLoading(false);
      setTimeout(async () => {
        await setStopHeaderScroll(false);
      }, 400);
    }
  }, [addToast, folderId, hasErrorMessage, offset, onScrollMove, setStopHeaderScroll]);

  const debounceLoadInitalImages = useMemo(() => {
    const callBack = async () => {
      await setStopHeaderScroll(true);
      setImages([]);
      setFolderNameText(folderName);
      loadInitialImages();
    };
    return debounce(callBack, 200);
  }, [folderName, setStopHeaderScroll, loadInitialImages]);

  // 최초 로드: folderId 변경 시 loadInitialImages 호출
  useEffect(() => {
    debounceLoadInitalImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId]);

  // 추가 이미지 로드
  const handleLoadMore = useCallback(async () => {
    if (!folderId || isLoading) return;
    const newOffset = offset + 1;
    setIsLoading(true);
    try {
      const { result } = await getIncludedPhotoItems(folderId, {
        offsetWithLimit: `${newOffset},${CONSTANTS.PAGINATION.LIMIT}`,
        sorts: 'createdAt.desc',
      });
      if (result?.length) {
        setOffset(newOffset);
        setImages((prev) => [...prev, ...result]);
      }
    } catch (error) {
      console.error('추가 이미지 로드 에러:', error);
    } finally {
      setIsLoading(false);
    }
  }, [folderId, offset, isLoading]);

  // 이벤트 핸들러들
  const handleCloseModal = useCallback(() => {
    onClosePreview();
  }, [onClosePreview]);

  // 슬라이드 클래스를 적용
  const applySlideClasses = useCallback((swiper: any) => {
    if (!swiper) return false;

    const { slides } = swiper;
    if (!slides || slides.length === 0) return false;

    // 1. 모든 슬라이드에서 기존 클래스 제거
    slides.forEach((slide: HTMLElement) => {
      slide.classList.remove('prev-slide', 'prev-prev-slide', 'next-slide', 'next-next-slide', 'no-show-slide');
    });

    const { activeIndex } = swiper;

    // 2. 모든 슬라이드를 순회하면서 거리 계산해서 클래스 추가
    slides.forEach((slide: HTMLElement, index: number) => {
      const distance = index - activeIndex;

      if (distance === -1) {
        slide.classList.add('prev-slide');
      } else if (distance === -2) {
        slide.classList.add('prev-prev-slide');
      } else if (distance === 1) {
        slide.classList.add('next-slide');
      } else if (distance === 2) {
        slide.classList.add('next-next-slide');
      } else if (Math.abs(distance) > 2) {
        // 중앙에서 2칸 이상 떨어진 모든 슬라이드 숨기기
        slide.classList.add('no-show-slide');
      }
    });

    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // handleSlideChange에서 applySlideClasses 사용
  const handleSlideChange = useCallback(
    (swiper: any) => {
      setCurrentIndex(swiper.realIndex);
      applySlideClasses(swiper);
    },
    [applySlideClasses],
  );

  // 최초 로드 및 이미지 변경 시 클래스 적용을 위한 useEffect
  useEffect(() => {
    if (swiperRef.current && images.length > 0) {
      // 약간의 지연을 주어 Swiper가 완전히 렌더링된 후 클래스 적용
      const timer = setTimeout(() => {
        applySlideClasses(swiperRef.current.swiper);
      }, 100);

      return () => clearTimeout(timer);
    }
    return () => {};
  }, [images, applySlideClasses]);

  const handleReachEnd = useCallback(() => {
    handleLoadMore();
  }, [handleLoadMore]);

  const handleSlideClick = useCallback(
    (idx: number) => {
      // 센터클릭 아닐경우는 이동시키고
      if (swiperRef.current?.realIndex !== idx) {
        swiperRef.current.slideTo(idx);
        // 센터 슬라이드 일 경우에는 이제 상세 레이어 띄우기
      } else {
        if (images.length === 0) {
          showAlert({ message: '사진을 불러오지 못하였습니다.<br/>다시 시도해주세요.' });
          return false;
        }
        const { id, smartFolderApiType: apiType } = images[idx];
        router.push(`${prefix.preview}?smartFolderItemId=${id}&smartFolderApiType=${apiType}`);
      }
      return null;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [images],
  );

  // 삭제 함수 (handleDeleteItem) : 이미지 삭제 후 재로딩 처리
  const handleDeleteItem = useCallback(async () => {
    try {
      await moveItemToTrash1({
        itemList: [
          {
            smartFolderApiType: currentItem?.smartFolderApiType || 'Photo',
            itemId: currentItem?.id || 0,
          },
        ],
      });

      currentActionIndexRef.current = currentIndex;
      const currentSlideImageList = await loadInitialImages();

      if (currentSlideImageList.length > 0) {
        addToast({ message: '이미지가 휴지통으로 이동되었습니다.' });
      } else {
        handleCloseModal();
        addToast({ message: '폴더내에 이미지가 전부 삭제되었습니다.' });
      }
      console.log('옴메야 들어노ㅑ', currentSlideImageList);
    } catch (error) {
      console.error('삭제 에러:', error);
      addToast({ message: '이미지 삭제에 실패했습니다.' });
    }
  }, [currentItem?.smartFolderApiType, currentItem?.id, currentIndex, loadInitialImages, addToast, handleCloseModal]);

  // Swiper pagination 옵션 최적화
  const paginationConfig = useMemo<PaginationOptions>(
    () => ({
      el: '.count-slider',
      clickable: true,
      type: 'custom',
      renderCustom: (swiper, current, total) => `
        <span class="screen_out">현재 슬라이드</span>
        <span class="current-count">${current}</span> / 
        <span class="screen_out">전체 슬라이드</span> ${total}
      `,
    }),
    [],
  );

  // Swiper 렌더링을 메모이제이션하여 불필요한 재렌더링 최소화
  const memoizedSwiper = useMemo(() => {
    return (
      <Swiper
        // grabCursor={true}
        effect="coverflow"
        spaceBetween={100}
        centeredSlides
        initialSlide={currentIndex} //
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        slidesPerView={2.35}
        coverflowEffect={SWIPER_CONFIG.COVERFLOW_EFFECT}
        pagination={paginationConfig}
        modules={[EffectCoverflow, Navigation, Pagination]}
        onSlideChange={handleSlideChange}
        onReachEnd={handleReachEnd}
        navigation={SWIPER_CONFIG.NAVIGATION}
        // draggable={false}
        className="fastAiSlide"
        onInit={(swiper) => {
          // 초기화 시 클래스 적용
          applySlideClasses(swiper);
        }}
        onAfterInit={(swiper) => {
          // 초기화 후에도 클래스 적용 (안전장치)
          applySlideClasses(swiper);
        }}
        onTransitionEnd={(swiper) => {
          // 슬라이드 전환 후 클래스 재적용
          applySlideClasses(swiper);
        }}
      >
        {Children.toArray(
          images.map((image, idx) => (
            <SwiperSlide onClick={() => handleSlideClick(idx)} className="fastAiResultSlide fastAiSliderItem">
              <div className="wrap-img">
                <img src={image.thumbUrl || ''} alt={image.name || '이미지'} loading="lazy" />
              </div>
            </SwiperSlide>
          )),
        )}
      </Swiper>
    );
  }, [currentIndex, paginationConfig, handleSlideChange, handleReachEnd, images, applySlideClasses, handleSlideClick]);

  // 다운로드 모달 핸들러 - 처리 완료 후 loadInitialImages() 호출하여 이미지 재로딩
  // const handleConfirmDownloadModal = useCallback(
  //   async (selectFolder?: SmartFolderItemResult | null) => {
  //     console.log('선택한 폴더:', selectFolder);
  //     console.log('현재 아이템:', currentItem);
  //     if (selectFolder && currentItem) {
  //       const {
  //         ownerAccountId: itemOwnerAccountId,
  //         ownerProfileId: itemOwnerProfileId,
  //         id: targetParentId,
  //       } = selectFolder;
  //       await moveItem1({
  //         itemOwnerAccountId,
  //         itemOwnerProfileId,
  //         targetSmartFolderApiType: 'UserFolder',
  //         targetFolderId: targetParentId,
  //         originalSmartFolderApiType: 'Photo',
  //         originalItemIds: currentItem?.id !== undefined ? [currentItem.id] : [],
  //       });
  //       addToast({ message: `${selectFolder?.name} 폴더로 이동되었습니다.` });
  //     }
  //     setIsDownloadModalOpen(false);
  //     // 다운로드 모달 처리 후 이미지를 재로딩하여 최신 상태로 갱신
  //     loadInitialImages();
  //   },
  //   [currentItem, addToast, loadInitialImages],
  // );

  const initCurrentAction = useCallback(() => {
    setCurrentAction(null);
    setCurrentActionItem(null);
    loadInitialImages();
  }, [loadInitialImages]);

  /* 다운로드 모달 열기 */
  const handleOpenDownloadModal = () => {
    setIsDownloadModalOpen(true);
  };

  /* 다운로드 모달 닫기 */
  const handleCloseDownloadModal = () => {
    setIsDownloadModalOpen(false);
  };

  const handleActionItems = useCallback((action: 'COPY' | 'MOVE' | 'SAVE', item?: SmartFolderItemResult) => {
    handleOpenDownloadModal();
    setCurrentAction(action);
    if (item) setCurrentActionItem(item);
  }, []);

  /* 다운로드 저장 버튼 클릭시 */
  const handleConfirmDownloadModal = async (targetFolder?: SmartFolderItemResult | null, pathString?: string) => {
    // await handleFileData(targetFolder, pathString);
    if (!targetFolder || !currentActionItem) return;

    console.log('탁엨 폴더', targetFolder);

    const finalize = () => {
      initCurrentAction();
      handleCloseDownloadModal();
    };

    if (currentAction === 'SAVE') {
      handleSave(targetFolder, [currentActionItem?.driveItemKey], pathString).then(finalize);
      return;
    }

    if (currentAction === 'MOVE') {
      handleMove(targetFolder, currentActionItem?.id, 'Photo', pathString).then(finalize);
      return;
    }

    if (currentAction === 'COPY') {
      handleCopy(targetFolder, currentActionItem?.id, 'Photo', pathString).then(finalize);
    }
  };

  // 공유 관리 모달
  const [isShareLinkModalOpen, setIsShareLinkModalOpen] = useState(false);
  const [shareLinkModalItem, setShareLinkModalItem] = useState<SmartFolderItemResult | null>();

  const handleClickShareLinkButton = (item: SmartFolderItemResult) => {
    setShareLinkModalItem(item);
    setIsShareLinkModalOpen(true);
  };

  const handleCloseShareLinkModal = () => {
    setShareLinkModalItem(null);
    setIsShareLinkModalOpen(false);
  };

  const menuList = useMemo(() => {
    if (!currentItem) return [];

    const MOVE_BUTTON: IActionButton = {
      key: 'move',
      label: '이동',
      action: () => {
        handleActionItems('MOVE', currentItem);
      },
    };

    const DELETE_BUTTON: IActionButton = {
      key: 'delete',
      label: '삭제',
      action: () => handleDeleteItem(),
    };

    const SAVE_BUTTON: IActionButton = {
      key: 'save',
      label: '저장',
      action: () => {
        handleActionItems('SAVE', currentItem);
      },
    };

    const SHARE_BUTTON: IActionButton = {
      key: 'share',
      label: '공유',
      action: () => handleClickShareLinkButton(currentItem),
    };

    return [SAVE_BUTTON, MOVE_BUTTON, DELETE_BUTTON, SHARE_BUTTON];
  }, [currentItem, handleActionItems, handleDeleteItem]);

  // 최적화를 위해 Swiper 렌더링은 memoizedSwiper로 분리하고 나머지 UI는 안정적으로 유지
  if (!hasImages && !isLoading) return null;

  return (
    <div className="group-content" id="ai_fast_result" style={{ margin: 0, padding: 0, border: 0, minHeight: '415px' }}>
      <div className="item-slider" style={{ background: BG_COLORS[type] }}>
        <div className="count-slider" />
        <button type="button" onClick={handleCloseModal} className="btn-close">
          <span className="ico-comm ico-close-20">슬라이드 닫기</span>
        </button>

        <p className="title_preview_slide">{folderNameText}</p>

        <div className="button-group" style={{ marginBottom: '1rem', textAlign: 'center' }}>
          <button
            type="button"
            className={cx(
              'preview_fastAi_prev',
              'btn-prev',
              'btn-util',
              'btn-slider',
              images?.length === 0 && 'slide-image-button-disabled',
            )}
            aria-label="이전 이미지"
          >
            <span className="ico_fast_arw arw_left" aria-hidden />
          </button>
          <button
            type="button"
            className={cx(
              'preview_fastAi_next',
              'btn-next',
              'btn-util',
              'btn-slider',
              images?.length === 0 && 'slide-image-button-disabled',
            )}
            aria-label="다음 이미지"
          >
            <span className="ico_fast_arw arw_right" aria-hidden />
          </button>
        </div>

        {images.length === 0 ? (
          <div
            style={{
              display: 'flex',
              position: 'relative',
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: '32.25%',
            }}
          >
            <div
              className="slide-loading-box"
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Image src="/images/loading_img.svg" alt="" className="img-loading" priority width={24} height={24} />
            </div>
          </div>
        ) : (
          memoizedSwiper
        )}

        <div className="util-slider">
          <div className="group-btn">
            {menuList && menuList.length > 0 ? (
              menuList.map((item) => (
                <button key={item.key} type="button" className="btn-util" onClick={item.action}>
                  {item.label}
                </button>
              ))
            ) : (
              <div style={{ minHeight: '34px' }} />
            )}
          </div>
        </div>
      </div>
      {isDownloadModalOpen && (
        <DownloadModal
          isOpen={isDownloadModalOpen}
          itemData={currentItem ? [currentItem] : images}
          onCancel={() => setIsDownloadModalOpen(false)}
          onConfirm={handleConfirmDownloadModal}
          action={currentAction}
        />
      )}

      {isShareLinkModalOpen && <ShareLinkModal item={shareLinkModalItem} onCancel={handleCloseShareLinkModal} />}
    </div>
  );
};

export default memo(WorkAiResultSlideClient);
