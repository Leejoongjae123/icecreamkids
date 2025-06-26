'use client';

import React, { useState } from 'react';
import { SmartFolderItemResultFileType } from '@/service/file/schemas';
import { RecentTaskResult } from '@/service/file/schemas/recentTaskResult';
import { Thumbnail } from '@/components/common';
import { validateUrlPattern } from '@/utils';
import { RecentTaskTypes } from './types';
import { RecentTaskResultMaterialTaskType } from '../../(protected)/recent-work-history/type';

interface RecentWorkThumbnailProps {
  recentTask: RecentTaskResult | any;
  onClickItem?: (item: RecentTaskResult | any) => void; // 클릭 이벤트
}

function RecentWorkThumbnail({ recentTask, onClickItem }: RecentWorkThumbnailProps) {
  const [openDropDown, setOpenDropDown] = useState<boolean>(false);
  // 드롭다운 옵션
  const dropDownMenuOptions = {
    list: [
      {
        key: 'share',
        text: '공유 관리',
        action: () => {
          console.log('공유 관리');
        },
      },
      {
        key: 'tag',
        text: '태그 관리',
        action: () => {
          console.log('태그 관리');
        },
      },
      {
        key: 'change',
        text: '이름 변경',
        action: () => {
          console.log('이름 변경');
        },
      },
      {
        key: 'delete',
        text: '삭제',
        action: () => {
          console.log('삭제');
        },
      },
      {
        key: 'save',
        text: '저장',
        action: () => {
          console.log('저장');
        },
      },
    ],
  };

  const { taskType, createdAt, driveItem, lecturePlan, lectureReport, studentRecord, storyBoard } = recentTask;

  function getTaskTypeItem() {
    if (taskType === SmartFolderItemResultFileType.LECTURE_PLAN) return lecturePlan;
    if (taskType === SmartFolderItemResultFileType.LECTURE_PLAN_REPORT) return lectureReport;
    if (taskType === SmartFolderItemResultFileType.STUDENT_RECORD) return studentRecord;
    if (taskType === SmartFolderItemResultFileType.STORY_BOARD) return storyBoard;
    return null;
  }

  function getTaskTypeItemHead() {
    if (driveItem?.name) {
      return driveItem.name;
    }
    if (taskType === SmartFolderItemResultFileType.LECTURE_PLAN) {
      return lecturePlan?.subject ? lecturePlan.subject : '';
    }
    if (taskType === SmartFolderItemResultFileType.LECTURE_PLAN_REPORT) {
      return lectureReport?.subject ? lectureReport.subject : '';
    }
    if (taskType === SmartFolderItemResultFileType.STUDENT_RECORD) {
      return studentRecord?.teacherComment ? studentRecord.teacherComment : '';
    }
    return '';
  }

  function getTaskTypeItemFilename() {
    if (driveItem?.name) {
      return driveItem.name;
    }
    if (taskType === SmartFolderItemResultFileType.LECTURE_PLAN) {
      return lecturePlan?.activityNames ? lecturePlan.activityNames : '';
    }
    if (taskType === SmartFolderItemResultFileType.LECTURE_PLAN_REPORT) {
      return lectureReport?.learningPoint ? lectureReport.learningPoint : '';
    }
    if (taskType === SmartFolderItemResultFileType.STUDENT_RECORD) {
      return studentRecord?.teacherComment ? studentRecord.teacherComment : '';
    }
    return '';
  }

  function getTaskFileType() {
    // if (driveItem?.fileType) {
    //   if (RecentTaskResultMaterialTaskType.includes(driveItem?.fileType)) {
    //     if (driveItem.type === 'FOLDER') return driveItem.type;
    //   }
    //   return driveItem.fileType;
    // }
    if (taskType) return taskType;
    return SmartFolderItemResultFileType[taskType as keyof typeof SmartFolderItemResultFileType];
  }

  function getTaskThumbnailUrl() {
    let retThumbnailUrl: string = '';
    if (recentTask.thumbUrl) return recentTask.thumbUrl;
    const taskTypeItem = getTaskTypeItem();
    if (taskTypeItem && 'thumbUrl' in taskTypeItem) retThumbnailUrl = taskTypeItem.thumbUrl as string;
    if (!retThumbnailUrl) {
      if (driveItem && 'thumbUrl' in driveItem) retThumbnailUrl = driveItem.thumbUrl as string;
    }
    return retThumbnailUrl.charAt(0) === '/' || validateUrlPattern(retThumbnailUrl) ? retThumbnailUrl : '';
  }
  // const recentWorkData = getTaskTypeItem();
  const { tag, name } = (taskType && RecentTaskTypes[taskType as keyof typeof RecentTaskTypes]) || {
    tag: undefined,
    name: '',
  };

  const tagItem = tag ? { type: tag, text: name } : undefined;
  const fileType = getTaskFileType();
  const head = getTaskTypeItemHead();
  const filename = getTaskTypeItemFilename();
  const thumbnailUrl = getTaskThumbnailUrl();

  const handlerThumbnailClick = () => {
    onClickItem?.(recentTask);
  };

  const handlerFavoriteClick = () => {
    console.log('즐겨 찾기');
  };

  const onDropDown = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setOpenDropDown((prev) => !prev);
  };

  // 스토리 보드, 사진 분류의 경우 폴더 타입 형태
  const FOLDER_TYPE = [
    'STORY_BOARD',
    'STUDENT_CLASSIFICATION',
    'ACTIVITY_CLASSIFICATION',
    'PHOTO_COMPOSITION',
    'PRIVATE_DATA_ENCRYPTION',
  ].includes(fileType);

  return (
    <Thumbnail
      hover
      className="type-work"
      floatingType="none"
      head={FOLDER_TYPE ? undefined : head}
      fileName={filename}
      fileType={fileType}
      tag={tagItem}
      thumbUrl={thumbnailUrl}
      date={createdAt}
      favoriteHide
      dropDownHide
      // dropDown={openDropDown}
      // dropDownMenu={dropDownMenuOptions}
      onDropDown={(event) => onDropDown(event)}
      onClick={handlerThumbnailClick}
      onFavorite={handlerFavoriteClick}
      visualClassName={FOLDER_TYPE ? 'type-folder' : undefined}
      userEditable={!FOLDER_TYPE}
    />
  );
}

export default RecentWorkThumbnail;
