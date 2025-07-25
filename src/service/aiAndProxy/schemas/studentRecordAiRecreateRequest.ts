/**
 * Generated by orval v7.4.1 🍺
 * Do not edit manually.
 * Ai and Proxy API
 * isd / kinder board api doc
 * OpenAPI spec version: v1.1.0
 */
import type { StudentRecordAiRecreateRequestIndicatorScores } from './studentRecordAiRecreateRequestIndicatorScores';

export interface StudentRecordAiRecreateRequest {
  /**
   * 테스트용으로 호출하는지 확인합니다. false일경우 실제 ai로 데이터를 생성합니다. 필드아예 전달하지 않으시면 추후 서버 배포하면서 기본값 바꾸거나 필드를 삭제할 예정입니다.
   * @nullable
   */
  testSession?: boolean | null;
  /**
   * 아이가 속한 반의 아이디
   * @minimum 0
   */
  educationalClassId: number;
  /**
   * 아이의 아이디
   * @minimum 0
   */
  studentId: number;
  /** 해당 영역의 점수 모두 보내야한다고 합니다. "indicatorCode":score */
  indicatorScores: StudentRecordAiRecreateRequestIndicatorScores;
}
