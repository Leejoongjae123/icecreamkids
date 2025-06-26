import type { RecentTaskResultTaskType } from '@/service/file/schemas';

export type Replacement = {
  key: string;
  value: string;
};

export type RecentTaskResultTaskTypeDetailLinkType =
  (typeof RecentTaskResultTaskType)[keyof typeof RecentTaskResultTaskType];

export const RecentTaskResultTaskTypeDetailLinkType = {
  LECTURE_PLAN: '/work-board/playing-plan/activity-card/{taskItemId}',
  LECTURE_PLAN_REPORT: '/work-board/playing-report/{taskItemId}',
  STUDENT_RECORD: '/work-board/student-record/{educationalClassId}/{studentId}/{taskItemId}',
  STORY_BOARD: '/my-board/story-board/view/{taskItemId}',
  STUDENT_CLASSIFICATION: '/material-board/photo/{taskItemId}',
  ACTIVITY_CLASSIFICATION: '/material-board/photo/{taskItemId}',
  PHOTO_COMPOSITION: '/material-board/photo/{taskItemId}',
  PRIVATE_DATA_ENCRYPTION: '/material-board/photo/{taskItemId}',
  SKETCH_CREATION: '',
  PHOTO_ALBUM: '',
  AI_WRITING: '',
  STUDENT_AND_ACTIVITY_CLASSIFICATION: '',
  PLAY_PHOTO: '',
  REPLY: '',
  ETC: '',
} as const;

export type RecentTaskResultTaskTypeList =
  (typeof RecentTaskResultTaskTypeList)[keyof typeof RecentTaskResultTaskTypeList];

export const RecentTaskResultTaskTypeList = {
  LECTURE_PLAN: '놀이계획',
  LECTURE_PLAN_REPORT: '놀이보고서',
  STUDENT_RECORD: '아이관찰기록',
  STORY_BOARD: '스토리 보드',
  STUDENT_CLASSIFICATION: '아이 분류',
  ACTIVITY_CLASSIFICATION: '활동 분류',
  PHOTO_COMPOSITION: '사진 합성',
  PRIVATE_DATA_ENCRYPTION: '초상권 보호',
  SKETCH_CREATION: '컬러링 도안 생성',
  PHOTO_ALBUM: '앨범 사진 정리',
} as const;

export const RecentTaskResultMaterialTaskType = [
  'STUDENT_CLASSIFICATION',
  'ACTIVITY_CLASSIFICATION',
  'PHOTO_COMPOSITION',
  'PRIVATE_DATA_ENCRYPTION',
  'SKETCH_CREATION',
  'PHOTO_ALBUM',
];

// 최근 작업 현황 전체보기
export const RecentTaskResultAll = Object.keys(RecentTaskResultTaskTypeList)
  .map((key) => key)
  .join(',');
// export const RecentTaskResultAll = '';

export type photoFolderTreeList = {
  STUDENT_CLASSIFICATION?: number | undefined | null;
  ACTIVITY_CLASSIFICATION?: number | undefined | null;
  PHOTO_COMPOSITION?: number | undefined | null;
  PRIVATE_DATA_ENCRYPTION?: number | undefined | null;
  SKETCH_CREATION?: number | undefined | null;
  PHOTO_ALBUM?: number | undefined | null;
};
