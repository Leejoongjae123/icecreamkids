'use client';

import React, { useState, useCallback } from 'react';
import { useDrag } from 'react-dnd';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { Thumbnail } from '@/components/common';
import {
  LecturePlanResult,
  SmartFolderItemResultSmartFolderApiType,
  SmartFolderItemResult,
} from '@/service/file/schemas';
import { IDropDownMenu } from '@/components/common/Thumbnail/_components/DropDownMenu/types';
import { isEmpty } from '@/utils';
import { useRouter } from 'next/navigation';
import { useStarred } from '@/service/file/fileStore';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import { DownloadModal, ShareLinkModal } from '@/components/modal';
import useUserStore from '@/hooks/store/useUserStore';
import { useBeforeLeavePagePrevent } from '@/hooks/useBeforeLeavePagePrevent';

export interface DragItem {
  type: string;
  id?: number;
  index: number;
  referencePlanCardId?: number; // Changed from playCardId
  playCardName?: string;
  referenceMemoKey?: string; // Changed from memoCardId
  playCardId?: number;
  memoCardId?: number;
  [key: string]: any;
}

interface IDraggablePlayCardProps {
  playCardList: LecturePlanResult[];
  prev: string;
  next: string;
  onUpdate: () => void;
  openPreviewLayer: (id: number, type: string) => void;
}

const DraggablePlayCard: React.FC<IDraggablePlayCardProps> = ({
  prev,
  next,
  playCardList,
  onUpdate,
  openPreviewLayer,
}) => {
  const showAlert = useAlertStore((state) => state.showAlert);
  const router = useRouter();
  const { mutateAsync: starred } = useStarred();
  const [openDropDownId, setOpenDropDownId] = useState<number | null>(null);
  const { userInfo } = useUserStore();

  // 모달 관련 상태
  const [isShareLinkModalOpen, setIsShareLinkModalOpen] = useState<boolean>(false);
  const [shareLinkModalItem, setShareLinkModalItem] = useState<SmartFolderItemResult | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);
  const [currentActionItem, setCurrentActionItem] = useState<SmartFolderItemResult | null>(null);

  // useBeforeLeavePagePrevent(false);

  // 모달 핸들러 함수들
  const handleClickShareLinkButton = useCallback((item: SmartFolderItemResult) => {
    setShareLinkModalItem(item);
    setIsShareLinkModalOpen(true);
  }, []);

  const handleCloseShareLinkModal = useCallback(() => {
    setIsShareLinkModalOpen(false);
    setShareLinkModalItem(null);
  }, []);

  const handleCloseDownloadModal = useCallback(() => {
    setIsDownloadModalOpen(false);
    setCurrentActionItem(null);
  }, []);

  const handleConfirmDownloadModal = useCallback(() => {
    setIsDownloadModalOpen(false);
    setCurrentActionItem(null);
  }, []);

  const refetch = useCallback(() => {
    onUpdate();
  }, [onUpdate]);

  // 아이템 클릭 핸들러
  const handleItemClick = useCallback(
    (item: LecturePlanResult) => {
      if (!item?.smartFolderItem || Object.keys(item.smartFolderItem).length === 0) return;

      const { id, smartFolderApiType } = item.smartFolderItem;

      if (
        isEmpty(id) ||
        isEmpty(smartFolderApiType) ||
        !(smartFolderApiType in SmartFolderItemResultSmartFolderApiType)
      ) {
        showAlert({ message: '선택된 항목이 없습니다.' });
        return;
      }

      openPreviewLayer(id, smartFolderApiType);
    },
    [showAlert, openPreviewLayer],
  );

  // 즐겨찾기 핸들러
  const handleFavorite = useCallback(
    async (item: LecturePlanResult) => {
      if (!item) {
        showAlert({ message: '즐겨찾기를 실패하였습니다. 다시 시도해주세요.' });
        return;
      }

      const { driveItemKey } = item.smartFolderItem as SmartFolderItemResult;

      try {
        await starred({
          data: { driveItemKey },
        });
        onUpdate();
      } catch (error) {
        console.error('즐겨찾기 오류:', error);
        showAlert({ message: '즐겨찾기를 실패하였습니다. 다시 시도해주세요.' });
      }
    },
    [starred, onUpdate, showAlert],
  );

  // 드롭다운 메뉴 생성 함수
  const dropDownMenu = (
    keyword: 'public' | 'myFolder',
    data: SmartFolderItemResult,
  ): { list: IDropDownMenu['list'] } => {
    const menuItems = {
      share: {
        key: 'share',
        text: '공유 관리',
        action: () => handleClickShareLinkButton(data),
      },
      save: {
        key: 'save',
        text: '저장',
        action: () => {
          console.log('저장 기능 추가 필요');
        },
      },
    };

    let dropDown: IDropDownMenu['list'] = [];

    if (keyword === 'myFolder') {
      // dropDown = [menuItems.rename, menuItems.delete];
      dropDown = [menuItems.share, menuItems.save];
      // const index = dropDown.findIndex((_item) => _item.key === 'save');
      // dropDown.splice(index, 0, menuItems.copy);
    }

    return { list: dropDown };
  };

  const onDropDown = useCallback((itemId: number) => {
    setOpenDropDownId((prevState) => (prevState === itemId ? null : itemId));
  }, []);

  // 개별 아이템 렌더링 컴포넌트
  const renderPlayCardItem = useCallback(
    (item: LecturePlanResult, index: number) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [{ isDragging }, dragRef] = useDrag<DragItem, unknown, { isDragging: boolean }>(() => ({
        type: 'play_card',
        item: () => ({
          type: 'play_card',
          index,
          info: item,
          referencePlanCardId: item?.id || 0,
          playCardName: item?.subject,
          playCardId: item?.id || 0,
        }),
        collect: (monitor) => ({
          isDragging: !!monitor.isDragging(),
        }),
      }));

      return (
        <div ref={dragRef as unknown as React.RefObject<HTMLDivElement>}>
          <Thumbnail
            fileType="LECTURE_PLAN"
            viewType="lecturePlan"
            lecturePlan={item}
            onClick={() => handleItemClick(item)}
            innerCard={item?.creationType}
            fileName={item?.subject || ''}
            favorite={item?.smartFolderItem?.isFavorite}
            onFavorite={() => handleFavorite(item)}
            dropDown={openDropDownId === (item?.smartFolderItem?.id as number)}
            onDropDown={() => item?.smartFolderItem?.id !== undefined && onDropDown(item.smartFolderItem.id)}
            dropDownMenu={dropDownMenu('myFolder', item?.smartFolderItem as SmartFolderItemResult)}
            userProfileThumbUrl={userInfo?.photoUrl}
          />
        </div>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handleItemClick, handleFavorite, dropDownMenu],
  );

  return (
    <>
      <div className="playcard-section">
        <Swiper
          modules={[Navigation]}
          navigation={{
            prevEl: `.${prev}`,
            nextEl: `.${next}`,
          }}
          spaceBetween={14}
          allowTouchMove={false}
          slidesPerView={6}
          className="playcard-swiper"
        >
          {playCardList.map((item, index) => (
            <SwiperSlide key={`play_${item?.id || index}`}>{renderPlayCardItem(item, index)}</SwiperSlide>
          ))}
        </Swiper>
      </div>

      {isShareLinkModalOpen && (
        <ShareLinkModal item={shareLinkModalItem} onCloseRefetch={refetch} onCancel={handleCloseShareLinkModal} />
      )}

      {isDownloadModalOpen && (
        <DownloadModal
          isOpen={isDownloadModalOpen}
          itemData={currentActionItem ? [currentActionItem] : []}
          onCancel={handleCloseDownloadModal}
          onConfirm={handleConfirmDownloadModal}
          action="SAVE"
        />
      )}
    </>
  );
};

export default DraggablePlayCard;
