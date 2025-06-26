import { useEffect, useMemo, useRef, useState } from 'react';
import { SmartFolderTreeResult } from '@/service/file/schemas';
import { useFolderStore } from '@/hooks/store/useFolderStore';
import { usePathname } from 'next/navigation';
import { getSmartFolderPath } from '@/const/smartFolderApiType';
import { SUBFOLDERS_REGAX } from '@/const/meterialBoard';

// 스마트 폴더의 하위 id와 내 폴더의 하위 id는 같을 수 있음 그래서 smartFolderApiType도 추가로 비교

export function useActiveFolderSync(photoHomeList: SmartFolderTreeResult[]) {
  const { folderList } = useFolderStore();
  const pathname = usePathname();
  const [activeFolder, setActiveFolder] = useState<SmartFolderTreeResult | null>(null);
  const photoHomeListRef = useRef(photoHomeList);

  // 폴더 탐색을 빠르게 하기 위해 Map 사용
  const folderMap = useMemo(() => {
    const map = new Map<string, SmartFolderTreeResult>();

    const addToMap = (folders: SmartFolderTreeResult[]) => {
      folders.forEach((folder) => {
        const key = `${getSmartFolderPath[folder?.smartFolderApiType as keyof typeof getSmartFolderPath]}_${folder?.id}`;
        map.set(key, folder);
        if (folder?.subFolders) addToMap(folder.subFolders);
      });
    };

    addToMap(folderList.myFolders);
    addToMap(folderList.smartFolders);

    return map;
  }, [folderList]);

  // pathname 변경될 때 activeFolder 설정
  useEffect(() => {
    const folderMatch = pathname.match(SUBFOLDERS_REGAX);

    if (!folderMatch) return;

    const [, folderType, folderId] = folderMatch;

    const folderKey = `${folderType}_${folderId}`;

    const matchedFolder = folderMap.get(folderKey) || null;

    if (matchedFolder) {
      sessionStorage.setItem('activeFolder', JSON.stringify(matchedFolder));
      setActiveFolder(matchedFolder); // 상태 업데이트
    }
    if (!matchedFolder && photoHomeListRef.current) {
      const classTotalFolder = photoHomeListRef.current.find(
        (photoFolder) =>
          photoFolder?.rootType === 'EDUCATIONAL_CLASS_TOTAL_PHOTO' && photoFolder.smartFolderApiType === 'Photo',
      );

      if (classTotalFolder) {
        sessionStorage.setItem('activeFolder', JSON.stringify(classTotalFolder));
        setActiveFolder(classTotalFolder);
      }
    }
  }, [pathname, folderMap]);

  // sessionStorage에서 가져오기
  useEffect(() => {
    const folderMatch = pathname.match(SUBFOLDERS_REGAX);

    if (!folderMatch) return;

    const [, folderType, folderId] = folderMatch;

    const folderKey = `${folderType}_${folderId}`;

    const storedFolder = sessionStorage.getItem('activeFolder');
    const parsedFolder = storedFolder ? JSON.parse(storedFolder || '') : null;
    if (parsedFolder) {
      const parsedFolderKey = `${getSmartFolderPath[parsedFolder.smartFolderApiType as keyof typeof getSmartFolderPath]}_${parsedFolder.id}`;
      if (folderKey === parsedFolderKey) {
        setActiveFolder(parsedFolder);
      }
      if (folderKey !== parsedFolderKey) {
        const classTotal = photoHomeListRef.current.find(
          (photoItem) =>
            photoItem?.smartFolderApiType === 'Photo' && photoItem.rootType === 'EDUCATIONAL_CLASS_TOTAL_PHOTO',
        );
        const photoRootData: SmartFolderTreeResult = {
          id: classTotal?.id ?? 0,
          smartFolderApiType: classTotal?.smartFolderApiType ?? 'Photo',
          rootType: classTotal?.rootType ?? 'EDUCATIONAL_CLASS_TOTAL_PHOTO',
          parentSmartFolderItemId: classTotal?.parentSmartFolderItemId ?? 0,
          driveItemKey: classTotal?.driveItemKey ?? '',
          depth: classTotal?.depth ?? 0,
          name: classTotal?.name ?? '우리반 전체 사진',
          userEditable: classTotal?.userEditable ?? false,
        };
        setActiveFolder(photoRootData);
      }
    }
    if (storedFolder) {
      setActiveFolder(JSON.parse(storedFolder));
    }
  }, [pathname]);

  return { activeFolder };
}
