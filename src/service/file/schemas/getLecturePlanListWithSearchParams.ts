/**
 * Generated by orval v7.4.1 🍺
 * Do not edit manually.
 * File API
 * isd / kinder board api doc
 * OpenAPI spec version: v1.1.0
 */

export type GetLecturePlanListWithSearchParams = {
  /**
   * 조회에 포함할 정보. sections > cards > driveItems. driveItems로 요청하면 모든 상위 항목 포함.
   */
  includes?: string;
  /**
   * 검색한다면 검색 키워드
   */
  searchKeyword?: string;
  /**
   * 페이징 설정 페이지(0부터),한 페이지에 나올 수.
   */
  offsetWithLimit?: string;
  /**
   * 정렬 설정. 필드.정렬방법으로 요청
   */
  sorts?: string;
};
