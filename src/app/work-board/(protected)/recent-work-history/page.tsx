'use client';

import React, { useMemo, useRef, useEffect, useState, Children } from 'react';
import { useRouter } from 'next/navigation';
import cx from 'clsx';
import { getRecentTasks, useGetPhotoFolderTree } from '@/service/file/fileStore';
import GroupRenderEmpty from '@/components/common/GroupRenderEmpty';
import { Loader, Select } from '@/components/common';
import { Table, IColumn } from '@/components/common/Table';
import AppLayout from '@/components/layout/AppLayout';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useQueryClient } from '@tanstack/react-query';
import { useInfiniteQueryWithLimit } from '@/utils/react-query';
import { getFlattenedData, validateUrlPattern } from '@/utils';
import {
  RecentTaskResult,
  SmartFolderTreeResult,
  SmartFolderTreeResultSmartFolderApiType,
} from '@/service/file/schemas';
import RecentWorkThumbnail from '../../_components/recent-work-history/RecentWorkThumbnail';
import {
  Replacement,
  RecentTaskResultTaskTypeDetailLinkType,
  RecentTaskResultMaterialTaskType,
  RecentTaskResultAll,
  RecentTaskResultTaskTypeList,
} from './type';

const LIMIT = 20;
function RecentWorkHistory() {
  // 무한 스크롤 사용 유무
  const hasInfiniteScrolling = false;
  const router = useRouter();
  const queryClient = useQueryClient();

  const [filterTaskType, setFilterTaskType] = useState<string>(RecentTaskResultAll);
  const [currentViewMode, setCurrentViewMode] = useState('grid');
  const [showRecentTask, setShowRecentTask] = useState<boolean>(false);

  // 자료 보드 메뉴 트리 조회
  const photoFolderTreeResult = useGetPhotoFolderTree();
  const photoFolderTreeData = photoFolderTreeResult?.data;
  const photoFolderTreeList = useMemo(() => {
    const smartFolder = photoFolderTreeData?.result?.[0];
    if (smartFolder && smartFolder.smartFolderApiType === SmartFolderTreeResultSmartFolderApiType.Photo) {
      const findSmartFolderTreeId = (
        arrayList: SmartFolderTreeResult | undefined,
        name: string = '',
        rootType: string[] = ['AI_IMAGE_TASK'],
      ) => {
        if (!name || !arrayList) return null;
        return arrayList?.subFolders?.find(
          (item: { name: string; rootType: string; userEditable: boolean } | null) =>
            item?.name === name && rootType.includes(item.rootType) && item.userEditable === false,
        )?.id;
      };
      const { subFolders } = smartFolder;
      const EDUCATIONAL_CLASS_STUDENT_PHOTO = subFolders?.find(
        (item) => item?.rootType === 'EDUCATIONAL_CLASS_STUDENT_PHOTO' && item?.userEditable === false,
      );
      const ACTIVITY_PHOTO = subFolders?.find(
        (item) => item?.rootType === 'ACTIVITY_PHOTO' && item?.userEditable === false,
      );
      const AI_IMAGE_TASK = subFolders?.find(
        (item) => item?.rootType === 'AI_IMAGE_TASK' && item?.userEditable === false,
      );
      return {
        STUDENT_CLASSIFICATION: EDUCATIONAL_CLASS_STUDENT_PHOTO?.id,
        ACTIVITY_CLASSIFICATION: ACTIVITY_PHOTO?.id,
        PHOTO_COMPOSITION: findSmartFolderTreeId(AI_IMAGE_TASK, RecentTaskResultTaskTypeList.PHOTO_COMPOSITION, [
          'AI_IMAGE_TASK',
        ]), // 사진 합성
        PRIVATE_DATA_ENCRYPTION: findSmartFolderTreeId(
          AI_IMAGE_TASK,
          RecentTaskResultTaskTypeList.PRIVATE_DATA_ENCRYPTION,
          ['AI_IMAGE_TASK'],
        ), // 초상권 보호
        PHOTO_ALBUM: findSmartFolderTreeId(AI_IMAGE_TASK, RecentTaskResultTaskTypeList.PHOTO_ALBUM, ['AI_IMAGE_TASK']), // 앨범 사진 정리
        SKETCH_CREATION: findSmartFolderTreeId(AI_IMAGE_TASK, RecentTaskResultTaskTypeList.SKETCH_CREATION, [
          'AI_IMAGE_SKETCH',
          'AI_IMAGE_TASK',
        ]), // 컬러링 동안 생성
      };
    }
    return {};
  }, [photoFolderTreeData]);

  // 최근 작업 api 호출
  const {
    data: publics,
    fetchNextPage: publicsNextPage,
    hasNextPage: publicsHasNext,
    isFetchingNextPage: publicsFetchingNextPage,
  } = useInfiniteQueryWithLimit({
    queryKey: ['publics', filterTaskType],
    queryFn: (pageParam) => {
      return getRecentTasks({
        taskType: filterTaskType,
        includes: 'driveItem',
        offsetWithLimit: `${pageParam},${LIMIT}`,
      });
    },
    limit: LIMIT,
    enabled: true,
  });

  const fileList = useMemo(() => {
    const flattened = getFlattenedData(publics?.pages ?? undefined);
    return flattened.map((history, index) => {
      const id = 'id' in history ? history.id : `${history.driveItemId}_${index}`;
      const driveItem = history?.driveItem;
      const studentRecord = history?.studentRecord;
      const name = driveItem?.name;
      const fileType = driveItem?.fileType;
      const type = driveItem?.type;
      let thumbUrl = studentRecord && studentRecord.thumbUrl;
      if (!thumbUrl) thumbUrl = '';
      const thumbail = thumbUrl.charAt(0) === '/' || validateUrlPattern(thumbUrl) ? thumbUrl : '';
      return { name, fileType, type, thumbUrl: thumbail, ...history, id };
    });
  }, [publics]);

  useEffect(() => {
    if (publics) setShowRecentTask(true);
    else setShowRecentTask(false);
  }, [publics]);

  const hasFileList = useMemo(() => {
    if (fileList && Array.isArray(fileList)) return fileList.length > 0;
    return false;
  }, [fileList]);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef<() => void>(() => {}); // 데이터의 최신 상태 유지하기 위해 ref 생성
  useEffect(() => {
    callbackRef.current = () => {
      if (publicsHasNext && !publicsFetchingNextPage) {
        publicsNextPage();
      }
    };
  }, [publicsHasNext, publicsNextPage, publicsFetchingNextPage]);

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
  ];

  const handleToggleView = () => {
    setCurrentViewMode(currentViewMode === 'grid' ? 'list' : 'grid');
  };

  // 상단 작업 타입 필터
  const handleChangeFilter = async (value: string) => {
    // next-query cache 초기화
    const queryKey01: any = ['publics', filterTaskType];
    queryClient.removeQueries(queryKey01);
    await setFilterTaskType(value);
    const queryKey02: any = ['publics', filterTaskType];
    queryClient.invalidateQueries(queryKey02);
  };

  const taskTypeFilterList = [
    { text: '전체보기', value: RecentTaskResultAll },
    { text: '놀이계획', value: 'LECTURE_PLAN' },
    { text: '놀이보고서', value: 'LECTURE_PLAN_REPORT' },
    { text: '아이관찰기록', value: 'STUDENT_RECORD' },
    { text: '스토리 보드', value: 'STORY_BOARD' },
    { text: '아이 분류', value: 'STUDENT_CLASSIFICATION' },
    { text: '활동 분류', value: 'ACTIVITY_CLASSIFICATION' },
    { text: '아이합성', value: 'PHOTO_COMPOSITION' },
    { text: '초상권보호', value: 'PRIVATE_DATA_ENCRYPTION' },
  ];
  const taskTypeSelect = () => {
    return (
      <Select
        className="w-120"
        size="small"
        options={taskTypeFilterList}
        value={filterTaskType}
        placeholder="옵션을 선택하세요."
        onChange={(value) => handleChangeFilter(value as string)}
      />
    );
  };

  const handleClickItem = (item: RecentTaskResult) => {
    const { taskType, taskItemId, studentRecord, smartFolderApiType, smartFolderId } = item;
    const taskLink = RecentTaskResultTaskTypeDetailLinkType[taskType as RecentTaskResultTaskTypeDetailLinkType];
    const typeStudentRecord =
      RecentTaskResultTaskTypeDetailLinkType['STUDENT_RECORD' as RecentTaskResultTaskTypeDetailLinkType];
    if (taskLink) {
      const replacementItems: Replacement[] = [];
      const replaceString = (input: string, rules: Replacement[]) => {
        return rules.reduce((result, rule) => {
          return result.replace(new RegExp(rule.key, 'g'), rule.value);
        }, input);
      };
      if (RecentTaskResultMaterialTaskType.includes(taskType)) {
        if (smartFolderApiType === 'Photo' && smartFolderId) {
          replacementItems.push({ key: '{taskItemId}', value: `${smartFolderId}` } as Replacement);
        } else {
          const targetId = photoFolderTreeList[taskType as keyof typeof photoFolderTreeList];
          if (targetId) replacementItems.push({ key: '{taskItemId}', value: `${targetId}` } as Replacement);
        }
      } else {
        replacementItems.push({ key: '{taskItemId}', value: `${taskItemId}` } as Replacement);
        if (taskLink === typeStudentRecord) {
          replacementItems.push({
            key: '{educationalClassId}',
            value: `${studentRecord?.educationalClassId}`,
          } as Replacement);
          replacementItems.push({ key: '{studentId}', value: `${studentRecord?.studentId}` } as Replacement);
        }
      }
      const pathUrl = replaceString(taskLink, replacementItems);
      router.push(pathUrl);
    }
  };

  return (
    <AppLayout>
      <div className="inner-content">
        <h3 className="title-content">최근 작업 히스토리</h3>
        <div className="filter-content">
          <button
            type="button"
            className={cx('btn-view-list', { active: currentViewMode === 'list' })}
            onClick={handleToggleView}
          >
            <span className="ico-comm ico-list-20">리스트형</span>
          </button>
          <button
            type="button"
            className={cx('btn-view-grid', { active: currentViewMode === 'grid' })}
            onClick={handleToggleView}
          >
            <span className="ico-comm ico-grid-20">그리드형</span>
          </button>
          {taskTypeSelect()}
        </div>
        <div className="body-content" style={{ ...(!hasFileList && { padding: '50px 0' }) }}>
          {hasFileList &&
            (currentViewMode === 'grid' ? (
              <ul className="list-thumbnail">
                {fileList &&
                  Children.toArray(
                    fileList.map((item) => (
                      <li>
                        <RecentWorkThumbnail recentTask={item} onClickItem={handleClickItem} />
                      </li>
                    )),
                  )}
              </ul>
            ) : (
              <Table columns={TABLE_COLUMNS} data={fileList} onClickItem={handleClickItem} />
            ))}
          {!hasFileList &&
            (showRecentTask ? (
              <GroupRenderEmpty
                errorMessage="최근 작업이 없습니다."
                desc="놀이계획을 만들어 시작해 보세요."
                icon="ico-illust6"
                txtClassName="align_center"
              />
            ) : (
              <div className="align_center" style={{ minHeight: '64px', padding: '70px 0' }}>
                <Loader loadingMessage="최근 작업 히스토리를 조회 중입니다." />
              </div>
            ))}
        </div>
      </div>
      {/* 무한 스크롤 감지 div */}
      {!hasInfiniteScrolling && <div ref={loadMoreRef} style={{ height: '10px', background: 'transparent' }} />}
    </AppLayout>
  );
}

export default RecentWorkHistory;
