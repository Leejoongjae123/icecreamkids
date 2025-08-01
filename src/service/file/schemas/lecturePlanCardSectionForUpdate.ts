/**
 * Generated by orval v7.4.1 🍺
 * Do not edit manually.
 * File API
 * isd / kinder board api doc
 * OpenAPI spec version: v1.1.0
 */
import type { LecturePlanCardForUpdate } from './lecturePlanCardForUpdate';

/**
 * 놀이 계획에서 수정할 카드를 포함한 하위 섹션들.
 */
export interface LecturePlanCardSectionForUpdate {
  /**
   * 수정할 섹션의 아이디, 없다면 신규 저장(3월 오픈엔 수정시 모두 있을것으로 예상.)
   * @nullable
   */
  cardSectionId?: number | null;
  /** AI에서 응답으로 온 카드 묶음의 키 */
  sectionKey: string;
  /**
   * 섹션의 정렬 순서. 0부터 오름차순으로 보여주기.
   * @minimum 0
   */
  sectionOrder?: number;
  /**
   * 섹션이 화면상에서 보여줄 이름. ex)주제/목표/도입 등
   * @maxLength 20
   */
  title?: string;
  /** 놀이 계획에서 수정할 카드들. */
  lecturePlanCard?: LecturePlanCardForUpdate[];
}
