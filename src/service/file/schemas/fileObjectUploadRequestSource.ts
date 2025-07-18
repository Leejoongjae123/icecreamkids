/**
 * Generated by orval v7.4.1 🍺
 * Do not edit manually.
 * File API
 * isd / kinder board api doc
 * OpenAPI spec version: v1.1.0
 */

/**
 * 자료의 기본 종류 구분. FILE, THUMB, PROFILE
 */
export type FileObjectUploadRequestSource =
  (typeof FileObjectUploadRequestSource)[keyof typeof FileObjectUploadRequestSource];

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const FileObjectUploadRequestSource = {
  FILE: 'FILE',
  THUMBNAIL: 'THUMBNAIL',
  PROFILE: 'PROFILE',
} as const;
