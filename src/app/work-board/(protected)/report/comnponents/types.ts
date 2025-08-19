// Article 데이터 관련 타입 정의

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
}

export interface SearchParams {
  type: string;
  subject: string;
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