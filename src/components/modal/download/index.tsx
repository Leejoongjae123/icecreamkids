import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BreadCrumb, Button, Loader, ModalBase, Thumbnail } from '@/components/common';
import { Tab } from '@/components/common/Tab';
import { DOWNLOAD_MODAL_TAB_LIST } from '@/const/tab';
import type { IDownloadModal } from '@/components/modal/download/types';
import cx from 'clsx';
import {
  DUMMY_FOLDER,
  fileTypeMap,
  FLOATING_BUTTON_TYPE,
  MATERIAL_BREADCRUMB,
  PUBLIC_BREADCRUMB,
  PUBLIC_FOLDER,
  type SaveToImageFileType,
  SPECIAL_FILE_TYPE,
} from '@/const';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import type {
  LecturePlanResult,
  LectureReportCardResult,
  SmartFolderItemResult,
  SmartFolderItemResultFileType,
  SmartFolderItemResultSmartFolderApiType,
  SmartFolderTreeResult,
  StoryBoardAddRequest,
  StudentRecordResult,
} from '@/service/file/schemas';
import {
  getGetItemListQueryKey,
  getGetPublicItemForMyListQueryKey,
  getItemList,
  getPublicItemForMyList,
  useAddFolder1,
  useGetDomains,
  useGetItemFlatPathTree,
  useGetItemList,
  useGetLectureReport,
  useGetStoryBoard,
  useGetStudentRecord,
  useScanMyFolders,
  useGetLecturePlan,
} from '@/service/file/fileStore';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import type { IBreadcrumbItem } from '@/components/common/Breadcrumb';
import { getFlattenedData, removeFileExtension } from '@/utils';
import { useInfiniteQueryWithLimit } from '@/utils/react-query';
import { createPortal } from 'react-dom';
import { useMakeBreadcrumbs } from '@/hooks/useMakeBreadcrumbs';
import type { ITabItem } from '@/components/common/Tab/types';
import { useGetCdnFile } from '@/hooks/useGetCdnFile';
import JSZip from 'jszip';
import { useForm } from 'react-hook-form';
import type { IBlockData } from '@/app/(auth)/my-board/[tab]/(story-board)/_components/StoryBoardForm/types';
import { getStoryBoardInitBlocks } from '@/app/(auth)/my-board/utils';
import useCaptureImage from '@/hooks/useCaptureImage';
import StoryBoardForm from '@/app/(auth)/my-board/[tab]/(story-board)/_components/StoryBoardForm';
import PreviewReportClient from '@/app/work-board/(protected)/playing-report/_components/PreviewReport';
import StudentRecordPreview from '@/app/work-board/(protected)/student-record/_component/StudentRecordPreview';
import type { EducationalClassResultCourse } from '@/service/member/schemas';
import { useReportStore } from '@/hooks/store/useReportStore';
import { useToast } from '@/hooks/store/useToastStore';
import { useLoadingState } from '@/hooks/useLoadingState';
import ActivityCardDetailBody from '@/app/work-board/(protected)/playing-plan/_components/ActivityCardDetailBody';

export const DownloadModal = ({
  isOpen,
  onCancel,
  onConfirm,
  itemData = [],
  onSaveToImage,
  action,
}: IDownloadModal) => {
  const { showAlert } = useAlertStore();
  const addToast = useToast((state) => state.add);

  const [focusIdx, setFocusIdx] = useState<number>(0);
  const LIMIT = 17;

  /** 내 컴퓨터 다운로드: 내 컴퓨터에 직접 다운로드 */
  // 다운로드 URL 생성.
  const { getCdnFile, getPublicCdnFile, saveBlobToFile, getCdnFolder } = useGetCdnFile();

  /** 저장 */
  // 이미지 or 파일 저장 대응 로딩바
  const [saving, setSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState('이미지로 저장 중입니다.');
  const savingState = useMemo(() => {
    return [
      {
        isLoading: saving,
        name: '저장',
        message: saveMessage,
        priority: 0, // 가장 높은 우선순위
      },
    ];
  }, [saving, saveMessage]);

  const { isLoading: isSaving, message: savingMessage } = useLoadingState(savingState);

  const getFolderList = async (item: {
    id: number;
    driveItemKey: string;
    ownerAccountId: number;
    ownerProfileId: number;
    name: string;
    isMine: boolean;
    fileType: SmartFolderItemResultFileType;
    smartFolderApiType: SmartFolderItemResultSmartFolderApiType;
  }) => {
    const folderCdn = await getCdnFolder(item.id.toString(), item.smartFolderApiType);

    if (folderCdn) {
      return folderCdn;
    }
    return [];
  };

  const downLoadFileWithSystem = async <
    T extends {
      id: number;
      driveItemKey: string;
      ownerAccountId: number;
      ownerProfileId: number;
      name: string;
      isMine: boolean;
      fileType: SmartFolderItemResultFileType;
      smartFolderApiType: SmartFolderItemResultSmartFolderApiType;
    },
  >(
    items: T | T[],
  ) => {
    const smartFolderItems = Array.isArray(items) ? items : [items];
    try {
      setSaveMessage('저장 파일 생성 중입니다.');
      setSaving(true);
      const zip = new JSZip();

      // 특수 파일 확장자 목록
      const SPECIAL_EXTENSIONS = ['.isdlp', '.isdlpr', '.isdsr'];

      // 폴더의 경우 EX) [item]이 아닌, EX)[[item | null]] 구조가 되기 때문에 평탄화 작업이 필요함
      const fetchResults = await Promise.all(
        smartFolderItems.map(async (item) => {
          try {
            let cdnFiles;
            const fileExtension = item.name.split('.').pop()?.toLowerCase() || '';

            if (item.fileType === 'FOLDER') {
              cdnFiles = await getFolderList(item);
            } else if (!item.ownerAccountId) {
              cdnFiles = await getPublicCdnFile(item);
            } else if (item.isMine) {
              cdnFiles = await getCdnFile(item);
            } else {
              cdnFiles = await getPublicCdnFile(item);
            }

            if (!Array.isArray(cdnFiles) || cdnFiles.length === 0) return null;

            // // 특수 확장자 파일인 경우 원본 데이터를 Base64로 인코딩하여 JSON 형태로 저장
            // if (SPECIAL_EXTENSIONS.includes(`.${fileExtension}`)) {
            //   console.log('특수 확장자 파일 처리:', item.name);

            //   const fileUrl = cdnFiles[0]?.url;
            //   console.log('ㅇㅅㅇ? 뭐지 근데 이거', fileUrl);

            //   if (!fileUrl) return null;

            //   try {
            //     const res = await fetch(fileUrl);
            //     if (!res.ok) return null;

            //     // ArrayBuffer로 원본 바이너리 데이터 가져오기
            //     const arrayBuffer = await res.arrayBuffer();

            //     // ArrayBuffer를 Base64 문자열로 변환
            //     const base64 = btoa(
            //       new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''),
            //     );

            //     // JSON 객체 생성
            //     const jsonObj = {
            //       ...item,
            //     };

            //     // JSON 문자열로 변환
            //     const jsonStr = JSON.stringify(jsonObj, null, 2);

            //     // JSON 형태로 Blob 생성
            //     const blob = new Blob([jsonStr], { type: 'application/json' });
            //     return [{ name: item.name, blob }];
            //   } catch (error) {
            //     console.error('특수 파일 처리 실패:', error);
            //     return null;
            //   }
            // }

            // 폴더일 경우 zip에 여러 파일 포함
            if (item.fileType === 'FOLDER') {
              const subResults = await Promise.all(
                cdnFiles.map(async (subFile) => {
                  try {
                    if (!subFile.url) return null;
                    const res = await fetch(subFile.url);
                    if (!res.ok) return null;
                    const blob = await res.blob();
                    return { name: subFile.path, blob };
                  } catch {
                    return null;
                  }
                }),
              );
              return subResults.filter((r): r is { name: string; blob: Blob } => r !== null);
            }

            // 일반 파일 처리
            const cdnFile = cdnFiles[0];
            if (!cdnFile?.url) return null;
            const res = await fetch(cdnFile.url);
            if (!res.ok) return null;
            const blob = await res.blob();
            return [{ name: item.name, blob }];
          } catch {
            return null;
          }
        }),
      );

      const flattenedResults = fetchResults.flat().filter((r): r is { name: string; blob: Blob } => !!r);

      if (flattenedResults.length === 0) {
        if (smartFolderItems.length === 1 && smartFolderItems[0].fileType === 'FOLDER') {
          showAlert({ message: '폴더 내 파일이 없습니다.' });
          return;
        }
        showAlert({ message: '저장에 실패했습니다.' });
        return;
      }

      // 파일이 1개이면 zip 없이 직접 저장
      if (flattenedResults.length === 1) {
        const { name, blob } = flattenedResults[0];
        await saveBlobToFile(blob, name, 'application/octet-stream').then((isCompleted) => {
          if (onCancel && isCompleted) onCancel();
        });
        return;
      }

      flattenedResults.forEach(({ name, blob }) => {
        if (name && blob) zip.file(name, blob);
      });

      // 경로 확인 용
      // zip.forEach((relativePath, file) => {
      //   console.log('ZIP에 추가된 파일:', relativePath, '경로:', file.dir);
      // });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      // 폴더 선택시에는 폴더 명이 zip 파일 명으로 아닐땐 임의대로 지정
      let zipFilename = `files_${Date.now()}.zip`;

      if (smartFolderItems.length === 1) {
        const { name } = smartFolderItems[0];
        zipFilename = name.endsWith('.zip') ? name : `${name}.zip`;
      }

      await saveBlobToFile(zipBlob, zipFilename, 'application/zip').then((isCompleted) => {
        if (onCancel && isCompleted) onCancel();
      });
    } catch (err) {
      console.error('파일 저장 실패:', err);
      showAlert({ message: '저장에 실패했습니다.' });
    } finally {
      setSaveMessage('이미지로 저장 중입니다.'); // 기본 값 초기화
      setSaving(false);
    }
  };
  /** 내 컴퓨터 다운로드: 내 컴퓨터에 직접 다운로드 끝 */

  /** 내 폴더 & 자료보드 다운로드 */
  const { data: materialBoardList } = useGetItemList();
  const { data: myFolderList } = useScanMyFolders();

  // 내 폴더 아이디 조회
  const myFolderId = useMemo(() => {
    return myFolderList?.result?.[0]?.id.toString() ?? null;
  }, [myFolderList?.result]);

  // 내 폴더 SmartFolderItemResult 조회
  const myFolderItemResult = useMemo(() => {
    return materialBoardList?.result?.find((item) => item.id.toString() === myFolderId);
  }, [materialBoardList?.result, myFolderId]);

  // 선택 폴더 관리
  const [selectedItem, setSelectedItem] = useState<SmartFolderItemResult | null>(null);

  const [smartFolderApiType, setSmartFolderApiType] = useState<SmartFolderItemResultSmartFolderApiType | null>(
    'UserFolder',
  );
  const [parentSmartFolderId, setParentSmartFolderId] = useState<string | null>(myFolderId ?? null);

  useEffect(() => {
    if (myFolderId) setParentSmartFolderId(myFolderId);
  }, [myFolderId]);

  // 썸네일 클릭 이벤트
  const handleClickItem = (item: SmartFolderItemResult, event: React.MouseEvent<HTMLDivElement>) => {
    // 다운로드 타켓 폴더 설정
    if (item.fileType === 'FOLDER') {
      if (selectedItem && selectedItem.id !== item.id) {
        setSelectedItem(item);
      } else if (selectedItem && selectedItem.id === item.id) {
        setSelectedItem(null);
      } else {
        setSelectedItem(item);
      }
    }
  };

  // 썸네일 더블 클릭 이벤트
  const handleDoubleClickItem = (item: SmartFolderItemResult, event: React.MouseEvent<HTMLDivElement>) => {
    if (item.fileType === 'FOLDER') {
      setSmartFolderApiType(item.smartFolderApiType);
      setParentSmartFolderId(item.id.toString());
      setSelectedItem(item);
    }
  };

  // 내 폴더 / 자료보드 (공개자료 제외) 자료 조회
  const queryParams = useMemo(() => {
    return {
      smartFolderApiType,
      parentSmartFolderId,
      sorts: 'createdAt.desc,name.asc',
    };
  }, [parentSmartFolderId, smartFolderApiType]);

  const isEnabledGetItemList = useMemo(() => {
    return (!!smartFolderApiType && !!parentSmartFolderId) || (!smartFolderApiType && !parentSmartFolderId);
  }, [parentSmartFolderId, smartFolderApiType]);

  const is1Depth = useMemo(() => {
    if (focusIdx === 0) return smartFolderApiType === 'UserFolder' && parentSmartFolderId === myFolderId;
    return smartFolderApiType === null && parentSmartFolderId === null;
  }, [focusIdx, myFolderId, parentSmartFolderId, smartFolderApiType]);

  /** 공개 자료 무한스크롤 */
  const publicQueryKey = getGetPublicItemForMyListQueryKey();

  const isInPublicFolder = useMemo(() => {
    return parentSmartFolderId === '0' && smartFolderApiType === 'PublicItem';
  }, [parentSmartFolderId, smartFolderApiType]);

  const {
    data: publicList,
    fetchNextPage: publicListNextPage,
    hasNextPage: publicListHasNext,
    isFetchingNextPage: publicListFetchingNextPage,
    refetch: publicListRefetch,
  } = useInfiniteQueryWithLimit({
    queryKey: publicQueryKey,
    queryFn: (pageParam) => getPublicItemForMyList({ offsetWithLimit: `${pageParam},${LIMIT}` }),
    limit: LIMIT,
    enabled: isInPublicFolder,
  });
  /** 공개 자료 무한스크롤 끝 */

  const inMaterialTab1Depth = useMemo(() => {
    return focusIdx === 1 && is1Depth;
  }, [focusIdx, is1Depth]);

  /** 내 폴더 & 자료보드  무한 스크롤 */
  const queryKey = getGetItemListQueryKey(queryParams);
  const {
    data: itemList,
    fetchNextPage: itemListNextPage,
    hasNextPage: itemListsHasNext,
    isFetchingNextPage: itemListFetchingNextPage,
    isLoading: itemIsLoading,
    refetch,
  } = useInfiniteQueryWithLimit({
    queryKey,
    queryFn: (pageParam) =>
      getItemList({
        ...queryParams,
        offsetWithLimit: `${pageParam},${LIMIT}`, // limit + 1개만큼의 아이템이 나옴
      }),
    limit: LIMIT,
    enabled: isEnabledGetItemList,
  });

  const fileItems = useMemo(() => {
    return inMaterialTab1Depth
      ? [...getFlattenedData(itemList?.pages), PUBLIC_FOLDER] // 공개자료 폴더 할당
      : getFlattenedData(isInPublicFolder ? publicList?.pages : itemList?.pages);
  }, [inMaterialTab1Depth, isInPublicFolder, itemList?.pages, publicList?.pages]);

  const [currentFileItems, setCurrentFileItems] = useState<SmartFolderItemResult[]>([]);
  useEffect(() => {
    setCurrentFileItems(fileItems);
  }, [fileItems]);

  const myFolderLoadMoreRef = useRef<HTMLDivElement | null>(null);
  const myFolderCallbackRef = useRef<() => void>(() => {}); // 데이터의 최신 상태 유지하기 위해 ref 생성
  useEffect(() => {
    myFolderCallbackRef.current = async () => {
      if (focusIdx === 0 && itemListsHasNext && !itemListFetchingNextPage) {
        await itemListNextPage();
      }
    };
  }, [itemListsHasNext, itemListFetchingNextPage, itemListNextPage, focusIdx]);

  const { observe: myFolderObserve } = useInfiniteScroll({
    callback: () => myFolderCallbackRef.current(),
    threshold: 0.1,
    root: document.querySelector('.inner-modal') as HTMLElement,
    rootMargin: '0px 0px 0px 0px',
  });

  /** 내 폴더 탭 옵저브 요소 할당 */
  useEffect(() => {
    if (myFolderLoadMoreRef.current) {
      myFolderObserve(myFolderLoadMoreRef.current);
    }
  }, [myFolderObserve]);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef<() => void>(() => {}); // 데이터의 최신 상태 유지하기 위해 ref 생성
  useEffect(() => {
    callbackRef.current = async () => {
      if (focusIdx === 1 && itemListsHasNext && !itemListFetchingNextPage) {
        await itemListNextPage();
      }
    };
  }, [itemListsHasNext, itemListFetchingNextPage, itemListNextPage, focusIdx]);

  useEffect(() => {
    callbackRef.current = async () => {
      // 공개 자료 무한 스크롤
      if (focusIdx === 1 && isInPublicFolder && publicListHasNext && !publicListFetchingNextPage) {
        await publicListNextPage();
      }
    };
  }, [focusIdx, isInPublicFolder, publicListHasNext, publicListFetchingNextPage, publicListNextPage]);

  const { observe } = useInfiniteScroll({
    callback: () => callbackRef.current(),
    threshold: 0.1,
    root: document.querySelector('.inner-modal') as HTMLElement,
    rootMargin: '0px 0px 0px 0px',
  });

  /** 자료보드 탭 옵저브 요소 할당 */
  useEffect(() => {
    if (loadMoreRef.current) {
      observe(loadMoreRef.current);
    }
  }, [observe]);

  /* 옵저버 포함 DOWNLOAD_MODAL_TAB_LIST */
  const OBSERVER_TAB_LIST: (ITabItem & {
    loadMoreRef: React.MutableRefObject<HTMLDivElement | null>;
    isFetchingNextPage: boolean;
  })[] = DOWNLOAD_MODAL_TAB_LIST.map((tab, idx) => {
    return {
      ...tab,
      loadMoreRef: idx === 0 ? myFolderLoadMoreRef : loadMoreRef,
      isFetchingNextPage:
        idx === 0 ? focusIdx === 0 && itemListFetchingNextPage : focusIdx === 1 && itemListFetchingNextPage,
    };
  });
  /** 내 폴더 & 자료보드 무한스크롤 끝 */

  const isSelectTargetFolder = useCallback((): boolean => {
    if (!selectedItem) {
      showAlert({ message: '폴더를 선택해 주세요.' });
      return false;
    }
    return true;
  }, [selectedItem, showAlert]);

  const initCurrentFolder = useCallback(
    (index: number) => {
      // 탭 이동시  smartFolderApiType, parentSmartFolderId 초기화.
      setSmartFolderApiType(index === 0 ? 'UserFolder' : null);
      setParentSmartFolderId(index === 0 ? myFolderId : null);
      if (isEnabledGetItemList) refetch();
    },
    [isEnabledGetItemList, myFolderId, refetch],
  );

  const handleTabClick = (index: number) => {
    initCurrentFolder(index);
    setSelectedItem(null); // 탭 이동시 선택된 폴더 초기화.
    setFocusIdx(index);
  };

  useEffect(() => {
    initCurrentFolder(0);
  }, [initCurrentFolder]);

  const initTree: IBreadcrumbItem[] = useMemo(() => {
    return focusIdx === 1
      ? isInPublicFolder
        ? [...MATERIAL_BREADCRUMB, ...PUBLIC_BREADCRUMB]
        : MATERIAL_BREADCRUMB
      : [];
  }, [focusIdx, isInPublicFolder]);

  // 최초 내 폴더 탭 진입시, 내 폴더 선택
  useEffect(() => {
    if (is1Depth && !selectedItem && myFolderItemResult) setSelectedItem(focusIdx === 0 ? myFolderItemResult : null); // 내 폴더 자동 선택.
  }, [focusIdx, is1Depth, myFolderItemResult, selectedItem]);

  // 폴더 트리 조회
  const { data: flatPathTreeData } = useGetItemFlatPathTree(
    {
      smartFolderApiType: smartFolderApiType || '',
      smartFolderItemId: parentSmartFolderId || '',
    },
    {
      query: {
        enabled: smartFolderApiType !== null && parentSmartFolderId !== null && !isInPublicFolder,
      },
    },
  );

  const flatPathTree: SmartFolderTreeResult[] | null = useMemo(() => {
    return flatPathTreeData?.result || null;
  }, [flatPathTreeData]);

  const lastFlatPathTree: SmartFolderTreeResult | null = useMemo(() => {
    return flatPathTree ? flatPathTree[flatPathTree.length - 1] : null;
  }, [flatPathTree]);

  // 브레드크럼 생성
  const breadcrumbs: IBreadcrumbItem[] = useMakeBreadcrumbs({
    pathTree: flatPathTree,
    initTree,
  });

  const lastTreeItem: IBreadcrumbItem = useMemo(() => {
    return breadcrumbs[breadcrumbs.length - 1];
  }, [breadcrumbs]);

  const currentSelectFolder = useMemo(() => {
    return {
      ...DUMMY_FOLDER,
      id: Number(lastTreeItem?.id) ?? 0,
      smartFolderApiType: lastTreeItem?.smartFolderApiType ?? 'UserFolder',
    };
  }, [lastTreeItem?.id, lastTreeItem?.smartFolderApiType]);

  /**
   * * 저장 경로
   */
  const currentPathString = useMemo(() => {
    let pathString = '';

    if (breadcrumbs && breadcrumbs.length > 0) {
      pathString = breadcrumbs.map((item) => item.label).join(' > ');
    }

    if (selectedItem && !['', lastTreeItem?.label].includes(selectedItem?.name)) {
      pathString += ` > ${selectedItem?.name}`; // 선택한 폴더 경로 추가
    }
    return pathString;
  }, [breadcrumbs, lastTreeItem?.label, selectedItem]);

  const handleConfirm = useCallback(async () => {
    if (isSelectTargetFolder()) {
      // 저장 경로를 포함하고 싶다면 onConfirm parameter에 pathString 추가
      onConfirm?.(selectedItem, currentPathString);
    }
  }, [isSelectTargetFolder, selectedItem, onConfirm, currentPathString]);

  // 현재 선택된 폴더가 없는 경우, 현재 위치의 폴더로 선택
  useEffect(() => {
    if (lastTreeItem?.smartFolderApiType && lastTreeItem?.smartFolderApiType && !selectedItem) {
      setSelectedItem(currentSelectFolder);
    }
  }, [currentSelectFolder, lastTreeItem?.smartFolderApiType, parentSmartFolderId, selectedItem, smartFolderApiType]);

  const handleNavigate = (item: IBreadcrumbItem) => {
    setSelectedItem(null);
    setSmartFolderApiType(item.smartFolderApiType!);
    if (item.id) setParentSmartFolderId(item.id.toString());
    else setParentSmartFolderId(null);
  };
  /** 내 폴더 & 자료보드 다운로드 끝 */

  /** 폴더 생성 */
  const isAllowMakeFolder = useMemo(() => {
    if (isInPublicFolder) return false; // 공개 자료 폴더 내부 제외
    if (lastTreeItem?.label === '자료') return false;
    if (['모바일 업로드', '즐겨찾기', '활동 사진', '우리반 아이 사진', '빠른 작업 사진'].includes(lastTreeItem?.label))
      return true;
    if (lastFlatPathTree?.rootType === 'EDUCATIONAL_CLASS_STUDENT_PHOTO' && !lastFlatPathTree.userEditable) return true; // 우리반 아이 사진이 루트인 경우, 시스템 생성 폴더만 가능
    if (lastFlatPathTree?.rootType === 'EDUCATIONAL_CLASS_STUDENT_PHOTO' && lastFlatPathTree.userEditable) return false; // 우리반 아이 사진이 루트인 경우, 사용자 생성 폴더는 불가능
    if (flatPathTree && flatPathTree?.length >= 2 && focusIdx === 1) return false; // 내 폴더 하위 폴더 제외
    return (focusIdx === 0 && is1Depth) || (!is1Depth && focusIdx === 1); // 내 폴더 1Depth 허용, 자료 보드 1Depth 제외
  }, [
    flatPathTree,
    focusIdx,
    is1Depth,
    isInPublicFolder,
    lastFlatPathTree?.rootType,
    lastFlatPathTree?.userEditable,
    lastTreeItem?.label,
  ]);

  const [makeFolderMode, setMakeFolderMode] = useState(false); // 폴더 이름 변경 or 생성 모드
  const [nameEditable, setNameEditable] = useState<SmartFolderItemResult | null>(null);
  const { mutateAsync: addFolder } = useAddFolder1();

  const currentDummyFolder: SmartFolderItemResult = useMemo(() => {
    return {
      ...DUMMY_FOLDER,
      smartFolderApiType: smartFolderApiType ?? 'UserFolder',
      parentSmartFolderItemId: parentSmartFolderId ? Number(parentSmartFolderId) : 0,
      parentSmartFolderApiType: smartFolderApiType ?? 'UserFolder',
    };
  }, [parentSmartFolderId, smartFolderApiType]);

  const handleAddFolder = () => {
    try {
      if (makeFolderMode) return;
      setMakeFolderMode(true);
      setCurrentFileItems((prev) => [currentDummyFolder, ...prev]);
      setNameEditable(currentDummyFolder);
    } catch (error) {
      showAlert({ message: '폴더 생성에 실패하였습니다.' });
    }
  };

  const resetMakeRenameFile = () => {
    if (nameEditable) setNameEditable(null);
    if (makeFolderMode) setMakeFolderMode(false);
    setCurrentFileItems((prev) => prev.slice(1)); // 더미 제거
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
    try {
      if (type === 'make') {
        await addFolder({
          data: {
            name,
            public: false,
            parentSmartFolderId: id ?? 0,
            parentSmartFolderApiType: smartFolderApiType ?? 'UserFolder',
          },
        });
      }
      if (isInPublicFolder) publicListRefetch().then(() => resetMakeRenameFile());
      else refetch().then(() => resetMakeRenameFile());
    } catch (error) {
      showAlert({ message: '폴더 생성에 실패하였습니다.' });
      resetMakeRenameFile();
    }
  };
  /** 폴더 생성 끝 */

  // 스토리 보드
  const form = useForm<StoryBoardAddRequest>({
    defaultValues: {},
    mode: 'onChange',
  });
  const getParams = { includes: 'driveItems' };
  const { data: storyBoardData } = useGetStoryBoard(itemData[0]?.taskItemId ?? 0, getParams, {
    query: {
      enabled: !!itemData[0].taskItemId && itemData[0].fileType === 'STORY_BOARD',
    },
  });
  const [blocks, setBlocks] = useState<IBlockData[]>(getStoryBoardInitBlocks(storyBoardData?.result));
  useEffect(() => {
    if (storyBoardData?.result) setBlocks(getStoryBoardInitBlocks(storyBoardData?.result));
  }, [storyBoardData]);

  // 아이 관찰 기록
  const { data: studentRecordData } = useGetStudentRecord(
    itemData[0].taskItemId,
    { includes: 'scores,comments,photoItems' },
    {
      query: {
        enabled: !!itemData[0].taskItemId && itemData[0].fileType === 'STUDENT_RECORD',
      },
    },
  );
  const [studentRecord, setStudentRecord] = useState<StudentRecordResult | undefined>(studentRecordData?.result);
  useEffect(() => {
    if (studentRecordData?.result) setStudentRecord(studentRecordData?.result);
  }, [studentRecordData]);

  const { data: domains } = useGetDomains(
    { course: studentRecord?.course as EducationalClassResultCourse },
    {
      query: {
        enabled: !!studentRecord?.course && itemData[0].fileType === 'STUDENT_RECORD',
      },
    },
  );

  // 놀이 계획
  const { data: lecturePlanData } = useGetLecturePlan(
    itemData[0].taskItemId,
    { includes: 'driveItems' },
    {
      query: {
        enabled: !!itemData[0].taskItemId && itemData[0].fileType === 'LECTURE_PLAN',
      },
    },
  );
  const [lecturePlan, setLecturePlan] = useState<LecturePlanResult | undefined>(lecturePlanData?.result);
  useEffect(() => {
    if (lecturePlanData?.result) setLecturePlan(lecturePlanData?.result);
  }, [lecturePlanData]);

  // 놀이  보고서
  const { reportData, setReportData } = useReportStore((state) => ({
    reportData: state.reportData,
    setReportData: state.setReportData,
  }));

  const { data: lectureReportData } = useGetLectureReport(
    itemData[0].taskItemId,
    { includes: 'photoItems' },
    {
      query: {
        enabled: !!itemData[0].taskItemId && itemData[0].fileType === 'LECTURE_PLAN_REPORT',
      },
    },
  );

  useEffect(() => {
    setReportData(lectureReportData?.result);
  }, [lectureReportData, setReportData]);

  // 특수 파일에 따른 렌더링 대상 컴포넌트
  const renderMap: Record<string, React.ReactNode | null> = {
    STORY_BOARD: storyBoardData ? (
      <StoryBoardForm
        data={storyBoardData?.result}
        isEdit={false}
        form={form}
        onSubmit={async () => {}}
        blocks={blocks}
        setBlocks={setBlocks}
      />
    ) : null,
    LECTURE_PLAN_REPORT: reportData ? (
      <div className="doc-playreport">
        <PreviewReportClient
          previewData={{
            ...reportData,
            cards: reportData.lectureReportCards?.map((item: LectureReportCardResult) => {
              return {
                ...item,
                title: item.title ?? '',
                contents: item.contents ?? '',
              };
            }),
            objective: reportData.learningPoint,
            support: reportData.teacherSupport,
          }}
          showHeader={false}
          onBackEdit={() => {}}
        />
      </div>
    ) : null,
    LECTURE_PLAN: lecturePlan ? (
      <div className="doc-playplan">
        <ActivityCardDetailBody
          isEditMode={false}
          lecturePlanCardSections={lecturePlan}
          displayTitle={lecturePlan?.subject as string}
          displayPeriod={`${lecturePlan?.startsAt} ~ ${lecturePlan?.endsAt}`}
          displayAge={lecturePlan?.studentAge as number}
          displayTime={lecturePlan?.activityTimeStr as string}
        />
      </div>
    ) : null,
    STUDENT_RECORD: studentRecord ? (
      <div className="doc-observation">
        <StudentRecordPreview
          studentName={studentRecord?.studentName}
          modifiedAt={studentRecord?.modifiedAt}
          studentThumbnail={studentRecord?.studentThumbnail}
          educationalClassAge={studentRecord?.educationalClassAge}
          studentBirthday={studentRecord?.studentBirthday}
          summaryScores={studentRecord?.summaryScores}
          domains={domains?.result}
          observeComments={studentRecord?.observeComments}
          observeSummary={studentRecord?.observeSummary}
          teacherComment={studentRecord?.teacherComment}
          teacherSupport={studentRecord?.teacherSupport}
          parentSupport={studentRecord?.parentSupport}
          showUtilButtons={false}
        />
      </div>
    ) : null,
  };

  const containerRef = useRef<HTMLDivElement | null>(null);
  const { getImageAndUploadToS3 } = useCaptureImage();

  const handleSaveToImage = async () => {
    if (isSelectTargetFolder() && onSaveToImage) {
      onSaveToImage?.(selectedItem, currentPathString);
      return;
    }

    // 전달된 컴포넌트를 임시로 렌더링하여 이미지로 변환
    if (containerRef.current) {
      setSaving(true);

      if (!selectedItem) {
        showAlert({ message: '폴더를 선택해 주세요.' });
        return;
      }

      try {
        const elementId = fileTypeMap[itemData[0]?.fileType as SaveToImageFileType] ?? '';
        const targetNode = document.getElementById(elementId);
        if (!targetNode) {
          showAlert({ message: '이미지로 저장 중 오류가 발생했습니다.' });
          return;
        }
        const imageFileName = `${removeFileExtension(itemData[0]?.name ?? '')}.png`;
        const uploadedFile: SmartFolderItemResult | undefined = await getImageAndUploadToS3({
          elementId,
          fileName: imageFileName,
          taskType: itemData[0]?.fileType as SaveToImageFileType,
          smartFolderApiType: selectedItem.smartFolderApiType,
          targetFolderId: selectedItem.id,
        });

        if (uploadedFile) {
          addToast({ message: `이미지로 저장되었습니다. ${currentPathString && `<br />${currentPathString}`}` });
          if (onCancel) {
            onCancel();
            setSaving(false);
          }
        } else {
          showAlert({ message: '이미지로 저장 중 오류가 발생했습니다.' });
        }
      } catch (error) {
        showAlert({ message: '이미지로 저장 중 오류가 발생했습니다.' });
      } finally {
        // containerRef.current.remove(); // DOM에서 엘리먼트 삭제
        setSaving(false);
      }
    } else {
      showAlert({ message: '이미지로 저장 중 오류가 발생했습니다.' });
    }
  };

  /** 저장 버튼 활성화 조건 */
  const isConfirm = useMemo(() => {
    // if (focusIdx === 0) return handleConfirm;
    // if (focusIdx === 1)
    //   return (is1Depth && selectedItem && selectedItem?.id.toString() !== myFolderId) || isInPublicFolder
    //     ? undefined
    //     : handleConfirm;
    if (isInPublicFolder || selectedItem?.smartFolderApiType === 'PublicItem') return undefined;
    return handleConfirm;
  }, [handleConfirm, isInPublicFolder, selectedItem?.smartFolderApiType]);

  const isSpecialType = itemData.every((item: SmartFolderItemResult) => {
    return SPECIAL_FILE_TYPE.includes(item?.fileType);
  });

  /** 저장 모달 명칭 : 복사/이동/저장  */
  const actionLabel = useMemo(() => {
    if (action?.toLocaleLowerCase() === 'copy') return '복사';
    if (action?.toLocaleLowerCase() === 'move') return '이동';
    if (action?.toLocaleLowerCase() === 'save') return '저장';
    return '저장';
  }, [action]);

  return createPortal(
    <>
      <ModalBase
        className="modal-download"
        isOpen={isOpen}
        confirmText={actionLabel}
        cancelText="취소"
        message={actionLabel}
        onCancel={onCancel}
        onConfirm={isConfirm}
        size="large"
        plusButton={
          isSpecialType && isConfirm && itemData.length === 1 && actionLabel === '저장' ? (
            <Button icon="image-18" onClick={handleSaveToImage}>
              이미지로 저장
            </Button>
          ) : null
        }
      >
        <Tab
          focusIdx={focusIdx}
          items={DOWNLOAD_MODAL_TAB_LIST}
          onChange={handleTabClick}
          commonArea={
            actionLabel === '저장' && (
              <Button
                className="btn-computer"
                size="small"
                color="line"
                icon="computer-14"
                onClick={() => downLoadFileWithSystem(itemData)}
              >
                내 컴퓨터
              </Button>
            )
          }
        >
          {/* 내폴더 탭 / 자료보드 탭 */}
          {OBSERVER_TAB_LIST.map(
            (
              _: ITabItem & {
                loadMoreRef: React.MutableRefObject<HTMLDivElement | null>;
                isFetchingNextPage: boolean;
              },
            ) => (
              <div key={_.tabId}>
                <div className="top-list">
                  <BreadCrumb items={breadcrumbs} onNavigate={handleNavigate} />
                  {isAllowMakeFolder && (
                    <Button size="small" icon="plus-w" onClick={handleAddFolder}>
                      새폴더
                    </Button>
                  )}
                </div>
                {currentFileItems && currentFileItems.length > 0 ? (
                  <>
                    <ul className="list-thumbnail-grid list-thumbnail-grid-file">
                      {currentFileItems.map((item: SmartFolderItemResult) => (
                        <li key={`download_${_.tabId}_${item.id}_${item.name}_${item.driveItemCreatedAt}`}>
                          <Thumbnail
                            width={172}
                            className={cx('type-upload', {
                              active: item.id === selectedItem?.id,
                            })}
                            style={{
                              cursor: item.fileType === 'FOLDER' ? 'pointer' : 'default',
                            }}
                            floating={false}
                            floatingType={FLOATING_BUTTON_TYPE.Default}
                            fileType={item.fileType as SmartFolderItemResultFileType}
                            fileName={item.name}
                            thumbUrl={item.thumbUrl ?? ''}
                            isEditActive={item.id === selectedItem?.id}
                            onClick={(event) => handleClickItem(item, event)}
                            onDoubleClick={(event) => handleDoubleClickItem(item, event)}
                            lecturePlan={item.lecturePlan as LecturePlanResult}
                            visualClassName={item.fileType === 'LECTURE_PLAN' ? 'type-card' : undefined}
                            userEditable={item.userEditable}
                            makeRenameFile={({ name, type }) =>
                              makeRenameFile?.({
                                name,
                                type,
                                id: item.parentSmartFolderItemId,
                              })
                            }
                            nameEditable={item.id === nameEditable?.id}
                          />
                        </li>
                      ))}
                      {((!isInPublicFolder && _.isFetchingNextPage) ||
                        (isInPublicFolder && publicListFetchingNextPage)) && (
                        <li style={{ gridColumn: 'span 6' }}>
                          <Loader loadingMessage={null} />
                        </li>
                      )}
                      <div
                        ref={_.loadMoreRef}
                        style={{
                          height: '10px',
                          background: 'transparent',
                          gridColumn: 'span 6',
                        }}
                      />
                    </ul>
                    {itemData && itemData.length > 0 && (
                      <div className="box-name">
                        <span className="txt-name">
                          {itemData.length === 1 ? itemData.map((item) => item.name) : `${itemData.length}개 항목`}
                        </span>
                      </div>
                    )}
                  </>
                ) : !isEnabledGetItemList || itemIsLoading ? (
                  <Loader loadingMessage={null} />
                ) : (
                  <div className="group-empty">
                    <div className="item-empty type3">
                      <span className="ico-comm ico-illust6" />
                      <strong className="tit-empty">자료가 없습니다.</strong>
                    </div>
                  </div>
                )}
              </div>
            ),
          )}
          {/* 내폴더 탭 / 자료보드 탭 끝 */}
        </Tab>
      </ModalBase>
      {isSpecialType && (
        <div ref={containerRef} style={{ opacity: 0 }}>
          {/* 이미지로 저장할 컴포넌트를 임시로 렌더링 */}
          {renderMap[itemData[0].fileType]}
        </div>
      )}
      {isSaving && <Loader hasOverlay loadingMessage={savingMessage} />}
    </>,
    document.getElementById('modal-root') as HTMLElement,
  );
};

DownloadModal.displayName = 'DownloadModal';
