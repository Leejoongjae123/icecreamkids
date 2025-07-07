import {
  CdnFileResult,
  SmartFolderItemDetailedResult,
  SmartFolderItemResultFileType,
  SmartFolderItemResultSmartFolderApiType,
} from '@/service/file/schemas';

export interface IFileViewer {
  isFullScreen: boolean;
  file: SmartFolderItemDetailedResult; // 파일 객체
  style?: React.CSSProperties; // 스타일을 받아오는 프로퍼티 추가
  onClick?: (e?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void; // 자료 확대용
  cdnFile: CdnFileResult | undefined;
  isFailCdnFile: boolean | undefined;
  handleDownload: () => void; // 파일 다운로드용 액션
}

export interface IPopupLayer {
  isDirect: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  /** 컴포넌트 단에서 API 호출 방식으로 처리 예정 */
}

export interface IComment {
  id: number;
  content: string;
  image?: string;
  parentId?: number; // 부모 댓글 ID (없으면 최상위 댓글)
  replies?: IComment[]; // 대댓글 목록
}

export interface IRecommendation {
  id: number;
  title: string;
  thumbnail: string;
}

export interface IReportModalInfo {
  isShow: boolean;
  id?: number;
  targetProfileName?: string;
}

export type IRenderMap = SmartFolderItemResultFileType | 'YOUTUBE' | 'PDF' | 'HWP' | 'DOC';
