/**
 * Generated by orval v7.4.1 🍺
 * Do not edit manually.
 * Ai and Proxy API
 * isd / kinder board api doc
 * OpenAPI spec version: v1.1.0
 */
import type { StoryBoardContentResultContentType } from './storyBoardContentResultContentType';
import type { StoryBoardContentPhotoResult } from './storyBoardContentPhotoResult';

/**
 * 스토리보드에 들어간 내용들
 */
export interface StoryBoardContentResult {
  /** 스토리보드 내용의 아이디 */
  id: number;
  /**
   * 속한 스토리보드의 아이디
   * @minimum 0
   */
  storyBoardId: number;
  /**
   * 내용의 순서. 0부터 오름차순
   * @minimum 0
   */
  contentOrder: number;
  /** 내용의 타입, enum이라 0부터 넣거나 텍스트로 입력 */
  contentType: StoryBoardContentResultContentType;
  /**
   * 제목
   * @maxLength 45
   */
  title?: string;
  /**
   * 부제목, 혹은 내용
   * @maxLength 1000
   */
  contents?: string;
  /**
   * 포함되는 자료의 id들 순서대로 ,로 구분
   * @maxLength 2000
   */
  attachedDriveItemIds?: string;
  /** 생성일 */
  createdAt: string;
  /** 수정일 */
  modifiedAt: string;
  /** 포함된 사진의 리스트 */
  attachedPhotos?: StoryBoardContentPhotoResult[];
}
