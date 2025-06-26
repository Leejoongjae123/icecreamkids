import { ImageProps } from 'next/image';
import { SmartFolderItemDetailedResult, SmartFolderItemResultFileType } from '@/service/file/schemas';
import { IFloatingButton } from '@/components/common/Thumbnail/_components/FloatingButton/types';
import { ReactNode } from 'react';

export interface IThumbnail
  extends Omit<ImageProps, 'src' | 'alt' | 'width' | 'height'>,
    IFloatingButton,
    Pick<SmartFolderItemDetailedResult, 'lecturePlan' | 'lecturePlanReport' | 'studentRecord' | 'storyBoard'> {
  thumbUrl?: string;
  fileType: SmartFolderItemResultFileType;
  alt?: string;
  fallbackSrc?: string; // 로딩 실패 시 표시할 대체 이미지
  className?: string; // 추가 클래스
  blurDataURL?: string; // 로딩 중 블러 이미지
  tag?: {
    type: 'y' | 'o' | 'p' | 'b' | 'bk' | 'g';
    text: string;
  };
  nameHidden?: boolean;
  desc?: string;
  date?: string;
  likes?: number;
  views?: number;
  head?: string;
  width?: number; // 썸네일 width
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onDoubleClick?: React.MouseEventHandler<HTMLDivElement>;
  contentHideen?: boolean; // 컨텐츠 히든 여부
  isThumbnailCheckbox?: boolean; // 썸네일 전체 영역 선택시 (체크박스)활성화 유무: 업로드모달 대응
  favoriteHide?: boolean; // 즐겨찾기 히든 여부
  dropDownHide?: boolean; // 드롭다운 히든 여부
  viewType?: 'thumbnail' | 'table' | 'lecturePlan';
  visualClassName?:
    | 'type-format'
    | 'type-dimmed'
    | 'type-folder'
    | 'type-slide'
    | 'type-card'
    | 'type-square'
    | 'type-contain'
    | undefined; // 비쥬얼 클래스 네임 (업로드, 슬라이드, 3:4용)
  nameEditable?: boolean; // 네임 수정 여부
  /**
   * 자료 소유자의 프로필 명
   * @nullable
   */
  userProfileName?: string | null;
  /**
   * 자료 소유자의 프로필 썸네일 url
   * @nullable
   */
  userProfileThumbUrl?: string | null;
  isProfileImage?: boolean; // 프로필 이미지 표시 여부
  /**
   * 자료 소유자의 프로필 소개글.
   * @nullable
   */
  // profileBio?: string | null;
  /**
   * 썸네일 표시용 사용자 프로필 조회용 코드
   * @nullable
   */
  // userProfileCode?: string | null;
  makeRenameFile?: ({ name, type }: { name: string; type: 'make' | 'rename' | 'cancel' }) => void; // 파일 생성 or 이름 변경용 action
  showInfo?: boolean; // 정보 표시 여부
  cardFloatingButton?: boolean; // 카드썸네일 호버시 플로팅 버튼 노출 여부
  dropDownDirection?: 'left' | 'right'; // 드롭다운 메뉴 노출 방향
  descWhiteSpace?: 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line' | 'break-spaces';
  innerCard?: 'TYPE_A' | 'TYPE_B' | 'TYPE_C'; // 놀이카드 전용, A-노랑 ,B-보라, C-핑크
  showIndexOnCheck?: boolean; // 놀이보고서용 체크될 경우 숫자가 보여져야하는 경우
  showNumber?: number; // 보여져야 할 숫자
  eagerLoading?: boolean; // 이미지 로딩 조건 eager을 사용할건지 여부
  children?: ReactNode; // 보조 컨텐츠
  inputAutoFocus?: boolean; // 썸네일 인풋의 오토 포커스 여부
  userProfileCode?: string;
}
