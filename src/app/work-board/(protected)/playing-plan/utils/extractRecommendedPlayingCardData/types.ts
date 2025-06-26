/**
 * * 파싱 전 데이터 타입
 */

import type { SmartFolderItemResultPublicState, SmartFolderItemResultRootType } from '@/service/file/schemas';

interface LecturePlanCard {
  title: string;
  subTitle: string;
  contents: string;
  subContents: string;
}

interface LecturePlanSection {
  title: string;
  lecturePlanCards: LecturePlanCard[];
}

interface LecturePlan {
  id: number;
  subject: string;
  activityNames: string;
  studentAge: number;
  activityTimeStr: string;
  activityTime: string;
  indoorType: string;
  startsAt: string;
  endsAt: string;
  creationType: string;
  lecturePlanCardSections: LecturePlanSection[];
}

/**
 * * 파싱 후 데이터 타입
 */
interface RecommendedPlayingCardDetailLayerInfo {
  title: string;
  contents: {
    title: string;
    subTitle: string;
    contents: string;
    subContents: string;
  }[];
  startDateOfPlayingPlan: string;
  endDateOfPlayingPlan: string;
  activityAgeWithHangulSuffix: string;
  activityTimeWithHangulSuffix: string;
  numOfLike: number;
  numOfViews: number;
}

interface ParsedRecommendedPlayingCardData {
  recommendedPlayingCardId: number;
  recommendedPlayingCardSubject: string;
  activityContentsList: string[];
  activityAgeWithHangulSuffix: string;
  activityTimeWithHangulSuffix: string;
  numOfLike: number;
  numOfViews: number;
  profileName?: string | null; // swagger > nullable: true 로 정의되어 있음
  profileImageUrl?: string | null; // swagger > nullable: true 로 정의되어 있음
  profileBio?: string | null; // swagger > nullable: true 로 정의되어 있음
  fileExtension: string;
  recommendedPlayingCardDetailLayerInfo: RecommendedPlayingCardDetailLayerInfo;
  activityNames: string;
  studentAge: number;
  constantValueOfActivityTime: string;
  fileName?: string;
  indoorOrOutdoor: string;
  aiGenerationFocusType: string;
  driveItemKey: string;
  smartFolderApiType: string;
  smartFolderItemId: number; // smartFolderItemId (SmartFolderItem.id)
  isMine: boolean;
  fileType?: SmartFolderItemResultRootType;
  taskItemId?: number;
  publicState?: SmartFolderItemResultPublicState;
  profileCode?: string;
}

// 최종 반환 객체 타입 정의
interface RecommendedPlayingCardResult {
  parsedRecommendedPlayingCardData: ParsedRecommendedPlayingCardData;
}

export type {
  LecturePlan,
  RecommendedPlayingCardResult,
  ParsedRecommendedPlayingCardData,
  RecommendedPlayingCardDetailLayerInfo,
};
