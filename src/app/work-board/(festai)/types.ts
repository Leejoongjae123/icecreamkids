import { SmartFolderResult } from '@/service/file/schemas';

// 업로드된 파일 정보를 위한 인터페이스
export interface IUploadedFileInfo {
  id: string;
  file: File | SmartFolderResult;
  previewUrl: string;
  thumbKey?: string; // S3 업로드 후 반환받은 키 (없으면 아직 업로드 안된 상태)
  smartFolderItemId?: number; // 스마트 폴더 아이템 ID (SmartFolderItemResult에서 가져온 경우)
  isPreUploaded?: boolean; // 이미 업로드된 파일인지 여부 (SmartFolderItemResult에서 가져온 경우)
}

// API 요청 파라미터 인터페이스
export interface IClassificationParams {
  profileId: number;
  driveItemKeys: string[];
  responseWithFolder?: boolean; // 폴더 포함 여부
  maskSize?: number;
  maskType?: string;
}

// 갤러리 컴포넌트 분리
export interface IRegistersImageListProps {
  fileInfos: IUploadedFileInfo[];
  isFilterDone: boolean; // 작업실행 완료여부
  onDeleteAll: () => void;
  onDeleteOne: (id: string) => void;
  selectValue?: string;
}

// 빠른업무 AI
// 상단 필터영역컴포넌트 > 선택 필터옵션
export interface IFilterOption {
  id: string;
  label: string;
  type: 'checkbox' | 'radio';
  value: string;
  checked?: boolean;
  thumbnail: string;
  isIcoHidden?: boolean; // 아이콘 숨김여부
}

// 상단 필터영역컴포넌트 > 아이콘 및 컬러 지정
export type T_FILTER_TYPE = 'sort' | 'edit' | 'face';

export const TUTORIAL_TYPE = {
  students: {
    tutorialImg: 'img_tutorial_sortFace',
    tutorialText: 'AI가 아이별로 사진을 분류하고<br/>놀이 활동별로 사진을 인식해 각각의 폴더로 자동 정리합니다.',
  },
  activityPhotos: {
    tutorialImg: 'img_tutorial_sortFace',
    tutorialText: 'AI가 아이별로 사진을 분류하고<br/>놀이 활동별로 사진을 인식해 각각의 폴더로 자동 정리합니다.',
  },
  convertFace: {
    tutorialImg: 'img_tutorial_removeFace',
    tutorialText: 'AI가 사진에서 아이 얼굴을 쉽게 분리해,<br/>창의적인 콘텐츠 제작을 더 간편하게 만들어 줍니다.',
  },
  removeBackground: {
    tutorialImg: 'img_tutorial_removeBg',
    tutorialText:
      'AI가 사진 속 인물과 배경을 자동으로 쉽게 분리하고 배경을 삭제하여 PNG파일로 다운되며,<br/>아이들의 다양한 모습을 창의적으로 활용할 수 있는 기회를 제공합니다.',
  },
  mergePhoto: {
    tutorialImg: '',
    tutorialText: '',
  },
  fetchBlurFace: {
    tutorialImg: 'img_tutorial_Blur',
    tutorialText: '사진 속 아이들 얼굴을 자동으로 가려주어,<br/>몇 초 만에 초상권을 보호할 수 있습니다.',
  },
  fetchSticker: {
    tutorialImg: 'img_tutorial_sticker',
    tutorialText:
      '사진 속 얼굴을 귀여운 스티커로 가려<br/>초상권을 보호하면서 예쁘고 재미있는 사진을 만들 수 있습니다.',
  },
  faceReplaceFace: {
    tutorialImg: 'img_tutorial_changeFace',
    tutorialText:
      'AI가 사진 속 얼굴을 자연스럽게 실제 사람 같은 얼굴로 바꿔,<br/>어색함 없이 초상권을 보호하며 공유할 수 있습니다.',
  },
};

export type TutorialType = keyof typeof TUTORIAL_TYPE;
