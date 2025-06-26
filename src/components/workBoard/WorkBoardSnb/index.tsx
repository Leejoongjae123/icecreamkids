'use client';

import React, { type ChangeEvent, useEffect, useMemo, useRef, useState, Children, useCallback } from 'react';
import Selecto, { type SelectoProps } from 'react-selecto';
import { BreadCrumb, Loader } from '@/components/common';
import { DraggableThumbnail, DraggableThumbnailLayer } from '@/app/work-board/_components/DraggableThumbnail';
import { Tab } from '@/components/common/Tab';
import cx from 'clsx';
import {
  getGetItemListQueryKey,
  getGetPublicItemForMyListQueryKey,
  getItemList,
  getPublicItemForMyList,
  getRecommendItems,
  getSearchMyDataQueryKey,
  searchMyData,
  useGetItemFlatPathTree,
} from '@/service/file/fileStore';
import { WORK_BOARD_SNB_TAB } from '@/const/tab';
import { useInfiniteQueryWithLimit } from '@/utils/react-query';
import { getFlattenedData, groupByDate, isEmpty, hasReactQueryCompleted } from '@/utils';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { EXTENSIONS, MATERIAL_BREADCRUMB, PUBLIC_BREADCRUMB, PUBLIC_FOLDER } from '@/const';
import type {
  SearchMyDataParams,
  SmartFolderItemResult,
  SmartFolderItemResultSmartFolderApiType,
  SmartFolderTreeResult,
} from '@/service/file/schemas';
import type { IBreadcrumbItem } from '@/components/common/Breadcrumb';
import { useMakeBreadcrumbs } from '@/hooks/useMakeBreadcrumbs';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import { useLoadingState } from '@/hooks/useLoadingState';
import { useInfiniteQuery } from '@tanstack/react-query';
import SearchBar from '@/components/common/SearchBar';
import { useFileContext } from '@/context/fileContext';
import { usePathname, useRouter } from 'next/navigation';
import { useValidateFileName } from '@/hooks/useValidateFileName';
import { useClickOutside } from '@/hooks/useClickOutside';

const taskMap: Record<string, string> = {
  '/work-board/playing-plan': 'LECTURE_PLAN',
  '/work-board/playing-report': 'LECTURE_PLAN_REPORT',
  '/work-board/student-record': 'STUDENT_RECORD',
  '/work-board/image-sort': 'STUDENT_AND_ACTIVITY_CLASSIFICATION',
  '/work-board/image-merge': 'PHOTO_COMPOSITION',
  '/work-board/image-face-privacy': 'PRIVATE_DATA_ENCRYPTION',
};

interface IWorkBoardSnbProps {
  externalIsOpen?: boolean;
  externalToggleSnb?: () => void;
}

export function WorkBoardSnb({ externalIsOpen, externalToggleSnb }: IWorkBoardSnbProps) {
  const { showAlert } = useAlertStore();
  const currentPath = usePathname();
  const router = useRouter();

  // === 상태 관리 ===
  const [selectingItems, setSelectingItems] = useState<Set<string>>(new Set()); // 현재 드래그 중 선택되고 있는 아이템들의 ID 집합
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set()); // 드래그 완료 후 최종 선택된 아이템들의 ID 집합
  const [internalIsOpen, setInternalIsOpen] = useState(true); // 사이드바 내부 열림/닫힘 상태
  const [focusIdx, setFocusIdx] = useState<number>(0); // 현재 활성화된 탭 인덱스 (0: 추천자료, 1: 자료보드)
  const [loading, setLoading] = useState<boolean>(false); // 파일 업로드 로딩 상태
  const [searchValue, setSearchValue] = useState<string>(''); // 검색창 입력값
  const [selectedItem, setSelectedItem] = useState<SmartFolderItemResult | null>(null); // 클릭으로 선택된 단일 아이템
  const [smartFolderApiType, setSmartFolderApiType] = useState<SmartFolderItemResultSmartFolderApiType | null>(null); // 현재 폴더의 API 타입
  const [parentSmartFolderId, setParentSmartFolderId] = useState<string | null>(null); // 현재 폴더의 부모 ID
  const [selectoReady, setSelectoReady] = useState(false); // Selecto 컴포넌트 렌더링 준비 상태
  const [isReactDndDragging, setIsReactDndDragging] = useState(false); // React DnD 드래그 진행 중 여부

  // === Ref 관리 ===
  const containerRef = useRef<HTMLDivElement>(null); // 사이드바 전체 컨테이너 ref
  const tabPanelRef = useRef<HTMLDivElement>(null); // 탭 패널 컨테이너 ref (스크롤 가능)
  const selectoRef = useRef<Selecto>(null); // Selecto 컴포넌트 인스턴스 ref
  const recommendListRef = useRef<HTMLUListElement>(null); // 추천자료 리스트 ul 요소 ref
  const fileListRef = useRef<HTMLUListElement>(null); // 자료보드 리스트 ul 요소 ref
  const recommendLoadMoreRef = useRef<HTMLDivElement | null>(null); // 추천자료 무한스크롤 트리거 div ref
  const loadMoreRef = useRef<HTMLDivElement | null>(null); // 자료보드 무한스크롤 트리거 div ref
  const recommendContainerRef = useRef<HTMLDivElement>(null); // 추천자료 전체 컨테이너 ref (Selecto boundContainer용)

  // === Selecto 드래그 상태 관리 ===
  // 드래그 진행 중 여부를 추적하는 ref (무한스크롤로 인한 rerender에도 유지)
  const isDraggingRef = useRef(false);
  // 드래그 상태와 현재 선택중인 아이템들을 추적하는 복합 상태 ref
  const dragStateRef = useRef<{
    isDragging: boolean;
    startTarget: Element | null;
    currentSelecting: Set<string>;
  }>({
    isDragging: false,
    startTarget: null,
    currentSelecting: new Set(),
  });

  // === 기본 설정 ===
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const isWorkBoard = useMemo(() => currentPath.includes('/work-board'), [currentPath]);
  const toggleSnb = externalToggleSnb || (() => setInternalIsOpen((prev) => !prev));

  // === 파일 업로드 관련 ===
  const { handleFileSelect, handleIsPreviewOpen } = useFileContext();
  const { isLoading, message: loadingMessage } = useLoadingState([
    {
      isLoading: loading,
      name: '업로드',
      message: '업로드 중입니다.',
      priority: 0,
    },
  ]);
  const validateFileName = useValidateFileName();

  const isPlayingPlan = useMemo(
    () => isWorkBoard && currentPath.includes('/work-board/playing-plan'),
    [isWorkBoard, currentPath],
  );

  const acceptInput = useMemo(() => {
    const extensions = isPlayingPlan ? EXTENSIONS.LECTURE_PLAN : EXTENSIONS.IMAGE;
    return extensions.map((ext: string) => `.${ext}`).join(',');
  }, [isPlayingPlan]);

  // === Selecto 이벤트 핸들러 ===
  /**
   * Selecto 선택 상태를 모두 초기화하는 함수
   */
  const onResetSelecto = () => {
    setSelectedItems(new Set());
    setSelectingItems(new Set());
  };

  /**
   * 탭 클릭 시 처리 함수
   * @param index - 클릭된 탭의 인덱스
   */
  const handleTabClick = (index: number) => {
    setFocusIdx(index);
    onResetSelecto();
  };

  // React DnD 드래그 시작/종료 핸들러
  const handleReactDndDragStart = () => setIsReactDndDragging(true);
  const handleReactDndDragEnd = () => {
    setIsReactDndDragging(false);
    onResetSelecto();
  };

  // useEffect(() => {
  //   setCurrentPath(currentPath);
  // }, [currentPath, setCurrentPath]);

  /**
   * Selecto 드래그 시작 이벤트 핸들러
   * @param e - Selecto 드래그 시작 이벤트
   * @returns 드래그 허용 여부
   */
  const handleDragStart = (e: any) => {
    // React DnD 드래그 중이거나 버튼 클릭 시 드래그 방지
    if (isReactDndDragging || e.inputEvent.target.nodeName === 'BUTTON') {
      return false;
    }

    // 드래그 상태 설정
    isDraggingRef.current = true;
    dragStateRef.current = {
      isDragging: true,
      startTarget: e.inputEvent.target,
      currentSelecting: new Set(),
    };

    return true;
  };

  /**
   * Selecto 선택 중 이벤트 핸들러 (드래그하며 선택되는 아이템들 처리)
   * @param e - Selecto 선택 중 이벤트
   */
  const handleSelecting = (e: any) => {
    const selectingIds = new Set<string>();
    // 현재 선택된 DOM 요소들에서 data-item-id 추출
    e.selected.forEach((element: Element) => {
      const itemId = element.getAttribute('data-item-id');
      if (itemId) selectingIds.add(itemId);
    });
    setSelectingItems(selectingIds);

    // 드래그 상태 동기화
    dragStateRef.current = {
      ...dragStateRef.current,
      currentSelecting: selectingIds,
    };
  };

  /**
   * Selecto 드래그 종료 이벤트 핸들러
   * @param e - Selecto 드래그 종료 이벤트
   */
  const handleSelectoEnd = (e: any) => {
    const selectedIds = new Set<string>();

    if (!e.isDrag) {
      const clickedElement = e.inputEvent?.target;
      // 드래그 영역 밖 클릭시 선택 해제요
      if (!clickedElement?.closest('.selectable-item')) {
        onResetSelecto();
        return;
      }
    }

    // 최종 선택된 DOM 요소들에서 data-item-id 추출
    e.selected.forEach((element: Element) => {
      const itemId = element.getAttribute('data-item-id');
      if (itemId) selectedIds.add(itemId);
    });
    setSelectedItems(selectedIds);
    setSelectingItems(new Set());

    // 드래그 상태 초기화
    isDraggingRef.current = false;
    dragStateRef.current = {
      isDragging: false,
      startTarget: null,
      currentSelecting: new Set(),
    };
  };

  /**
   * Selecto 자동 스크롤 이벤트 핸들러
   * @param e - 스크롤 이벤트 정보
   */
  const handleOnScroll = (e: any) => {
    if (tabPanelRef.current) {
      tabPanelRef.current.scrollBy(e.direction[0] * 10, e.direction[1] * 10);
    }
  };

  // === 탭/바깥 클릭 이벤트 ===
  // 탭 패널 바깥 클릭 시 선택 상태 초기화
  useClickOutside(tabPanelRef, () => {
    if (selectedItems.size > 0 || selectingItems.size > 0) {
      onResetSelecto();
    }
  });

  // 탭 변경 시 Selecto 초기화 및 재생성
  useEffect(() => {
    onResetSelecto();
    setSelectoReady(false);
    const timer = setTimeout(() => setSelectoReady(true), 50);
    return () => clearTimeout(timer);
  }, [focusIdx]);

  const task = useMemo(() => {
    if (currentPath.includes('/work-board/student-record')) return taskMap['/work-board/student-record'] ?? undefined;
    return taskMap[currentPath] ?? undefined;
  }, [currentPath]);
  const LIMIT = 19;
  const recommendQueryKey = ['recommendItems', task];

  const {
    data: recommendData,
    fetchNextPage: recommendItemListNextPage,
    hasNextPage: recommendItemListsHasNext,
    isFetchingNextPage: recommendItemListFetchingNextPage,
    isLoading: isRecommendLoading,
  } = useInfiniteQueryWithLimit({
    queryKey: recommendQueryKey,
    queryFn: (pageParam) => getRecommendItems({ task, offsetWithLimit: `${pageParam},${LIMIT}` }),
    limit: LIMIT,
    enabled: isWorkBoard,
  });

  const recommendItems = useMemo(() => getFlattenedData(recommendData?.pages), [recommendData?.pages]);
  const groupByDateTempItems = useMemo(() => groupByDate(recommendItems ?? []), [recommendItems]);

  // 추천자료 무한스크롤 콜백 관리
  const recommendCallbackRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (isWorkBoard) {
      recommendCallbackRef.current = () => {
        if (focusIdx === 0 && recommendItemListsHasNext && !recommendItemListFetchingNextPage) {
          recommendItemListNextPage();
        }
      };
    }
  }, [focusIdx, recommendItemListsHasNext, recommendItemListFetchingNextPage, recommendItemListNextPage, isWorkBoard]);

  const { observe: recommendObserve } = useInfiniteScroll({
    callback: () => recommendCallbackRef.current(),
    threshold: 0.5,
  });

  useEffect(() => {
    if (isWorkBoard && recommendLoadMoreRef.current) {
      recommendObserve(recommendLoadMoreRef.current);
    }
  }, [recommendObserve, isWorkBoard]);

  // === 자료보드 관련 로직 ===
  /**
   * 아이템 클릭 시 처리 함수
   * @param item - 클릭된 아이템
   * @param event - 마우스 클릭 이벤트
   */
  const handleClickItem = async (item: SmartFolderItemResult, event: React.MouseEvent<HTMLDivElement>) => {
    // 폴더 클릭 시 폴더 내부로 이동
    if (item.fileType === 'FOLDER') {
      setSmartFolderApiType(item.smartFolderApiType);
      setParentSmartFolderId(item.id.toString());
      setSelectedItem(item);
      return;
    }
    // 파일 클릭 시 미리보기 페이지로 이동
    if (isEmpty(item.id) || isEmpty(item.smartFolderApiType) || !item.smartFolderApiType) {
      showAlert({ message: '선택된 항목이 없습니다.' });
      return;
    }
    await handleIsPreviewOpen(true);
    router.push(`/preview?smartFolderItemId=${item.id}&smartFolderApiType=${item.smartFolderApiType}`);
  };

  // 공개 자료
  const publicQueryKey = getGetPublicItemForMyListQueryKey();
  const isInPublicFolder = useMemo(
    () => parentSmartFolderId === '0' && smartFolderApiType === 'PublicItem',
    [parentSmartFolderId, smartFolderApiType],
  );

  const {
    data: publicList,
    fetchNextPage: publicListNextPage,
    hasNextPage: publicListHasNext,
    isFetchingNextPage: publicListFetchingNextPage,
  } = useInfiniteQueryWithLimit({
    queryKey: publicQueryKey,
    queryFn: (pageParam) => getPublicItemForMyList({ offsetWithLimit: `${pageParam},${LIMIT}` }),
    limit: LIMIT,
    enabled: isWorkBoard && isInPublicFolder,
  });

  // 폴더 트리 및 브레드크럼
  const is1Depth = useMemo(
    () => focusIdx === 0 || (smartFolderApiType === null && parentSmartFolderId === null),
    [focusIdx, parentSmartFolderId, smartFolderApiType],
  );
  const inMaterialTab1Depth = useMemo(() => focusIdx === 1 && is1Depth, [focusIdx, is1Depth]);

  const { data: pathTreeData, status: isPathTreeDataStatus } = useGetItemFlatPathTree(
    { smartFolderApiType: smartFolderApiType || '', smartFolderItemId: parentSmartFolderId || '' },
    { query: { enabled: !!smartFolderApiType && !!parentSmartFolderId && !isInPublicFolder } },
  );

  const pathTree: SmartFolderTreeResult[] | null = useMemo(() => pathTreeData?.result || null, [pathTreeData]);
  const initTree: IBreadcrumbItem[] = useMemo(() => {
    if (focusIdx === 1) return isInPublicFolder ? [...MATERIAL_BREADCRUMB, ...PUBLIC_BREADCRUMB] : MATERIAL_BREADCRUMB;
    return [];
  }, [focusIdx, isInPublicFolder]);

  const breadcrumbs: IBreadcrumbItem[] = useMakeBreadcrumbs({ pathTree, initTree });
  const handleNavigate = (item: IBreadcrumbItem) => {
    setSmartFolderApiType(item.smartFolderApiType!);
    setParentSmartFolderId(item.id ? item.id.toString() : null);
  };

  const isShowBreadcrumbs = useMemo(
    () => breadcrumbs.length < 2 || hasReactQueryCompleted(isPathTreeDataStatus) || isInPublicFolder,
    [breadcrumbs.length, isInPublicFolder, isPathTreeDataStatus],
  );

  // 자료보드 아이템 리스트
  const queryParams = useMemo(
    () => ({ smartFolderApiType, parentSmartFolderId, sorts: 'createdAt.desc,name.asc' }),
    [parentSmartFolderId, smartFolderApiType],
  );
  const queryKey = getGetItemListQueryKey(queryParams);

  const {
    data: itemList,
    fetchNextPage: itemListFetchNextPage,
    hasNextPage: itemListsHasNext,
    isFetchingNextPage: isItemListFetchingNextPage,
    isLoading: isItemLoading,
  } = useInfiniteQueryWithLimit({
    queryKey,
    queryFn: (pageParam) => getItemList({ ...queryParams, offsetWithLimit: `${pageParam},${LIMIT}` }),
    limit: LIMIT,
    enabled: isWorkBoard,
  });

  const fileItems = useMemo(() => {
    const baseItems = getFlattenedData(isInPublicFolder ? publicList?.pages : itemList?.pages);
    return inMaterialTab1Depth ? [...baseItems, PUBLIC_FOLDER] : baseItems;
  }, [inMaterialTab1Depth, isInPublicFolder, itemList?.pages, publicList?.pages]);

  // 자료보드 검색
  const handleChangeSearchValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === '') setSearchValue(e.target.value);
  };

  const handleSearch = (value: string) => setSearchValue(value);
  const handleSelectOption = (searchKeyword: string) => setSearchValue(searchKeyword);
  const handleClearSearchValue = () => setSearchValue('');

  const isSearching = useMemo(() => searchValue && searchValue.length >= 2, [searchValue]);

  const searchParams: SearchMyDataParams = {
    searchKeyword: searchValue,
    sorts: 'createdAt.desc,name.asc',
  };

  const searchQueryKey = getSearchMyDataQueryKey(searchParams);
  const {
    data: searchData,
    fetchNextPage: searchDataFetchNextPage,
    hasNextPage: searchDataHasNextPage,
    isFetchingNextPage: isSearchDataFetchingNextPage,
    isLoading: isSearchLoading,
  } = useInfiniteQuery({
    queryKey: searchQueryKey,
    queryFn: ({ pageParam = 0 }) => searchMyData({ ...searchParams, offsetSizeWithLimit: `${pageParam},${LIMIT}` }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage?.result?.nextOffset === lastPage?.result?.total ? null : lastPage?.result?.nextOffset,
    enabled: isWorkBoard && !!isSearching,
  });

  const searchFileItems = useMemo(
    () => searchData?.pages.flatMap(({ result }) => result?.items || []),
    [searchData?.pages],
  );

  const currentFileItems = useMemo(
    () => (isSearching ? searchFileItems : fileItems),
    [fileItems, isSearching, searchFileItems],
  );

  // === 무한스크롤 로직 ===
  /**
   * 무한스크롤 실행 함수 - 상황에 따라 적절한 API 호출
   */
  const executeInfiniteScroll = useCallback(() => {
    if (!isSearching && !isInPublicFolder && itemListsHasNext && !isItemListFetchingNextPage) {
      itemListFetchNextPage();
    }
    if (!isSearching && isInPublicFolder && publicListHasNext && !publicListFetchingNextPage) {
      publicListNextPage();
    }
    if (isSearching && !isInPublicFolder && searchDataHasNextPage && !isSearchDataFetchingNextPage) {
      searchDataFetchNextPage();
    }
  }, [
    isSearching,
    isInPublicFolder,
    itemListsHasNext,
    isItemListFetchingNextPage,
    itemListFetchNextPage,
    publicListHasNext,
    publicListFetchingNextPage,
    publicListNextPage,
    searchDataHasNextPage,
    isSearchDataFetchingNextPage,
    searchDataFetchNextPage,
  ]);

  // 무한스크롤 콜백 ref - 의존성이 변경될 때마다 새로운 함수로 업데이트
  const callbackRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (isWorkBoard) {
      callbackRef.current = executeInfiniteScroll;
    }
  }, [
    itemListsHasNext,
    isItemListFetchingNextPage,
    itemListFetchNextPage,
    isInPublicFolder,
    publicListHasNext,
    publicListFetchingNextPage,
    publicListNextPage,
    isSearching,
    searchDataHasNextPage,
    isSearchDataFetchingNextPage,
    searchDataFetchNextPage,
    isWorkBoard,
    executeInfiniteScroll,
  ]);

  const { observe } = useInfiniteScroll({
    callback: () => callbackRef.current(),
    threshold: 0.5,
  });

  useEffect(() => {
    if (isWorkBoard && loadMoreRef.current) {
      observe(loadMoreRef.current);
    }
  }, [observe, isWorkBoard]);

  // === 파일 업로드 핸들러 ===
  /**
   * 파일 선택 시 업로드 처리 함수
   * @param e - 파일 입력 변경 이벤트
   */
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    try {
      setLoading(true);
      const { files } = e.target;

      if (!files || files.length === 0) {
        showAlert({ message: '선택된 파일이 없습니다.' });
        if (e.target) e.target.value = '';
        setLoading(false);
        return;
      }

      // 파일명 유효성 검사
      if (Array.from(files).some((file) => validateFileName(file.name))) {
        if (e.target) e.target.value = '';
        setLoading(false);
        return;
      }

      // 로그 추가
      console.log('WorkBoardSnb - 선택된 파일들:', files);
      console.log('WorkBoardSnb - 파일 개수:', files.length);

      // 중요: 새로운 FileList 객체 생성하여 전달
      const fileListCopy = new DataTransfer();
      Array.from(files).forEach((file) => fileListCopy.items.add(file));

      // FileContext에 선택된 파일들 전달
      handleFileSelect(fileListCopy.files);

      // 확인 로그
      console.log('WorkBoardSnb - handleFileSelect 호출 완료');
    } catch (error) {
      console.error('파일 처리 중 오류 발생:', error);
      showAlert({ message: '파일 업로드 중 오류가 발생했습니다. 다시 시도해 주세요.' });
    } finally {
      if (e.target) e.target.value = '';
      setLoading(false);
    }
  };
  // === 선택된 아이템 데이터 ===
  /**
   * 현재 선택된 아이템들의 실제 데이터를 반환하는 함수
   * @returns 선택된 아이템들의 배열
   */
  const getSelectedItemsData = (): SmartFolderItemResult[] => {
    const currentItems = focusIdx === 0 ? recommendItems : currentFileItems;
    if (!currentItems || currentItems.length === 0) return [];
    return Array.from(selectedItems)
      .map((id) => currentItems.find((item) => item.id.toString() === id))
      .filter((item): item is SmartFolderItemResult => item !== undefined);
  };

  // === Selecto 설정 ===
  const scrollOptions = useMemo((): SelectoProps['scrollOptions'] | undefined => {
    return {
      container: () => tabPanelRef.current || document.body,
      getScrollPosition: () => {
        if (!tabPanelRef.current) return [0, 0];
        return [tabPanelRef.current.scrollLeft, tabPanelRef.current.scrollTop];
      },
      threshold: 0,
    };
  }, []);

  const selectoKey = useMemo(() => `selecto-${focusIdx}-${isOpen}`, [focusIdx, isOpen]);

  // === useEffect 정리 ===

  /**
   * 추천자료 무한스크롤 완료 후 Selecto boundContainer 및 selectableTargets 업데이트
   * - boundContainer 높이 재계산으로 드래그 영역 확장
   * - selectableTargets 재설정으로 새로 추가된 요소들 선택 가능
   */
  useEffect(() => {
    if (!recommendItemListFetchingNextPage && recommendItems?.length > 0) {
      setTimeout(() => {
        if (selectoRef.current) {
          const boundContainer = recommendContainerRef.current;
          if (boundContainer) {
            // boundContainer 강제 업데이트 - 새로운 높이 인식
            (selectoRef.current as any).boundContainer = boundContainer;
            (selectoRef.current as any).containerRect = boundContainer.getBoundingClientRect();

            // selectableTargets 강제 업데이트 - 새로 추가된 요소들 인식
            (selectoRef.current as any).selectableTargets = ['.selectable-item'];
            if ((selectoRef.current as any).getSelectableElements) {
              (selectoRef.current as any).getSelectableElements();
            }
          }
          selectoRef.current.checkScroll();
        }
      }, 100);
    }
  }, [recommendItemListFetchingNextPage, recommendItems?.length]);

  // 무한스크롤 완료 후 checkScroll 호출
  useEffect(() => {
    if (!recommendItemListFetchingNextPage && recommendItems?.length > 0) {
      selectoRef.current?.checkScroll?.();
    }
  }, [recommendItemListFetchingNextPage, recommendItems?.length]);

  /**
   * 데이터 변경 후 Selecto 업데이트 및 드래그 상태 복원
   * - 무한스크롤, 탭 변경 등으로 데이터가 변경되었을 때 실행
   * - 드래그 중이었다면 선택 상태 복원
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectoRef.current) {
        selectoRef.current.checkScroll();

        // 드래그 중이었다면 상태 복원
        if (isDraggingRef.current && dragStateRef.current.isDragging) {
          if (dragStateRef.current.currentSelecting.size > 0) {
            setSelectingItems(new Set(dragStateRef.current.currentSelecting));
          }
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [
    recommendItems?.length,
    currentFileItems?.length,
    recommendItemListFetchingNextPage,
    isItemListFetchingNextPage,
    isSearchDataFetchingNextPage,
    publicListFetchingNextPage,
    focusIdx,
  ]);

  /**
   * Selecto selectableTargets 동적 생성
   * - 현재 탭과 아이템 상태에 따라 선택 가능한 타겟들을 동적으로 생성
   */
  const selectableTargets = useMemo(() => {
    // 현재 DOM에 있는 모든 .selectable-item 요소들을 동적으로 가져온다
    if (focusIdx === 0 && recommendItems?.length) {
      // 추천자료 탭: 추천 아이템 개수만큼 타겟 생성
      return Array.from({ length: recommendItems.length }, (_, i) => `[data-item-id="${recommendItems[i]?.id}"]`);
    }
    if (focusIdx === 1 && currentFileItems?.length) {
      // 자료보드 탭: 현재 아이템 개수만큼 타겟 생성
      return Array.from({ length: currentFileItems.length }, (_, i) => `[data-item-id="${currentFileItems[i]?.id}"]`);
    }
    return ['.selectable-item'];
  }, [focusIdx, recommendItems, currentFileItems]);

  /**
   * 자료보드 무한스크롤 완료 후 Selecto boundContainer 및 selectableTargets 업데이트
   * - 추천자료와 동일한 로직으로 새로 추가된 요소들 선택 가능하게 처리
   */
  useEffect(() => {
    if (
      !isItemListFetchingNextPage &&
      !isSearchDataFetchingNextPage &&
      currentFileItems &&
      currentFileItems?.length > 0
    ) {
      setTimeout(() => {
        if (selectoRef.current) {
          const boundContainer = fileListRef.current;
          if (boundContainer) {
            // boundContainer 강제 업데이트 - 새로운 높이 인식
            (selectoRef.current as any).boundContainer = boundContainer;
            (selectoRef.current as any).containerRect = boundContainer.getBoundingClientRect();

            // selectableTargets 강제 업데이트 - 새로 추가된 요소들 인식
            (selectoRef.current as any).selectableTargets = ['.selectable-item'];
            if ((selectoRef.current as any).getSelectableElements) {
              (selectoRef.current as any).getSelectableElements();
            }
          }
          selectoRef.current.checkScroll();
        }
      }, 100);
    }
  }, [isItemListFetchingNextPage, isSearchDataFetchingNextPage, currentFileItems]);

  const shouldRenderSelecto = useMemo(() => {
    if (!selectoReady || !tabPanelRef.current || isReactDndDragging) {
      return false;
    }

    // 추천자료 탭: recommendItems가 있을 때만
    if (focusIdx === 0) {
      return recommendItems && recommendItems.length > 0;
    }

    // 자료보드 탭: currentFileItems가 있을 때만
    if (focusIdx === 1) {
      return currentFileItems && currentFileItems.length > 0;
    }

    return false;
  }, [selectoReady, isReactDndDragging, focusIdx, recommendItems, currentFileItems]);

  return (
    <>
      <section className={cx('content-feature', !isOpen && 'fold')}>
        <div className="content-snb" ref={containerRef}>
          <h3 className="screen_out">업무보드 사이드 메뉴</h3>

          <Tab
            sizeType="small"
            items={WORK_BOARD_SNB_TAB}
            focusIdx={focusIdx}
            onChange={handleTabClick}
            panelRef={tabPanelRef}
            onPanelScroll={() => selectoRef.current?.checkScroll?.()}
            commonArea={
              <>
                <label
                  className="btn btn-small btn-line btn-computer"
                  htmlFor="inputFile_workBoard_snb"
                  style={{ cursor: 'pointer' }}
                >
                  내 컴퓨터
                </label>
                <input
                  id="inputFile_workBoard_snb"
                  accept={acceptInput}
                  type="file"
                  style={{ display: 'none' }}
                  multiple={!isPlayingPlan}
                  onChange={handleFileChange}
                />
              </>
            }
          >
            {/* 추천자료 탭 */}
            <>
              <h4 className="screen_out">추천자료</h4>
              {/* 추천자료 조회 중일 경우만 노출 */}
              {isRecommendLoading && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    marginTop: '16px',
                  }}
                >
                  <Loader loadingMessage={null} />
                </div>
              )}
              {Object.entries(groupByDateTempItems).length > 0 ? (
                <div ref={recommendContainerRef}>
                  {Object.entries(groupByDateTempItems).map(([date, items]) => (
                    <React.Fragment key={date}>
                      <em className="title-sub">{date}</em>
                      <ul className="list-thumbnail" ref={recommendListRef}>
                        {Children.toArray(
                          items?.map((item: SmartFolderItemResult) => (
                            <li
                              className={cx(
                                item.fileType !== 'FOLDER' && 'selectable-item',
                                selectedItems.has(item.id.toString()) && 'selected',
                                selectingItems.has(item.id.toString()) && 'selecting',
                              )}
                              data-item-id={item.id}
                            >
                              <DraggableThumbnail
                                item={item}
                                onClickHandler={(event) => handleClickItem(item, event)}
                                selectedItems={selectedItems}
                                selectedItemsData={getSelectedItemsData()}
                                onDragStart={handleReactDndDragStart}
                                onDragEnd={handleReactDndDragEnd}
                              />
                            </li>
                          )),
                        )}
                      </ul>
                    </React.Fragment>
                  ))}
                  {isWorkBoard && recommendItemListsHasNext && (
                    <div ref={recommendLoadMoreRef} style={{ height: '10px', background: 'transparent' }} />
                  )}
                  {recommendItemListFetchingNextPage && <Loader loadingMessage={null} />}
                </div>
              ) : (
                <div className="item-empty" style={{ height: '100%' }}>
                  <div className="ico-comm ico-information-14-g" />
                  <span className="txt-empty">{task ? '이미지 자료가 없습니다.' : '추천 자료가 없습니다.'}</span>
                </div>
              )}
            </>

            {/* 자료보드 탭 */}
            <>
              <SearchBar
                searchValue={searchValue}
                handleSearch={handleSearch}
                handleSelectOption={handleSelectOption}
                handleChangeSearchValue={handleChangeSearchValue}
                handleClearSearchValue={handleClearSearchValue}
              />
              <h4 className="screen_out">자료보드</h4>
              {!isSearching && isShowBreadcrumbs && (
                <BreadCrumb items={breadcrumbs} isFull={false} isLastTwoItems onNavigate={handleNavigate} />
              )}
              {currentFileItems && currentFileItems.length > 0 ? (
                <>
                  <ul className="list-thumbnail" ref={fileListRef}>
                    {Children.toArray(
                      currentFileItems.map((item) => (
                        <li
                          key={item.id}
                          className={cx(
                            item.fileType !== 'FOLDER' && 'selectable-item',
                            selectedItems.has(item.id.toString()) && 'selected',
                            selectingItems.has(item.id.toString()) && 'selecting',
                          )}
                          data-item-id={item.id}
                        >
                          <DraggableThumbnail
                            item={item}
                            onClickHandler={(event) => handleClickItem(item, event)}
                            selectedItems={selectedItems}
                            selectedItemsData={getSelectedItemsData()}
                            onDragStart={handleReactDndDragStart}
                            onDragEnd={handleReactDndDragEnd}
                          />
                        </li>
                      )),
                    )}
                  </ul>
                  {isWorkBoard && (isSearching ? searchDataHasNextPage : itemListsHasNext) && (
                    <div ref={loadMoreRef} style={{ height: '10px', background: 'transparent' }} />
                  )}
                  {(isSearching ? isSearchDataFetchingNextPage : isItemListFetchingNextPage) && (
                    <Loader loadingMessage={null} />
                  )}
                </>
              ) : (
                <div className="item-empty" style={{ height: 'calc(100% - 150px)' }}>
                  {isSearching &&
                    (isSearchLoading ? (
                      <Loader loadingMessage={null} />
                    ) : (
                      <>
                        <strong className="tit-empty">
                          검색어 <em className="font-bold">{`"${searchValue}"`}</em>에 대한
                          <br />
                          검색 결과가 없습니다.
                        </strong>
                        <p className="txt-empty" style={{ textAlign: 'center', marginTop: '10px' }}>
                          오타가 없는지 확인하거나 <br />
                          다른 검색어를 사용해 보세요.
                        </p>
                      </>
                    ))}
                  {!isSearching &&
                    (isItemLoading ? (
                      <Loader loadingMessage="" />
                    ) : (
                      <>
                        <div className="ico-comm ico-information-14-g" />
                        <span className="txt-empty">자료가 없습니다.</span>
                      </>
                    ))}
                  {/* {isSearching ? (
                    isSearchLoading ? (
                      <Loader loadingMessage={null} />
                    ) : (
                      <>
                        <strong className="tit-empty">
                          검색어 <em className="font-bold">{`"${searchValue}"`}</em>에 대한 검색 결과가 없습니다.
                        </strong>
                        <p className="txt-empty" style={{ textAlign: 'center' }}>
                          오타가 없는지 확인하거나 <br />
                          다른 검색어를 사용해 보세요.
                        </p>
                      </>
                    )
                  ) : isItemLoading ? (
                    <Loader loadingMessage={null} />
                  ) : (
                    <div className="item-empty" style={{ height: '100%' }}>
                      <div className="ico-comm ico-information-14-g" />
                      <span className="txt-empty">자료가 없습니다</span>
                    </div>
                  )} */}
                </div>
              )}
            </>
          </Tab>

          {/* Selecto 컴포넌트 */}
          {shouldRenderSelecto && (
            <Selecto
              key={selectoKey}
              ref={selectoRef}
              container={tabPanelRef.current}
              dragContainer={tabPanelRef.current}
              boundContainer={focusIdx === 0 ? recommendContainerRef.current : fileListRef.current}
              selectableTargets={selectableTargets}
              hitRate={0}
              selectByClick={false}
              selectFromInside
              continueSelect={false}
              toggleContinueSelect={['shift']}
              continueSelectWithoutDeselect
              preventClickEventOnDrag
              preventDragFromInside={false}
              scrollOptions={scrollOptions}
              onDragStart={handleDragStart}
              onScroll={handleOnScroll}
              onSelect={handleSelecting}
              onSelectEnd={handleSelectoEnd}
            />
          )}
          <DraggableThumbnailLayer />
        </div>

        <div className="wrap-btn">
          <button type="button" className="btn-toggle" onClick={toggleSnb}>
            <span className="ico-comm ico-snb-arrow-left-fill">메뉴 접기/펼치기</span>
          </button>
        </div>
      </section>
      {isLoading && <Loader hasOverlay loadingMessage={loadingMessage} disableBodyScroll={false} />}
    </>
  );
}
