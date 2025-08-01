export interface ITypeSelectionModal {
  isOpen: boolean;
  onSelect: (type: "A" | "B" | "C") => void;
  onCancel: () => void;
}

export type ReportType = "A" | "B" | "C";

export interface TypeOption {
  type: ReportType;
  imageUrl: string;
  description: string;
  buttonText: string;
}

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

export interface AddPictureProps {
  children: React.ReactNode;
  targetImageRatio?: {
    width: number;
    height: number;
    aspectRatio: number;
  };
  targetFrame?: {
    width: number;
    height: number;
    x: number;
    y: number;
  };
}

export interface PhotoFrameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (selectedFrame: number) => void;
}

export interface ReportBottomSectionProps {
  type: ReportType;
}

// 드래그앤드롭 관련 타입 추가
export interface GridItemData {
  id: string;
  index: number;
  category: string;
  images: string[];
  inputValue: string;
}

export interface DragItem {
  type: string;
  id: string;
  index: number;
}

export interface GridItem {
  id: string;
  index: number;
  category: string;
  images: string[];
  inputValue: string;
  cardType?: 'large' | 'small'; // 3개 레이아웃에서 카드 타입
  colSpan?: number; // 컬럼 스팬 설정
}

export interface GridAElementProps {
  index: number;
  gridId: string;
  style?: React.CSSProperties;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  moveCard?: (dragIndex: number, hoverIndex: number) => void;
  // React Grid Layout 관련 추가 props
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  category?: string;
  images?: string[];
  onAIGenerate?: () => void;
  onImageUpload?: () => void;
  placeholderText?: string;
  onMove?: (dragIndex: number, hoverIndex: number) => void;
  animationState?: AnimationState;
}

export interface PositionAnimation {
  id: string;
  fromIndex: number;
  toIndex: number;
  duration: number;
}

export interface AnimationState {
  isAnimating: boolean;
  direction?: 'to-left' | 'to-right' | 'to-up' | 'to-down' | 'to-up-left' | 'to-up-right' | 'to-down-left' | 'to-down-right';
  progress: number;
}

// React Beautiful DnD 관련 타입 추가
export interface GridData {
  id: string;
  index: number;
  category: string;
  images: string[];
  inputValue: string;
}

export interface DragResult {
  draggableId: string;
  type: string;
  source: {
    droppableId: string;
    index: number;
  };
  destination?: {
    droppableId: string;
    index: number;
  } | null;
  reason: string;
}

export interface GridAElementDndProps {
  index: number;
  gridId: string;
  style?: React.CSSProperties;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  category?: string;
  images?: string[];
  onAIGenerate?: () => void;
  onImageUpload?: () => void;
  placeholderText?: string;
  gridData: GridData;
}

// @dnd-kit 관련 타입 추가
export interface DndGridAElementProps {
  index: number;
  gridId: string;
  style?: React.CSSProperties;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  category?: string;
  images?: string[];
  onAIGenerate?: () => void;
  onImageUpload?: () => void;
  placeholderText?: string;
  isDragging?: boolean;
  dragAttributes?: any;
  dragListeners?: any;
  cardType?: 'large' | 'small';
}

// GridB 컴포넌트용 타입 추가
export interface GridBItem {
  id: string;
  index: number;
  isSelected: boolean;
  isExpanded: boolean;
  isHidden: boolean;
  images?: string[];
  inputValue?: string;
}

export interface GridBElementDndProps {
  index: number;
  gridId?: string;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  isSelected?: boolean;
  onSelectChange?: (isSelected: boolean) => void;
  images?: string[];
  onAIGenerate?: () => void;
  onImageUpload?: () => void;
  onDelete?: () => void;
  placeholderText?: string;
  isExpanded?: boolean;
  isHidden?: boolean;
  isDragging?: boolean;
  dragAttributes?: any;
  dragListeners?: any;
}

// ImageEditModal 관련 타입들
export interface ImageEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrls: string[];
  selectedImageIndex?: number;
  onApply: (editedImageData: string) => void;
  onImageOrderChange?: (newOrder: string[]) => void;
  targetFrame?: {
    width: number;
    height: number;
    x: number;
    y: number;
  };
}

// 이미지 썸네일 관련 타입들
export interface ImageThumbnailProps {
  imageUrl: string;
  index: number;
  isActive: boolean;
  onSelect: (index: number) => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  totalCount: number;
}

export interface ImageThumbnailListProps {
  imageUrls: string[];
  activeImageIndex: number;
  onImageSelect: (index: number) => void;
  onImageOrderChange: (fromIndex: number, toIndex: number) => void;
  isLoading: boolean;
  hasCurrentImage: boolean;
}

export interface CustomControl {
  x: number;
  y: number;
  offsetX?: number;
  offsetY?: number;
  cursorStyle: string;
  actionHandler: any;
  render: any;
  cornerSize: number;
  touchCornerSize: number;
}

export interface FabricImageObject {
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  angle?: number;
  left?: number;
  top?: number;
  set: (options: any) => void;
  setControlsVisibility: (controls: any) => void;
  controls?: any;
}

export interface FabricCanvasType {
  width?: number;
  height?: number;
  add: (object: any) => void;
  remove: (object: any) => void;
  setActiveObject: (object: any) => void;
  renderAll: () => void;
  clear: () => void;
  dispose: () => void;
  getElement: () => HTMLCanvasElement;
}

export interface ImagePosition {
  x: number;
  y: number;
}

export interface ImageTransform {
  scale: number;
  rotation: number;
  position: ImagePosition;
}

export type EditMode = 'move' | 'crop';

export interface StickerItem {
  id: string;
  stickerIndex: number;
  url: string;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  rotation: number;
  zIndex: number;
}

export interface StickerStore {
  stickers: StickerItem[];
  addSticker: (stickerIndex: number, url: string) => void;
  updateStickerPosition: (id: string, position: { x: number; y: number }) => void;
  updateStickerSize: (id: string, size: { width: number; height: number }) => void;
  updateStickerRotation: (id: string, rotation: number) => void;
  removeSticker: (id: string) => void;
  bringToFront: (id: string) => void;
}

// 텍스트 스티커 관련 타입들
export interface TextStickerItem {
  id: string;
  type: 'basic' | 'bubble';
  textType?: 'title' | 'subtitle' | 'body'; // 기본 탭에서만 사용
  bubbleIndex?: number; // 말풍선 탭에서만 사용
  text: string;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  rotation: number;
  zIndex: number;
  backgroundUrl?: string; // 말풍선 이미지 URL
}

export interface TextStickerStore {
  textStickers: TextStickerItem[];
  addTextSticker: (sticker: Omit<TextStickerItem, 'id' | 'zIndex'>) => void;
  updateTextStickerPosition: (id: string, position: { x: number; y: number }) => void;
  updateTextStickerSize: (id: string, size: { width: number; height: number }) => void;
  updateTextStickerRotation: (id: string, rotation: number) => void;
  updateTextStickerText: (id: string, text: string) => void;
  removeTextSticker: (id: string) => void;
  bringTextStickerToFront: (id: string) => void;
}

// FabricCanvas 관련 타입들
export interface FabricCanvasProps {
  imageUrl: string;
  canvasWidth: number;
  canvasHeight: number;
  imageTransform: {
    scale: number;
    rotation: number;
    translateX: number;
    translateY: number;
  };
  onImageChange?: (imageObject: any) => void;
}

export interface ImageCanvasTransform {
  scale: number;
  rotation: number;
  translateX: number;
  translateY: number;
}
