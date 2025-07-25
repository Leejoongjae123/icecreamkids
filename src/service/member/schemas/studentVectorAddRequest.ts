/**
 * Generated by orval v7.4.1 🍺
 * Do not edit manually.
 * Member API
 * isd / kinder board api doc
 * OpenAPI spec version: v1.1.0
 */

export interface StudentVectorAddRequest {
  /**
   * 학생의 이름, 킨더보드용 있는데 일단 어떻게 쓰실지 몰라서 별도로 설정
   * @maxLength 40
   */
  name: string;
  /** 벡터 포인트 */
  featureVector: number[];
  /** 이미지 경로 */
  imagePath: string;
  /** 벡터 버전. 어떻게 쓰실지 몰라서 일단 문자열로 */
  vectorVersion?: string;
  /** 킨더보드의 학생 id */
  studentId: number;
}
