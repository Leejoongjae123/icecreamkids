'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  SmartFolderItemResult,
  SmartFolderTreeResult,
  SmartFolderTreeResultSmartFolderApiType,
  StorageUsageResult,
} from '@/service/file/schemas';
import cx from 'clsx';
import { Button } from '@/components/common';
import { useGetByProfileId, useGetFolderTreeFromRoot, useScanMyFolders } from '@/service/file/fileStore';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { prefix } from '@/const';
import { useFolderStore } from '@/hooks/store/useFolderStore';
import { getSmartFolderPath } from '@/const/smartFolderApiType';
import { UploadModal } from '@/components/modal';
import { useQueryClient } from '@tanstack/react-query';
import { useHandleFile } from '@/hooks/useHandleFile';
import useUserStore from '@/hooks/store/useUserStore';
import { formatFileSize, hasReactQueryCompleted, isRecommendTaskType } from '@/utils';
import { TSlugType } from '@/app/(auth)/material-board/[...slug]/types';
import { tokenManager } from '@/utils/tokenManager';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import { useToast } from '@/hooks/store/useToastStore';
import { SmartFolderSlugType, MyFolderSlugType } from './types';

const BOARD_WIDTH = 1; // 구분선 넓이
const MIN_WIDTH = 240 - BOARD_WIDTH; // 최소 GNB 너비
const MAX_WIDTH = 600; // 최대 GNB 너비

export function MaterialBoardGnb() {
  const { data: myFolderList, status: myFolderStatus } = useScanMyFolders();
  const { data: smartFolderList, status: smartFolderStatus } = useGetFolderTreeFromRoot();

  const { setFolderList, folderList } = useFolderStore();
  const { handleSave } = useHandleFile();
  const { userInfo } = useUserStore();
  const { showAlert } = useAlertStore();
  const addToast = useToast((state) => state.add);
  const { data: storageUsage } = useGetByProfileId(String(userInfo?.id ?? 0));
  const params = useParams();

  const queryClient = useQueryClient();

  const stored = sessionStorage.getItem('activeFolder');
  const activeFolder: SmartFolderTreeResult = stored ? JSON.parse(stored) : null;

  const myFolders = useMemo(() => {
    if (!myFolderList?.result) return [];

    const folders = [...myFolderList.result];
    // TODO: 기획이 일치하지 않아 (스마트 폴더는 시스템 폴더가 뒤로, 내 폴더는 앞으로 우선 임시로 프론트에서 처리)
    if (folders[0]?.subFolders?.length) {
      folders[0].subFolders = [...folders[0].subFolders].sort((a, b) => {
        return Number(a?.userEditable) - Number(b?.userEditable);
      });
    }

    return folders;
  }, [myFolderList]);

  const storage: StorageUsageResult = useMemo(() => {
    if (!storageUsage?.result) {
      return {
        accountId: 0,
        count: 0,
        size: 0,
        sizeAssigned: 0,
      };
    }

    return storageUsage.result;
  }, [storageUsage]);

  const smartFolders = useMemo(() => {
    const smartFolderData: SmartFolderTreeResult & { isStatic?: boolean; path?: string } = {
      id: 0,
      smartFolderApiType: 'Drive',
      rootType: 'NONE',
      parentSmartFolderItemId: 0,
      driveItemKey: '',
      depth: 0,
      name: '스마트 폴더',
      userEditable: false,
      isStatic: true,
      path: `${prefix.materialBoard}#smart-folder`,
    };

    if (!smartFolderList?.result) return [];
    /** 200 시 무조건 하위 폴더가 있기에 해당 상황 가정하고 진행 */
    const increaseDepth = (folders: SmartFolderTreeResult[]): SmartFolderTreeResult[] =>
      folders.map((folder) => {
        const { subFolders, ...folderWithOutSubFolder } = folder as SmartFolderTreeResult & {
          subFolders?: SmartFolderTreeResult[];
        };

        const updatedFolder: SmartFolderTreeResult & { isStatic?: boolean; path?: string } = {
          ...folderWithOutSubFolder,
          depth: folderWithOutSubFolder.depth + 1,
        };

        if (subFolders && subFolders.length > 0) {
          updatedFolder.subFolders = increaseDepth(subFolders);
        }

        return updatedFolder;
      });

    const subFolders = increaseDepth(smartFolderList.result);

    return subFolders.length > 0 ? [{ ...smartFolderData, subFolders }] : [];
  }, [smartFolderList]);

  const lnbItems = [
    { id: 'home', name: '자료보드', path: `${prefix.materialBoard}/`, isStatic: true, depth: 0 },
    ...smartFolders,
    ...myFolders,
    { id: 'public', name: '내 공개자료', path: `${prefix.materialBoard}/public`, isStatic: true, depth: 0 },
    { id: 'trash', name: '휴지통', path: `${prefix.materialBoard}/trash`, isStatic: true, depth: 0 },
  ];
  const router = useRouter();

  const pathname = usePathname(); // 현재 경로 가져오기
  const [activePath, setActivePath] = useState(pathname); // 활성화된 경로 상태 추가

  const [openSubMenuIdx, setOpenSubMenuIdx] = useState<string[]>([]);
  const [gnbWidth, setGnbWidth] = useState(MIN_WIDTH); // 기본 너비
  const isResizingRef = useRef(false);

  /** 업로드 모달 */
  const [itemData, setItemData] = useState<SmartFolderItemResult[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleOpenUploadModal = () => {
    if (Array.isArray(params.slug)) {
      setIsUploadModalOpen(true);
    }
  };
  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
  };
  const initCurrentAction = useCallback(async () => {
    setItemData([]);
    // 쿼리 재호출
    await queryClient.refetchQueries({
      queryKey: ['publics'],
      type: 'active', // 활성 상태인 쿼리만
    });
    // 쿼리 재호출
    await queryClient.refetchQueries({
      queryKey: ['itemLists'],
      type: 'active', // 활성 상태인 쿼리만
    });
  }, [queryClient]);

  const handleConfirmAction = useCallback(
    async (selectItemData: SmartFolderItemResult[]) => {
      if (selectItemData.length <= 0 && !activeFolder) return;
      handleSave(
        {
          ...selectItemData[0],
          smartFolderApiType: activeFolder?.smartFolderApiType as SmartFolderTreeResultSmartFolderApiType, // 들어갈 부모 폴더 타입
          id: activeFolder?.id as number, // 들어갈 부모 폴더 id
        },
        selectItemData.map((item) => item.driveItemKey),
      ).then(() => {
        addToast({ message: '업로드하였습니다.' });
        initCurrentAction();
      });
    },
    [activeFolder, addToast, handleSave, initCurrentAction],
  );

  const handleConfirmUploadModal = async (selectItemData?: SmartFolderItemResult[]) => {
    if (selectItemData) {
      handleConfirmAction(selectItemData);
    } else {
      initCurrentAction();
    }
    handleCloseUploadModal();
  };

  const findSmartFolderTreeIndexById = (
    array: SmartFolderTreeResult[],
    id: number,
    path: number[] = [],
  ): number[] | null => {
    for (let i = 0; i < array.length; i++) {
      if (array[i]?.id === id) {
        return [...path, i]; // 현재 객체의 인덱스 경로 반환
      }

      if ('subFolders' in array[i]! && Array.isArray(array[i]?.subFolders)) {
        const subFolderItems = array[i]?.subFolders;
        if (subFolderItems) {
          const subIndex = findSmartFolderTreeIndexById(subFolderItems, id, [...path, i]);
          if (subIndex) return subIndex;
        }
      }
    }
    return null; // 찾지 못한 경우
  };

  const findOpenSmartFolderSubMenuIdx = (smartFolderApiType: string, smartFolderId: number) => {
    if (smartFolderId > -1) {
      const rootIdx = lnbItems.findIndex((item) => {
        if ('smartFolderApiType' in item!) {
          return item.smartFolderApiType === smartFolderApiType;
        }
        return false;
      });

      if (rootIdx > -1) {
        const targetFolder = lnbItems[rootIdx];
        if ('subFolders' in targetFolder! && Array.isArray(targetFolder.subFolders)) {
          const openMuneIdxItems = findSmartFolderTreeIndexById(targetFolder.subFolders, smartFolderId);
          if (Array.isArray(openMuneIdxItems) && openMuneIdxItems.length > 0) {
            const openMuneIdx = [rootIdx, ...openMuneIdxItems];
            const numList = openMuneIdx.reduce((arr: string[], item: number) => {
              const id = arr.length > 0 ? arr[arr.length - 1] : '';
              if (!id) arr.push(item.toString());
              else arr.push(`${id}-${item}`);
              return arr;
            }, []);
            if (numList) {
              return numList.filter((idx: string) => !openSubMenuIdx.includes(idx));
            }
          }
        }
        if (targetFolder?.id === smartFolderId) {
          return [`${rootIdx}`];
        }
      }
    }
    return null;
  };

  const openSubMenuItem = () => {
    if (params && Object.keys(params).length > 0 && Array.isArray(params.slug)) {
      const slugType = params.slug[0];
      const smartFolderId: number = params.slug.length > 0 ? parseInt(params.slug[1], 10) : -1;
      const isSmartFolder = SmartFolderSlugType.includes(slugType);
      const isUserFolder = !isSmartFolder && MyFolderSlugType.includes(slugType);
      if (isSmartFolder || isUserFolder) {
        const targetType = isSmartFolder ? 'Drive' : 'UserFolder';
        if (targetType) {
          const addOpenSubMenuIdxList = findOpenSmartFolderSubMenuIdx(targetType, smartFolderId);
          if (addOpenSubMenuIdxList) {
            setOpenSubMenuIdx((prev) => [...prev, ...addOpenSubMenuIdxList]);
          }
        }
      }
    }
  };

  /** 자료보드 홈 > 스마트 폴더 섹션까지 스크롤 애니메이션 임의 주석 처리 합의 완료 시 제거 */
  // useEffect(() => {
  //   if (typeof window === 'undefined') return;

  //   const { hash } = window.location;
  //   if (hash === '#smart-folder') {
  //     const scrollToSection = () => {
  //       const section = document.getElementById('smartFolder');
  //       if (section) {
  //         section.scrollIntoView({ behavior: 'smooth' });
  //       } else {
  //         setTimeout(scrollToSection, 100); // 0.1초 후 재시도
  //       }
  //     };

  //     scrollToSection();
  //   }
  // }, []);

  useEffect(() => {
    setActivePath(pathname); // pathname 변경 시 즉시 반영
  }, [folderList, pathname]);

  useEffect(() => {
    // 해당 폴더 조회 성공 실패 상관없이 조회가 종료된 시점
    if (hasReactQueryCompleted(smartFolderStatus) && hasReactQueryCompleted(myFolderStatus)) openSubMenuItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [smartFolderStatus, myFolderStatus, pathname]); // parmas

  useEffect(() => {
    if (myFolders.length > 0) {
      setFolderList('myFolders', myFolders);
    }
    if (smartFolders.length > 0) {
      setFolderList('smartFolders', smartFolders);
    }
  }, [smartFolders, myFolders, setFolderList]);

  const toggleSubMenu = (indexPath: string) => {
    setOpenSubMenuIdx((prev) =>
      prev.includes(indexPath) ? prev.filter((idx) => idx !== indexPath) : [...prev, indexPath],
    );
  };

  const isActivePath = (currentPath: string, targetPath: string) => {
    if (targetPath === prefix.materialBoard || targetPath === `${prefix.materialBoard}/`) {
      return currentPath === prefix.materialBoard || currentPath === `${prefix.materialBoard}/`;
    }
    return currentPath.startsWith(targetPath);
  };
  const handleClickDrive = () => {
    // ISD 로그인 API 호출 후 응답값으로 받은 토큰을 파라미터로 넘겨주기
    // https://i-screamdrive.com/
    tokenManager.getToken().then((res) => {
      if (res) {
        const href = `${process.env.NEXT_PUBLIC_DRIVE_URL}?token=${res?.token}`;
        window.open(href, '_blank');
        return;
      }
      showAlert({ message: '로그인 하는 도중 오류가 발생했습니다.' });
    });
  };
  // 재귀적으로 메뉴를 렌더링하는 함수
  const renderMenu = (menu: SmartFolderTreeResult | (typeof lnbItems)[number], index: number, parentIndexPath = '') => {
    const hasSubMenu = 'subFolders' in menu! && menu.subFolders?.length;
    const currentIndexPath = `${parentIndexPath ? `${parentIndexPath}-` : ''}${index}`;

    const path =
      menu && 'isStatic' in menu
        ? `${menu.path}`
        : `${prefix.materialBoard}/${getSmartFolderPath[menu?.smartFolderApiType as keyof typeof getSmartFolderPath]}/${menu?.id}`;

    // icon 클래스 출력
    const iconClass = {
      home: 'ico-comm ico-snb-home',
      trash: 'ico-comm ico-snb-delete',
      default: 'ico-comm ico-snb-folder',
    } as const;

    const iconKey = ((menu?.id as string) in iconClass ? menu?.id : 'default') as keyof typeof iconClass;

    return (
      <li className={cx({ open: openSubMenuIdx.includes(currentIndexPath) })} key={menu?.id} role="presentation">
        <div
          className={cx('item-snb', {
            on: isActivePath(activePath, path),
            active: activePath === path, // activePath 상태를 사용하여 즉시 반영
          })}
          style={{ paddingLeft: `${(menu?.depth as number) * 14}px` }}
        >
          <button
            className="link-snb"
            onClick={() => {
              if (hasSubMenu) {
                toggleSubMenu(currentIndexPath);
              }
              // if (path === `${prefix.materialBoard}#smart-folder`) {
              //   openSubMenuItem();
              // }
              router.push(path);
            }}
            // disabled={path === `/404`} // 스마트 폴더 홈 비활성화 - 비활성화 주석 처리
          >
            <span className={iconClass[iconKey]} />
            {menu?.name}
          </button>
          {hasSubMenu && (
            <button
              className="btn-snb"
              onClick={() => {
                toggleSubMenu(currentIndexPath);
              }}
            >
              <span className="ico-comm ico-snb-arrow-down">폴더 펼침/접힘</span>
            </button>
          )}
        </div>
        {hasSubMenu &&
          openSubMenuIdx.includes(currentIndexPath) &&
          menu.depth < 10 && ( // 최대 depth 제한
            <div className="submenu-snb">
              <ul className={`list-submenu depth${menu.depth}`}>
                {menu.subFolders!.map((subMenu, subIndex) => renderMenu(subMenu, subIndex, currentIndexPath))}
              </ul>
            </div>
          )}
      </li>
    );
  };

  // 드래그 중 (너비 변경)
  const handleMouseMove = (event: MouseEvent) => {
    if (isResizingRef.current) {
      let newWidth = event.clientX; // 마우스 위치 기준 너비 조정
      if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
      if (newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;
      setGnbWidth(newWidth);
    }
  };

  // 드래그 종료
  const handleMouseUp = () => {
    isResizingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  // 드래그 시작
  const handleMouseDown = () => {
    isResizingRef.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const uploadDisabled = () => {
    const { slug } = params;
    if (!slug) {
      return true;
    }
    const category: TSlugType = slug[0] as TSlugType;
    if (!activeFolder) {
      return false;
    }

    if (category === 'public' || category === 'trash' || category === 'search') {
      return true;
    }
    if (category === 'photo' || category === 'docs') {
      if (activeFolder.rootType === 'NONE' || activeFolder.rootType === 'EDUCATIONAL_CLASS_TOTAL_PHOTO') {
        return true;
      }
      if (
        activeFolder.rootType === 'STORY_BOARD' ||
        activeFolder.rootType === 'LECTURE_PLAN' ||
        activeFolder.rootType === 'LECTURE_PLAN_REPORT'
      ) {
        return false;
      }

      // 우리반 아이사진
      // 활동 사진
      // 빠른 작업 사진등 모두 하위 폴더 부터 파일 업로드 가능
      if (activeFolder.depth < 3) {
        return true;
      }
      // 자료
      if (activeFolder.rootType === 'MONTHLY_DOCUMENT' && activeFolder.depth < 3) {
        return true;
      }
    }
    return false;
  };

  return (
    <>
      <section className="content-feature" style={{ width: gnbWidth }}>
        <div className="content-snb">
          <h2 className="screen_out">전체 메뉴</h2>
          <div className="wrap-upload">
            <Button
              color="black"
              className="btn-upload"
              icon="upload"
              disabled={uploadDisabled()}
              onClick={handleOpenUploadModal}
            >
              업로드
            </Button>
          </div>
          <ul className="list-snb">{lnbItems.map((menu, index) => renderMenu(menu, index))}</ul>
        </div>
        <div className="content-status">
          <span className="txt-status">
            <em className="screen_out">현재 사용량</em>
            <em className="status-current">{formatFileSize(storage.size)}</em>
            <span className="screen_out">총 저장 공간</span>
            <span className="status-total">&nbsp;/&nbsp;{formatFileSize(storage.sizeAssigned, 0)}</span>
            <span className="status-free">여유공간 {formatFileSize(storage.sizeAssigned - storage.size, 0)}</span>
          </span>
          <span className="status-bar">
            <span className="bar" style={{ width: `${storage.size / storage.sizeAssigned}%` }} />
          </span>
        </div>
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: BOARD_WIDTH,
            height: '100%',
            backgroundColor: '#f0f0f0',
            cursor: 'col-resize',
          }}
          role="presentation"
          onMouseDown={handleMouseDown}
        />
      </section>
      {isUploadModalOpen && (
        <UploadModal
          isOpen={isUploadModalOpen}
          onCancel={handleCloseUploadModal}
          onConfirm={handleConfirmUploadModal}
          setItemData={setItemData}
          taskType={isRecommendTaskType(activeFolder?.rootType ?? '')}
          isUploadS3
          targetSmartFolderApiType={activeFolder?.smartFolderApiType}
          targetFolderId={activeFolder?.id}
          isReturnS3UploadedItemData={false}
          isFolderUpload
        />
      )}
    </>
  );
}
