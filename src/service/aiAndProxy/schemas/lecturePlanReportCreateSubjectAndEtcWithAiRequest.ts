/**
 * Generated by orval v7.4.1 🍺
 * Do not edit manually.
 * Ai and Proxy API
 * isd / kinder board api doc
 * OpenAPI spec version: v1.1.0
 */
import type { TitleAndContents } from './titleAndContents';

export interface LecturePlanReportCreateSubjectAndEtcWithAiRequest {
  /**
   * 테스트용으로 호출하는지 확인합니다. false일경우 실제 ai로 데이터를 생성합니다. 필드아예 전달하지 않으시면 추후 서버 배포하면서 기본값 바꾸거나 필드를 삭제할 예정입니다.
   * @nullable
   */
  testSession?: boolean | null;
  /**
   * 놀이계획의 주제 키워드
   * @maxLength 20
   */
  subject: string;
  /** 놀이 계획의 대상 연령 */
  age: number;
  /**
   * 놀이계획 시작일(yyyy-MM-dd)
   * @maxLength 10
   * @nullable
   */
  startsAt?: string | null;
  /**
   * 놀이계획 종료일(yyyy-MM-dd)
   * @maxLength 10
   * @nullable
   */
  endsAt?: string | null;
  reportCaptions?: TitleAndContents[];
}
