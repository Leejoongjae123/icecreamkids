/**
 * Generated by orval v7.4.1 🍺
 * Do not edit manually.
 * File API
 * isd / kinder board api doc
 * OpenAPI spec version: v1.1.0
 */

/**
 * 항목의 종류. FILE, FOLDER, PROJECT,TEMP,ROOT
 */
export type UploadedItemInfoType = (typeof UploadedItemInfoType)[keyof typeof UploadedItemInfoType];

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const UploadedItemInfoType = {
  FILE: 'FILE',
  FOLDER: 'FOLDER',
  PROJECT: 'PROJECT',
  SMART_FOLDER: 'SMART_FOLDER',
  MY_FOLDER: 'MY_FOLDER',
  TEMP: 'TEMP',
  ROOT: 'ROOT',
} as const;
