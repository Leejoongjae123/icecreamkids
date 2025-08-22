// Article 데이터 관련 타입 정의
import type React from 'react';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface StickerMeta {
  id: number;
  categoryId: number;
  type: string;
  name: string;
  thumbUrl: string;
  imageUrl: string;
  createdAt: string;
}

export interface Sticker {
  id: string;
  stickerIndex: number;
  url: string;
  position: Position;
  size: Size;
  rotation: number;
  zIndex: number;
  meta: StickerMeta;
}

export interface TextSticker {
  id: string;
  text: string;
  position: Position;
  size: Size;
  rotation: number;
  zIndex: number;
  fontSize: number;
  fontColor: string;
  fontFamily: string;
  type?: 'basic' | 'bubble';
  backgroundUrl?: string;
  textType?: 'title' | 'subtitle' | 'body';
  bubbleIndex?: number;
}

export interface SearchParams {
  type: string;
  subject: string;
  articleId?: string;
}

export interface GridLayoutItem {
  id: string;
  index: number;
  category: string;
  images: string[];
  inputValue: string;
  cardType: string;
  colSpan: number;
  imageCount: number;
  isSelected?: boolean;
  isExpanded?: boolean;
  isHidden?: boolean;
}

export interface GridContent {
  hasPlaySubject: boolean;
  hasCategoryValue: boolean;
  hasAiGenerated: boolean;
  hasImages: boolean;
  imageUrls: string[];
  driveItemKeys: string[];
  categoryValue: string;
  playSubjectText?: string;
  gridId: string;
}

export interface VisibleGrids {
  playActivity: boolean;
  teacherSupport: boolean;
  homeConnection: boolean;
}

export interface ReportBottomData {
  playActivityText: string;
  teacherSupportText: string;
  homeConnectionText: string;
  visibleGrids: VisibleGrids;
}

// 제목(헤더) 영역 데이터
export interface ReportTitleData {
  image?: {
    url: string;
    driveItemKey?: string;
  } | null;
  titleText: string; // 중앙 큰 제목 텍스트
  topText: string; // 우측 상단 박스 텍스트
  bottomText: string; // 우측 하단 박스 텍스트
  visible: {
    image: boolean;
    text: boolean;
    date: boolean;
  };
}

export interface ArticleData {
  id: string;
  reportType: string;
  subject: number;
  stickers: Sticker[];
  textStickers: TextSticker[];
  savedAt: string;
  title: string;
  description: string;
  searchParams: SearchParams;
  gridLayout: GridLayoutItem[];
  gridContents: Record<string, GridContent>;
  reportBottomData: ReportBottomData;
  backgroundImageUrl: string;
  imagePositionsMap: Record<string, any>;
  reportTitleData?: ReportTitleData;
}

// ===== 추가: 저장 스토어/스티커 스토어 등에서 사용하는 내부 타입들 =====
export type ReportType = 'A' | 'B' | 'C';

export interface StickerItem extends Omit<Sticker, 'meta'> {
  meta?: StickerMeta;
}

export interface TextStickerItem extends TextSticker {}

export type GridItem = GridLayoutItem;
export type GridBItem = GridLayoutItem;

export interface SavedReportData {
  id: string;
  reportType: ReportType;
  subject: number;
  stickers: StickerItem[];
  textStickers: TextStickerItem[];
  savedAt: string;
  title: string;
  description?: string;
  searchParams?: Record<string, string>;
  gridLayout?: GridItem[];
  gridContents?: Record<string, any>;
  reportBottomData?: ReportBottomData;
  backgroundImageUrl?: string;
  imagePositionsMap?: Record<string, any[]>;
  reportTitleData?: ReportTitleData;
}

export interface SavedDataStore {
  savedReports: SavedReportData[];
  currentSavedData: SavedReportData | null;
  isSaved: boolean;
  saveCurrentReport: (
    reportType: ReportType,
    subject: number,
    stickers: StickerItem[],
    textStickers: TextStickerItem[],
    title?: string,
    description?: string,
    searchParams?: Record<string, string>,
    gridLayout?: GridItem[],
    gridContents?: Record<string, any>,
    reportBottomData?: ReportBottomData,
    backgroundImageUrl?: string,
    imagePositionsMap?: Record<string, any[]>,
    reportTitleData?: ReportTitleData,
  ) => string;
  loadSavedReport: (id: string) => SavedReportData | null;
  deleteSavedReport: (id: string) => void;
  updateSavedReport: (id: string, updates: Partial<SavedReportData>) => void;
  setCurrentSavedData: (data: SavedReportData | null) => void;
  getAllSavedReports: () => SavedReportData[];
  setSaved: (saved: boolean) => void;
  exportToArticleDataFile: (reportData: SavedReportData) => void;
}

export interface StickerStore {
  stickers: StickerItem[];
  setStickers: (stickers: StickerItem[]) => void;
  addSticker: (payload: {
    stickerIndex: number;
    url: string;
    meta?: StickerMeta;
    position?: Position;
    size?: Size;
    rotation?: number;
    zIndex?: number;
  }) => void;
  updateStickerPosition: (id: string, position: Position) => void;
  updateStickerSize: (id: string, size: Size) => void;
  updateStickerRotation: (id: string, rotation: number) => void;
  removeSticker: (id: string) => void;
  bringToFront: (id: string) => void;
}

export interface TextStickerStore {
  textStickers: TextStickerItem[];
  setTextStickers: (stickers: TextStickerItem[]) => void;
  addTextSticker: (stickerData: Omit<TextStickerItem, 'id' | 'zIndex'>) => void;
  updateTextStickerPosition: (id: string, position: Position) => void;
  updateTextStickerSize: (id: string, size: Size) => void;
  updateTextStickerRotation: (id: string, rotation: number) => void;
  updateTextStickerText: (id: string, text: string) => void;
  removeTextSticker: (id: string) => void;
  bringTextStickerToFront: (id: string) => void;
}

// ===== Remote API 응답 및 데코레이션 타입 =====
export interface RemoteResponse<T> {
  result: T;
  [key: string]: any;
}

export interface DecorationCategoryRemote {
  id: number;
  name: string;
  [key: string]: any;
}

export interface DecorationItemRemote {
  id: number;
  name: string;
  thumbUrl?: string;
  imageUrl?: string;
  [key: string]: any;
}

// ===== 컴포넌트 Props 타입 =====
export interface ReportBottomSectionProps {
  type: ReportType;
  initialData?: ReportBottomData;
}

// ===== 이미지 편집 모달 Props =====
export interface ImageEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrls: string[];
  selectedImageIndex?: number;
  onApply?: (processedImages: { imageUrls: string[]; imagePositions: any[] }) => void;
  onImageOrderChange?: (newOrder: string[]) => void;
  targetFrame?: { width: number; height: number; x: number; y: number };
}

export interface ImageThumbnailProps {
  imageUrl: string;
  index: number;
  isActive: boolean;
  onSelect: (index: number) => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  totalCount: number;
}

// ===== 테마 관련 타입 =====
export interface ThemeItem {
  id: string | number;
  name: string;
  thumbUrl?: string;
  previewUrl?: string;
  backgroundImageUrl?: string;
  backgroundImage?: string | {
    id: number;
    imageUrl: string;
  };
  [key: string]: any;
}

// ===== 타입 선택 모달 =====
export interface TypeOption {
  type: ReportType;
  name?: string;
  description: string;
  icon?: string;
  imageUrl?: string;
  buttonText?: string;
}

export interface ITypeSelectionModal {
  isOpen: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onSelect: (type: ReportType) => void;
}

export interface ThemeItemListResponse {
  result: ThemeItem[];
  [key: string]: any;
}

// ===== 사진틀(클리핑 패스) 관련 타입 =====
export interface ClipPathItem {
  id: string;
  name: string;
  pathData: string;
}

// ===== 업로드/이미지 선택 관련 타입 =====
export interface UploadedFile {
  id: number;
  file: File;
  preview: string;
  name: string;
}

export interface FileUploadProps {
  onFilesChange: (files: UploadedFile[]) => void;
  selectedFiles: Set<number>;
  onFileSelect: (index: number) => void;
}

// ===== AddPicture / AddPictureClipping 컴포넌트 공용 Props =====
export interface AddPictureProps {
  children: React.ReactNode;
  targetImageRatio?: number;
  targetFrame?: { width: number; height: number; aspectRatio?: number };
  onImageAdded?: (isAdded: boolean, imageUrl?: string) => void;
  onImagesAdded?: (imageUrls: string[]) => void;
  imageIndex?: number;
  mode?: 'single' | 'multiple';
  hasImage?: boolean;
  maxImageCount?: number;
  // 클리핑/그리드 확장 관련 (선택적)
  clipPathData?: { id: string; pathData: string };
  gridId?: string;
  isClippingEnabled?: boolean;
  imageTransformData?: { x: number; y: number; width: number; height: number; scale: number } | null;
}