import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { dateFormat } from '@/lib/dayjs';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as swiperTypes } from 'swiper/types';
import { useQueryClient } from '@tanstack/react-query';
import { useInfiniteQueryWithLimit, getDehydratedQuery } from '@/utils/react-query';
import { Controller, EffectFade } from 'swiper/modules';

import { SmartFolderItemResultSmartFolderApiType } from '@/service/file/schemas';
import { SmartFolderItemResult } from '@/service/file/schemas/smartFolderItemResult';
import { searchStudentData, useUpdateMemoFile } from '@/service/file/fileStore';

import { Tab } from '@/components/common/Tab';
import { Select, Button } from '@/components/common';
import GroupRenderEmpty from '@/components/common/GroupRenderEmpty';
import { getFlattenedData, isEmpty, debounce } from '@/utils';
import RecentPlayRecordThumbnail from '@/app/work-board/(protected)/student-record/_component/RecentPlayRecordThumbnail';

import { getGetByIdOrCode1QueryOptions } from '@/service/member/memberStore';
import useUserStore from '@/hooks/store/useUserStore';
import { useToast } from '@/hooks/store/useToastStore';

// Swiper CSS 임포트
import 'swiper/css';
import 'swiper/css/grid';
import 'swiper/css/effect-fade';
import { useFileContext } from '@/context/fileContext';
import { MemoEditModal } from '@/components/modal/memo-edit';

type RecentPlayRecordProps = {
  educationalClassId: number;
  educationalClassYear: number;
  selectStudentId: number;
  callRecentPlayRecord?: boolean;
};

// ApiResponseListSmartFolderItemResult
const PLAY_HISTORY_ITEMS = [
  { month: '1', key: 'Jan' },
  { month: '2', key: 'Feb' },
  { month: '3', key: 'Mar' },
  { month: '4', key: 'Apr' },
  { month: '5', key: 'May' },
  { month: '6', key: 'Jun' },
  { month: '7', key: 'Jul' },
  { month: '8', key: 'aug' },
  { month: '9', key: 'Sep' },
  { month: '10', key: 'Oct' },
  { month: '11', key: 'Nov' },
  { month: '12', key: 'Doc' },
  { month: '', key: 'Favorite' },
];
export default function RecentPlayRecords({
  educationalClassId,
  educationalClassYear,
  selectStudentId,
  callRecentPlayRecord = false,
}: RecentPlayRecordProps) {
  // 최근 놀이 기록 기본값 선언
  const today = dayjs();
  const year = today.year();
  const month = today.month();
  const defaultLimit = 12; // 페이지 제한 수량
  const defaultFocusIdx = month || 0; // tab 포커스 기본 인덱스 - 날짜 기반 인덱스로 변경 예정
  const queryClient = useQueryClient(); // next-query 제어를 위한 선언 - 데이터 refech or remove
  const slidesPerView = 1;

  const PLAY_HISTORY_TAB = PLAY_HISTORY_ITEMS.map((tab) => {
    const text = tab.month ? `${tab.month}월` : '즐겨찾기';
    const tabName = tab.key.toLowerCase();
    const tabId = `tab${tab.key}`;
    const contentsId = `panel${tab.key}`;
    return { text, tabName, tabId, contentsId };
  });

  // tab 필터 - 사진 : IMAGE, 메모 : TEXT_MEMO, 음성메모(우선 제외): AUDIO
  const filterTypesOptions = [
    { text: '전체', value: 'IMAGE,TEXT_MEMO' },
    { text: '사진', value: 'IMAGE' },
    { text: '메모', value: 'TEXT_MEMO' },
  ];

  // useState 선언
  const [focusIdx, setFocusIdx] = useState<number>(defaultFocusIdx);
  const [filterType, setFilterType] = useState<string>(filterTypesOptions[0].value);
  const [swiperController, setSwiperController] = useState<swiperTypes>();
  const [currentSwiperActiveIdx, setCurrentSwiperActiveIdx] = useState<number>(0);

  /** 모바일 메모 */
  const [memoItem, setMemoItem] = useState<SmartFolderItemResult | null>(null);
  const { mutateAsync: updateMemo } = useUpdateMemoFile();
  const [memoData, setMemoData] = useState({
    title: '',
    memo: '',
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const router = useRouter();
  const addToast = useToast((state) => state.add);
  const { userInfo } = useUserStore();

  const handleChangeMemo = (val: Record<string, any>) => {
    const key = Object.keys(val)[0];
    const value = Object.values(val)[0];

    setMemoData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearData = () => {
    setIsEditModalOpen(false);
    setMemoItem(null);
    setMemoData({
      memo: '',
      title: '',
    });
  };

  // 최근 놀이 기록 API 호출 - 스와이프 페이징 처리를 위한 infiniteQuery 사용
  const {
    data: playRecordItems,
    fetchNextPage: playRecordNextPage,
    hasNextPage: playRecordHasNext,
    isFetchingNextPage: playRecordFetchingNextPage,
    refetch: playRecordRefetchPage,
  } = useInfiniteQueryWithLimit({
    queryKey: ['publics', filterType],
    queryFn: (pageParam) => {
      const searchDate = dayjs(`${year}-${focusIdx + 1}`);
      const startsAt = searchDate.format(dateFormat.kekaba);
      const endsAt = searchDate.add(1, 'month').format(dateFormat.kekaba);
      const studentId = selectStudentId ? selectStudentId.toString() : '';
      return searchStudentData({
        studentId,
        startsAt,
        endsAt,
        fileTypes: filterType,
        offsetWithLimit: `${pageParam},${defaultLimit}`,
      });
    },
    limit: defaultLimit,
    enabled: false,
  });

  const playRecordList = useMemo(() => {
    const flattened = getFlattenedData(playRecordItems?.pages ?? undefined);
    if (flattened) return flattened;
    return [];
  }, [playRecordItems]);

  const playRecordPageList = useMemo(() => {
    const playRecodItems = [...playRecordList];
    const swiperPages: any[] = [];
    while (swiperPages.flatMap((item) => [...item.list]).length < playRecordList.length) {
      const pageItem = playRecodItems.splice(0, defaultLimit);
      const swiperPageCnt = swiperPages.length;
      swiperPages.push({
        id: `swiper_0${swiperPageCnt}`,
        list: pageItem.map((result, idx) => ({ ...result, childId: `childId_${swiperPageCnt}_${idx}` })),
      });
    }
    return playRecordList.length > 0 ? swiperPages : [];
  }, [playRecordList]);

  // 메모저장
  const handleSaveEditedContent = async (item: SmartFolderItemResult) => {
    try {
      const body = {
        smartFolderApiType: item.smartFolderApiType,
        smartFolderItemId: item.id,
        memo: memoData.memo,
        title: memoData.title,
        taggedStudentIds: item.studentIds,
      };

      await updateMemo({
        data: body,
      });
      // 쿼리 재호출
      await queryClient.refetchQueries({
        queryKey: ['itemLists', 'UserFolder'],
        type: 'active', // 활성 상태인 쿼리만
      });
      addToast({ message: '메모를 수정하였습니다.' });
      clearData();
      playRecordRefetchPage();
    } catch (error) {
      addToast({ message: '메모 수정 중 오류가 발생했습니다.' });
    }
  };

  // 조회 결과 리스트 유무
  const hasData = playRecordPageList.length > 0;

  // 함수 모음
  // next query 캐쉬 초기화
  function resetCacheNextQuery() {
    const queryKey = ['publics', filterType];
    queryClient.removeQueries({ queryKey });
  }

  // tab 클릭 핸들러
  const handleTabClick = async (index: number) => {
    resetCacheNextQuery();
    await setFocusIdx(index); // 딜레이 추가: 딜레이가 없는 경우 이전 값을 사용함
    playRecordRefetchPage();
  };

  // tab 필터
  const handleChangeFilterTypes = async (filterTypeValue: string) => {
    resetCacheNextQuery();
    await setFilterType(filterTypeValue); // 딜레이 추가: 딜레이가 없는 경우 이전 값을 사용함
    playRecordRefetchPage();
  };

  // swiper 객체
  const currentSwiper = useMemo(() => {
    if (swiperController) return swiperController;
    return { activeIndex: 0, slidePrev: () => {}, slideNext: () => {} };
  }, [swiperController]);

  // swiper 이전 페이지로 이동
  const handlePrevClick = () => {
    if (currentSwiper) {
      const previousIndex = currentSwiper.activeIndex - 1;
      currentSwiper.slidePrev();
      if (previousIndex > -1) setCurrentSwiperActiveIdx(previousIndex);
    }
  };

  // swiper 다음 페이지로 이동
  const handleNextClick = async () => {
    if (currentSwiper) {
      const swiperActiveIdx = currentSwiper.activeIndex + slidesPerView;
      if (
        swiperActiveIdx > playRecordPageList.length - 1 ||
        (swiperActiveIdx + 1 > playRecordPageList.length - 1 &&
          playRecordPageList[playRecordPageList.length - 1]?.list.length === 1)
      ) {
        if (playRecordHasNext && !playRecordFetchingNextPage) {
          await playRecordNextPage();
        }
      }
      setTimeout(() => {
        currentSwiper.slideNext();
        setCurrentSwiperActiveIdx(swiperActiveIdx);
      }, 200);
    } else if (playRecordHasNext && !playRecordFetchingNextPage) {
      await playRecordNextPage();
    }
  };

  // 이전 버튼 disabled 처리
  const hasPrevDisabled = useMemo(() => {
    let retDisabled: boolean = false;
    if (playRecordPageList.length === 0 || currentSwiperActiveIdx === 0) {
      retDisabled = true;
    }
    return retDisabled;
  }, [playRecordPageList, currentSwiperActiveIdx]);

  // 다음 버튼 disabled 처리 - currentSwiperActiveIdx
  const hasNextDisabled = useMemo(() => {
    let retDisabled: boolean = false;
    if (!playRecordHasNext || playRecordPageList.length === 0) {
      retDisabled = true;
    }
    if (retDisabled) {
      if (playRecordPageList.length > 0) {
        if (playRecordPageList.length > currentSwiperActiveIdx + 1) retDisabled = false;
      }
    }
    return retDisabled;
  }, [playRecordHasNext, playRecordPageList, currentSwiperActiveIdx]);

  const tabBtnArrow = (
    <div className="wrap-btn">
      <Button
        size="small"
        color="line"
        icon="arrow-prev"
        className="btn-util"
        onClick={handlePrevClick}
        disabled={hasPrevDisabled}
      >
        <span className="screen_out">목록 왼쪽으로 넘기기</span>
      </Button>
      <Button
        size="small"
        color="line"
        icon="arrow-next"
        className="btn-util"
        onClick={handleNextClick}
        disabled={hasNextDisabled}
      >
        <span className="screen_out">목록 오른쪽으로 넘기기</span>
      </Button>
    </div>
  );

  const tabFileTypesSelect = () => {
    return (
      <div className="util-box" style={{ zIndex: '20' }}>
        <Select
          className="w-120"
          size="small"
          options={filterTypesOptions}
          value={filterType}
          placeholder="옵션을 선택하세요."
          onChange={(value) => handleChangeFilterTypes(value as string)}
        />
        {tabBtnArrow}
      </div>
    );
  };
  // 썸네일 클릭 이벤트 모음
  // 선택 객체 클릭 이벤트 - 미리보기 이벤트
  const { handleIsPreviewOpen } = useFileContext();
  const handleClickItem = async (selectItem: SmartFolderItemResult) => {
    const { id, smartFolderApiType, fileType } = selectItem;
    if (
      isEmpty(id) ||
      isEmpty(smartFolderApiType) ||
      !(smartFolderApiType in SmartFolderItemResultSmartFolderApiType)
    ) {
      addToast({ message: '선택된 항목이 없습니다.' });
      // showAlert({ message: '선택된 항목이 없습니다.' });
      return;
    }
    if (fileType === 'TEXT_MEMO') {
      const { title = '', memo = '' } = selectItem.memoContents || {};
      setMemoData({
        title: title ?? '',
        memo,
      });
      setMemoItem(selectItem);
      setIsEditModalOpen(true);
    } else {
      await handleIsPreviewOpen(true);
      router.push(`/preview?smartFolderItemId=${id}&smartFolderApiType=${smartFolderApiType}`);
    }
  };

  const handleThubnailClick = (clickItem: string, item: any) => {
    // console.log(clickItem, item);
    if (clickItem === 'click') handleClickItem(item);
  };

  // 페이지 진입 시 초기 api 호출
  const initReset = useCallback(async () => {
    const queryKey = ['publics', filterType];
    queryClient.removeQueries({ queryKey });
    setCurrentSwiperActiveIdx(0);
    await setFilterType(filterTypesOptions[0].value);
    setTimeout(() => {
      playRecordNextPage();
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, playRecordNextPage, queryClient]);

  const debounceRecentPlayRecord = useMemo(() => {
    const callBack = () => initReset();
    return debounce(callBack, 300);
  }, [initReset]);

  // const dragstartHandler = (event: DragEvent<HTMLLIElement>) => {
  //   console.log(event);
  //   // event.dataTransfer.setData("text", event.target.id);
  // };

  useEffect(() => {
    if (callRecentPlayRecord === true) {
      if (educationalClassId && educationalClassYear && selectStudentId) {
        debounceRecentPlayRecord();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [educationalClassId, educationalClassYear, selectStudentId, callRecentPlayRecord]);

  return (
    <div className="group-report group-history">
      <h4 className="title-type4">최근 놀이 기록</h4>
      <div className="inner-group">
        <Tab
          focusIdx={focusIdx}
          items={PLAY_HISTORY_TAB}
          theme="fill"
          onChange={handleTabClick}
          contentsHide
          commonArea={
            <>
              {tabFileTypesSelect()}
              <div className="tab-panel active">
                {hasData ? (
                  <Swiper
                    modules={[Controller, EffectFade]}
                    cssMode
                    effect="slide"
                    slidesPerView={slidesPerView}
                    onSwiper={(swiper: swiperTypes) => setSwiperController(swiper)}
                  >
                    {playRecordPageList &&
                      playRecordPageList.map((thumnailPageItems) => (
                        <SwiperSlide key={thumnailPageItems.id}>
                          <ul className="list-thumbnail-grid">
                            {thumnailPageItems?.list &&
                              thumnailPageItems.list.map((playRecord: any) => (
                                <li key={playRecord.childId} style={{ minWidth: '100%' }}>
                                  <RecentPlayRecordThumbnail
                                    studentRecordItem={playRecord}
                                    onClickItem={handleThubnailClick}
                                  />
                                </li>
                              ))}
                          </ul>
                        </SwiperSlide>
                      ))}
                  </Swiper>
                ) : (
                  <GroupRenderEmpty type="" icon="ico-empty" errorMessage="최근 놀이 기록이 없습니다." />
                )}
              </div>
            </>
          }
        />
      </div>
      {isEditModalOpen && memoItem && (
        <MemoEditModal
          memo={memoData}
          isOpen={isEditModalOpen}
          onChangeMemo={handleChangeMemo}
          onCancel={clearData}
          onSave={() => handleSaveEditedContent(memoItem)}
        />
      )}
    </div>
  );
}
