/**
 * Generated by orval v7.4.1 🍺
 * Do not edit manually.
 * File API
 * isd / kinder board api doc
 * OpenAPI spec version: v1.1.0
 */
import type { UploadedItemInfo } from './uploadedItemInfo';
import type { CommonUploadCompletedRequestUploadedTaskType } from './commonUploadCompletedRequestUploadedTaskType';
import type { CommonUploadCompletedRequestTargetSmartFolderApiType } from './commonUploadCompletedRequestTargetSmartFolderApiType';

export interface CommonUploadCompletedRequest {
  uploadItemInfo: UploadedItemInfo;
  /** 어느 기능에서 업로드를 완료 했는지? */
  uploadedTaskType: CommonUploadCompletedRequestUploadedTaskType;
  /** 특별히 저장할 경로가 있다면 목적 폴더의 api 타입(Photo:사진스마트폴더, EducationalData:자료스마트폴더, UserFolder:내폴더, MyBoard:마이 보드) */
  targetSmartFolderApiType?: CommonUploadCompletedRequestTargetSmartFolderApiType;
  /** 특별히 저장할 경로가 있다면 목적 폴더의 id */
  targetFolderId?: number;
}
