import { useMemo } from 'react';
import { SmartFolderTreeResult } from '@/service/file/schemas';
import { IBreadcrumbItem } from '@/components/common/Breadcrumb';

interface IUseMakeBreadcrumbs {
  pathTree: SmartFolderTreeResult[] | null;
  initTree?: IBreadcrumbItem[];
}

export const useMakeBreadcrumbs = ({ pathTree, initTree = [] }: IUseMakeBreadcrumbs): IBreadcrumbItem[] => {
  const makeBreadcrumbs = (targetPathTree: SmartFolderTreeResult[] | null): IBreadcrumbItem[] => {
    if (!targetPathTree) return [];

    const currenBreadCrumbs: IBreadcrumbItem[] = [];

    targetPathTree.forEach((tree: SmartFolderTreeResult) => {
      // 현재 폴더 추가
      currenBreadCrumbs.push({
        label: tree?.name as string,
        id: tree?.id.toString(),
        smartFolderApiType: tree?.smartFolderApiType,
        href: 'dummy', // 실제 링크로 수정 가능
      });
    });

    return currenBreadCrumbs;
  };

  return useMemo(() => {
    return [...initTree, ...makeBreadcrumbs(pathTree)];
  }, [pathTree, initTree]);
};
