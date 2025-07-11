/**
 * Generated by orval v7.4.1 🍺
 * Do not edit manually.
 * File API
 * isd / kinder board api doc
 * OpenAPI spec version: v1.1.0
 */
import type { StoryBoardContentForUpdate } from './storyBoardContentForUpdate';

export interface StoryBoardUpdateRequest {
  /**
   * 스토리보드의 id (storyBoardResult.id)
   * @minimum 0
   */
  id: number;
  /**
   * 제목(안넣으면 내용들중에 첫 번째 타이틀이 있다면 자동으로 입력)
   * @maxLength 45
   */
  title?: string;
  /**
   * 부제목, 혹은 내용
   * @maxLength 1000
   */
  subTitle?: string;
  /**
   * 대표사진 url(안넣으면 내용들중에 첫 번째 사진의 url로 입력 있다면 자동으로 입력)
   * @maxLength 1000
   */
  thumbUrl?: string;
  /** 스토리보드에 들어갈 내용들 */
  contents?: StoryBoardContentForUpdate[];
  /**
   * 생성자의 ip
   * @minLength 1
   * @maxLength 40
   */
  requestIp: string;
}
