/**
 * Generated by orval v7.4.1 🍺
 * Do not edit manually.
 * File API
 * isd / kinder board api doc
 * OpenAPI spec version: v1.1.0
 */

export interface RemoveDriveItemFromMyFolderWithKeyRequest {
  /** 제외를 요청한 사용자의 사용자의 계정 id */
  folderOwnerAccountId: number;
  /** 제외를 요청한 사용자의 프로필 id */
  folderOwnerProfileId: number;
  /**
   * 제외할 자료의 자료 키 리스트
   * @minLength 1
   * @minItems 1
   * @maxItems 2147483647
   */
  targetDriveItemKeys: string[];
}
