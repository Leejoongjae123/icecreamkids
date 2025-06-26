/**
 * 파일 선택기 메시지 유형을 정의합니다.
 * 각 유형에 따라 다른 안내 텍스트가 표시됩니다.
 */
export const FILE_SELECTOR_TYPES = {
  PLAYING_PLAN: 'playingPlan',
  PLAYING_REPORT: 'playingReport',
} as const;

/**
 * 파일 선택기 메시지 키 타입
 */
export type FileSelectorMessageKey = (typeof FILE_SELECTOR_TYPES)[keyof typeof FILE_SELECTOR_TYPES];

/**
 * 파일 선택기 메시지 구조
 * @property upperRowText - 윗줄에 표시할 문구
 * @property linkText - 클릭 가능한 링크 텍스트
 * @property bottomRowTextAfterLink - 링크 텍스트 이후에 표시할 문구
 */
export interface FileSelectorMessage {
  upperRowText: string;
  linkText: string;
  bottomRowTextAfterLink: string;
}

/**
 * 파일 선택기에 표시할 메시지 정의
 */
export const FILE_SELECTOR_MESSAGE: Record<FileSelectorMessageKey, FileSelectorMessage> = {
  [FILE_SELECTOR_TYPES.PLAYING_PLAN]: {
    upperRowText: '놀이카드를 선택해 여기에 드래그 하거나,',
    linkText: '업로드',
    bottomRowTextAfterLink: ' 해주세요.',
  },
  [FILE_SELECTOR_TYPES.PLAYING_REPORT]: {
    upperRowText: '사진을 선택하여 여기에 드래그 하거나, ',
    linkText: '업로드',
    bottomRowTextAfterLink: ' 해주세요.',
  },
};
