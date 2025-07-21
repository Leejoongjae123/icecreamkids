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
}
