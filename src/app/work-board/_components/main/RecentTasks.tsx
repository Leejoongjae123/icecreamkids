'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import useUserStore from '@/hooks/store/useUserStore';
import { useGetRecentTasks } from '@/service/file/fileStore';
import { RecentTaskResult } from '@/service/file/schemas/recentTaskResult';
import { Loader } from '@/components/common';
import GroupRenderEmpty from '@/components/common/GroupRenderEmpty';
import RecentWorkThumbnail from '../recent-work-history/RecentWorkThumbnail';
import {
  Replacement,
  RecentTaskResultTaskTypeDetailLinkType,
  RecentTaskResultMaterialTaskType,
  RecentTaskResultAll,
  photoFolderTreeList,
} from '../../(protected)/recent-work-history/type';

interface RecentTasksProps {
  photoFolderTree?: photoFolderTreeList;
}

function RecentTasks({ photoFolderTree = {} }: RecentTasksProps) {
  const router = useRouter();
  const { userInfo } = useUserStore();
  // const { reactQueryFetching, setReactQueryFetching }

  // 최근 작업 히스토리 링크
  const recentWorkHistoryUrl = '/work-board/recent-work-history';

  // 최근 작업
  const myProfileId = userInfo?.id || 0;
  const profileId = myProfileId.toString();
  const handleRecentWorkHistoryMove = () => {
    if (!userInfo) {
      // 로그인 여부 확인
    }
    router.push(recentWorkHistoryUrl);
  };

  const [showRecentTask, setShowRecentTask] = useState<boolean>(false);
  const queryParams = useMemo(() => {
    return {
      profileId,
      taskType: RecentTaskResultAll, // type.ts에서 셋팅
      includes: 'driveItem',
      offsetWithLimit: '0,4',
    };
  }, [profileId]);

  const recentTasksResult = useGetRecentTasks(queryParams);
  const recentTasksData = recentTasksResult?.data;
  const recentTasksStatus = recentTasksResult?.status;

  const recentTaskList = useMemo(() => {
    return recentTasksData?.result?.filter((item, idx) => idx < 5);
  }, [recentTasksData]);

  useEffect(() => {
    if (recentTasksStatus !== 'pending') setShowRecentTask(true);
  }, [recentTasksStatus]);

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
          const targetId = photoFolderTree[taskType as keyof photoFolderTreeList];
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
    <div className="content-recent">
      <div className="inner-content">
        <h4 className="tit-content">최근 작업</h4>
        <button type="button" className="btn btn-small btn-line btn-history" onClick={handleRecentWorkHistoryMove}>
          <span className="ico-comm ico-history-14" />
          히스토리 보기
        </button>
        {/* {showRecentTask && (
          recentTaskList && recentTaskList.length > 0 ? (
          <ul className="list-thumbnail">
            {recentTaskList.map((task) => {
              return (
                <li key={task.driveItemKey}>
                  <RecentWorkThumbnail recentTask={task} onClickItem={handleClickItem} />
                </li>
              );
            })}
          </ul>
        ) : (
          <GroupRenderEmpty
            errorMessage="최근 작업이 없습니다.<br/>놀이계획을 만들어 시작해 보세요."
            icon="ico-illust6"
            txtClassName="align_center"
          />
        )
        )} */}
        {recentTaskList && recentTaskList.length > 0 ? (
          <ul className="list-thumbnail">
            {recentTaskList.map((task) => {
              return (
                <li key={task.driveItemKey}>
                  <RecentWorkThumbnail recentTask={task} onClickItem={handleClickItem} />
                </li>
              );
            })}
          </ul>
        ) : showRecentTask ? (
          <GroupRenderEmpty
            errorMessage="최근 작업이 없습니다."
            desc="놀이계획을 만들어 시작해 보세요."
            icon="ico-illust6"
            txtClassName="align_center"
          />
        ) : (
          <div className="align_center" style={{ minHeight: '64px', padding: '70px 0' }}>
            <Loader loadingMessage="최근 작업 목록을 조회 중입니다." />
          </div>
        )}
      </div>
    </div>
  );
}

export default RecentTasks;
