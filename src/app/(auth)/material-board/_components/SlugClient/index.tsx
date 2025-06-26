'use client';

import { BreadCrumb, Button, Input, Select } from '@/components/common';
import FloatingMenu from '@/components/common/FloatingMenu';
import { IActionButton } from '@/components/common/FloatingMenu/types';
import { DRIVE_ITEM_OPTIONS, EXTENSIONS, prefix } from '@/const';
import { getApiTypeForSlug, getSmartFolderPath } from '@/const/smartFolderApiType';
import useUserStore from '@/hooks/store/useUserStore';
import {
  findAllPagingReplies,
  getGetFolderTreeFromRootQueryKey,
  getItemKeyList,
  getItemList,
  getPublicItemForMyList,
  getScanMyFoldersQueryKey,
  useAddFolder1,
  useGetPhotoHomeFolders,
  useHideItems,
  useMoveItemToTrash1,
  useRemoveFromService,
  useRenameItem2,
  useRestoreItems,
  useStarred,
} from '@/service/file/fileStore';
import {
  SmartFolderItemResult,
  SmartFolderItemResultFileType,
  SmartFolderItemResultSmartFolderApiType,
  SmartFolderResult,
  SmartFolderResultRootType,
  SmartFolderTreeResult,
} from '@/service/file/schemas';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import cx from 'clsx';
import MaterialBoardList from '@/app/(auth)/material-board/_components/MaterialBoardList';
import PhotoHomeList from '@/app/(auth)/material-board/_components/PhotoHomeList';
import PhotoDateList from '@/app/(auth)/material-board/_components/PhotoDateList';
import { ShareLinkModal } from '@/components/modal/share-link';
import SearchBar from '@/components/common/SearchBar';
import { ISlugClient } from '@/app/(auth)/material-board/_components/SlugClient/types';
import { useActiveFolderSync } from '@/hooks/useActiveFolderSync';
import { useFolderStore } from '@/hooks/store/useFolderStore';
import { IBreadcrumbProps } from '@/components/common/Breadcrumb';
import { useGetEducationalClasses } from '@/service/member/memberStore';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useInfiniteQueryWithLimit } from '@/utils/react-query';
import { getFlattenedData, isEmpty } from '@/utils';
import { useHandleFile } from '@/hooks/useHandleFile';
import { DownloadModal, TagModal } from '@/components/modal';
import { useToast } from '@/hooks/store/useToastStore';
import { EducationalClassResult } from '@/service/member/schemas';
import Image from 'next/image';
import dayjs, { dateFormat } from '@/lib/dayjs';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import { useQueryClient } from '@tanstack/react-query';
import Selecto, { OnSelect, OnSelectEnd } from 'react-selecto';

const LIMIT = 30;

const SlugClient: React.FC<ISlugClient> = ({ category, parentSmartFolderId }) => {
  const { userInfo } = useUserStore();
  const isMine = userInfo?.id.toString();
  // 반 정보 리스트
  const { data: classes, refetch: classesRefetch } = useGetEducationalClasses(
    isMine || '0',
    {
      includes: 'students',
    },
    {
      query: { enabled: category === 'photo' },
    },
  );

  const classList = useMemo(() => {
    return classes?.result || [];
  }, [classes]);

  // 3. defaultClassId 계산
  const defaultClassId = useMemo(() => {
    return classList.find((c) => c.isBasicClass)?.id ?? classList[0]?.id ?? 0;
  }, [classList]);

  const { mutateAsync: addFolder } = useAddFolder1();
  const { mutateAsync: renameItem } = useRenameItem2();
  const [selectClass, setSelectClass] = useState<number | null>(null); // 반 선택
  const resolvedClassId = selectClass ?? defaultClassId;
  const photoHomeParams = {
    ...(resolvedClassId !== 0 && { educationalClassId: resolvedClassId }), // 0이면 키 제거
  };

  const {
    data: photoHome,
    refetch: photoHomeRefetch,
    isLoading: photoHomeLoading,
  } = useGetPhotoHomeFolders(photoHomeParams, {
    query: { enabled: category === 'photo' },
  });

  const photoHomeList = useMemo(() => {
    return photoHome?.result || [];
  }, [photoHome]);
  // 사진 폴더 홈 용
  const [photoHomeListState, setPhotoHomeListState] = useState<SmartFolderResult[]>(photoHomeList);
  const [makeFolderMode, setMakeFolderMode] = useState(false);
  // 폴더 이름 변경 or 생성 모드
  const [nameEditable, setNameEditable] = useState<SmartFolderItemResult | null>(null);
  useEffect(() => {
    setPhotoHomeListState(photoHomeList || []);
  }, [photoHomeList]);

  const router = useRouter();

  const { activeFolder } = useActiveFolderSync(photoHomeList);
  const { folderList } = useFolderStore();
  const { showAlert } = useAlertStore();
  const queryClient = useQueryClient();
  const addToast = useToast((state) => state.add);

  const isPhotoHome = useMemo(() => {
    return activeFolder?.rootType === 'NONE' && category === 'photo';
  }, [activeFolder, category]);

  const isDocsHome = useMemo(() => {
    return activeFolder?.rootType === 'NONE' && category === 'docs';
  }, [activeFolder, category]);

  const isClassTotal = useMemo(() => {
    return activeFolder?.rootType === 'EDUCATIONAL_CLASS_TOTAL_PHOTO' && activeFolder?.smartFolderApiType === 'Photo';
  }, [activeFolder]);

  const isClassStudent = useMemo(() => {
    return (
      activeFolder?.rootType === 'EDUCATIONAL_CLASS_STUDENT_PHOTO' &&
      !activeFolder.userEditable &&
      activeFolder?.depth > 2 &&
      activeFolder.name !== '기타'
    );
  }, [activeFolder]);

  const isFavoriteFolder = useMemo(() => {
    return activeFolder?.rootType === 'FAVORITE';
  }, [activeFolder]);
  // 검색 필터 조건
  const [targetFileType, setTargetFileType] = useState<string>('ALL'); // 반 선택

  const [targetDate, setTargetDate] = useState<string>(''); // 년월

  // 더미 사진 폴더 생성
  const handleCreatePhotoFolder = (sectionType: 'educational' | 'activity' | 'ai') => {
    if (makeFolderMode) return;

    setMakeFolderMode(true);

    const sectionRootType = {
      educational: 'EDUCATIONAL_CLASS_STUDENT_PHOTO',
      activity: 'ACTIVITY_PHOTO',
      ai: 'AI_IMAGE_TASK',
    };
    const dummyFolder: SmartFolderResult = {
      id: 0,
      name: '',
      smartFolderApiType: 'Photo',
      parentSmartFolderItemId:
        photoHomeList.find(
          (photoHomes) => photoHomes.rootType === (sectionRootType[sectionType] as SmartFolderResultRootType),
        )?.parentSmartFolderItemId ?? 0,
      depth: (activeFolder?.depth ?? 0) + 1,
      rootType: sectionRootType[sectionType] as SmartFolderResultRootType,
      userEditable: true,
      thumbUrl: '',
      driveItemKey: '',
      publicState: 'PRIVATE',
      isHidden: false,
      ownerAccountId: 0,
      ownerProfileId: 0,
      driveItemCreatedAt: dayjs().format(dateFormat.default),
    };

    setPhotoHomeListState((prev) => [dummyFolder, ...prev]);
    const photoHomeEditTable: SmartFolderItemResult = {
      ...dummyFolder,
      fileType: 'FOLDER',
      isMine: true,
      originalCreatorAccountId: userInfo?.accountId ?? 0,
      originalCreatorProfileId: userInfo?.id ?? 0,
      viewCount: 0,
      likeCount: 0,
      hasLiked: false,
      isFavorite: false,
      addedAt: '',
      taskItemId: 0,
      copyCount: 0,
      replyCount: 0,
      totalSize: null,
      memoCount: 0,
    };

    setNameEditable(photoHomeEditTable);
  };

  // 내 폴더, 스마트폴더(사진 제외) 및 조회
  const {
    data: itemList,
    fetchNextPage: itemListNextPage,
    hasNextPage: itemListsHasNext,
    isFetchingNextPage: itemListFetchingNextPage,
    isLoading: itemListLoading,
    refetch: itemListRefetch,
  } = useInfiniteQueryWithLimit({
    queryKey: ['itemLists', getApiTypeForSlug[category as keyof typeof getApiTypeForSlug], parentSmartFolderId],
    queryFn: (pageParam) =>
      getItemList({
        smartFolderApiType: getApiTypeForSlug[category as keyof typeof getApiTypeForSlug],
        parentSmartFolderId,
        offsetWithLimit: `${pageParam},${LIMIT}`,
        ...(targetDate !== '' && {
          startsAt: dayjs(targetDate).startOf('month').format(dateFormat.kekaba),
          endsAt: dayjs(targetDate).endOf('month').format(dateFormat.kekaba),
        }),
        ...(targetFileType !== 'ALL' && { targetFileType }), // ALL이면 키 제거
      }),
    limit: LIMIT,
    enabled: (category === 'folder' || category === 'docs' || category === 'photo') && !isPhotoHome,
  });

  // 휴지통
  const {
    data: trashes,
    fetchNextPage: trashesNextPage,
    hasNextPage: trashesHasNext,
    isFetchingNextPage: trashesFetchingNextPage,
    isLoading: trashesLoading,
    refetch: trashesRefetch,
  } = useInfiniteQueryWithLimit({
    queryKey: ['trashes'],
    queryFn: (pageParam) => findAllPagingReplies({ offsetWithLimit: `${pageParam},${LIMIT}` }), //
    limit: LIMIT,
    enabled: category === 'trash',
  });

  // 공개자료
  const {
    data: publics,
    fetchNextPage: publicsNextPage,
    hasNextPage: publicsHasNext,
    isFetchingNextPage: publicsFetchingNextPage,
    refetch: publicsRefetch,
  } = useInfiniteQueryWithLimit({
    queryKey: ['publics'],
    queryFn: (pageParam) => getPublicItemForMyList({ offsetWithLimit: `${pageParam},${LIMIT}` }),
    limit: LIMIT,
    enabled: category === 'public',
  });

  const studentInfo = useMemo(() => {
    if (!isClassStudent) {
      return null;
    }
    const findSelectClass: EducationalClassResult | undefined = classList.find(
      (studentClass) => studentClass.teacherProfileId === (userInfo?.id || 0),
    );
    const studentList = findSelectClass?.students || [];

    if (studentList.length <= 0) {
      return null;
    }

    return { classId: findSelectClass?.id, ...studentList.find((student) => student.name === activeFolder?.name) };
  }, [activeFolder, classList, isClassStudent, userInfo]);

  // 각 function refetch
  const refetch = {
    folder: itemListRefetch,
    photo: isPhotoHome ? photoHomeRefetch : itemListRefetch,
    docs: itemListRefetch,
    public: publicsRefetch,
    trash: trashesRefetch,
    search: () => {},
  }[category];

  useEffect(() => {
    refetch();
  }, [refetch, targetFileType, targetDate]);

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

  const goToSearchPage = (searchKeyword: string) => {
    router.push(`${prefix.materialBoard}/search?keyword=${searchKeyword}`);
  };

  const handleSelectOption = (searchKeyword: string) => {
    goToSearchPage(searchKeyword);
  };

  const handleSearch = (value: string) => {
    goToSearchPage(value);
  };

  /** 폴더 생성 및 이름 변경 */
  const [localFolders, setLocalFolders] = useState<SmartFolderItemResult[]>([]);

  // 드래그 ref
  const selectoRef = useRef<Selecto>(null);

  // 파일 리스트
  const fileList = useMemo(() => {
    const categoryDataMap: Record<string, typeof itemList | typeof trashes | typeof publics> = {
      folder: itemList,
      docs: itemList,
      photo: itemList,
      trash: trashes,
      public: publics,
    };
    const flattened = getFlattenedData(categoryDataMap[category]?.pages ?? undefined);
    // TODO: 기획이 일치하지 않아 (스마트 폴더는 시스템 폴더가 뒤로, 내 폴더는 앞으로 우선 임시로 프론트에서 처리)
    const combined = [...localFolders, ...flattened];

    // if (category === 'folder') {
    //   return combined.slice().sort((a, b) => {
    //     if (a.userEditable === b.userEditable) return 0;
    //     return a.userEditable ? 1 : -1; // false가 앞으로
    //   });
    // }

    return combined;
  }, [category, itemList, trashes, publics, localFolders]);

  // fileList가 DOM 업데이트 이후 실행
  useEffect(() => {
    const timeout = setTimeout(() => {
      selectoRef.current?.findSelectableTargets();
    }, 0);

    return () => clearTimeout(timeout);
  }, [fileList]);

  const handleCreateDummyFolder = () => {
    if (makeFolderMode) return;
    setMakeFolderMode(true);
    const dummyFolder: SmartFolderItemResult = {
      id: 0,
      name: '',
      fileType: 'FOLDER',
      smartFolderApiType: getApiTypeForSlug[category as keyof typeof getApiTypeForSlug],
      driveItemKey: '',
      depth: (activeFolder?.depth ?? 0) + 1,
      parentSmartFolderItemId: activeFolder?.id ?? 0,
      userEditable: true,
      rootType: 'NONE',
      isMine: false,
      publicState: 'PRIVATE',
      isHidden: false,
      ownerAccountId: 0,
      ownerProfileId: 0,
      originalCreatorAccountId: 0,
      originalCreatorProfileId: 0,
      driveItemCreatedAt: dayjs().format(dateFormat.default),
      addedAt: '',
      taskItemId: 0,
      memoCount: 0,
      copyCount: 0,
      viewCount: 0,
      likeCount: 0,
      hasLiked: false,
      isFavorite: false,
      replyCount: 0,
      totalSize: null,
    };
    setLocalFolders((prev) => [dummyFolder, ...prev]);
    setNameEditable(dummyFolder);
  };

  const changeFolderFinally = async (mode: 'make' | 'rename' | 'cancel') => {
    setNameEditable(null);
    setMakeFolderMode(false);
    if (mode !== 'rename') {
      setLocalFolders((prev) => prev.slice(1)); // 더미 제거
      setPhotoHomeListState((prev) => prev.slice(1)); // 더미 제거
    }
    if (mode !== 'cancel') {
      await refetch();
      await queryClient.refetchQueries({ queryKey: ['/file/v1/my-folder/folder-tree'], type: 'active' });
      await queryClient.refetchQueries({ queryKey: ['/file/v1/smart-folder/folder-tree'], type: 'active' });
    }
  };

  const makeRenameFile = async ({
    name,
    type,
    id,
  }: {
    name: string;
    type: 'make' | 'rename' | 'cancel';
    id?: number;
  }) => {
    if (type === 'make') {
      await addFolder({
        data: {
          name,
          public: false,
          parentSmartFolderId: id ?? activeFolder?.id ?? 0,
          parentSmartFolderApiType: getApiTypeForSlug[category as keyof typeof getApiTypeForSlug],
        },
      });
    }
    if (type === 'rename') {
      await renameItem({
        data: {
          itemOwnerProfileId: userInfo?.id || 0,
          nameToChange: name,
          targetItemId: id ?? nameEditable?.id ?? 0,
          targetSmartFolderApiType: getApiTypeForSlug[category as keyof typeof getApiTypeForSlug],
        },
      });
    }

    changeFolderFinally(type);
  };

  const hasFile = useMemo(() => {
    if (isPhotoHome) {
      return (photoHomeList && photoHomeList.length > 0) ?? false;
    }
    return (fileList && fileList?.length >= 1) ?? false;
  }, [fileList, isPhotoHome, photoHomeList]);

  /** 체크박스 버튼 컨트롤 */
  const [selectedIds, setSelectedIds] = useState<Record<number, boolean>>({});

  // 기존 체크박스 선택 아이템 저장용
  const [prevSelectedIds, setPrevSelectedIds] = useState<Record<number, boolean>>({});

  const [openDropDown, setOpenDropDown] = useState<Record<number, boolean>>({});

  // 체크 박스 핸들링
  const [isAllSelected, setIsAllSelected] = useState(false);

  // 뷰 모드 상태 관리
  const [currentViewMode, setCurrentViewMode] = useState<'grid' | 'list'>('grid');

  /** 무한 스크롤 */
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef<() => void>(() => {}); // 데이터의 최신 상태 유지하기 위해 ref 생성
  useEffect(() => {
    callbackRef.current = () => {
      if (publicsHasNext && !publicsFetchingNextPage) {
        // console.log('public', publicsHasNext, publicsFetchingNextPage);
        publicsNextPage();
      }
      if (trashesHasNext && !trashesFetchingNextPage && !trashesLoading) {
        // console.log('trash', trashesHasNext, trashesFetchingNextPage);
        trashesNextPage();
      }
      if (itemListsHasNext && !itemListFetchingNextPage && !itemListLoading) {
        // console.log('item', category, itemListsHasNext, itemListFetchingNextPage);
        itemListNextPage();
      }
    };
  }, [
    publicsHasNext,
    publicsFetchingNextPage,
    trashesHasNext,
    trashesFetchingNextPage,
    trashesLoading,
    itemListsHasNext,
    itemListFetchingNextPage,
    itemListLoading,
    category,
    publicsNextPage,
    trashesNextPage,
    itemListNextPage,
  ]);

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

  // 특정 파일의 edit 상태를 토글
  const handleEditToggle = (id: number) => {
    setSelectedIds((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      setPrevSelectedIds(updated);
      return updated;
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
    if (id === 0) {
      return;
    }
    if (fileType === 'FOLDER') {
      router.push(`${prefix.materialBoard}/${getSmartFolderPath[apiType as keyof typeof getSmartFolderPath]}/${id}`);
      return;
    }
    router.push(`${prefix.preview}?smartFolderItemId=${id}&smartFolderApiType=${apiType}`);
  };

  // 전체 선택 체크박스 핸들링
  const handleAllSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.target;
    setIsAllSelected(checked);
    setSelectedIds((prev) => {
      const updatedSelection = { ...prev };

      fileList?.forEach((item: SmartFolderItemResult) => {
        if (item.fileType !== 'FOLDER' || category === 'trash') {
          updatedSelection[item.id] = checked;
        }
      });

      return updatedSelection;
    });
  };

  /** 사진 홈 */
  const onDropDown = (event: React.MouseEvent<HTMLButtonElement>, key: number) => {
    event.preventDefault();
    setOpenDropDown((prev) => ({
      ...prev,
      [key]: !prev[key], // 해당 파일의 상태만 변경
    }));
  };

  const handleSelectChange = (value: number) => {
    setSelectClass(value);
  };

  const classOptions = () => {
    return [
      ...classList.map((classItem) => ({
        text: classItem.name,
        value: classItem.id,
      })),
    ];
  };
  const { mutateAsync: moveItemToTrash } = useMoveItemToTrash1();
  const { handleSave, handleCopy, handleMove } = useHandleFile();
  /** 디운로드 모달 */
  const [itemData, setItemData] = useState<SmartFolderItemResult[]>([]);

  // 파일 저장 (다운로드 모달)
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  /* 선택한 폴더에 저장 & 이동 & 복사 */
  const [currentAction, setCurrentAction] = useState<'COPY' | 'MOVE' | 'SAVE' | 'RENAME' | null>(null);
  const [currentActionItem, setCurrentActionItem] = useState<SmartFolderItemResult | null>(null);

  // 초기화 및 진입 시 실행
  const initCurrentAction = useCallback(
    (isActions: boolean = true) => {
      setCurrentAction(null);
      setCurrentActionItem(null);
      setItemData([]);
      if (isActions) {
        setSelectedIds({});
        setIsAllSelected(false);
        refetch();
      }
    },
    [refetch],
  );

  /*
   * 다운로드 모달 열기
   */
  const handleOpenDownloadModal = () => {
    setIsDownloadModalOpen(true);
  };

  /*
   * 다운로드 모달 닫기
   */
  const handleCloseDownloadModal = () => {
    setIsDownloadModalOpen(false);
    initCurrentAction(false);
  };

  const handleFileData = useCallback(
    async (selectFolder: SmartFolderItemResult | null, path?: string) => {
      if (!selectFolder) return;
      const selectIdsNumber = Object.entries(selectedIds)
        .filter(([_, value]) => value)
        .map(([key]) => Number(key));

      if (currentAction === 'SAVE') {
        let driveItemKey: string[] = [];

        if (currentActionItem) {
          driveItemKey = [currentActionItem.driveItemKey];
          if (currentActionItem.fileType === 'FOLDER') {
            // 폴더는 무조건 1개임
            const keyList = await getItemKeyList({
              parentSmartFolderId: currentActionItem.id.toString(),
              smartFolderApiType: currentActionItem.smartFolderApiType,
            });
            if (keyList.result) {
              driveItemKey = keyList.result;
            }
            if (driveItemKey.length <= 0) {
              showAlert({ message: '폴더 내 파일이 없습니다.' });
              return;
            }
          }
        } else {
          driveItemKey = itemData.map((item) => item.driveItemKey);
        }

        handleSave(selectFolder, driveItemKey, path).then(() => {
          initCurrentAction();
        });
        return;
      }

      if (currentAction === 'MOVE') {
        handleMove(
          selectFolder,
          currentActionItem ? currentActionItem.id : selectIdsNumber,
          activeFolder?.smartFolderApiType,
          path,
        ).then(() => {
          initCurrentAction();
        });
        return;
      }

      if (currentAction === 'COPY') {
        handleCopy(
          selectFolder,
          currentActionItem ? currentActionItem.id : selectIdsNumber,
          activeFolder?.smartFolderApiType,
          path,
        ).then(() => {
          initCurrentAction();
        });
      }
    },
    [
      currentAction,
      currentActionItem,
      handleCopy,
      handleMove,
      handleSave,
      initCurrentAction,
      itemData,
      selectedIds,
      activeFolder,
      showAlert,
    ],
  );

  /*
   * 다운로드 저장 버튼 클릭시
   */
  const handleConfirmDownloadModal = (selectFolder?: SmartFolderItemResult | null, path?: string) => {
    if (selectFolder) {
      handleFileData(selectFolder, path);
    }
    handleCloseDownloadModal();
  };

  const hanldeDeleteButtons = (item?: SmartFolderItemResult) => {
    const deleteItems: SmartFolderItemResult[] = item ? [item] : fileList.filter((file) => selectedIds[file.id]);

    const findItems = deleteItems.find((findUserEditable) => !findUserEditable.userEditable);
    const findFolderItem = deleteItems.find((folderItem) => folderItem.fileType === 'FOLDER');

    if (!isEmpty(findItems) && !findItems?.userEditable) {
      addToast({
        message: '해당 파일은 삭제가 불가능 합니다.',
      });
      return;
    }

    moveItemToTrash({
      data: {
        itemList: deleteItems.map((deleteItem) => ({
          smartFolderApiType: deleteItem.smartFolderApiType,
          itemId: deleteItem.id,
        })),
      },
    })
      .then(async (result) => {
        if (result.status === 200) {
          addToast({
            message: '삭제되었습니다',
          });
          if (findFolderItem) {
            // 폴더가 있을 시 트리구조 업데이트
            const folderListKey = getScanMyFoldersQueryKey();
            const smartfolderListKey = getGetFolderTreeFromRootQueryKey();
            await queryClient.refetchQueries({
              queryKey: findFolderItem.smartFolderApiType === 'UserFolder' ? folderListKey : smartfolderListKey,
              type: 'active',
            });
          }
          return;
        }
        addToast({ message: '삭제에 실패하였습니다.' });
      })
      .catch(() => addToast({ message: '삭제에 실패하였습니다.' }))
      .finally(() => initCurrentAction());
  };

  // 복원 및 삭제
  const { mutateAsync: restoreItems } = useRestoreItems();
  const { mutateAsync: removeFromService } = useRemoveFromService();
  const { mutateAsync: hideItems } = useHideItems();

  const handleTrashButtons = async (
    action: 'restore' | 'remove' | 'removeFromService',
    items?: SmartFolderItemResult,
  ) => {
    const selectedFiles = fileList.filter((file) => selectedIds[file.id]);
    const postFiles = items
      ? [
          {
            smartFolderApiType: items.smartFolderApiType,
            itemId: items.id,
          },
        ]
      : selectedFiles.map((restoreItem) => ({
          smartFolderApiType: restoreItem.smartFolderApiType,
          itemId: restoreItem.id,
        }));

    if (action === 'restore') {
      await restoreItems({
        data: {
          itemList: postFiles,
        },
      }).then((res) => {
        if (res.status === 200) {
          addToast({ message: '복원되었습니다.' });
          return;
        }
        addToast({ message: '복원에 실패했습니다.' });
      });
    }
    if (action === 'remove') {
      await hideItems({
        data: {
          itemOwnerProfileId: userInfo?.id ?? 0,
          targetSmartFolderApiType: 'Trashcan',
          targetItemIds: selectedFiles.map((hideItem) => hideItem.id),
        },
      });
    }
    if (action === 'removeFromService') {
      showAlert({
        message: '정말 영구 삭제 하시겠습니까?',
        onCancel: () => {},
        onConfirm: async () => {
          await removeFromService({
            data: {
              itemList: postFiles,
            },
          });
          setSelectedIds({});
          await refetch();
        },
      });
    }

    if (action !== 'removeFromService') {
      setSelectedIds({});
      await refetch();
    }
  };
  // 태그 모달 설정
  const [isTagModal, setTagModal] = useState<boolean>(false);
  const [tagDriveItemKey, setTagDriveItemKey] = useState<string>('');

  const handleActionItems = (
    action: 'COPY' | 'MOVE' | 'SAVE' | 'DELETE' | 'RENAME' | 'TAG',
    item?: SmartFolderItemResult,
  ) => {
    if (action === 'RENAME') {
      if (!item?.userEditable) {
        showAlert({
          message: '이름을 변경할 수 없는 폴더 입니다.',
        });
        return;
      }
      setMakeFolderMode(true);
      setNameEditable(item);
      return;
    }
    if (action === 'DELETE') {
      hanldeDeleteButtons?.(item);
      return;
    }
    if (action === 'TAG') {
      if (item) {
        setTagDriveItemKey(item?.driveItemKey);
        setTagModal(true);
      }
      return;
    }
    if (!item) {
      const selectedFiles = fileList.filter((file) => selectedIds[file.id]);
      setItemData(selectedFiles);
    }
    handleOpenDownloadModal();
    setCurrentAction(action);
    if (item) setCurrentActionItem(item);
  };

  const { mutateAsync: starred } = useStarred();
  // 좋아요 버튼 처리
  const handleFavorite = async (item: SmartFolderItemResult) => {
    starred({
      data: {
        driveItemKey: item.driveItemKey,
      },
    }).finally(() => refetch());
  };

  // 우리반 관리 종료 시 콜백
  const classModalCallback = () => {
    refetch();
    classesRefetch();
  };

  const baseActionButtonList: IActionButton[] = [
    { key: 'copy', label: '복사', action: () => handleActionItems('COPY'), icon: 'copy-14-b' },
    { key: 'move', label: '이동', action: () => handleActionItems('MOVE'), icon: 'move-14' },
    { key: 'delete', label: '삭제', action: () => handleActionItems('DELETE'), icon: 'delete-14' },
    { key: 'save', label: '저장', action: () => handleActionItems('SAVE'), icon: 'save-14' },
  ];

  let actionButtonList: IActionButton[] = [...baseActionButtonList];

  if (hasFile) {
    actionButtonList = isMine
      ? [...baseActionButtonList] // 내 파일이면 기본 버튼 리스트 유지
      : [{ key: 'save', label: '저장', action: () => handleActionItems('SAVE') }]; // 내 파일이 아니면 `save` 버튼만 표시
  }

  if (category === 'trash') {
    actionButtonList = [
      { key: 'restore', label: '복원', action: () => handleTrashButtons('restore'), icon: 'rotate-14' },
      {
        key: 'removeFromService',
        label: '영구삭제',
        action: () => handleTrashButtons('removeFromService'),
        icon: 'delete-14',
      },
    ];
  }

  if (category === 'public') {
    actionButtonList = baseActionButtonList.filter((baseMenu) => ['copy', 'save'].includes(baseMenu.key));
  }

  // 모든 아이템 선택 시 group-top 전체 선택 버튼 활성화
  useEffect(() => {
    if (!fileList || fileList.length <= 0) {
      setIsAllSelected(false);
      return;
    }

    const selectableFiles = fileList.filter((item) => item.fileType !== 'FOLDER' || category === 'trash');
    if (selectableFiles.length <= 0) {
      setIsAllSelected(false);
      return;
    }

    const allSelected = selectableFiles.every((file) => selectedIds[file.id]);
    setIsAllSelected(allSelected);
  }, [fileList, selectedIds, category]);

  const [isSelectoReady, setSelectoReady] = useState(false);

  useEffect(() => {
    const target = document.querySelector('.main-content');
    if (target) {
      setSelectoReady(true);
    }
  }, []);

  const renderContent = () => {
    if (category === 'photo') {
      if (isPhotoHome) {
        return (
          <PhotoHomeList
            category={category}
            fileList={photoHomeListState}
            dropDown={(id) => openDropDown[id]}
            selectClass={resolvedClassId}
            onChange={handleSelectChange}
            onDropDown={onDropDown}
            onClick={({ id, fileType, apiType }) => {
              handleThumbnail({
                id,
                fileType,
                apiType,
              });
            }}
            classOptions={classOptions()}
            dropDownActions={handleActionItems}
            nameEditableInfo={nameEditable}
            makeRenameFile={makeRenameFile}
            setNameEditableInfo={setNameEditable}
            handleCreatePhotoFolder={handleCreatePhotoFolder}
            photoHomeLoading={photoHomeLoading}
            classModalCallback={classModalCallback}
          />
        );
      }

      return (
        <PhotoDateList
          category={category}
          fileList={fileList}
          currentViewMode={currentViewMode}
          onEditToggle={(id) => handleEditToggle(id)} // 개별 상태 토글 함수 전달
          dropDown={(id) => openDropDown[id]}
          onDropDown={onDropDown}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          onClickShareLinkButton={handleClickShareLinkButton}
          onClick={({ id, fileType, apiType }) => {
            handleThumbnail({
              id,
              fileType,
              apiType,
            });
          }}
          dropDownActions={handleActionItems}
          handleFavorite={handleFavorite}
          nameEditableInfo={nameEditable}
          makeRenameFile={makeRenameFile}
          setNameEditableInfo={setNameEditable}
        />
      );
    }

    return (
      <MaterialBoardList
        hasFile={hasFile}
        category={category}
        fileList={fileList}
        currentViewMode={currentViewMode}
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
        dropDownActions={handleActionItems}
        handleFavorite={handleFavorite}
        nameEditableInfo={nameEditable}
        makeRenameFile={makeRenameFile}
        setNameEditableInfo={setNameEditable}
        deleteActions={handleTrashButtons}
        isFavoriteFolder={isFavoriteFolder}
      />
    );
  };

  const title = {
    folder: activeFolder?.name,
    photo: activeFolder?.name,
    docs: activeFolder?.name,
    public: '내 공개자료',
    trash: '휴지통',
    search: undefined,
  };
  const folderTree = {
    folder: folderList.myFolders,
    photo: folderList.smartFolders,
    docs: folderList.smartFolders,
    public: [],
    trash: [],
    search: [],
  };

  const makeBreadcrumbs = (
    data: SmartFolderTreeResult[],
    targetFolder: SmartFolderTreeResult | null,
    path: IBreadcrumbProps['items'] = [],
  ): IBreadcrumbProps['items'] | null => {
    if (category === 'public' || category === 'trash') {
      return [
        {
          label: '자료보드',
          href: `${prefix.materialBoard}`,
        },
        {
          label: category === 'public' ? '내 공개자료' : '휴지통',
          href: `${prefix.materialBoard}/${category}`,
        },
      ];
    }
    // 우리반 전체 사진을 위한 분기처리
    if (category === 'photo' && targetFolder?.rootType === 'EDUCATIONAL_CLASS_TOTAL_PHOTO') {
      const photoRoot = data[0]?.subFolders?.find(
        (photoFolder) => photoFolder?.rootType === 'NONE' && photoFolder.smartFolderApiType === 'Photo',
      );

      return [
        {
          label: '스마트폴더',
          href: `${prefix.materialBoard}/`,
        },
        {
          label: photoRoot?.name || '',
          href: `${prefix.materialBoard}/${category}/${photoRoot?.id}`,
        },
        {
          label: targetFolder?.name as string,
          href: `${prefix.materialBoard}/${category}/${targetFolder?.id}`,
        },
      ];
    }
    const breadcrumbs =
      data
        .map((folder) => {
          if (folder?.id === targetFolder?.id) {
            return [...path, { label: folder?.name || '', href: `${prefix.materialBoard}/${category}/${folder?.id}` }]; // 해당하는 뎁스에 있을 경우 추가
          }
          if (folder?.subFolders && folder.subFolders.length > 0) {
            const subPath = makeBreadcrumbs(folder.subFolders, targetFolder, [
              ...path,
              { label: folder?.name || '', href: `${prefix.materialBoard}/${category}/${folder?.id}` },
            ]);
            return subPath;
          }
          return null;
        })
        .find((result) => result !== null) || null;
    return breadcrumbs;
  };

  const breadcrumbItem = makeBreadcrumbs(folderTree[category], activeFolder) || [];

  const makeDateFilter = () => {
    const startDate = dayjs(userInfo?.createdAt || '2025-04-01');
    const endDate = dayjs();
    const dateResult: { text: string; value: string }[] = [{ text: '전체보기', value: '' }];

    let current = startDate;

    while (current.isBefore(endDate) || current.isSame(endDate, 'month')) {
      const formatted = current.format('YYYY-MM');
      dateResult.push({ text: formatted, value: formatted });

      current = current.add(1, 'month');
    }

    return [
      { text: '전체보기', value: '' },
      ...dateResult.slice(1).reverse(), // 최신 순
    ];
  };

  // https://docs.google.com/spreadsheets/d/13oMQfsBfNQbvX2z61XHznhuDIemwfEGA9tjSU4yVVqM/edit?gid=1056452965#gid=1056452965 정책서 기반 폴더 생성 가능 여부 설정
  const renderMakeFolderButton = () => {
    if (!activeFolder) return false;

    // 공통 불가 조건
    if (
      category === 'trash' ||
      category === 'public' ||
      category === 'docs' ||
      activeFolder.rootType === 'EDUCATIONAL_CLASS_TOTAL_PHOTO'
    ) {
      return false;
    }
    // 폴더
    if (category === 'folder') {
      const { rootType, depth } = activeFolder;

      const isSystemFolder = rootType === 'FAVORITE' || rootType === 'MOBILE_UPLOAD';

      if ((isSystemFolder && depth > 1) || (!isSystemFolder && depth > 0)) {
        return false;
      }
    }

    // 사진
    if (category === 'photo') {
      const { rootType, depth, userEditable } = activeFolder;

      if (rootType.startsWith('ACTIVITY_PHOTO')) {
        return depth <= 2;
      }

      if (rootType === 'EDUCATIONAL_CLASS_STUDENT_PHOTO') {
        if (userEditable) return depth <= 2;
        return depth <= 3;
      }

      if (rootType === 'AI_IMAGE_TASK') {
        return depth <= 2;
      }

      return false;
    }

    return true;
  };

  const renderFilter = () => {
    if (activeFolder?.rootType === 'EDUCATIONAL_CLASS_TOTAL_PHOTO') {
      return (
        <Select
          className="w-160"
          size="small"
          value={targetDate}
          onChange={(value) => setTargetDate(value as string)}
          options={makeDateFilter()}
        />
      );
    }
    if (!isDocsHome && category === 'docs') {
      return (
        <>
          <Select
            className="w-160"
            size="small"
            value={targetDate}
            onChange={(value) => setTargetDate(value as string)}
            options={makeDateFilter()}
          />
          <Select
            className="w-120"
            size="small"
            value={targetFileType}
            onChange={(value) => setTargetFileType(value as string)}
            options={DRIVE_ITEM_OPTIONS}
          />
        </>
      );
    }
    if (category !== 'trash' && !isDocsHome && category !== 'public') {
      return (
        <Select
          className="w-120"
          size="small"
          value={targetFileType}
          onChange={(value) => setTargetFileType(value as string)}
          options={DRIVE_ITEM_OPTIONS}
        />
      );
    }
    if (category === 'photo' && !isPhotoHome) {
      return (
        <Select
          className="w-160"
          size="small"
          value={targetDate}
          onChange={(value) => setTargetDate(value as string)}
          options={makeDateFilter()}
        />
      );
    }
    return null;
  };

  const handleSelect = (e: OnSelect) => {
    const dragSelected = e.selected
      .map((el) => {
        const { id } = (el as HTMLElement).dataset;
        return fileList.find((item) => item.id.toString() === id);
      })
      .filter((item): item is SmartFolderItemResult => !!item)
      .filter((item) => category === 'trash' || item.fileType !== 'FOLDER');

    if (dragSelected.length === 0) {
      setSelectedIds(prevSelectedIds); // 이전 상태 복원
      return;
    }

    const dragSelectedIds = new Set(dragSelected.map((item) => item.id));

    const next: Record<number, boolean> = {};

    fileList.forEach((item) => {
      const isSelectable = category === 'trash' || item.fileType !== 'FOLDER';
      if (!isSelectable) return;

      const wasPreviouslySelected = prevSelectedIds[item.id];
      const isNowSelected = dragSelectedIds.has(item.id);

      next[item.id] = !!(wasPreviouslySelected || isNowSelected);
    });

    setSelectedIds(next);
  };

  const handleSelectEnd = (e: OnSelectEnd) => {
    const dragSelected = e.selected
      .map((el) => {
        const { id } = (el as HTMLElement).dataset;
        return fileList.find((item) => item.id.toString() === id);
      })
      .filter((item): item is SmartFolderItemResult => !!item)
      .filter((item) => category === 'trash' || item.fileType !== 'FOLDER');

    const dragSelectedIds = new Set(dragSelected.map((item) => item.id));

    const next: Record<number, boolean> = {};

    fileList.forEach((item) => {
      const isSelectable = category === 'trash' || item.fileType !== 'FOLDER';
      if (!isSelectable) return;

      // 기존 + 드래그된 항목만 유지
      if (selectedIds[item.id] || dragSelectedIds.has(item.id)) {
        next[item.id] = true;
      }
    });

    setSelectedIds(next);
    setPrevSelectedIds(next); // 동기화 작용
  };

  /** 기존 로직 드래그할때마다 새로 선택됨 + 쉬프트로 아이템 추가  */
  const handleSelectEvent = (e: OnSelect | OnSelectEnd) => {
    const next: Record<number, boolean> = {};

    e.selected.forEach((el) => {
      const idAttr = el.getAttribute('data-id');
      const fileTypeAttr = el.getAttribute('data-file-type') as SmartFolderItemResultFileType;
      if (!idAttr) return;
      if (fileTypeAttr === 'FOLDER' && category !== 'trash') return;

      const id = Number(idAttr);
      if (id) {
        next[id] = true;
      }
    });

    if (e.inputEvent?.shiftKey) {
      setSelectedIds((prev) => ({
        ...prev,
        ...next,
      }));
    } else {
      setSelectedIds(next);
    }
  };

  return (
    <>
      <div className="group-top">
        <BreadCrumb
          items={breadcrumbItem}
          onNavigate={(item) => {
            if (item.label !== '스마트 폴더') {
              router.push(item.href || '');
            }
          }}
        />
        <SearchBar
          title="자료보드 검색"
          searchValue=""
          handleSearch={handleSearch}
          handleSelectOption={handleSelectOption}
        />
      </div>
      {isClassStudent && (
        <div className="group-profile">
          <div className="thumb-profile">
            {studentInfo?.thumbUrl ? (
              <Image
                width={32}
                height={32}
                alt="반 아이 프로필"
                className="img-profile"
                src={studentInfo.thumbUrl}
                style={{
                  borderRadius: '50%',
                }}
                priority
              />
            ) : (
              <span className="ico-comm ico-user-16-w" />
            )}
          </div>
          <div className="info-profile">
            <strong className="txt-profile">{title[category]}</strong>
          </div>
          {studentInfo && (
            <Button
              type="button"
              size="small"
              color="black"
              className="btn-record"
              onClick={() => router.push(`/work-board/student-record/${studentInfo.classId}/${studentInfo.id}`)}
            >
              아이 관찰 기록
            </Button>
          )}
        </div>
      )}
      <div
        className={cx('group-content', hasFile && 'group-empty')}
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        <div
          className={cx('head-content', {
            type3: category === 'photo' && isPhotoHome,
            type4: (category === 'photo' && !isPhotoHome) || (category === 'docs' && !isDocsHome),
          })}
        >
          {!isClassStudent && (
            <h4 className="title-type3">
              {category === 'trash' || category === 'public' ? title[category] : activeFolder?.name}
            </h4>
          )}

          <div className="util-head type-tab">
            {category === 'photo' && (isPhotoHome || isClassTotal) && (
              <>
                <Button
                  type="button"
                  size="small"
                  color="line"
                  className={cx('btn-manage', activeFolder?.rootType === 'NONE' && 'selected')}
                  disabled={activeFolder?.rootType === 'NONE'}
                  onClick={() => {
                    const photoHomeFolder = folderList?.smartFolders[0]?.subFolders?.find(
                      (classStudent) =>
                        classStudent?.smartFolderApiType === 'Photo' && classStudent?.rootType === 'NONE',
                    );

                    router.push(`${prefix.materialBoard}/photo/${photoHomeFolder?.id}`);
                  }}
                >
                  그룹별 보기
                </Button>
                <Button
                  type="button"
                  size="small"
                  color="line"
                  className={cx('btn-manage', activeFolder?.rootType === 'EDUCATIONAL_CLASS_TOTAL_PHOTO' && 'selected')}
                  disabled={activeFolder?.rootType === 'EDUCATIONAL_CLASS_TOTAL_PHOTO'}
                  onClick={() => {
                    const classTotal = photoHomeList.find(
                      (classTotalPhoto) =>
                        classTotalPhoto.smartFolderApiType === 'Photo' &&
                        classTotalPhoto.rootType === 'EDUCATIONAL_CLASS_TOTAL_PHOTO',
                    );

                    router.push(`${prefix.materialBoard}/photo/${classTotal?.id}`);
                  }}
                >
                  전체보기
                </Button>
              </>
            )}
          </div>
        </div>
        {!isPhotoHome && !isDocsHome && (
          <FloatingMenu
            isChecked={hasFile}
            isAllSelected={isAllSelected}
            setIsAllSelected={setIsAllSelected}
            handleAllSelected={handleAllSelected}
            floatingActionButton={Object.entries(selectedIds).find((state) => state[1]) !== undefined}
            actionButton={actionButtonList}
            buttonLabel="폴더 생성"
            renderButton={renderMakeFolderButton()}
            currentViewMode={currentViewMode}
            setCurrentViewMode={setCurrentViewMode}
            handleButton={handleCreateDummyFolder}
            filter={renderFilter()}
          />
        )}
        {renderContent()}
        {/* 무한 스크롤 감지 div */}
        {!isPhotoHome && <div ref={loadMoreRef} style={{ height: '10px', background: 'transparent' }} />}
      </div>
      {isSelectoReady && (
        <Selecto
          ref={selectoRef}
          dragContainer={document.querySelector('.main-content') as HTMLDivElement}
          container={document.querySelector('.main-content') as HTMLDivElement}
          selectableTargets={['#fileItem', '#fileTableItem']}
          selectByClick={false}
          clickBySelectEnd={false}
          continueSelect={false}
          selectFromInside
          preventClickEventOnDrag
          hitRate={0}
          dragCondition={(e) => {
            const blockedSelectors = [
              '.btn-download', // 다운로드
              '.badge-util', // 대표 뱃지
              '.btn-menu', // 드롭다운 메뉴
              '.btn-favorite', // 즐겨찾기 버튼
              '.btn-delete', // 닫기 버튼
              '.btn-memo', // 수정 버튼
              '#fileName', // 이름 수정
              '.thumb-profile', // 썸네일 이미지
              '.modal-layer', // 모달 레이어
              '.item-choice', // 썸네일 체크박스
            ];
            const target = e.inputEvent?.target as HTMLElement;
            if (blockedSelectors.some((selector) => target.closest(selector))) return false;

            const clientX = e.inputEvent?.clientX;
            const clientY = e.inputEvent?.clientY;

            const mainContent = document.querySelector('.main-content') as HTMLElement;
            const bodyContent = document.querySelector('.body-content') as HTMLElement;

            const rectX = mainContent?.getBoundingClientRect();
            const rectY = bodyContent?.getBoundingClientRect();

            // 가로: main-content, 세로: body-content 범위 안에서만 드래그 시작 허용
            const withinX = rectX && clientX >= rectX.left && clientX <= rectX.right;
            const withinY = rectY && clientY >= rectY.top && clientY <= rectY.bottom;

            return withinX && withinY;
          }}
          scrollOptions={{
            container: document.documentElement,
            threshold: 10,
            throttleTime: 10,
            useScroll: false,
            requestScroll: ({ container, direction }: { container: HTMLElement; direction: number[] }) => {
              // eslint-disable-next-line no-param-reassign
              container.scrollTop += direction[1] * 10;
            },
            checkScrollEvent: true,
          }}
          toggleContinueSelect={['shift']}
          // onSelect={handleSelect}
          // onSelectEnd={handleSelectEvent}
          onDragStart={() => {
            setPrevSelectedIds({ ...selectedIds });
          }}
          onSelect={handleSelect}
          onSelectEnd={handleSelectEnd}
        />
      )}

      {isShareLinkModalOpen && (
        <ShareLinkModal item={shareLinkModalItem} onCloseRefetch={refetch} onCancel={handleCloseShareLinkModal} />
      )}
      {isDownloadModalOpen && (
        <DownloadModal
          isOpen={isDownloadModalOpen}
          itemData={currentActionItem ? [currentActionItem] : itemData}
          onCancel={handleCloseDownloadModal}
          onConfirm={handleConfirmDownloadModal}
          action={currentAction}
        />
      )}
      {isTagModal && (
        <TagModal
          isOpen={isTagModal}
          driveItemKey={tagDriveItemKey}
          onSave={async () => {
            setTagDriveItemKey('');
            setTagModal(false);
          }}
          onCancel={() => setTagModal(false)}
        />
      )}
    </>
  );
};

export default SlugClient;
