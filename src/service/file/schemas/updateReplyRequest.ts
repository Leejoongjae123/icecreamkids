/**
 * Generated by orval v7.4.1 🍺
 * Do not edit manually.
 * File API
 * isd / kinder board api doc
 * OpenAPI spec version: v1.1.0
 */

export interface UpdateReplyRequest {
  /**
   * 댓글 본문
   * @minLength 0
   * @maxLength 500
   */
  contents: string;
  /** 추가할 첨부파일 ID */
  driveItemKeysToAdd?: string[];
  /** 제거할 첨부파일 ID */
  driveItemKeysToRemove?: string[];
}
