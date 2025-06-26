'use client';

import cx from 'clsx';
import React, { ChangeEvent, MouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useInfiniteQuery } from '@tanstack/react-query';
import { searchMyData } from '@/service/file/fileStore';
import { BreadCrumb, Loader, Select } from '@/components/common';
import SearchBar from '@/components/common/SearchBar';
import FloatingMenu from '@/components/common/FloatingMenu';
import MaterialBoardList from '@/app/(auth)/material-board/_components/MaterialBoardList';
import { ShareLinkModal } from '@/components/modal/share-link';

import { IActionButton } from '@/components/common/FloatingMenu/types';
import { DRIVE_ITEM_OPTIONS, prefix } from '@/const';
import { getSmartFolderPath } from '@/const/smartFolderApiType';
import {
  SmartFolderItemResult,
  SmartFolderItemResultFileType,
  SmartFolderItemResultSmartFolderApiType,
} from '@/service/file/schemas';
import { TSlugType } from '@/app/(auth)/material-board/[...slug]/types';
import { useInfiniteQueryWithLimit } from '@/utils/react-query';
import { getFlattenedData } from '@/utils';

type MaterialBoardSearchListProps = {
  category: TSlugType;
  keyword: string;
};
const LIMIT = 20;
const MaterialBoardSearchList = ({ category, keyword }: MaterialBoardSearchListProps) => {
  const [searchValue, setSearchValue] = useState<string>('');
  const [filterFileType, setFilterFileType] = useState<string>('ALL');
  // 체크 박스 핸들링
  const [isAllSelected, setIsAllSelected] = useState(false);
  // 체크박스 버튼 컨트롤
  const [selectedIds, setSelectedIds] = useState<Record<number, boolean>>({});
  // 뷰 모드 상태 관리
  const [currentViewMode, setCurrentViewMode] = useState<'grid' | 'list'>('grid');
  const [openDropDown, setOpenDropDown] = useState<Record<number, boolean>>({});
  // 공유 관리 모달
  const [isShareLinkModalOpen, setIsShareLinkModalOpen] = useState(false);
  const [shareLinkModalItem, setShareLinkModalItem] = useState<SmartFolderItemResult | null>();

  const router = useRouter();

  const baseActionButtonList: IActionButton[] = [
    { key: 'copy', label: '복사', action: () => console.log('복사'), icon: 'copy-14-b' },
    { key: 'move', label: '이동', action: () => console.log('이동'), icon: 'move-14' },
    { key: 'delete', label: '삭제', action: () => console.log('삭제'), icon: 'delete-14' },
    { key: 'save', label: '저장', action: () => console.log('저장'), icon: 'save-14' },
  ];
  const actionButtonList: IActionButton[] = [...baseActionButtonList];

  useEffect(() => {
    setSearchValue(keyword);
  }, [keyword]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } = useInfiniteQueryWithLimit({
    queryKey: ['search', 'material-board', keyword, filterFileType],
    queryFn: async (pageParam) => {
      const res = await searchMyData({
        offsetSizeWithLimit: `${pageParam},${LIMIT}`,
        searchKeyword: keyword,
        ...(filterFileType !== 'ALL' && { filterFileType }),
      });

      return {
        ...res,
        result: res.result?.items ?? [], // result를 배열로 가공
      };
    },
    limit: LIMIT,
  });

  const fileList = useMemo(() => {
    const flattened = getFlattenedData(data?.pages ?? undefined);
    return flattened;
  }, [data]);

  const hasFile = useMemo(() => {
    if (fileList) {
      return (fileList && fileList.length > 0) ?? false;
    }
    return false;
  }, [fileList]);

  /** 무한 스크롤 */
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef<() => void>(() => {}); // 데이터의 최신 상태 유지하기 위해 ref 생성
  useEffect(() => {
    callbackRef.current = async () => {
      if (hasNextPage && !isFetchingNextPage && !isLoading) {
        await fetchNextPage();
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isLoading]);

  /** 무한 스크롤 옵저브 선언 */
  const { observe } = useInfiniteScroll({
    callback: () => callbackRef.current(), // 항상 최신 상태의 callback을 실행
    threshold: 0.5,
  });

  /** 옵저브 요소 할당 */
  useEffect(() => {
    if (loadMoreRef.current) {
      observe(loadMoreRef.current);
    }
  }, [observe]);

  // 전체 선택 체크박스 핸들링
  const handleAllSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.target;
    setIsAllSelected(checked);
    setSelectedIds((prev) => {
      const updatedSelection = { ...prev };

      fileList?.forEach((item: SmartFolderItemResult) => {
        updatedSelection[item.id] = checked;
      });

      return updatedSelection;
    });
  };

  const handleThumbnail = ({
    fileType,
    id,
    apiType,
  }: {
    id: number;
    fileType: SmartFolderItemResultFileType;
    apiType: SmartFolderItemResultSmartFolderApiType;
  }) => {
    if (fileType === 'FOLDER') {
      router.push(`${prefix.materialBoard}/${getSmartFolderPath[apiType as keyof typeof getSmartFolderPath]}/${id}`);
      return;
    }
    router.push(`${prefix.preview}?smartFolderItemId=${id}&smartFolderApiType=${apiType}`);
  };

  const handleClickShareLinkButton = (item: SmartFolderItemResult) => {
    setShareLinkModalItem(item);
    setIsShareLinkModalOpen(true);
  };

  const handleCloseShareLinkModal = () => {
    setShareLinkModalItem(null);
    setIsShareLinkModalOpen(false);
  };

  const goToSearchPage = (searchKeyword: string) => {
    router.push(`${prefix.materialBoard}/search?keyword=${searchKeyword}`);
  };

  const handleSelectOption = (searchKeyword: string) => {
    goToSearchPage(searchKeyword);
  };

  const handleSearch = (value: string) => {
    goToSearchPage(value);
  };

  // 특정 파일의 edit 상태를 토글
  const handleEditToggle = (id: number) => {
    setSelectedIds((prev) => ({
      ...prev,
      [id]: !prev[id], // 해당 파일의 상태만 토글
    }));
  };

  const handleChangeFilter = (fileType: string) => {
    setFilterFileType(fileType as string);
  };

  const handleClearSearchValue = () => {
    setSearchValue('');
  };

  /** 사진 홈 */
  const onDropDown = (event: React.MouseEvent<HTMLButtonElement>, key: number) => {
    event.preventDefault();
    setOpenDropDown((prev) => ({
      ...prev,
      [key]: !prev[key], // 해당 파일의 상태만 변경
    }));
  };

  const getDropDown = (id: number) => {
    return openDropDown;
  };

  const fileTypeSelect = () => {
    return (
      <Select
        className="w-120"
        size="small"
        options={DRIVE_ITEM_OPTIONS}
        value={filterFileType}
        placeholder="옵션을 선택하세요."
        onChange={(value) => handleChangeFilter(value as string)}
      />
    );
  };

  return (
    <>
      <div className="group-top">
        <BreadCrumb items={[{ label: '자료보드' }, { label: '검색결과' }]} />
        <SearchBar
          title="자료보드 검색"
          searchValue={searchValue}
          handleClearSearchValue={handleClearSearchValue}
          handleSearch={handleSearch}
          handleSelectOption={handleSelectOption}
        />
      </div>
      {keyword && (
        <div className="group-search">
          <p className="txt-search">
            <em className="txt-blue font-bold">{`"${keyword}"`}</em>에 대한 검색결과입니다.
          </p>
        </div>
      )}
      <div className={cx('group-content', hasFile && 'group-empty')}>
        <FloatingMenu
          isChecked={category !== 'search'}
          isAllSelected={isAllSelected}
          setIsAllSelected={setIsAllSelected}
          handleAllSelected={handleAllSelected}
          floatingActionButton={Object.entries(selectedIds).find((state) => state[1]) !== undefined}
          actionButton={category === 'search' ? undefined : actionButtonList}
          renderButton={false}
          currentViewMode={currentViewMode}
          setCurrentViewMode={setCurrentViewMode}
          filter={fileTypeSelect()}
        />
        {isLoading ? (
          <Loader loadingMessage={null} />
        ) : (
          <MaterialBoardList
            hasFile={hasFile}
            category={category}
            fileList={fileList || []}
            currentViewMode={currentViewMode}
            searchKeyword={keyword}
            onEditToggle={(id) => handleEditToggle(id)} // 개별 상태 토글 함수 전달
            dropDown={(id) => openDropDown[id]}
            onDropDown={onDropDown}
            selectedIds={selectedIds}
            onClickShareLinkButton={handleClickShareLinkButton}
            onClick={({ id, fileType, apiType }) => {
              if (category !== 'trash') {
                handleThumbnail({
                  id,
                  fileType,
                  apiType,
                });
              }
            }}
            // TODO: 빌드에러나서 바꿈
            dropDownActions={() => {}}
            handleFavorite={() => {}}
          />
        )}
        {/* 무한 스크롤 감지 div */}
        <div ref={loadMoreRef} style={{ height: '10px', background: 'transparent' }} />
      </div>
      {isShareLinkModalOpen && (
        <ShareLinkModal item={shareLinkModalItem} onCloseRefetch={refetch} onCancel={handleCloseShareLinkModal} />
      )}
    </>
  );
};

export default MaterialBoardSearchList;
