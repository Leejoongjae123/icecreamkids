import React, { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BreadCrumb, Button, Loader, ModalBase, Thumbnail } from '@/components/common';
import { IUploadModal } from '@/components/modal/upload/types';
import { Tab } from '@/components/common/Tab';
import { UPLOAD_MODAL_TAB_LIST } from '@/const/tab';
import {
  getGetFolderTreeFromRootQueryKey,
  getGetItemListQueryKey,
  getGetPublicItemForMyListQueryKey,
  getGetRecommendItemsQueryKey,
  getItemList,
  getPublicItemForMyList,
  getRecommendItems,
  getScanMyFoldersQueryKey,
  useAddFolder1,
  useGetItemFlatPathTree,
} from '@/service/file/fileStore';
import {
  LecturePlanResult,
  SmartFolderItemResult,
  SmartFolderItemResultFileType,
  SmartFolderItemResultSmartFolderApiType,
  SmartFolderTreeResult,
} from '@/service/file/schemas';
import { EXTENSIONS, FLOATING_BUTTON_TYPE, MATERIAL_BREADCRUMB, PUBLIC_BREADCRUMB, PUBLIC_FOLDER } from '@/const';
import { usePathname } from 'next/navigation';
import cx from 'clsx';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import useS3FileUpload, { IPostFile } from '@/hooks/useS3FileUpload';
import { getFileExtension, getFlattenedData, isRecommendTaskType } from '@/utils';
import { useInfiniteQueryWithLimit } from '@/utils/react-query';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { IBreadcrumbItem } from '@/components/common/Breadcrumb';
import { createPortal } from 'react-dom';
import { useMakeBreadcrumbs } from '@/hooks/useMakeBreadcrumbs';
import { PhotoAiFaceModal } from '@/components/modal/photo-ai-face';
import { useBlurFaces, useMaskingFaces } from '@/service/aiAndProxy/aiAndProxyStore';
import {
  AiBlurReqeust,
  AIMaskingReqeust,
  SmartFolderItemResult as AiSmartFolderItemResult,
} from '@/service/aiAndProxy/schemas';
import useUserStore from '@/hooks/store/useUserStore';
import { useLoadingState } from '@/hooks/useLoadingState';
import { useToast } from '@/hooks/store/useToastStore';
import { useValidateFileName } from '@/hooks/useValidateFileName';
import Selecto, { SelectoProps } from 'react-selecto';
import { IDropDownMenu } from '@/components/common/Thumbnail/_components/DropDownMenu/types';
import { DropDownMenu } from '@/components/common/Thumbnail/_components/DropDownMenu';
import { useQueryClient } from '@tanstack/react-query';

export const UploadModal = ({
  isOpen,
  onCancel,
  onConfirm,
  setItemData,
  setFileData,
  allowsFileTypes = Object.keys(EXTENSIONS) as SmartFolderItemResultFileType[], // allowsFileTypes의 기본 값은 모두 허용
  taskType = 'ETC',
  isMultiUpload = true,
  isUploadS3 = false,
  isReturnS3UploadedItemData = true,
  targetSmartFolderApiType,
  targetFolderId,
  inputFileId = 'fileUpload',
  isFolderUpload = false,
}: IUploadModal) => {
  const currentPath = usePathname();
  const { userInfo } = useUserStore();

  const { showAlert } = useAlertStore();
  const addToast = useToast((state) => state.add);

  const [focusIdx, setFocusIdx] = useState<number>(0);
  const LIMIT = 17;

  /** 폴더 업로드용 */
  const { mutateAsync: addFolder } = useAddFolder1();
  const queryClient = useQueryClient();
  /** */

  const selectoRef = useRef<Selecto>(null); // 셀렉토

  const [loading, setLoading] = useState<boolean>(false);
  const loadingState = useMemo(() => {
    return [
      {
        isLoading: loading,
        name: '초상권 해결',
        message: '초상권 해결 중입니다.',
        priority: 0,
      },
    ];
  }, [loading]);

  const { isLoading, message: loadingMessage } = useLoadingState(loadingState);

  /** 추천자료 무한 스크롤 */
  const recommendQueryKey = getGetRecommendItemsQueryKey({
    task: isRecommendTaskType(taskType),
  });
  const {
    data: recommendData,
    fetchNextPage: recommendItemListNextPage,
    hasNextPage: recommendItemListsHasNext,
    isFetchingNextPage: recommendItemListFetchingNextPage,
    isLoading: recommendIsLoading,
  } = useInfiniteQueryWithLimit({
    queryKey: recommendQueryKey,
    queryFn: (pageParam) =>
      getRecommendItems({
        ...(isRecommendTaskType(taskType) !== 'ETC' && { task: isRecommendTaskType(taskType) }),
        offsetWithLimit: `${pageParam},${LIMIT}`, // limit + 1개만큼의 아이템이 나옴
      }),
    limit: LIMIT,
  });

  const recommendItems = useMemo(() => {
    return getFlattenedData(recommendData?.pages);
  }, [recommendData?.pages]);

  // 추천자료 리스트 useState 관리
  const [currentRecommendData, setCurrentRecommendData] = useState<SmartFolderItemResult[]>([]);

  useEffect(() => {
    setCurrentRecommendData(recommendItems);
  }, [recommendItems]);

  const recommendLoadMoreRef = useRef<HTMLDivElement | null>(null);
  const recommendCallbackRef = useRef<() => void>(() => {}); // 데이터의 최신 상태 유지하기 위해 ref 생성
  useEffect(() => {
    recommendCallbackRef.current = () => {
      if (recommendItemListsHasNext && !recommendItemListFetchingNextPage) {
        recommendItemListNextPage();
      }
    };
  }, [recommendItemListsHasNext, recommendItemListFetchingNextPage, recommendItemListNextPage]);

  const { observe: recommendObserve } = useInfiniteScroll({
    callback: () => recommendCallbackRef.current(),
    threshold: 0.1,
    root: document.querySelector('.inner-modal') as HTMLElement,
    rootMargin: '0px 0px 0px 0px',
  });

  /** 옵저브 요소 할당 */
  useEffect(() => {
    if (recommendLoadMoreRef.current) {
      recommendObserve(recommendLoadMoreRef.current);
      selectoRef.current?.findSelectableTargets();
    }
  }, [recommendObserve]);
  /** 추천자료 무한 스크롤 끝 */

  /** 자료보드 무한 스크롤 */
  const [smartFolderApiType, setSmartFolderApiType] = useState<SmartFolderItemResultSmartFolderApiType | null>(
    targetSmartFolderApiType || null,
  );
  const [parentSmartFolderId, setParentSmartFolderId] = useState<string | null>(targetFolderId?.toString() || null);

  /** 공개 자료 */
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

  const is1Depth = useMemo(() => {
    if (focusIdx === 0) return true;
    return smartFolderApiType === null && parentSmartFolderId === null;
  }, [focusIdx, parentSmartFolderId, smartFolderApiType]);

  const inMaterialTab1Depth = useMemo(() => {
    return focusIdx === 1 && is1Depth;
  }, [focusIdx, is1Depth]);

  // 폴더 트리 조회
  const { data: pathTreeData } = useGetItemFlatPathTree(
    {
      smartFolderApiType: smartFolderApiType || '',
      smartFolderItemId: parentSmartFolderId || '',
    },
    {
      query: { enabled: !!smartFolderApiType && !!parentSmartFolderId && !isInPublicFolder },
    },
  );

  const pathTree: SmartFolderTreeResult[] | null = useMemo(() => {
    return pathTreeData?.result || null;
  }, [pathTreeData]);

  // 자료보드 폴더 자료 조회 (공개자료 제외)
  const queryParams = useMemo(() => {
    return {
      smartFolderApiType,
      parentSmartFolderId,
      sorts: 'createdAt.desc,name.asc',
    };
  }, [parentSmartFolderId, smartFolderApiType]);

  const queryKey = getGetItemListQueryKey(queryParams);

  const {
    data: itemList,
    fetchNextPage: itemListNextPage,
    hasNextPage: itemListsHasNext,
    isFetchingNextPage: itemListFetchingNextPage,
    isLoading: itemIsLoading,
  } = useInfiniteQueryWithLimit({
    queryKey,
    queryFn: (pageParam) =>
      getItemList({
        ...queryParams,
        offsetWithLimit: `${pageParam},${LIMIT}`, // limit + 1개만큼의 아이템이 나옴
      }),
    limit: LIMIT,
  });

  const fileItems = useMemo(() => {
    return inMaterialTab1Depth
      ? [...getFlattenedData(itemList?.pages), PUBLIC_FOLDER] // 공개자료 폴더 할당
      : getFlattenedData(isInPublicFolder ? publicList?.pages : itemList?.pages);
  }, [inMaterialTab1Depth, isInPublicFolder, itemList?.pages, publicList?.pages]);

  // 자료보드 리스트 useState 관리
  const [currentFileData, setCurrentFileData] = useState<(SmartFolderItemResult | AiSmartFolderItemResult)[]>([]);

  useEffect(() => {
    setCurrentFileData(fileItems);
  }, [fileItems]);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef<() => void>(() => {}); // 데이터의 최신 상태 유지하기 위해 ref 생성
  useEffect(() => {
    callbackRef.current = () => {
      if (!isInPublicFolder && itemListsHasNext && !itemListFetchingNextPage) {
        itemListNextPage();
      }
      if (isInPublicFolder && publicListHasNext && !publicListFetchingNextPage) {
        publicListNextPage();
      }
    };
  }, [
    itemListsHasNext,
    itemListFetchingNextPage,
    itemListNextPage,
    isInPublicFolder,
    publicListHasNext,
    publicListFetchingNextPage,
    publicListNextPage,
  ]);

  const { observe } = useInfiniteScroll({
    callback: () => callbackRef.current(),
    threshold: 0.1,
    root: document.querySelector('.inner-modal') as HTMLElement,
    rootMargin: '0px 0px 0px 0px',
  });

  /** 옵저브 요소 할당 */
  useEffect(() => {
    if (loadMoreRef.current) {
      observe(loadMoreRef.current);
      selectoRef.current?.findSelectableTargets();
    }
  }, [observe]);

  /** 자료보드 무한 스크롤 끝 */

  // 업로드중 로딩바 노출 관리
  const [uploading, setUploading] = useState<boolean>(false);
  const uploadingState = useMemo(() => {
    return [
      {
        isLoading: uploading,
        name: '업로드',
        message: '업로드 중입니다.',
        priority: 0, // 가장 높은 우선순위
      },
    ];
  }, [uploading]);

  const { isLoading: isUploading, message: uploadingMessage } = useLoadingState(uploadingState);

  const { postFile } = useS3FileUpload();
  const acceptInput = useMemo(() => {
    return allowsFileTypes
      ?.map((type) => EXTENSIONS[type])
      .flat()
      .map((ext: string) => `.${ext}`) // 확장자 앞에 '.'을 추가
      .join(',');
  }, [allowsFileTypes]);

  // 추출된 썸네일 File로 변환
  const dataURLtoFile = (dataUrl: string, fileName: string): File => {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/); // 'image/png' 추출
    const mime = mimeMatch?.[1] ?? 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n); // 바이너리 데이터를 Uint8Array로 변환
    // File 객체 생성
    return new File([u8arr], fileName, { type: mime });
  };

  // 비디오 썸네일 설정
  const getVideoThumbnail = (file: File, seekTo = 1): Promise<File | null> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = URL.createObjectURL(file);
      video.crossOrigin = 'anonymous';

      video.onloadedmetadata = () => {
        video.currentTime = video.duration < seekTo ? 0 : seekTo; // 비디오 총 길이 시간이 프레임 따는 시간보다 작을 시 0으로 설정
      };

      video.onseeked = async () => {
        // 프레임 로딩 완료 시
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/png');
        const fileThumbnail = dataURLtoFile(dataUrl, `${file.name}.png`);

        URL.revokeObjectURL(video.src);
        resolve(fileThumbnail);
      };

      video.onerror = (e) => {
        resolve(null);
      };
    });
  };

  const makeThumbFile = async (file: File, fileType: SmartFolderItemResultFileType) => {
    if (fileType === 'IMAGE') {
      return file;
    }
    if (fileType === 'VIDEO') {
      const thumbnailUrl = await getVideoThumbnail(file);
      return thumbnailUrl;
    }
    return null;
  };

  // 제목 유효성 체크
  const validateFileName = useValidateFileName();

  /** 폴더 업로드 or 파일 업로드 여부 */
  const [isFolderUploadMode, setFolderUploadMode] = useState<boolean>(false);

  // 내 컴퓨터에서 직접 자료 선택시 호출.
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const input = event.target as HTMLInputElement;
      const { files } = event.target;

      if (!files) return;

      const valideFiles = Array.from(files).filter((file) => file.name !== '.DS_Store'); // 맥 시스템 파일 제외

      if (
        Array.from(valideFiles)
          .map((file: File) => validateFileName(file.name))
          .includes(true)
      ) {
        return; // 파일 하나라도 파일명중 허용하지 않는 특수문자가 포함된 경우
      }

      const allowedExtensions = allowsFileTypes?.map((type) => EXTENSIONS[type]).flat();

      const filesArray: File[] = Array.from(valideFiles);
      const invalidFile = filesArray.find((file: File) => {
        const fileName = file.name || '';
        const extension = getFileExtension(fileName);
        return !allowedExtensions?.includes(extension!.toLowerCase());
      });

      if (invalidFile) {
        showAlert({ message: '확장자 확인 후 업로드 해주세요.' });
        return;
      }
      let makeFolderInfo = {
        smartFolderApiType,
        parentSmartFolderId: Number(parentSmartFolderId),
      };
      // 폴더 업로드 시 폴더 먼저 생성
      if (isFolderUploadMode) {
        const getWebkitRelativePath = filesArray[0].webkitRelativePath.split('/')[0];
        if (!smartFolderApiType || !parentSmartFolderId) {
          showAlert({ message: '업로드를 실패했습니다.' });
          return;
        }
        await addFolder({
          data: {
            name: getWebkitRelativePath,
            public: false,
            parentSmartFolderApiType: smartFolderApiType,
            parentSmartFolderId: Number(parentSmartFolderId),
          },
        })
          .then(async (response) => {
            if (response.status === 200 && response.result) {
              makeFolderInfo = {
                smartFolderApiType: response.result.smartFolderApiType,
                parentSmartFolderId: response.result.id,
              };
              const folderListKey = getScanMyFoldersQueryKey();
              const smartfolderListKey = getGetFolderTreeFromRootQueryKey();
              await queryClient.refetchQueries({
                queryKey: response.result.smartFolderApiType === 'UserFolder' ? folderListKey : smartfolderListKey,
                type: 'active',
              });
            }
          })
          .catch(() => {
            showAlert({ message: '더 이상 폴더 생성이 불가능하거나 폴더명이 중복됩니다.' });
          });
      }

      if (setItemData && isUploadS3) {
        // 유효성 체크 완료된 파일들을 순차적으로 S3 자료 업로드.
        const uploadedItems: (SmartFolderItemResult | null)[] = await Promise.all(
          filesArray.map(async (file: File) => {
            const fileName = file.name || '';
            const extension = getFileExtension(fileName);
            const fileType = allowsFileTypes?.find((type) => EXTENSIONS[type].includes(extension!)) ?? 'ETC';
            const thumbFile = await makeThumbFile(file, fileType);

            const uploadOptions: IPostFile = {
              file,
              fileType,
              taskType,
              source: 'FILE',
              thumbFile,
            };

            if (smartFolderApiType && parentSmartFolderId) {
              uploadOptions.targetSmartFolderApiType = isFolderUploadMode
                ? (makeFolderInfo.smartFolderApiType ?? undefined)
                : smartFolderApiType;
              uploadOptions.targetFolderId = isFolderUploadMode
                ? makeFolderInfo.parentSmartFolderId
                : Number(parentSmartFolderId);
            }

            return (await postFile(uploadOptions)) as SmartFolderItemResult | null;
          }),
        );

        if (uploadedItems.includes(null)) {
          setItemData([]);
          input.value = '';
          onConfirm();
          return;
        }

        if (isReturnS3UploadedItemData) {
          setItemData(uploadedItems as SmartFolderItemResult[]);
          onConfirm?.(uploadedItems as SmartFolderItemResult[]);
        } else {
          setItemData([]);
          onConfirm();
        }
      }
      if (setFileData) {
        setFileData(valideFiles);
        onConfirm();
        input.value = '';
      }
    } catch (error) {
      showAlert({ message: '업로드에 실패했습니다.' });
    } finally {
      const input = event.target as HTMLInputElement;
      input.value = '';
      setFolderUploadMode(false);
      setUploading(false);
    }
  };
  /*
   * isMultiUpload: false 인 경우, 선택된 id를 하나만 가짐. (예: [1])
   * isMultiUpload: true 인경우, 선택된 id들을 배열로 관리 (예: [1, 3, 5])
   */
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [currentSelectedIds, setCurrentSelectedIds] = useState<number[]>([]);

  const handleTabClick = (index: number) => {
    // 탭 이동시 선택된 자료 초기화.
    setSelectedIds([]);
    setCurrentSelectedIds([]);
    setFocusIdx(index);
  };

  const hasSelectedIds = useMemo(() => {
    return selectedIds.length > 0;
  }, [selectedIds]);

  const updateSelectedIds = (prevSelectedIds: number[], id: number, isChecked: boolean, isMulti: boolean): number[] => {
    if (isMulti) {
      if (isChecked) {
        return prevSelectedIds.includes(id) ? prevSelectedIds : [...prevSelectedIds, id];
      }
      return prevSelectedIds.filter((selectedId) => selectedId !== id);
    }

    return isChecked ? [id] : [];
  };

  // onEditToggle 핸들러: 체크박스의 체크 여부에 따라 배열에 추가하거나 제거.
  const onEditToggle = (id: number, event: React.ChangeEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    let isChecked: boolean;

    if (event.currentTarget instanceof HTMLDivElement) {
      const checkbox = event.currentTarget.querySelector('input[type="checkbox"]');
      if (checkbox instanceof HTMLInputElement) {
        if (event.type === 'change') {
          isChecked = checkbox.checked;
        } else {
          isChecked = !checkbox.checked;
        }
      } else {
        return; // 체크박스를 찾을 수 없는 경우 처리.
      }
    } else {
      return;
    }

    setSelectedIds((prevSelectedIds) => updateSelectedIds(prevSelectedIds, id, isChecked, isMultiUpload));
    setCurrentSelectedIds((prevSelectedIds) => updateSelectedIds(prevSelectedIds, id, isChecked, isMultiUpload));
  };

  const handleClickMaterialTabItem = (
    item: SmartFolderItemResult | AiSmartFolderItemResult,
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (item.fileType === 'FOLDER') {
      setSelectedIds([]);
      setCurrentSelectedIds([]);
      setSmartFolderApiType(item.smartFolderApiType);
      setParentSmartFolderId(item.id.toString());
    } else {
      onEditToggle(item.id, event);
    }
  };

  const currentItems: (SmartFolderItemResult | AiSmartFolderItemResult)[] = useMemo(() => {
    return focusIdx === 0 ? currentRecommendData : currentFileData;
  }, [currentFileData, currentRecommendData, focusIdx]);

  // 추천자료탭 > 초상권 해결 버튼 활성화 조건. (이미지만 선택 가능)
  const isAllImage = useMemo(() => {
    return selectedIds.length > 0
      ? selectedIds.every((id) => {
          const fileName = currentItems?.find((item) => item.id === id)?.name;
          if (!fileName) return false;
          return EXTENSIONS.IMAGE.includes(getFileExtension(fileName)!.toLowerCase());
        })
      : false;
  }, [currentItems, selectedIds]);

  const handleConfirm = useCallback(() => {
    // return;
    if (setItemData) {
      if (!hasSelectedIds) {
        showAlert({ message: '자료를 선택 해주세요.' });
        return;
      }

      // 확장자 필터링
      const validateFiles = selectedIds.every((id) => {
        const file = currentItems?.find((item: SmartFolderItemResult | AiSmartFolderItemResult) => item.id === id);
        return file && allowsFileTypes?.includes(file.fileType); // item이 undefined가 아니면 fileType을 체크
      });

      if (!validateFiles) {
        showAlert({ message: '확장자 확인 후 업로드 해주세요.' });
        return;
      }

      if (validateFiles) {
        const selectedItems: (SmartFolderItemResult | AiSmartFolderItemResult)[] = selectedIds.map((id) =>
          currentItems?.find((item: SmartFolderItemResult | AiSmartFolderItemResult) => item.id === id),
        ) as SmartFolderItemResult[];
        setItemData(selectedItems as SmartFolderItemResult[]);

        // 자료 업로드 완료 함수 호출.
        if (selectedItems.length > 0) onConfirm?.(selectedItems as SmartFolderItemResult[]);
        else showAlert({ message: '업로드에 실패했습니다.' });
      }
    }
  }, [allowsFileTypes, currentItems, hasSelectedIds, onConfirm, selectedIds, setItemData, showAlert]);

  const initTree: IBreadcrumbItem[] = useMemo(() => {
    if (focusIdx === 1) {
      return isInPublicFolder ? [...MATERIAL_BREADCRUMB, ...PUBLIC_BREADCRUMB] : MATERIAL_BREADCRUMB;
    }
    return [];
  }, [focusIdx, isInPublicFolder]);

  // 브레드크럼 생성
  const breadcrumbs: IBreadcrumbItem[] = useMakeBreadcrumbs({
    pathTree,
    initTree,
  });

  const handleNavigate = (item: IBreadcrumbItem) => {
    setSelectedIds([]);
    setCurrentSelectedIds([]);
    setSmartFolderApiType(item.smartFolderApiType!);
    if (item.id) setParentSmartFolderId(item.id.toString());
    else setParentSmartFolderId(null);
  };

  const isConfirm = useMemo(() => {
    if (focusIdx === 0) return recommendItems?.length < 1 ? undefined : handleConfirm;
    if (focusIdx === 1) return fileItems?.length < 1 ? undefined : handleConfirm;
    return undefined;
  }, [fileItems?.length, focusIdx, handleConfirm, recommendItems?.length]);

  const [isPhotoAiFaceModalOpen, setIsPhotoAiFaceModalOpen] = useState(false);

  /** 초상권 해결 */
  /* 초상권 해결 모달 열기 */
  const handleOpenPhotoAiFaceModal = () => {
    setIsPhotoAiFaceModalOpen(true);
  };

  /* 초상권 해결 모달 닫기 */
  const handleClosePhotoAiFaceModal = () => {
    setIsPhotoAiFaceModalOpen(false);
  };

  const { mutateAsync: blurFaces } = useBlurFaces();
  const { mutateAsync: maskingFaces } = useMaskingFaces();

  const applyPhotoAiResult = (
    selectedDriveItems: SmartFolderItemResult[],
    resultItems: AiSmartFolderItemResult[] | undefined,
  ) => {
    if (!resultItems || resultItems.length === 0) {
      setLoading(false);
      showAlert({ message: '초상권 해결에 실패했습니다.<br/> [ code : ai ]' });
      return false;
    }

    const updatedItems: AiSmartFolderItemResult[] = currentItems.map((item) => {
      const matchedIndex = selectedDriveItems.findIndex(
        (selectedItem: SmartFolderItemResult) => item.id === selectedItem.id,
      );
      const matchedItem = resultItems[matchedIndex];
      return (matchedItem ?? item) as AiSmartFolderItemResult;
    });

    setCurrentFileData(updatedItems);
    setSelectedIds([]); // 기존 선택 id 제거
    setCurrentSelectedIds([]);

    addToast({ message: '초상권 해결이 완료되었습니다.' });
    setLoading(false);
    return true;
  };

  const handleConfirmPhotoAiFace = async (selectedOption: string) => {
    setLoading(true);

    try {
      const selectedDriveItems =
        (selectedIds.map((id) => currentItems.find((item) => item.id === id)) as SmartFolderItemResult[]) ?? [];
      const selectedDriveItemKeys: string[] = selectedDriveItems.map((item) => item?.driveItemKey ?? '');

      if (selectedOption === 'blurEffect') {
        const blurRequest: AiBlurReqeust = {
          profileId: userInfo?.id ?? 0,
          driveItemKeys: selectedDriveItemKeys,
          threshold: null,
          responseWithFolder: false,
        };

        const { result } = await blurFaces({ data: blurRequest });
        const successApplyBlur = applyPhotoAiResult(selectedDriveItems, result);
        return;
      }

      if (selectedOption === 'sticker') {
        const stickerRequest: AIMaskingReqeust = {
          profileId: userInfo?.id ?? 0,
          driveItemKeys: selectedDriveItemKeys,
          maskSize: 0.9,
          maskType: 'C',
          responseWithFolder: false,
        };

        const { result } = await maskingFaces({ data: stickerRequest });
        const successApplyMasking = applyPhotoAiResult(selectedDriveItems, result);
        return;
      }

      if (selectedOption === 'faceReplace') {
        showAlert({ message: '얼굴 교체 기능 준비 중입니다.' });
      }
    } catch (error) {
      showAlert({ message: '초상권 해결에 실패했습니다.<br/> [ code : ai ]' });
    } finally {
      setLoading(false);
    }
  };

  // 마이 보드 > 초상권 해결 버튼
  const renderPhotoAiFace = () => {
    if (currentPath.includes('my-board')) {
      return (
        <Button color="line" size="small" disabled={!isAllImage} onClick={handleOpenPhotoAiFaceModal}>
          초상권 해결
        </Button>
      );
    }
    return null;
  };
  /** 초상권 해결 끝 */

  // 모달 오픈 시 setItemData 초기화
  useEffect(() => {
    if (isOpen && setItemData) setItemData([]);
  }, [isOpen, setItemData]);

  /** 드롭 다운 */
  const [openDropDown, setOpenDropDown] = useState(false);

  // 내 컴퓨터 선택 창 열림
  const clickFileInput = () => {
    const inputSelector = document.getElementById(`inputFile_${inputFileId}`);
    inputSelector?.click();
  };

  /** 내 컴퓨터 onClick 이벤트 */
  const myPcOnClick = () => {
    if (isFolderUpload) {
      setOpenDropDown((prev) => !prev);
      return;
    }
    clickFileInput();
  };

  const dropDownMenu: IDropDownMenu['list'] = [
    {
      key: 'fileUpload',
      text: '파일 업로드',
      action: () => {
        setFolderUploadMode(false);
        setTimeout(() => {
          clickFileInput();
        }, 50);
      },
    },
    {
      key: 'folderUpload',
      text: '폴더 업로드',
      action: () => {
        setFolderUploadMode(true);
        setTimeout(() => {
          clickFileInput();
        }, 50);
      },
    },
  ];

  /** 드래그 셀렉트 */
  const [modalContainer, setModalContainer] = useState<Element | null>(null);
  const [listContainer, setListContainer] = useState<Element | null>(null);

  const recommendListRef = useRef<HTMLUListElement>(null);
  const materialListRef = useRef<HTMLUListElement>(null);

  /** 스크롤 컨테이너 영역 지정 */
  useEffect(() => {
    const modalContainerElem = document.querySelector('.modal-body');
    if (modalContainerElem) setModalContainer(modalContainerElem);
  }, []);

  useEffect(() => {
    if (focusIdx === 0) {
      setListContainer(recommendListRef.current);
      return;
    }

    if (focusIdx === 1) {
      setListContainer(materialListRef.current);
    }
  }, [focusIdx, recommendIsLoading, itemIsLoading, currentRecommendData, currentFileData]);

  /* 드래그 관련 콜백 함수 & 옵션 */
  const scrollOptions = useMemo((): SelectoProps['scrollOptions'] | undefined => {
    return {
      container: listContainer as HTMLElement,
      threshold: 10,
      throttleTime: 10,
      useScroll: false,
      requestScroll: ({ container, direction }: { container: HTMLElement; direction: number[] }) => {
        // eslint-disable-next-line no-param-reassign
        if (container) container.scrollTop += direction[1] * 10;
      },
      checkScrollEvent: true,
    };
  }, [listContainer]);

  /* 선택된 아이템 처리 */
  const handleSelect = (e: any) => {
    const selected = e.selected
      .filter((el: any) => el.dataset.fileType !== 'FOLDER')
      .map((el: any) => Number(el.dataset.id));

    if (selected && selected.length > 0) {
      const updated = Array.from(new Set([...currentSelectedIds, ...selected]));
      setSelectedIds(updated);
    } else {
      setSelectedIds([...currentSelectedIds]);
    }
  };

  const handleSelectEnd = (e: any) => {
    setCurrentSelectedIds([...selectedIds]);
  };

  /* 현재 페이지 자료 전체 선택 */
  // const [allChecked, setAllChecked] = useState(false);
  // const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const { checked } = e.target;
  //
  //   if (checked) {
  //     if (focusIdx === 0) {
  //       setSelectedIds(currentRecommendData.filter((item) => item.fileType !== 'FOLDER')?.map((item) => item.id));
  //     }
  //     if (focusIdx === 1) {
  //       setSelectedIds(
  //         currentItems.filter((item) => item.fileType !== 'FOLDER')?.map((item: SmartFolderItemResult) => item.id),
  //       );
  //     }
  //   } else {
  //     setSelectedIds([]);
  //   }
  //   setAllChecked(checked);
  // };
  /** 드래그 셀렉트 끝 */

  return createPortal(
    <>
      <ModalBase
        isOpen={isOpen}
        size="large"
        message="업로드"
        cancelText="닫기"
        confirmText="적용"
        onCancel={onCancel}
        onConfirm={isConfirm}
        className="modal-upload"
      >
        <Tab
          focusIdx={focusIdx}
          items={UPLOAD_MODAL_TAB_LIST}
          onChange={handleTabClick}
          commonArea={
            <>
              <div
                className="btn btn-small btn-line btn-computer"
                // htmlFor={`inputFile_${inputFileId}`}
                style={{ cursor: 'pointer' }}
                role="button"
                tabIndex={0}
                onClick={myPcOnClick}
                onKeyDown={() => {}}
                onMouseLeave={() => openDropDown && setOpenDropDown(false)}
              >
                <span className={cx('ico-comm', `ico-computer-14`)} />내 컴퓨터
                <DropDownMenu show={openDropDown} list={dropDownMenu} />
              </div>
              <input
                id={`inputFile_${inputFileId}`}
                accept={acceptInput}
                type="file"
                style={{ display: 'none' }}
                multiple={isMultiUpload}
                onChange={handleFileChange}
                // 폴더 업로드 용 옵션
                {...(isFolderUploadMode
                  ? ({
                      webkitdirectory: '',
                    } as any)
                  : {})}
              />
            </>
          }
        >
          {/* 추천자료 탭 */}
          <div className="modal-drag-container">
            {recommendIsLoading && <Loader loadingMessage={null} />}
            {!recommendIsLoading &&
              (currentRecommendData && currentRecommendData.length > 0 ? (
                <>
                  {/* <Checkbox */}
                  {/*  name="modal_upload_all_select" */}
                  {/*  id="modal_upload_all_select" */}
                  {/*  label="전체 선택" */}
                  {/*  labHidden */}
                  {/*  onChange={handleSelectAll} */}
                  {/* /> */}
                  {renderPhotoAiFace()}
                  <ul className="list-thumbnail-grid" ref={recommendListRef}>
                    {currentRecommendData.map((item: SmartFolderItemResult) => (
                      <li key={item.id} data-id={item.id} data-file-type={item.fileType} className="upload-selectable">
                        <Thumbnail
                          width={172}
                          className="type-upload"
                          hover={item.fileType !== 'FOLDER'}
                          floating={isMultiUpload ? hasSelectedIds : selectedIds.includes(item.id)}
                          floatingType={FLOATING_BUTTON_TYPE.Default}
                          fileType={item.fileType}
                          fileName={item.name}
                          thumbUrl={item.thumbUrl ?? ''}
                          isThumbnailCheckbox
                          isEditActive={selectedIds.includes(item.id)}
                          onClick={(event) => onEditToggle(item.id, event)}
                          onEditToggle={(event) => onEditToggle(item.id, event)} // 개별 상태 토글 함수 전달
                          lecturePlan={item.lecturePlan as LecturePlanResult}
                          lecturePlanReport={item.lectureReport}
                          storyBoard={item.storyBoard}
                          visualClassName={item.fileType === 'LECTURE_PLAN' ? 'type-card' : undefined}
                        />
                      </li>
                    ))}
                    {recommendItemListFetchingNextPage && (
                      <li style={{ gridColumn: 'span 6' }}>
                        <Loader loadingMessage={null} />
                      </li>
                    )}
                    <div
                      ref={recommendLoadMoreRef}
                      style={{ height: '10px', background: 'transparent', gridColumn: 'span 6' }}
                    />
                  </ul>
                </>
              ) : (
                <div className="group-empty">
                  <div className="item-empty type3">
                    <span className="ico-comm ico-illust6" />
                    <strong className="tit-empty">추천된 자료가 없습니다.</strong>
                  </div>
                </div>
              ))}
            {}
          </div>
          {/* 추천자료 탭 끝 */}
          {/* 자료보드 탭 */}
          <div className="modal-drag-container">
            <div className="top-list">
              <BreadCrumb items={breadcrumbs} onNavigate={handleNavigate} />
              {/* <Checkbox */}
              {/*  name="modal_upload_all_select" */}
              {/*  id="modal_upload_all_select" */}
              {/*  label="전체 선택" */}
              {/*  labHidden */}
              {/*  onChange={handleSelectAll} */}
              {/* /> */}
              {renderPhotoAiFace()}
            </div>
            {itemIsLoading && <Loader loadingMessage={null} />}
            {!itemIsLoading &&
              (currentFileData && currentFileData.length > 0 ? (
                <ul className="list-thumbnail-grid" ref={materialListRef}>
                  {currentFileData.map((item: SmartFolderItemResult | AiSmartFolderItemResult) => (
                    <li
                      key={`upload_${item.name}_${item.id}_${item.driveItemCreatedAt}`}
                      data-id={item.id}
                      data-file-type={item.fileType}
                      className="upload-selectable"
                    >
                      <Thumbnail
                        width={172}
                        className="type-upload"
                        hover={item.fileType !== 'FOLDER'}
                        floating={
                          item.fileType !== 'FOLDER' && (isMultiUpload ? hasSelectedIds : selectedIds.includes(item.id))
                        }
                        floatingType={FLOATING_BUTTON_TYPE.Default}
                        fileType={item.fileType as SmartFolderItemResultFileType}
                        fileName={item.name}
                        thumbUrl={item.thumbUrl ?? item.driveItemResult?.thumbUrl ?? ''}
                        isEditActive={selectedIds.includes(item.id)}
                        isThumbnailCheckbox
                        onEditToggle={(event) => onEditToggle(item.id, event)} // 개별 상태 토글 함수 전달
                        onClick={(event) => handleClickMaterialTabItem(item, event)}
                        lecturePlan={item.lecturePlan as LecturePlanResult}
                        lecturePlanReport={item.lectureReport}
                        storyBoard={item.storyBoard}
                        visualClassName={item.fileType === 'LECTURE_PLAN' ? 'type-card' : undefined}
                        userEditable={item.userEditable}
                      />
                    </li>
                  ))}
                  {itemListFetchingNextPage && (
                    <li style={{ gridColumn: 'span 6' }}>
                      <Loader loadingMessage={null} />
                    </li>
                  )}
                  <div ref={loadMoreRef} style={{ height: '10px', background: 'transparent', gridColumn: 'span 6' }} />
                </ul>
              ) : (
                <div className="group-empty">
                  <div className="item-empty type3">
                    <span className="ico-comm ico-illust6" />
                    <strong className="tit-empty">자료가 없습니다.</strong>
                  </div>
                </div>
              ))}
          </div>
          {/* 자료보드 탭 끝 */}
        </Tab>
        {modalContainer && isMultiUpload && (
          <Selecto
            ref={selectoRef}
            container={modalContainer as HTMLElement}
            dragContainer={modalContainer}
            selectableTargets={['.upload-selectable']}
            toggleContinueSelect={['shift']}
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
      </ModalBase>
      {isLoading && <Loader hasOverlay loadingMessage={loadingMessage} />}
      {isUploading && <Loader hasOverlay loadingMessage={uploadingMessage} />}
      {isPhotoAiFaceModalOpen && (
        <PhotoAiFaceModal
          className=""
          isOpen={isPhotoAiFaceModalOpen}
          onConfirm={handleConfirmPhotoAiFace}
          onCancel={handleClosePhotoAiFaceModal}
        />
      )}
    </>,
    document.getElementById('modal-root') as HTMLElement,
  );
};

UploadModal.displayName = 'UploadModal';
