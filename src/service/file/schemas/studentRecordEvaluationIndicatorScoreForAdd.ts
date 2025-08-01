/**
 * Generated by orval v7.4.1 🍺
 * Do not edit manually.
 * File API
 * isd / kinder board api doc
 * OpenAPI spec version: v1.1.0
 */

/**
 * 그래프에 들어간 항목에 대한 점수들
 * @nullable
 */
export type StudentRecordEvaluationIndicatorScoreForAdd = {
  /** 평가지표 뎁스 */
  indicatorDepth: number;
  /**
   * 평가지표 코드
   * @maxLength 3
   */
  indicatorCode: string;
  /**
   * 평가 지표에 대한 점수
   * @minimum 0
   */
  score: number;
} | null;
