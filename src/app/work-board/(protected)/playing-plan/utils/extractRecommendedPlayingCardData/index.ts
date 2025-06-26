import type { ApiResponseListSmartFolderItemResult, SmartFolderItemResultRootType } from '@/service/file/schemas';
import type { LecturePlan, RecommendedPlayingCardResult } from './types';

/**
 * * 추천 놀이계획 카드 데이터 조회 후 필요한 데이터 추출
 * ! SmartFolderItemResult 타입을 참고할 것
 * @param data API 응답 데이터
 * @returns {
 * 제목 (놀이계획 주제): lecturePlan > subject (string)
 * 아이디값 (놀이계획 ID): lecturePlan > id (number)
 * 놀이카드 내용: lecturePlan > activityNames (string) >>> @!,$!를 기준으로 내용 구분
 * 놀이 연령: result > lecturePlan > studentAge (number)
 * 놀이 시간: result > lecturePlan > activityTimeStr (string)
 * 놀이 시간 타입 (ex. MINUTES_40): result > lecturePlan > activityTime (string)
 * 좋아요 수: result > likeCount (number)
 * 조회수: result > viewCount (number)
 * 자료의 이름: result > name (string)  >>> 자료 업로드 후 드랍되는 영역에서 이름 확인이 필요함
 * 프로필명:  result > profileName (string)
 * 프로필 이미지: result > profileImageUrl (string)
 * 프로필 소개글: result > profileBio (string)
 * 실내외 구분 (ex. INDOOR): result > lecturePlan > indoorType (string)
 * 놀이계획 시작일: result > lecturePlan > startsAt (string)
 * 놀이계획 종료일: result > lecturePlan > endsAt (string)
 * AI 생성 초점 타입 (ex. TYPE_A): result > lecturePlan > creationType (string)
 * 섹션상 보여줄 타이틀 (ex. 주제, 목표, 도입, 주요놀이 등): result > lecturePlan > lecturePlanCardSections > title (string)
 * 섹션상 보여줄 서브 타이틀: result > lecturePlan > lecturePlanCardSections > lecturePlanCards > title (string)
 * 섹션상 보여줄 내용: result > lecturePlan > lecturePlanCardSections > lecturePlanCards > content (string)
 * 섹션상 보여줄 서브내용: result > lecturePlan > lecturePlanCardSections > lecturePlanCards > subContent (string)
 * 드라이브 아이템 키값: result > driveItemKey (string)
 * 드라이브 아이템 키값: result > driveItemKey (string)
 * 스마트 폴더 자료의 id: result > id (number)
 * 내가 작성한 자료인지 여부: result > isMine (boolean)
 * 파일 타입: result > fileType (string)
 * }
 */

// eslint-disable-next-line consistent-return
export function extractRecommendedPlayingCardData(
  data?: ApiResponseListSmartFolderItemResult,
): RecommendedPlayingCardResult[] {
  if (!data?.result || !Array.isArray(data.result)) {
    return [];
  }

  return data.result.map((item) => {
    // 에러가 발생하는 경우 BE API 이상여부를 요청할 수 있으므로 타입 단언 사용
    const lecturePlan = item.lecturePlan as LecturePlan;

    // 놀이 이름 파싱 (예: "단풍나무 술래잡기@!,$!낙엽나무 만들기@!,$!낙엽물감찍기")
    const activityContentsList = lecturePlan.activityNames.split('@!,$!') || [];

    // 파일 확장자 안전하게 추출하기
    const getFileExtension = (filename?: string): string => {
      if (!filename) return '';

      const parts = filename.split('.');
      // 파일명에 .이 없거나 마지막 부분이 비어있는 경우 (예: "file.")
      if (parts.length <= 1 || !parts[parts.length - 1]) return '';

      // 확장자 추출하고 .으로 시작하게 변환
      return `.${parts[parts.length - 1]}`;
    };

    // 확장자 구하기
    const fileExtension = getFileExtension(item.name);

    /**
     * * 추천놀이카드 > 자료 상세 레이어에서 필요한 데이터 추출
     */

    const [firstSection = { title: '', lecturePlanCards: [] }] = lecturePlan.lecturePlanCardSections || [];
    const { title: sectionTitle = '' } = firstSection;

    const sectionContents = (firstSection.lecturePlanCards || []).map(
      ({ title = '', subTitle = '', contents = '', subContents = '' }) => ({
        title,
        subTitle,
        contents,
        subContents,
      }),
    );

    const recommendedPlayingCardDetailLayerInfo = {
      title: sectionTitle,
      contents: sectionContents,
      startDateOfPlayingPlan: lecturePlan.startsAt,
      endDateOfPlayingPlan: lecturePlan.endsAt,
      activityAgeWithHangulSuffix: `${lecturePlan.studentAge}세`,
      activityTimeWithHangulSuffix: lecturePlan.activityTimeStr,
      numOfLike: item.likeCount,
      numOfViews: item.viewCount,
    };

    /**
     * * PlayingCard 컴포넌트 호환용 필드 (파싱된 데이터를 활용하여 필요한 데이터만 추출)
     */
    const parsedRecommendedPlayingCardData = {
      // 아이디값 (놀이계획 ID)
      recommendedPlayingCardId: lecturePlan.id,

      // 제목 (놀이계획 주제)
      recommendedPlayingCardSubject: lecturePlan.subject,

      // 놀이카드 내용 (파싱 후 개별 분리된 상태)
      activityContentsList,

      // 놀이 나이
      activityAgeWithHangulSuffix: lecturePlan.studentAge ? `${lecturePlan.studentAge}세` : '나이가 내려오지 않음',

      // 놀이시간
      activityTimeWithHangulSuffix: lecturePlan.activityTimeStr,

      // 좋아요 수
      numOfLike: item.likeCount,

      // 조회수
      numOfViews: item.viewCount,

      // 프로필명
      profileName: item.profileName,

      // 프로필 이미지
      profileImageUrl: item.profileImageUrl,

      // 프로필 소개글
      profileBio: item.profileBio,

      fileExtension,

      // 드라이브 아이템 키값 -> 즐겨찾기 설정시 필요
      driveItemKey: item.driveItemKey,

      // api 요청하는 구분(Photo:사진스마트폴더, EducationalData:자료스마트폴더, UserFolder:내폴더)
      smartFolderApiType: item.smartFolderApiType,

      // 스마트 폴더 자료의 id
      smartFolderItemId: item.id,

      // 내가 작성한 자료인지 여부
      isMine: item.isMine,

      /**
       * * 추천놀이카드 > 자료 상세 레이어에서 필요한 데이터
       * ! 파싱하지 않은 데이터도 일부 포함 (놀이 연령, 놀이시간타입 등)
       */

      recommendedPlayingCardDetailLayerInfo,

      // 놀이카드 내용 (파싱 이전)
      activityNames: lecturePlan.activityNames,

      // 놀이 연령
      studentAge: lecturePlan.studentAge,

      // 놀이 시간 타입
      constantValueOfActivityTime: lecturePlan.activityTime,

      // 자료의 이름
      fileName: item.name,

      // 실내외 구분
      indoorOrOutdoor: lecturePlan.indoorType,

      // AI 생성 초점 타입
      aiGenerationFocusType: lecturePlan.creationType,

      // 파일 타입
      fileType: item.fileType as unknown as SmartFolderItemResultRootType,

      // 영역별 구분을 위한 섹션 아이디값 (LECTURE_PLAN, STORY_BOARD, LECTURE_PLAN_REPORT, STUDENT_RECORD)
      taskItemId: item.taskItemId,

      // 자료의 공개 상태
      publicState: item.publicState,

      // 프로필 사진 클릭했을 때 마이보드 이동을 위한 프로필 코드
      profileCode: item.profileCode || '',
    };

    return {
      parsedRecommendedPlayingCardData,
    };
  });
}
