/**
 * Generated by orval v7.4.1 🍺
 * Do not edit manually.
 * Ai and Proxy API
 * isd / kinder board api doc
 * OpenAPI spec version: v1.1.0
 */

/**
 * 저장할 파일의 성격. (FILE : 파일, THUMBNAIL:썸네일, PROFILE : 프로필 사진 )
 */
export type MobileUploadCompleteRequestFileObjectSource =
  (typeof MobileUploadCompleteRequestFileObjectSource)[keyof typeof MobileUploadCompleteRequestFileObjectSource];

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const MobileUploadCompleteRequestFileObjectSource = {
  FILE: 'FILE',
  THUMBNAIL: 'THUMBNAIL',
  PROFILE: 'PROFILE',
} as const;
