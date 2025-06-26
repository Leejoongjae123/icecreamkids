import cx from 'clsx';
import { use, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { useSnb } from '@/context/SnbContext';
import useWindowSize from '@/hooks/useWindowSize';
import DraggableItem from './DraggableItem';
import SelectoGrid from './SelectoGrid';
import type { IDraggableItemListProps } from './types';

export default function DraggableItemList<T extends { id: string | number }>(props: IDraggableItemListProps<T>) {
  const { items, selectedIds, onSelectionChange, renderItem, Container, prev, next } = props;

  /**
   * * 화면 너비와 SNB 상태에 따라 slidesPerView 조정
   */
  // SNB 열림/닫힘 감지
  const { isSnbOpen } = useSnb();

  // 화면 너비 변화 감지
  const { width: windowWidth } = useWindowSize();
  // slidesPerView 계산
  const slidesPerView = useMemo(() => {
    if (!windowWidth) return 6;

    if (windowWidth > 1919) {
      return isSnbOpen ? 6 : 7; // 1920 이상: SNB 열림 5, 접힘 6
    }
    return isSnbOpen ? 5 : 6; // 1440 이하: SNB 열림 5, 접힘 6
  }, [windowWidth, isSnbOpen]);

  return (
    <>
      <Swiper
        className={cx(isSnbOpen && slidesPerView === 5 && 'fold-item')}
        modules={[Navigation]}
        navigation={{
          prevEl: `.${prev}`,
          nextEl: `.${next}`,
        }}
        spaceBetween={14}
        allowTouchMove={false}
        slidesPerView={slidesPerView} // 한번에 보여줄 카드 수
      >
        {items.map((item) => (
          <SwiperSlide key={`item_${item.id}`}>
            <DraggableItem key={item.id} file={item} selectedIds={selectedIds} Container={Container}>
              {renderItem(item)}
            </DraggableItem>
          </SwiperSlide>
        ))}
      </Swiper>
      {/* <SelectoGrid onSelectionChange={onSelectionChange} /> */}
    </>
  );
}
