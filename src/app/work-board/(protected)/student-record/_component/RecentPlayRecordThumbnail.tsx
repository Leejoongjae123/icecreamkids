'use client';

import React from 'react';
import { SmartFolderItemResultFileType } from '@/service/file/schemas';
import { SmartFolderItemResult } from '@/service/file/schemas/smartFolderItemResult';
import { Thumbnail } from '@/components/common';
import { validateUrlPattern } from '@/utils';
import { FLOATING_BUTTON_TYPE } from '@/const';

interface StudentRecordThumbnailProps {
  studentRecordItem: SmartFolderItemResult | any;
  className?: string;
  contentHiden?: boolean;
  onClickItem?: (clickItem: string, studentRecordItem: SmartFolderItemResult | any) => void; // 클릭 이벤트
}

function RecentPlayRecordThumbnail({
  studentRecordItem,
  className = 'type-upload',
  contentHiden = false,
  onClickItem,
}: StudentRecordThumbnailProps) {
  // 드롭다운 옵션
  const dropDownMenuOptions = {
    show: false, // 드롭다운 메뉴 표시
    save: false, // 스마트 폴더에 저장된 상태가 아님
    text: false, // 텍스트 형태가 아닌 아이콘 형태로 표시
    list: [
      {
        key: 'share',
        text: '공유 관리',
        action: () => console.log('공유 관리 클릭됨'),
      },
      {
        key: 'tag',
        text: '태그 관리',
        action: () => console.log('태그 관리 클릭됨'),
      },
      {
        key: 'rename',
        text: '이름변경',
        action: () => console.log('이름변경 클릭됨'),
      },
      {
        key: 'delete',
        text: '삭제',
        action: () => {
          console.log('삭제 버튼 클릭');
        },
      },
      {
        key: 'save',
        text: '저장',
        action: () => console.log('저장 클릭됨'),
      },
    ],
  };

  // drive 아이템 선언
  const taskType = studentRecordItem?.taskType || studentRecordItem.fileType;
  const driveItem = studentRecordItem.driveItemResult || studentRecordItem.driveItem;

  function getFileType() {
    if (studentRecordItem?.fileType) return studentRecordItem.fileType;
    if (driveItem?.fileType) return driveItem.fileType;
    return SmartFolderItemResultFileType[taskType as keyof typeof SmartFolderItemResultFileType];
  }

  function getFilename() {
    if (studentRecordItem?.name) return studentRecordItem.name;
    if (driveItem?.name) return driveItem.name;
    const fileTypeItem = getFileType();
    if (fileTypeItem === SmartFolderItemResultFileType.LECTURE_PLAN) {
      return studentRecordItem?.lecturePlan?.subject || '';
    }
    if (fileTypeItem === SmartFolderItemResultFileType.LECTURE_PLAN_REPORT) {
      return studentRecordItem?.lectureReport?.subject || '';
    }
    if (fileTypeItem === SmartFolderItemResultFileType.STORY_BOARD) {
      return studentRecordItem?.storyBoard?.title || '';
    }
    return '';
  }

  function getTaskThumbnailUrl() {
    let retThumbnailUrl: string = '';
    if (studentRecordItem?.thumbUrl) retThumbnailUrl = studentRecordItem.thumbUrl;
    if (driveItem?.thumbUrl) retThumbnailUrl = driveItem.thumbUrl;
    if (!retThumbnailUrl) {
      const fileTypeItem = getFileType();
      if (fileTypeItem === SmartFolderItemResultFileType.LECTURE_PLAN) {
        retThumbnailUrl = studentRecordItem?.lecturePlan?.thumbUrl || '';
      }
      if (fileTypeItem === SmartFolderItemResultFileType.LECTURE_PLAN_REPORT) {
        retThumbnailUrl = studentRecordItem?.lectureReport?.thumbUrl || '';
      }
      if (fileTypeItem === SmartFolderItemResultFileType.STUDENT_RECORD) {
        retThumbnailUrl = studentRecordItem?.studentRecord?.thumbUrl || '';
      }
      if (fileTypeItem === SmartFolderItemResultFileType.STORY_BOARD) {
        retThumbnailUrl = studentRecordItem?.storyBoard?.thumbUrl || '';
      }
    }
    return retThumbnailUrl.charAt(0) === '/' || validateUrlPattern(retThumbnailUrl) ? retThumbnailUrl : '';
  }

  const memoCount = driveItem?.memoCount > 0 || false;

  const fileType = getFileType();
  const filename = getFilename();
  const thumbnailUrl = getTaskThumbnailUrl();
  const floatingType = memoCount ? FLOATING_BUTTON_TYPE.Edit : FLOATING_BUTTON_TYPE.None;

  // 클릭 이벤트 모음
  const handlerThumbnailClick = () => {
    onClickItem?.('click', studentRecordItem);
  };

  const handlerEdit = () => {
    onClickItem?.('edit', studentRecordItem);
  };

  const handlerClose = () => {
    onClickItem?.('close', studentRecordItem);
  };
  return (
    <Thumbnail
      style={{ cursor: 'pointer' }}
      hover
      className={className}
      contentHideen={contentHiden}
      fileName={filename}
      isMine
      fileType={fileType}
      thumbUrl={thumbnailUrl}
      floatingType={floatingType}
      onClick={handlerThumbnailClick}
      onEdit={handlerEdit}
      onClose={handlerClose}
    />
  );
}

export default RecentPlayRecordThumbnail;
