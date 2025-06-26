'use client';

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  getGetMyBoardItemsQueryOptions,
  getMyBoardItems,
  useAddItemsToMyBoard,
  useDeleteItems,
  useStarred,
} from '@/service/file/fileStore';
import type { IMyBoardTabClient } from '@/app/(auth)/my-board/[tab]/_components/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tab } from '@/components/common/Tab';
import {
  type AddDriveItemToMyBoardRequest,
  type AddDriveItemToMyBoardRequestMyBoardType,
  type DeleteMyBoardItemRequest,
  type SmartFolderItemResult,
  type SmartFolderItemResultFileType,
  SmartFolderItemResultSmartFolderApiType,
} from '@/service/file/schemas';
import { MY_BOARD_TAB_LIST } from '@/const/tab';
import { Loader, Select } from '@/components/common';
import FloatingMenu from '@/components/common/FloatingMenu';
import useUserStore from '@/hooks/store/useUserStore';
import type { IActionButton } from '@/components/common/FloatingMenu/types';
import { getMyBoardType } from '@/app/(auth)/my-board/utils';
import { type IColumn, Table } from '@/components/common/Table';
import { MyBoardLayoutContext } from '@/app/(auth)/my-board/context/MyBoardLayoutContext';
import MyBoardThumbnail from '@/app/(auth)/my-board/_components/MyBoardThumbnail';
import { useToast } from '@/hooks/store/useToastStore';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import { DownloadModal, UploadModal } from '@/components/modal';
import { IP_ADDRESS } from '@/const';
import { getFlattenedData, isEmpty } from '@/utils';
import { ShareLinkModal } from '@/components/modal/share-link';
import { useHandleFile } from '@/hooks/useHandleFile';
import GroupRenderEmpty from '@/components/common/GroupRenderEmpty';
import { useInfiniteQueryWithLimit } from '@/utils/react-query';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useGetByIdOrCode1 } from '@/service/member/memberStore';
import Selecto, { SelectoProps } from 'react-selecto';
import { useUserProfileStroe } from '@/hooks/store/useUserProfileStroe';

type Data = { [key: string]: any };

// 테이블 컬럼 리스트
const TABLE_COLUMNS: IColumn[] = [
  {
    key: 'name',
    title: '이름',
    dataType: 'thumbnail',
  },
  {
    key: 'userProfileName',
    title: '사용자',
    textEllipsis: true,
    width: '149px',
    dataType: 'profile',
  },
  {
    key: 'totalSize',
    title: '크기',
    width: '111px',
    dataType: 'fileSize',
  },
  {
    key: 'driveItemCreatedAt',
    title: '등록일',
    width: '133px',
    dataType: 'date',
  },
  {
    key: 'isFavorite',
    title: '즐겨찾기',
    width: '71px',
    dataType: 'favorite',
  },
];

const MyBoardTabClient: React.FC<IMyBoardTabClient> = ({
  // profileId,
  // profileCode,
  defaultFocusIdx,
}: IMyBoardTabClient) => {
  // 알림 스토어
  const { showAlert } = useAlertStore();
  const { userInfo } = useUserStore();
  const addToast = useToast((state) => state.add);

  // 유저 정보 관리
  // const searchParams = useSearchParams();
  // const userParams = searchParams.get('user');
  // const profileCode = userParams ?? userInfo?.code ?? '';

  // const { data: currentUserInfo } = useGetByIdOrCode1(profileCode);
  // const profileId = useMemo(() => {
  //   return currentUserInfo?.result?.id.toString() ?? userInfo?.id.toString() ?? '0';
  // }, [currentUserInfo?.result?.id, userInfo?.id]);

  // const { userProfileCode: profileCode, userProfileId: profileId } = useUserProfile();
  const { userProfile } = useUserProfileStroe();

  const profileId = useMemo(() => {
    return userProfile?.id.toString() ?? userInfo?.id.toString() ?? '0';
  }, [userProfile?.id, userInfo?.id]);

  const profileCode = useMemo(() => {
    return userProfile?.code.toString() ?? userInfo?.code.toString() ?? '';
  }, [userProfile?.code, userInfo?.code]);

  // 검색어 관리
  const { searchValue, searchResult, searchLoadMoreRef, searchLoading, searchRefetch } =
    useContext(MyBoardLayoutContext);
  const [searchType, setSearchType] = useState<string>('');

  const [filteredSearchResult, setFilteredSearchResult] = useState<SmartFolderItemResult[]>(searchResult);
  useEffect(() => {
    if (!searchType) setFilteredSearchResult(searchResult);
    else setFilteredSearchResult(searchResult.filter((item) => item.fileType === searchType));
  }, [searchType, searchResult]);

  const isSearching = useMemo(() => {
    return !!searchValue && searchValue.length >= 2;
  }, [searchValue]);

  // 탭 관리
  const [focusIdx, setFocusIdx] = useState<number>(defaultFocusIdx);
  const router = useRouter();
  const currentTabType = useMemo(() => {
    return getMyBoardType(focusIdx);
  }, [focusIdx]);

  const isStoryBoardTab = useMemo(() => {
    return focusIdx === 2;
  }, [focusIdx]);

  // 나의 마이 보드 판별
  const isMine = profileId === userInfo?.id.toString();

  const handleRouteTab = useCallback(
    (index: number) => {
      const { path: targetPath } = MY_BOARD_TAB_LIST[index];
      router.push(`/my-board/${targetPath}${!isMine ? `?user=${profileCode}` : ''}`);
    },
    [isMine, profileCode, router],
  );

  const [gridClassName, setGridClassName] = useState(focusIdx === 1 ? 'list-card-grid' : 'list-thumbnail-grid');

  const handleTabClick = (index: number) => {
    if (isSearching) return;
    setFocusIdx(index);
    handleRouteTab(index);
  };

  // 탭별 자료 GET 요청 파라미터
  const [isPublic, setIsPublic] = useState<string>(isMine ? '' : 'true'); // 자료 공개 여부 필터

  const queryParams = useMemo(() => {
    if (isPublic) {
      if (isMine) {
        return {
          myBoardType: currentTabType,
          isPublic,
          sorts: 'createdAt.desc,name.asc',
        };
      }
      return {
        myBoardType: currentTabType,
        isPublic: 'true',
        sorts: 'createdAt.desc,name.asc',
      };
    }

    if (isMine) {
      return {
        myBoardType: currentTabType,
        sorts: 'createdAt.desc,name.asc',
      };
    }
    return {
      myBoardType: currentTabType,
      isPublic: 'true',

      sorts: 'createdAt.desc,name.asc',
    };
  }, [currentTabType, isMine, isPublic]);

  // 체크 박스 핸들링
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SmartFolderItemResult[]>([]);
  const [currentSelectedItems, setCurrentSelectedItems] = useState<SmartFolderItemResult[]>([]);
  const selectedIds = useMemo(() => {
    return selectedItems.map((item) => item.id);
  }, [selectedItems]);

  /** 드래그 셀렉트 */
  const selectoRef = useRef<Selecto & { destroy(): void }>(null);

  /** 검색 결과 무한 스크롤 * */
  const LIMIT = 29;

  const { queryKey: myBoardQueryKey } = getGetMyBoardItemsQueryOptions(profileId, queryParams);
  const {
    data,
    fetchNextPage: myBoardResultNextPage,
    hasNextPage: myBoardResultHasNext,
    isFetchingNextPage: myBoardResultFetchingNextPage,
    refetch,
    isError,
    isLoading,
    isFetching,
    isRefetching,
  } = useInfiniteQueryWithLimit({
    queryKey: myBoardQueryKey,
    queryFn: (pageParam) =>
      getMyBoardItems(profileId, {
        ...queryParams,
        offsetWithLimit: `${pageParam},${LIMIT}`,
      }),
    limit: LIMIT,
    enabled: !!currentTabType,
  });

  const [dataList, setDataList] = useState<SmartFolderItemResult[]>(getFlattenedData(data?.pages));
  useEffect(() => {
    setDataList(getFlattenedData(data?.pages));
    setGridClassName(focusIdx === 1 ? 'list-card-grid' : 'list-thumbnail-grid');
  }, [data, focusIdx]);

  useEffect(() => {
    // 무한 스크롤 대응 - 전체 체크박스 선택초기화
    setIsAllSelected(
      selectedItems.length !== 0 && selectedItems.length === (isSearching ? filteredSearchResult : dataList)?.length,
    );
  }, [dataList, filteredSearchResult, isSearching, selectedItems.length]);

  /**  옵저브 관리 * */
  const lecturePhotoLoadMoreRef = useRef<HTMLDivElement | null>(null);
  const lecturePhotoCallbackRef = useRef<() => void>(() => {}); // 놀이 카드 탭 데이터의 최신 상태 유지하기 위해 ref 생성

  const lecturePlanLoadMoreRef = useRef<HTMLDivElement | null>(null);
  const lecturePlanCallbackRef = useRef<() => void>(() => {}); // 놀이 계획 탭 데이터의 최신 상태 유지하기 위해 ref 생성

  const storyBoardLoadMoreRef = useRef<HTMLDivElement | null>(null);
  const storyBoardCallbackRef = useRef<() => void>(() => {}); // 스토리 보드 탭 데이터의 최신 상태 유지하기 위해 ref 생성

  /** 무한 스크롤 옵저브 선언  */
  const { observe: lecturePhotoObserve } = useInfiniteScroll({
    callback: () => lecturePhotoCallbackRef.current(),
    threshold: 0.5,
  });

  const { observe: lecturePlanObserve } = useInfiniteScroll({
    callback: () => lecturePlanCallbackRef.current(),
    threshold: 0.5,
  });

  const { observe: storyBoardObserve } = useInfiniteScroll({
    callback: () => storyBoardCallbackRef.current(),
    threshold: 0.5,
  });

  /** 옵저브 요소 할당 */
  useEffect(() => {
    if (focusIdx === 0 && lecturePhotoLoadMoreRef.current) {
      lecturePhotoObserve(lecturePhotoLoadMoreRef.current);
      selectoRef.current?.findSelectableTargets();
    }

    if (focusIdx === 1 && lecturePlanLoadMoreRef.current) {
      lecturePlanObserve(lecturePlanLoadMoreRef.current);
      selectoRef.current?.findSelectableTargets();
    }

    if (focusIdx === 2 && storyBoardLoadMoreRef.current) {
      storyBoardObserve(storyBoardLoadMoreRef.current);
      selectoRef.current?.findSelectableTargets();
    }
  }, [focusIdx, lecturePhotoObserve, lecturePlanObserve, storyBoardObserve]);

  useEffect(() => {
    lecturePhotoCallbackRef.current = () => {
      if (focusIdx === 0 && myBoardResultHasNext && !myBoardResultFetchingNextPage) {
        myBoardResultNextPage();
      }
    };
    lecturePlanCallbackRef.current = () => {
      if (focusIdx === 1 && myBoardResultHasNext && !myBoardResultFetchingNextPage) {
        myBoardResultNextPage();
      }
    };
    storyBoardCallbackRef.current = () => {
      if (focusIdx === 2 && myBoardResultHasNext && !myBoardResultFetchingNextPage) {
        myBoardResultNextPage();
      }
    };
  }, [focusIdx, myBoardResultFetchingNextPage, myBoardResultHasNext, myBoardResultNextPage]);

  const getCurrentLoadMoreRef = (tabName: string) => {
    if (tabName === 'lecturePhoto') return lecturePhotoLoadMoreRef;
    if (tabName === 'lecturePlan') return lecturePlanLoadMoreRef;
    if (tabName === 'storyBoard') return storyBoardLoadMoreRef;
    return lecturePhotoLoadMoreRef;
  };

  const getCurrentIsFetchingNextPage = (tabName: string) => {
    if (tabName === 'lecturePhoto') return focusIdx === 0 && myBoardResultFetchingNextPage;
    if (tabName === 'lecturePlan') return focusIdx === 1 && myBoardResultFetchingNextPage;
    if (tabName === 'storyBoard') return focusIdx === 2 && myBoardResultFetchingNextPage;
    return focusIdx === 0 && myBoardResultFetchingNextPage;
  };

  // 파일 추가 (업로드 모달)
  const allowsFileTypes: SmartFolderItemResultFileType[] = useMemo(() => {
    /*
     * [업로드 모달 내부 허용 자료 타입]
     * 놀이 사진 : IMAGE
     * 놀이 계획 : LECTURE_PLAN
     * 스토리 보드 : STORY_BOARD (현재 스토리 보드는 파일 추가 X)
     * */
    return currentTabType === 'PLAY_PHOTO' ? ['IMAGE'] : [currentTabType as SmartFolderItemResultFileType];
  }, [currentTabType]);

  const [itemData, setItemData] = useState<SmartFolderItemResult[]>([]); // 업로드 모달에서 선택한 자료 데이터
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { mutateAsync: addItemsToMyBoard } = useAddItemsToMyBoard();

  /* 업로드 모달 열기 */
  const handleOpenUploadModal = () => {
    setIsUploadModalOpen(true);
  };

  /* 업로드 모달 닫기 */
  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
  };

  const handleCompletedUploadItemData = useCallback(async () => {
    await refetch();
    handleCloseUploadModal();
    addToast({ message: '업로드하였습니다.' });
  }, [addToast, refetch]);

  /* 업로드 모달 내에서 선택한 파일 업로드 */
  const handleUploadItemData = useCallback(
    async (targetData: SmartFolderItemResult[]) => {
      if (targetData.length < 1) return;
      const addItemsParams: { profileId: string; data: AddDriveItemToMyBoardRequest } = {
        profileId,
        data: {
          folderOwnerIp: IP_ADDRESS,
          myBoardType: currentTabType as AddDriveItemToMyBoardRequestMyBoardType,
          isPublic: isStoryBoardTab, // 디폴트공개 여부 설정, [놀이 사진] / [놀이 계획]: 비공개, [스토리보드]: 공개
          originalDriveItemKeys: targetData.map((item: SmartFolderItemResult) => item?.driveItemKey),
        },
      };

      const result = await addItemsToMyBoard(addItemsParams);
      if (result.status === 200) {
        await handleCompletedUploadItemData();
      } else {
        addToast({ message: '업로드에 실패했습니다.' });
      }
    },
    [addItemsToMyBoard, addToast, currentTabType, handleCompletedUploadItemData, isStoryBoardTab, profileId],
  );

  /* 업로드 모달 선택 파일 적용 */
  const handleConfirmUploadModal = useCallback(
    async (results?: SmartFolderItemResult[]) => {
      if (results && results?.length > 0) {
        await handleUploadItemData(results);
        return;
      }
      await handleCompletedUploadItemData();
    },
    [handleCompletedUploadItemData, handleUploadItemData],
  );

  /* 파일 저장 (다운로드 모달) */
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  // 파일 여부
  const hasFile = useMemo(() => {
    return (
      (isSearching ? filteredSearchResult && filteredSearchResult.length > 0 : dataList && dataList.length >= 1) ??
      false
    );
  }, [dataList, filteredSearchResult, isSearching]);

  const handleInitSelected = () => {
    setSelectedItems([]); // 마이보드 조회 프로필 변경시, 데이터 초기화
    setCurrentSelectedItems([]);
    setIsAllSelected(false);
  };

  useEffect(() => {
    handleInitSelected(); // 마이보드 조회 프로필 변경시, 데이터 초기화
    setSearchType('');
  }, [profileId]);

  useEffect(() => {
    handleInitSelected(); // 검색 시작/종료시, 선택된 데이터 초기화
  }, [isSearching]);

  // 전체 선택 체크박스 핸들링
  const handleAllSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.target;
    setIsAllSelected(checked);
    if (checked) {
      // 모든 아이디를 선택
      setSelectedItems((isSearching ? filteredSearchResult : dataList) ?? []);
      setCurrentSelectedItems((isSearching ? filteredSearchResult : dataList) ?? []);
    } else {
      // 선택 해제
      setSelectedItems([]);
      setCurrentSelectedItems([]);
    }
  };

  // 개별 썸네일 선택 상태 변경
  const handleThumbnailChange = (targetItem: SmartFolderItemResult, newValue: boolean) => {
    setSelectedItems((prev: SmartFolderItemResult[]) => {
      const updated = newValue
        ? [...prev, targetItem] // 선택 시 아이디 추가
        : prev.filter((item) => item !== targetItem); // 해제 시 아이디 제거

      // 전체 선택 여부 갱신
      setIsAllSelected(updated.length === (isSearching ? filteredSearchResult : dataList)?.length);
      // 현재 선택된 아이템 갱신
      setCurrentSelectedItems([...updated]);
      return updated;
    });
  };

  // 리스트 개별 선택 상태 변경
  const handleTableChange = (rowData: Data, checked: boolean) => {
    if (isEmpty(rowData)) {
      addToast({ message: '선택된 항목이 없습니다.' });
      // showAlert({ message: '선택된 항목이 없습니다.' });
      return;
    }
    handleThumbnailChange(rowData as SmartFolderItemResult, checked);
  };

  // 공개 여부 필터 관리
  const handleSelectPublicOptions = (value: string) => {
    setIsPublic(value as string);
    handleInitSelected();
  };

  let actionButtonList: IActionButton[] = [];

  // 플로팅 메뉴: 뷰 모드 상태 관리
  const [currentViewMode, setCurrentViewMode] = useState<'grid' | 'list'>('grid');

  // 플로팅 메뉴: 액션 버튼 실행 함수 정의
  const { mutateAsync: deleteItems } = useDeleteItems();
  const handleRemoveItems = async (items: number[]) => {
    const deleteMyBoardItemRequest: DeleteMyBoardItemRequest = {
      myBoardItemIds: items,
    };
    const { status } = await deleteItems({
      profileId,
      data: deleteMyBoardItemRequest,
    });
    if (status === 200) {
      addToast({ message: '삭제되었습니다' });
      setSelectedItems([]);
      setCurrentSelectedItems([]);
      if (isSearching) await searchRefetch();
      await refetch();
    } else {
      addToast({ message: '삭제에 실패하였습니다.' });
    }
  };

  // 즐겨찾기
  const { mutateAsync: starred } = useStarred();
  const handleFavorite = (item: SmartFolderItemResult) => {
    starred({
      data: {
        driveItemKey: item.driveItemKey,
      },
    }).then(({ result }) => {
      if (typeof result === 'undefined') return;
      setFilteredSearchResult((prev) =>
        prev.map((currentData) => {
          if (currentData.id === item.id) {
            return {
              ...currentData,
              isFavorite: result,
            };
          }
          return currentData;
        }),
      );
      setDataList((prev) =>
        prev.map((currentData) => {
          if (currentData.id === item.id) {
            return {
              ...currentData,
              isFavorite: result,
            };
          }
          return currentData;
        }),
      );
    });
  };

  /* 선택한 폴더에 저장 & 이동 & 복사 */
  const { handleSave, handleMove, handleCopy } = useHandleFile();
  const [currentAction, setCurrentAction] = useState<'COPY' | 'MOVE' | 'SAVE' | null>(null);
  const [currentActionItem, setCurrentActionItem] = useState<SmartFolderItemResult | null>(null);

  const initCurrentAction = useCallback(() => {
    setCurrentAction(null);
    setCurrentActionItem(null);
    handleInitSelected();
    if (isSearching) searchRefetch();
    refetch();
  }, [isSearching, refetch, searchRefetch]);

  /* 다운로드 모달 열기 */
  const handleOpenDownloadModal = () => {
    setIsDownloadModalOpen(true);
  };

  /* 다운로드 모달 닫기 */
  const handleCloseDownloadModal = () => {
    setIsDownloadModalOpen(false);
  };

  const handleActionItems = (action: 'COPY' | 'MOVE' | 'SAVE', item?: SmartFolderItemResult) => {
    handleOpenDownloadModal();
    setCurrentAction(action);
    if (item) setCurrentActionItem(item);
  };

  /* 다운로드 저장 버튼 클릭시 */
  const handleConfirmDownloadModal = async (targetFolder?: SmartFolderItemResult | null, pathString?: string) => {
    if (!targetFolder) return;

    const finalize = () => {
      initCurrentAction();
      handleCloseDownloadModal();
    };

    if (currentAction === 'SAVE') {
      handleSave(
        targetFolder,
        currentActionItem ? [currentActionItem?.driveItemKey] : selectedItems.map((item) => item.driveItemKey),
        pathString,
      ).then(finalize);
      return;
    }

    if (currentAction === 'MOVE') {
      handleMove(targetFolder, currentActionItem ? currentActionItem?.id : selectedIds, 'MyBoard', pathString).then(
        finalize,
      );
      return;
    }

    if (currentAction === 'COPY') {
      handleCopy(targetFolder, currentActionItem ? currentActionItem?.id : selectedIds, 'MyBoard', pathString).then(
        finalize,
      );
    }
  };

  /* 공유 관리 */
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

  /* 플로팅 메뉴 액션 버튼 관리 */
  const COPY_BUTTON: IActionButton = {
    key: 'copy',
    label: '복사',
    action: () => {
      handleActionItems('COPY');
    },
    icon: 'copy-14-b',
  };

  const MOVE_BUTTON: IActionButton = {
    key: 'move',
    label: '이동',
    action: () => {
      handleActionItems('MOVE');
    },
    icon: 'move-14',
  };

  const DELETE_BUTTON: IActionButton = {
    key: 'delete',
    label: '삭제',
    action: () => handleRemoveItems(selectedIds),
    icon: 'delete-14',
  };

  const SAVE_BUTTON: IActionButton = {
    key: 'save',
    label: '저장',
    action: () => {
      handleActionItems('SAVE');
    },
    icon: 'save-14',
  };

  if (hasFile && selectedIds.length > 0) {
    if (isMine) {
      actionButtonList = [COPY_BUTTON, MOVE_BUTTON, DELETE_BUTTON, SAVE_BUTTON];
    } else {
      actionButtonList = [SAVE_BUTTON];
    }
  }

  const handleAddButton = () => {
    if (isStoryBoardTab) {
      // 스토리북 글쓰기 버튼 클릭
      router.push('/my-board/story-board/post');
    } else {
      // 파일 추가 버튼 클릭
      handleOpenUploadModal();
    }
  };

  // 선택 객체 클릭 이벤트 - 미리보기 이벤트
  const handleClickItem = (selectItem: SmartFolderItemResult) => {
    const { id, smartFolderApiType } = selectItem;
    if (
      isEmpty(id) ||
      isEmpty(smartFolderApiType) ||
      !(smartFolderApiType in SmartFolderItemResultSmartFolderApiType)
    ) {
      addToast({ message: '선택된 항목이 없습니다.' });
      return;
    }
    router.push(`/preview?smartFolderItemId=${id}&smartFolderApiType=${smartFolderApiType}&user=${profileCode}`);
  };

  const renderEmpty = () => {
    const messages = {
      0: {
        title: isMine ? '놀이 사진을 올려주세요!' : '놀이 사진이 없습니다.',
        desc: '놀이 보고서 작성시 사용된 사진이 보여집니다.',
        ico: 'ico-illust7',
      },
      1: {
        title: isMine ? '놀이 계획을 올려주세요!' : '놀이 계획이 없습니다.',
        desc: '놀이 계획 작성시 사용된 놀이카드가 보여집니다.',
        ico: 'ico-illust8',
      },
      2: {
        title: isMine ? '스토리 보드를 올려주세요!' : '스토리 보드가 없습니다.',
        desc: '',
        ico: 'ico-illust9',
      },
    } as const;

    const { title, desc, ico } = messages[focusIdx as keyof typeof messages] || messages[0];

    return <GroupRenderEmpty type="type3" icon={ico} errorMessage={title} desc={desc} />;
  };

  /* 셀렉트 박스 (필터) 옵션 */
  const searchSelectOption = [
    { text: '전체', value: '' },
    { text: '놀이 사진', value: 'IMAGE' },
    { text: '놀이 계획', value: getMyBoardType(1) },
    { text: '스토리 보드', value: getMyBoardType(2) },
  ];

  const tabSelectOption = [
    { text: '전체', value: '' },
    { text: '공개', value: 'true' },
    { text: '비공개', value: 'false' },
  ];

  /* 옵저버 포함 MY_BOARD_TAB_LIST */
  const OBSERVER_TAB_LIST = MY_BOARD_TAB_LIST.map((tab) => {
    return {
      ...tab,
      loadMoreRef: getCurrentLoadMoreRef(tab.tabName),
      isFetchingNextPage: getCurrentIsFetchingNextPage(tab.tabName),
    };
  });

  /** 드래그 셀렉트 */
  const [myBoardContent, setMyBoardContent] = useState<Element | null>(null);

  useEffect(() => {
    const mainContentElem = document.querySelector('.main-content');
    if (mainContentElem) setMyBoardContent(mainContentElem);
  }, []);

  const scrollOptions = useMemo((): SelectoProps['scrollOptions'] | undefined => {
    return {
      container: document.documentElement,
      threshold: 10,
      throttleTime: 10,
      useScroll: false,
      requestScroll: ({ container, direction }: { container: HTMLElement; direction: number[] }) => {
        // eslint-disable-next-line no-param-reassign
        container.scrollTop += direction[1] * 10;
      },
      checkScrollEvent: true,
    };
  }, []);

  /* 선택된 아이템 처리 */
  const handleSelect = (e: any) => {
    const selected = e.selected.map((el: any) => {
      return (isSearching ? filteredSearchResult : dataList).find((item) => item.id.toString() === el.dataset.id);
    });
    if (selected && selected.length > 0) {
      const updated = Array.from(new Set([...currentSelectedItems, ...selected]));
      setSelectedItems(updated);
      setIsAllSelected(updated.length === (isSearching ? filteredSearchResult : dataList)?.length);
    } else {
      setSelectedItems([...currentSelectedItems]);
      setIsAllSelected(currentSelectedItems.length === (isSearching ? filteredSearchResult : dataList)?.length);
    }
  };

  const handleSelectEnd = (e: any) => {
    setCurrentSelectedItems([...selectedItems]);
  };
  /** 드래그 셀렉트 끝 */

  return (
    <>
      <Tab
        items={MY_BOARD_TAB_LIST}
        sizeType="large"
        focusIdx={isSearching ? -1 : focusIdx}
        onChange={handleTabClick}
        commonArea={
          isSearching && (
            /** 검색시 노출되는 화면 */
            <div className="tab-panel active group-content">
              <FloatingMenu
                isChecked={hasFile}
                isAllSelected={isAllSelected}
                handleAllSelected={handleAllSelected}
                floatingActionButton={selectedIds.length > 0}
                actionButton={actionButtonList}
                currentViewMode={currentViewMode}
                setCurrentViewMode={setCurrentViewMode}
                renderButton={false}
                filter={
                  isMine && (
                    <Select
                      className="w-120"
                      size="small"
                      options={searchSelectOption}
                      value={searchType}
                      placeholder="옵션을 선택하세요."
                      onChange={(value) => setSearchType(value as string)}
                    />
                  )
                }
              />
              {hasFile && filteredSearchResult ? (
                <div className="body-content">
                  {currentViewMode === 'grid' ? (
                    // 그리드 뷰어
                    <ul className="list-thumbnail-grid">
                      {filteredSearchResult.map((item: SmartFolderItemResult) => {
                        return (
                          <li key={item.id} data-id={item.id} className="selectable">
                            <MyBoardThumbnail
                              item={item}
                              path={MY_BOARD_TAB_LIST[focusIdx].path ?? 'lecture-photo'}
                              selected={selectedIds.includes(item.id)}
                              floating={selectedIds.length > 0}
                              isSearching={isSearching}
                              onClickShareLinkButton={handleClickShareLinkButton}
                              onRemoveItems={handleRemoveItems}
                              onActionItems={handleActionItems}
                              onThumbnailChange={(newValue) => handleThumbnailChange(item, newValue)}
                              onClickItem={handleClickItem}
                              onFavorite={handleFavorite}
                            />
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    // 리스트 뷰어
                    <Table
                      hasCheckBox
                      hasMenu
                      tabId="search"
                      columns={TABLE_COLUMNS}
                      data={filteredSearchResult}
                      selectRowItems={selectedIds}
                      onSelectRow={handleTableChange}
                      onClickShareLinkButton={handleClickShareLinkButton}
                      onRemoveItems={handleRemoveItems}
                      onActionItems={handleActionItems}
                      onClickItem={handleClickItem}
                      onFavorite={handleFavorite}
                      // pagination={{ totalPage: 10, perPage: 20, currentPage: 1 }}
                    />
                  )}
                  <div ref={searchLoadMoreRef} style={{ height: '10px', background: 'transparent' }} />
                </div>
              ) : searchLoading ? (
                <Loader loadingMessage={null} />
              ) : (
                <div>
                  <GroupRenderEmpty
                    isTitle={false}
                    errorMessage=""
                    searchValue={searchValue}
                    desc="오타가 없는지 확인하거나 다른 검색어를 사용해 보세요."
                  />
                </div>
              )}
            </div>
          )
          /** 검색시 노출되는 화면 꿑 */
        }
      >
        {!isSearching &&
          OBSERVER_TAB_LIST.map((tab) => (
            <div className="group-content" key={tab.tabId}>
              <FloatingMenu
                isChecked={hasFile}
                isAllSelected={isAllSelected}
                handleAllSelected={handleAllSelected}
                buttonLabel={isStoryBoardTab ? '글쓰기' : '파일추가'}
                floatingActionButton={selectedIds.length > 0}
                handleButton={handleAddButton}
                actionButton={actionButtonList}
                currentViewMode={currentViewMode}
                setCurrentViewMode={setCurrentViewMode}
                renderButton={isMine}
                // renderButton
                filter={
                  isMine && (
                    <Select
                      className="w-120"
                      size="small"
                      options={tabSelectOption}
                      value={isPublic}
                      placeholder="옵션을 선택하세요."
                      onChange={(value) => handleSelectPublicOptions(value as string)}
                    />
                  )
                }
              />
              {hasFile && dataList ? (
                <div className="body-content">
                  {currentViewMode === 'grid' ? (
                    // 그리드 뷰어
                    <ul className={gridClassName}>
                      {dataList.map((item: SmartFolderItemResult) => {
                        return (
                          <li key={item.id} data-id={item.id} className="selectable">
                            <MyBoardThumbnail
                              item={item}
                              path={MY_BOARD_TAB_LIST[focusIdx].path ?? 'lecture-photo'}
                              selected={selectedIds.includes(item.id)}
                              floating={selectedIds.length > 0}
                              onClickShareLinkButton={handleClickShareLinkButton}
                              onRemoveItems={handleRemoveItems}
                              onActionItems={handleActionItems}
                              onThumbnailChange={(newValue) => handleThumbnailChange(item, newValue)}
                              onClickItem={handleClickItem}
                              onFavorite={handleFavorite}
                            />
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    // 리스트 뷰어
                    <Table
                      hasCheckBox
                      hasMenu
                      tabId={tab.tabId}
                      columns={TABLE_COLUMNS}
                      data={dataList}
                      selectRowItems={selectedIds}
                      onSelectRow={handleTableChange}
                      onClickShareLinkButton={handleClickShareLinkButton}
                      onRemoveItems={handleRemoveItems}
                      onActionItems={handleActionItems}
                      onClickItem={handleClickItem}
                      onFavorite={handleFavorite}
                    />
                  )}
                  {tab.isFetchingNextPage && <Loader loadingMessage={null} />}
                  {tab.loadMoreRef && (
                    <div ref={tab.loadMoreRef} style={{ height: '10px', background: 'transparent' }} />
                  )}
                </div>
              ) : isLoading || isFetching || isRefetching ? (
                <Loader loadingMessage={null} />
              ) : (
                renderEmpty()
              )}
            </div>
          ))}
      </Tab>
      {/* 모달 컴포넌트들 */}
      {isUploadModalOpen && (
        <UploadModal
          isOpen={isUploadModalOpen}
          onCancel={handleCloseUploadModal}
          onConfirm={handleConfirmUploadModal}
          setItemData={setItemData}
          taskType={getMyBoardType(focusIdx)}
          allowsFileTypes={allowsFileTypes}
          isUploadS3
          isReturnS3UploadedItemData={false}
        />
      )}
      {isDownloadModalOpen && (
        <DownloadModal
          isOpen={isDownloadModalOpen}
          itemData={currentActionItem ? [currentActionItem] : selectedItems}
          onCancel={handleCloseDownloadModal}
          onConfirm={handleConfirmDownloadModal}
          action={currentAction}
        />
      )}
      {isShareLinkModalOpen && (
        <ShareLinkModal item={shareLinkModalItem} onCloseRefetch={refetch} onCancel={handleCloseShareLinkModal} />
      )}
      {myBoardContent && !isUploadModalOpen && !isDownloadModalOpen && !isShareLinkModalOpen && (
        <Selecto
          key={currentTabType}
          ref={selectoRef}
          container={document.documentElement}
          dragContainer={myBoardContent}
          toggleContinueSelect={['shift']}
          selectableTargets={['.selectable']}
          selectByClick={false}
          clickBySelectEnd={false}
          continueSelect={false}
          selectFromInside
          preventClickEventOnDrag
          hitRate={0}
          scrollOptions={scrollOptions}
          onSelect={handleSelect}
          onSelectEnd={handleSelectEnd}
        />
      )}
    </>
  );
};

export default MyBoardTabClient;
