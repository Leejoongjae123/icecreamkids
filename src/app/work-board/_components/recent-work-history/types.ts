export type RecentTaskIconTypes = (typeof RecentTaskIconTypes)[keyof typeof RecentTaskIconTypes];
export const RecentTaskIconTypes = {
  LECTURE_PLAN: 'icon2', // 놀이계획
  LECTURE_PLAN_REPORT: 'icon4', // 놀이보고서
  STUDENT_RECORD: 'icon6', // 관찰기록
  STORY_BOARD: '', // 스토리보드
  STUDENT_CLASSIFICATION: '', // 아이분류
  ACTIVITY_CLASSIFICATION: '', // 활동분류
  PHOTO_COMPOSITION: '', // 아이합성
  DATA_ENCRYPTION: '', // 초상권보호
  PRIVATE_DATA_ENCRYPTION: '', // 초상권보호 - 설정 필요
  SKETCH_CREATION: '', // 도안 생성
  PHOTO_ALBUM: '', // 사진 정리
} as const;

export type RecentTaskTags = (typeof RecentTaskTags)[keyof typeof RecentTaskTags];
export const RecentTaskTags = {
  LECTURE_PLAN: 'y', // 놀이계획
  LECTURE_PLAN_REPORT: 'y', // 놀이보고서
  STUDENT_RECORD: 'y', // 관찰기록
  STORY_BOARD: 'o', // 스토리보드 - 설정 필요
  STUDENT_CLASSIFICATION: 'p', // 아이분류
  ACTIVITY_CLASSIFICATION: 'p', // 활동분류
  PHOTO_COMPOSITION: 'b', // 아이합성 - 설정 필요
  DATA_ENCRYPTION: 'g', // 초상권보호 - 설정 필요
  PRIVATE_DATA_ENCRYPTION: 'g', // 초상권보호 - 설정 필요
  SKETCH_CREATION: 'b', // 도안 생성 - 설정 필요
  PHOTO_ALBUM: 'b', // 사진 정리
} as const;

export type RecentTaskTypes = (typeof RecentTaskTypes)[keyof typeof RecentTaskTypes];
export const RecentTaskTypes = {
  LECTURE_PLAN: {
    icon: RecentTaskIconTypes.LECTURE_PLAN,
    tag: RecentTaskTags.LECTURE_PLAN,
    name: '놀이 계획',
  },
  LECTURE_PLAN_REPORT: {
    icon: RecentTaskIconTypes.LECTURE_PLAN_REPORT,
    tag: RecentTaskTags.LECTURE_PLAN_REPORT,
    name: '놀이 보고서',
  },
  STUDENT_RECORD: {
    icon: RecentTaskIconTypes.STUDENT_RECORD,
    tag: RecentTaskTags.STUDENT_RECORD,
    name: '아이 관찰 기록',
  },
  STORY_BOARD: {
    icon: RecentTaskIconTypes.STORY_BOARD,
    tag: RecentTaskTags.STORY_BOARD,
    name: '스토리보드',
  },
  STUDENT_CLASSIFICATION: {
    icon: RecentTaskIconTypes.STUDENT_CLASSIFICATION,
    tag: RecentTaskTags.STUDENT_CLASSIFICATION,
    name: '아이분류', // 아이분류
  },
  ACTIVITY_CLASSIFICATION: {
    icon: RecentTaskIconTypes.ACTIVITY_CLASSIFICATION,
    tag: RecentTaskTags.ACTIVITY_CLASSIFICATION,
    name: '아이분류', // 활동분류
  },
  PHOTO_COMPOSITION: {
    icon: RecentTaskIconTypes.PHOTO_COMPOSITION,
    tag: RecentTaskTags.PHOTO_COMPOSITION,
    name: '아이합성',
  },
  DATA_ENCRYPTION: {
    icon: RecentTaskIconTypes.DATA_ENCRYPTION,
    tag: RecentTaskTags.DATA_ENCRYPTION,
    name: '초상권 보호',
  },
  PRIVATE_DATA_ENCRYPTION: {
    icon: RecentTaskIconTypes.PRIVATE_DATA_ENCRYPTION,
    tag: RecentTaskTags.PRIVATE_DATA_ENCRYPTION,
    name: '초상권 보호',
  },
  SKETCH_CREATION: {
    icon: RecentTaskIconTypes.SKETCH_CREATION,
    tag: RecentTaskTags.SKETCH_CREATION,
    name: '도안 생성',
  },
  PHOTO_ARRANGEMENT: {
    icon: RecentTaskIconTypes.PHOTO_ALBUM,
    tag: RecentTaskTags.PHOTO_ALBUM,
    name: '사진 정리',
  },
  PHOTO_ALBUM: {
    icon: RecentTaskIconTypes.PHOTO_ALBUM,
    tag: RecentTaskTags.PHOTO_ALBUM,
    name: '사진 정리',
  },
};
