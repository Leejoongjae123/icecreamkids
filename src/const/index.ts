import { SelectOption } from '@/components/common/Select';
import { IOption } from '@/const/types';
import {
  CommonUploadCompletedRequestUploadedTaskType,
  SmartFolderItemResult,
  SmartFolderItemResultFileType,
} from '@/service/file/schemas';
import { IBreadcrumbItem } from '@/components/common/Breadcrumb';

const EXTENSIONS: Record<SmartFolderItemResultFileType, string[]> = {
  [SmartFolderItemResultFileType.IMAGE]: [
    'apng',
    'avif',
    'bmp',
    'gif',
    'jpeg',
    'jpg',
    'png',
    'tif',
    'tiff',
    'webp',
    'svg',
  ],
  [SmartFolderItemResultFileType.AUDIO]: ['mp3', 'wav', 'weba', 'wma', 'm4a', 'flac'],
  [SmartFolderItemResultFileType.VIDEO]: ['avi', 'mp4', 'mpeg', 'webm', 'wmv', 'mov'],
  [SmartFolderItemResultFileType.DOCUMENT]: [
    'txt',
    'pdf',
    'hwp',
    'hwpx',
    'doc',
    'docx',
    'ppt',
    'pptx',
    'xls',
    'xlsx',
    'odt',
    'ppsx',
    'show',
    'hwt',
    'PSD',
    'AI',
    'PRPROJ',
    'csv',
  ],
  [SmartFolderItemResultFileType.ARCHIVE]: ['gz', 'zip', '7z', 'alz', 'egg'],
  [SmartFolderItemResultFileType.URL]: ['url'],
  [SmartFolderItemResultFileType.LECTURE_PLAN]: ['isdlp'],
  [SmartFolderItemResultFileType.LECTURE_PLAN_REPORT]: ['isdlpr'],
  [SmartFolderItemResultFileType.STUDENT_RECORD]: ['isdsr'],
  [SmartFolderItemResultFileType.STORY_BOARD]: ['isdsb'],
  [SmartFolderItemResultFileType.FOLDER]: [], // 폴더는 확장자 없음
  [SmartFolderItemResultFileType.ETC]: [], // 기타 확장자 미정
  [SmartFolderItemResultFileType.STUDENT_CLASSIFICATION]: [],
  [SmartFolderItemResultFileType.ACTIVITY_CLASSIFICATION]: [],
  [SmartFolderItemResultFileType.PHOTO_COMPOSITION]: [],
  [SmartFolderItemResultFileType.PRIVATE_DATA_ENCRYPTION]: [],
  [SmartFolderItemResultFileType.SKETCH_CREATION]: [],
  [SmartFolderItemResultFileType.PHOTO_ALBUM]: [],
  [SmartFolderItemResultFileType.AI_WRITING]: [],
  [SmartFolderItemResultFileType.STUDENT_AND_ACTIVITY_CLASSIFICATION]: [],
  [SmartFolderItemResultFileType.TEXT_MEMO]: ['isdmo'],
};

const DRIVE_ITEM_TYPE: IOption[] = [
  { id: 0, value: 'FILE', name: '파일' },
  { id: 1, value: 'FOLDER', name: '폴더' },
  { id: 2, value: 'PROJECT', name: '프로젝트' },
  { id: 254, value: 'TEMP', name: '임시 드라이브' },
  { id: 255, value: 'ROOT', name: '내 드라이브' },
];

const DRIVE_ITEM_OPTIONS: SelectOption[] = [
  {
    text: '전체',
    value: 'ALL',
  },
  {
    text: '이미지',
    value: SmartFolderItemResultFileType.IMAGE,
  },
  {
    text: '문서(hwp,doc,ppt.pdf..)',
    value: SmartFolderItemResultFileType.DOCUMENT,
  },
  {
    text: '비디오',
    value: SmartFolderItemResultFileType.VIDEO,
  },
  {
    text: '오디오',
    value: SmartFolderItemResultFileType.AUDIO,
  },
  {
    text: '웹사이트(URL)',
    value: SmartFolderItemResultFileType.URL,
  },
  {
    text: '압축파일',
    value: SmartFolderItemResultFileType.ARCHIVE,
  },
  {
    text: '놀이계획',
    value: SmartFolderItemResultFileType.LECTURE_PLAN,
  },
  {
    text: '놀이보고',
    value: SmartFolderItemResultFileType.LECTURE_PLAN_REPORT,
  },
  {
    text: '관찰기록',
    value: SmartFolderItemResultFileType.STUDENT_RECORD,
  },
];

const IN_TRASH_TYPE: IOption[] = [
  { id: 0, value: 'OUT_OF_TRASH', name: '휴지통 밖' },
  { id: 1, value: 'IN_TRASH', name: '휴지통 안' },
  { id: 2, value: 'PARENT_IN_TRASH', name: '부모가 휴지통안' },
];

const ALLOWED_ICONS = [
  'icon1',
  'icon2',
  'icon3',
  'icon4',
  'icon5',
  'icon6',
  'icon7',
  'icon8',
  'icon9',
  'icon10',
  'icon16',
  'icon18',
  'folder',
  'vod',
  'audio',
  'file',
  'pdf',
  'csv',
  'txt',
  'hwp',
  'hwpx',
  'doc',
  'docx',
  'ppt',
  'pptx',
  'ppsx',
  'xls',
  'xlsx',
  'odt',
  'show',
  'hwt',
  'zip',
  'no-image',
] as const;

// LECTURE_PLAN, LECTURE_PLAN_REPORT, STUDENT_RECORD
const THUMBNAIL_MAP: Record<SmartFolderItemResultFileType, (typeof ALLOWED_ICONS)[number]> = {
  [SmartFolderItemResultFileType.IMAGE]: 'no-image',
  [SmartFolderItemResultFileType.AUDIO]: 'audio',
  [SmartFolderItemResultFileType.VIDEO]: 'vod',
  [SmartFolderItemResultFileType.DOCUMENT]: 'file',
  [SmartFolderItemResultFileType.ARCHIVE]: 'zip',
  [SmartFolderItemResultFileType.URL]: 'icon16',
  [SmartFolderItemResultFileType.FOLDER]: 'folder',
  [SmartFolderItemResultFileType.LECTURE_PLAN]: 'icon2',
  [SmartFolderItemResultFileType.LECTURE_PLAN_REPORT]: 'icon8',
  [SmartFolderItemResultFileType.STUDENT_RECORD]: 'icon18',
  [SmartFolderItemResultFileType.STORY_BOARD]: 'no-image',
  [SmartFolderItemResultFileType.STUDENT_CLASSIFICATION]: 'no-image',
  [SmartFolderItemResultFileType.ACTIVITY_CLASSIFICATION]: 'no-image',
  [SmartFolderItemResultFileType.PHOTO_COMPOSITION]: 'no-image',
  [SmartFolderItemResultFileType.PRIVATE_DATA_ENCRYPTION]: 'no-image',
  [SmartFolderItemResultFileType.SKETCH_CREATION]: 'no-image',
  [SmartFolderItemResultFileType.PHOTO_ALBUM]: 'no-image',
  [SmartFolderItemResultFileType.AI_WRITING]: 'no-image',
  [SmartFolderItemResultFileType.STUDENT_AND_ACTIVITY_CLASSIFICATION]: 'no-image',
  [SmartFolderItemResultFileType.ETC]: 'no-image',
  [SmartFolderItemResultFileType.TEXT_MEMO]: 'file',
};

/**
 * 플로팅 타입 규칙 정의
 * default는 체크박스
 * 좌측 상단 부터 시계방향으로 플로팅 버튼 타입 정의 EX) 체크박스 + 드롭다운 + 수정 버튼 = checkboxDropDownEdit
 */
const FLOATING_BUTTON_TYPE = {
  None: 'none', // 11. 아무 메뉴 없음
  Default: 'default', // 1. 기본 (업로드 버튼) 체크박스
  DownloadDropdown: 'downloadDropdown', // 2. 다운로드 + 드롭다운 메뉴
  Dropdown: 'dropdown', // 3. 드롭다운 메뉴
  CheckCloseEdit: 'checkCloseEdit', // 4. 체크박스 + 수정 버튼 + Close 버튼
  BadgeCloseEdit: 'badgeCloseEdit', // 5. 대표 뱃지 + Close 버튼 + 수정 버튼
  CheckFavoriteDropdown: 'checkFavoriteDropDown', // 6. 체크박스 + 즐겨찾기 + 드롭다운
  CheckFavoriteDropdownEdit: 'checkFavoriteDropDownEdit', // 7. 체크박스 + 즐겨찾기 + 드롭다운 + 수정 버튼
  CheckboxDropdown: 'checkboxDropdown', // 8. 체크박스 + 드롭다운
  CheckboxDownloadDropdown: 'checkboxDownloadDropdown', // 9. 체크박스 + 다운로드 + 드롭다운
  FavoriteDropdownEdit: 'favoriteDropdownEdit', // 10. 즐겨찾기 + 다운로드 + 드롭다운
  CloseEdit: 'closeEdit', // 11. Close 버튼 + 수정 버튼
  Edit: 'edit', // 12. 수정 버튼
  closeWithMemo: 'closeWithMemo', // 12. Close 버튼 + 수정 버튼
  BadgeClose: 'badgeClose', // 13. 대표 뱃지 + Close 버튼
  Close: 'close', // 14. Close 버튼
  Badge: 'badge', // 15. 대표 뱃지
  CheckClose: 'CheckClose', // 16 check + close
  FavoriteDropdown: 'FavoriteDropdown', // 17 즐겨찾기 + 드롭다운
} as const;

const YOUTUBE_URL_PATTERN =
  /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

const dummyFileList = [
  { id: '1', fileName: 'test11.pdf', fileSrc: '/test11.pdf' },
  {
    id: '2',
    fileName: '[안될과학]발생과정으로 알아보는 초파리의 비밀 (1).url',
    fileSrc: '/[안될과학]발생과정으로 알아보는 초파리의 비밀 (1).url',
  },
  { id: '3', fileName: 'dktechin.url', fileSrc: '/dktechin.url' },
  { id: '4', fileName: 'NAVER.url', fileSrc: '/NAVER.url' },
  { id: '5', fileName: 'logo.png', fileSrc: '/images/logo.png' },
  { id: '6', fileName: 'logo@2x.png', fileSrc: '/images/logo@2x.png' },
];

const IP_ADDRESS = '127.0.0.1';

const PREFIX_THUMB = 'https://s3.ap-northeast-2.amazonaws.com//file-isd.dev/';

const MY_JOB = [
  { text: '유치원 교사', value: 'NURSERY_TEACHER' },
  { text: '어린이집 교사', value: 'KINDERGARTEN_TEACHER' },
  { text: '원장/원감', value: 'MANAGER' },
  { text: '기타', value: 'ETC' },
];

const MY_LOCATION = [
  { text: '서울', value: '서울' },
  { text: '경기', value: '경기' },
  { text: '부산', value: '부산' },
  { text: '대구', value: '대구' },
  { text: '인천', value: '인천' },
  { text: '광주', value: '광주' },
  { text: '대전', value: '대전' },
  { text: '울산', value: '울산' },
  { text: '세종', value: '세종' },
  { text: '강원', value: '강원' },
  { text: '충북', value: '충북' },
  { text: '충남', value: '충남' },
  { text: '전북', value: '전북' },
  { text: '전남', value: '전남' },
  { text: '경북', value: '경북' },
  { text: '경남', value: '경남' },
  { text: '제주', value: '제주' },
];

const prefix = {
  root: '/',
  login: '/login',
  signup: '/signup',
  findPassword: '/findPassword',
  introduce: '/introduce',
  materialBoard: '/material-board',
  preview: '/preview',
  // work_board: '/work-board',
};

// 자료의 폴더 루트 타입
const SMART_FOLDER_ROOT_TYPE = {
  NONE: '',
  EDUCATIONAL_CLASS_TOTAL_PHOTO: '우리반 전체 사진',
  EDUCATIONAL_CLASS_STUDENT_PHOTO: '우리반 아이 사진',
  ACTIVITY_PHOTO: '활동 사진',
  AI_IMAGE_TASK: '빠른 작업 사진',
  MONTHLY_DOCUMENT: '월간 업무',
  LECTURE_PLAN: '놀이계획서',
  LECTURE_PLAN_REPORT: '놀이보고서',
  STUDENT_RECORD: '관찰기록',
  STORY_BOARD: '스토리보드',
  AI_WRITEING: 'AI 문장 생성',
  PLAY_PHOTO: '놀이 사진',
  MY_FOLDER: '내 폴더',
  MY_BOARD: '마이 보드',
  PUBLIC_ITEM: '공개자료',
};

// 영역 이탈 안내 메시지
const LEAVE_PAGE_CONFIRM_MESSAGE = '다른 화면으로 이동하면 입력 내용이 초기화됩니다.<br /> 이동하시겠습니까?'; // 컨펌 메시지
// 줄바꿈 포함
const LEAVE_PAGE_CONFIRM_MESSAGE_WITH_BREAK =
  '다른 화면으로 이동하면 입력 내용이 초기화됩니다.<br /> 이동하시겠습니까?'; // 컨펌 메시지

// 킨더보드 특수 확장자 파일 타입 리스트
const SPECIAL_FILE_TYPE: SmartFolderItemResultFileType[] = [
  'LECTURE_PLAN',
  'LECTURE_PLAN_REPORT',
  'STUDENT_RECORD',
  'STORY_BOARD',
];

export type SaveToImageFileType = 'STORY_BOARD' | 'LECTURE_PLAN' | 'LECTURE_PLAN_REPORT' | 'STUDENT_RECORD';

const fileTypeMap: Record<SaveToImageFileType, string> = {
  STORY_BOARD: 'story-board',
  LECTURE_PLAN: 'activity-card-printing-area',
  LECTURE_PLAN_REPORT: 'lecture-plan-report',
  STUDENT_RECORD: 'student-record-preview',
};

// 공개자료 폴더
const PUBLIC_FOLDER: SmartFolderItemResult = {
  id: 0,
  smartFolderApiType: 'PublicItem',
  rootType: 'PUBLIC_ITEM',
  parentSmartFolderItemId: 0,
  driveItemKey: '',
  depth: 1,
  fileType: 'FOLDER',
  name: '공개자료',
  isMine: true,
  publicState: 'PUBLIC',
  isHidden: false,
  ownerAccountId: 0,
  ownerProfileId: 0,
  originalCreatorAccountId: 0,
  originalCreatorProfileId: 0,
  driveItemCreatedAt: '',
  addedAt: '',
  taskItemId: 0,
  userEditable: false,
  memoCount: 0,
  copyCount: 0,
  viewCount: 0,
  likeCount: 0,
  hasLiked: false,
  isFavorite: false,
  replyCount: 0,
  totalSize: null,
};

const DUMMY_FOLDER: SmartFolderItemResult = {
  id: 0,
  smartFolderApiType: 'Drive', // 임시 데이터
  rootType: 'NONE',
  parentSmartFolderItemId: 0,
  driveItemKey: '',
  depth: 1,
  fileType: 'FOLDER',
  name: '',
  isMine: true,
  publicState: 'PRIVATE',
  isHidden: false,
  ownerAccountId: 0,
  ownerProfileId: 0,
  originalCreatorAccountId: 0,
  originalCreatorProfileId: 0,
  driveItemCreatedAt: '',
  addedAt: '',
  taskItemId: 0,
  userEditable: true,
  memoCount: 0,
  copyCount: 0,
  viewCount: 0,
  likeCount: 0,
  hasLiked: false,
  isFavorite: false,
  replyCount: 0,
  totalSize: null,
};

// 자료보드 브레드크럼
const MATERIAL_BREADCRUMB: IBreadcrumbItem[] = [
  { label: '자료보드', smartFolderApiType: null, id: null, href: 'dummy' },
];
const PUBLIC_BREADCRUMB: IBreadcrumbItem[] = [
  { label: '공개자료', smartFolderApiType: 'PublicItem', id: 0, href: 'dummy' },
];

const AGE_OPTIONS = [
  { value: 2, text: '0~2세' },
  { value: 3, text: '3세' },
  { value: 4, text: '4세' },
  { value: 5, text: '5세' },
];

// 초상권 해결 옵션
const PHOTO_AI_FACE_OPTION = [
  { text: '적용 안함', value: '' },
  { text: '흐림효과', value: 'blurEffect' },
  { text: '스티커', value: 'sticker' },
  { text: '얼굴교체', value: 'faceReplace' },
];

const TASK_TYPE = {
  LECTURE_PLAN: 'LECTURE_PLAN',
  LECTURE_PLAN_REPORT: 'LECTURE_PLAN_REPORT',
  STUDENT_RECORD: 'STUDENT_RECORD',
  STORY_BOARD: 'STORY_BOARD',
  STUDENT_CLASSIFICATION: 'STUDENT_CLASSIFICATION',
  ACTIVITY_CLASSIFICATION: 'ACTIVITY_CLASSIFICATION',
  ETC: 'ETC',
} as const;

export {
  DRIVE_ITEM_TYPE,
  DRIVE_ITEM_OPTIONS,
  IN_TRASH_TYPE,
  FLOATING_BUTTON_TYPE,
  THUMBNAIL_MAP,
  EXTENSIONS,
  YOUTUBE_URL_PATTERN,
  dummyFileList,
  ALLOWED_ICONS,
  IP_ADDRESS,
  PREFIX_THUMB,
  MY_JOB,
  MY_LOCATION,
  prefix,
  SMART_FOLDER_ROOT_TYPE,
  LEAVE_PAGE_CONFIRM_MESSAGE,
  LEAVE_PAGE_CONFIRM_MESSAGE_WITH_BREAK,
  SPECIAL_FILE_TYPE,
  fileTypeMap,
  PUBLIC_FOLDER,
  DUMMY_FOLDER,
  MATERIAL_BREADCRUMB,
  PUBLIC_BREADCRUMB,
  PHOTO_AI_FACE_OPTION,
  AGE_OPTIONS,
  TASK_TYPE,
};
