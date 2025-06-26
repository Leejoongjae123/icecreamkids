'use client';

import React, { FC, useCallback, useId, useMemo } from 'react';
import { Button, BreadCrumb, Thumbnail } from '@/components/common';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { SmartFolderResult, SmartFolderTreeResult } from '@/service/file/schemas';

import { IBreadcrumbItem } from '@/components/common/Breadcrumb';
import cx from 'clsx';
// import { useRouter } from 'next/navigation';

// Swiper CSS 임포트
import 'swiper/css';
import 'swiper/css/navigation';

// 상수 정의
const SWIPER_BREAKPOINTS = {
  1024: { slidesPerView: 5 },
  1440: { slidesPerView: 6 },
};

const DEFAULT_SLIDES_PER_VIEW = 6;
const SWIPER_SPACE_BETWEEN = 20;

interface WorkAiPhotoResultProps {
  title: string;
  thumbNailList: SmartFolderResult[];
  breadCrumb?: SmartFolderTreeResult[];
  onShowFolder: (item: SmartFolderResult, sortType: string) => void;
  sortType?: string;
}

const WorkAiPhotoResultClient: FC<WorkAiPhotoResultProps> = ({
  title,
  thumbNailList,
  breadCrumb,
  onShowFolder,
  sortType = '',
}) => {
  // const router = useRouter();
  const rawId = useId();
  // swiper에서 .또는 - 로 셀렉트하면 에러나서 바꿈
  const navigationId = useMemo(() => rawId.replace(/:/g, '-'), [rawId]);

  // isHidden이 true인 항목은 필터링하여 사용자에게 보여지는 목록과 네비게이션 대상이 일치하도록 함
  const filteredThumbnails = useMemo(() => thumbNailList.filter((item) => !item.isHidden), [thumbNailList]);

  // 브레드크럼 컴포넌트 구조에 맞게 수정
  const breadcrumbItems: IBreadcrumbItem[] = useMemo(() => {
    if (!breadCrumb || !breadCrumb.length) return [];
    return breadCrumb.map((item) => ({
      label: item?.name || '',
      id: item?.id || 0,
    }));
  }, [breadCrumb]);

  // 해당 스마트 폴더로 이동
  const handleNavigateToFolder = useCallback(() => {
    if (!filteredThumbnails.length) return;
    const { smartFolderApiType, parentSmartFolderItemId } = filteredThumbnails[0]; // 어차피 id값은 다 같음
    if (!smartFolderApiType || !parentSmartFolderItemId) {
      console.error('유효하지 않은 폴더 데이터입니다.');
      // TODO: 사용자에게 알림(예: 토스트)으로 피드백 제공
      return;
    }

    const url = `/material-board/${smartFolderApiType.toLowerCase()}/${parentSmartFolderItemId}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  }, [filteredThumbnails]);

  // 상세페이지 보여질 데이터 부모 컴포넌트로 올림
  const handleThumbnailClick = useCallback(
    (item: SmartFolderResult) => {
      onShowFolder(item, sortType);
    },
    [onShowFolder, sortType],
  );

  return (
    <div className="group-content group-type2">
      <div className="head-content type2">
        <h4 className="title-type3">{title}</h4>
        <div className="util-head">
          <BreadCrumb items={breadcrumbItems} />
          <Button
            size="small"
            color="line"
            iconAfter="arrow-next"
            className="btn-go"
            onClick={handleNavigateToFolder}
            disabled={!filteredThumbnails.length}
          >
            스마트폴더 바로가기
          </Button>

          {/* 스와이퍼용 버튼 */}
          <Button
            size="small"
            color="line"
            icon="arrow-prev"
            className={cx('btn-util', `${navigationId}-prev`)}
            aria-label="목록 왼쪽으로 넘기기"
          >
            <span className="screen_out">목록 왼쪽으로 넘기기</span>
          </Button>
          <Button
            size="small"
            color="line"
            icon="arrow-next"
            className={cx('btn-util', `${navigationId}-next`)}
            aria-label="목록 오른쪽으로 넘기기"
          >
            <span className="screen_out">목록 오른쪽으로 넘기기</span>
          </Button>
        </div>
      </div>

      <div className="body-content">
        <Swiper
          modules={[Navigation]}
          navigation={{
            prevEl: `.${navigationId}-prev`,
            nextEl: `.${navigationId}-next`,
          }}
          spaceBetween={SWIPER_SPACE_BETWEEN}
          breakpoints={SWIPER_BREAKPOINTS}
          slidesPerView={DEFAULT_SLIDES_PER_VIEW}
          className={`workAiSwiper swiper_${sortType || 'item_list'}`}
        >
          {filteredThumbnails.map((item) => (
            <SwiperSlide key={`${item.id}_${item.driveItemCreatedAt}`}>
              <Thumbnail
                hover
                visualClassName="type-folder"
                isEditActive={false}
                fileType="FOLDER"
                // only-fastAi-folder-view는 빠른업무에서 필수임, 자세한 내용은 오른쪽 내용을 검색 [// TODO: 이것은 빠른업무 AI의]
                className="type-upload only-fastAi-folder-view"
                onClick={() => handleThumbnailClick(item)}
                thumbUrl={item.thumbUrl || ''}
                fileName={item.name}
                placeholder="blur"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default WorkAiPhotoResultClient;
