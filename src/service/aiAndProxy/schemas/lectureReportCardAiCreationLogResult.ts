/**
 * Generated by orval v7.4.1 🍺
 * Do not edit manually.
 * Ai and Proxy API
 * isd / kinder board api doc
 * OpenAPI spec version: v1.1.0
 */

/**
 * 관련된 ai 사용로그
 */
export interface LectureReportCardAiCreationLogResult {
  /** 로그의 아이디 */
  id: number;
  /** 사진의 자료 id */
  inputPhotoDriveItemId: number;
  /** 생성에 사용한 활동카드 (놀이계획) id */
  inputLecturePlanId?: number;
  /** 생성에 사용한 메모 자료 id */
  inputMemoDriveItemId?: number;
  /** 생성에 사용한 카드 id */
  inputLectureReportCardId?: number;
  /** 생성에 사용한  카드의 타이틀 */
  inputTitle?: string;
  /** 생성에 사용한  카드의 내용 */
  inputContents?: string;
  /** 생성된 카드의 타이틀 */
  outputTitle: string;
  /** 생성된 카드의 내용 */
  outputContents: string;
  /** 생성일 */
  createdAt: string;
}
