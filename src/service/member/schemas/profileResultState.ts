/**
 * Generated by orval v7.4.1 🍺
 * Do not edit manually.
 * Member API
 * isd / kinder board api doc
 * OpenAPI spec version: v1.1.0
 */

/**
 * 상태 (1 : 정상, 100 : 일시중지, 255 : 탈퇴)
 */
export type ProfileResultState = (typeof ProfileResultState)[keyof typeof ProfileResultState];

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const ProfileResultState = {
  NORMAL: 'NORMAL',
  PAUSE: 'PAUSE',
  WITHDRAWN: 'WITHDRAWN',
} as const;
