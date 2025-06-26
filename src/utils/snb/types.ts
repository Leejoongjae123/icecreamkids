export const WORKBOARD_ROUTES_CONFIG = {
  // SNB를 표시하지 않는 라우트
  withoutSnb: [
    '/work-board',
    '/work-board/playing-report/setting',
    '/work-board/playing-report/preview',
    '/work-board/playing-report/edit',
    '/work-board/student-record/preview',
  ],

  // SNB를 표시하는 라우트
  withSnb: [
    '/work-board/recent-work-history',
    '/work-board/playing-plan',
    '/work-board/playing-plan/activity-card',
    '/work-board/playing-report',
    '/work-board/student-record',
    '/work-board/fast-ai',
  ],
} as const;
