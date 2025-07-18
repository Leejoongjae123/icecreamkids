/**
 * Generated by orval v7.4.1 🍺
 * Do not edit manually.
 * Ai and Proxy API
 * isd / kinder board api doc
 * OpenAPI spec version: v1.1.0
 */
import type { EducationalClassResultCourse } from './educationalClassResultCourse';
import type { StudentResult } from './studentResult';

export interface EducationalClassResult {
  /** 반의 Id */
  id: number;
  /** 담당 선생님의 프로필의 Id */
  teacherProfileId: number;
  /** 반의 연도 */
  year: number;
  /** 반의 이름 */
  name: string;
  /** 반 학생들의 연령 */
  age: number;
  course: EducationalClassResultCourse;
  /** 반이 기본반인지 여부 */
  isBasicClass: boolean;
  /** 반에 포함된 학생 수. */
  studentCount: number;
  /** 반이 등록된 날짜 */
  createdAt: string;
  /** 반이 마지막으로 수정된 날짜 */
  modifiedAt?: string;
  /** 이 반의 학생들 정보 */
  students?: StudentResult[];
  basicClass?: boolean;
}
