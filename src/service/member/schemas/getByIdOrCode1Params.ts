/**
 * Generated by orval v7.4.1 🍺
 * Do not edit manually.
 * Member API
 * isd / kinder board api doc
 * OpenAPI spec version: v1.1.0
 */

export type GetByIdOrCode1Params = {
  /**
   * 정보 조회시 포함할 정보. badges : 드라이브용. 뱃지리스트를 같이 조회합니다.
   */
  includes?: string | null;
  /**
   * 정보 조회시 조회를 요청한 사용자의 프로필 id. (팔로우 상태 확인용)
   */
  requestedProfileId?: string | null;
};
