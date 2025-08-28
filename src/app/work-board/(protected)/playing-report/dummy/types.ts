// Moveable 관련 타입 정의
export interface MoveableTransform {
  translate: [number, number]; // [x, y] 이동
  scale: [number, number];     // [scaleX, scaleY] 크기
  rotate: number;              // 회전 각도 (도)
  matrix?: number[];           // 변형 매트릭스
}

// 이미지 편집 상태
export interface ImageEditState {
  isEditing: boolean;          // 편집 모드 여부
  transform: MoveableTransform; // Moveable 변형 데이터
  bounds?: {                   // 이동 범위 제한
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
}

// 그리드 아이템 인터페이스
export interface GridItem {
  id: string;
  color: string;
  shape: 'circle' | 'square' | 'star' | 'heart' | 'ellipse';
  borderWidth: number;
  imageUrl?: string;           // 이미지 URL
  isUnclipped?: boolean;       // 클리핑 해제 상태
  editState?: ImageEditState;  // 이미지 편집 상태
}

// 그리드 위치 정보
export interface GridPosition {
  x: number;
  y: number;
}

// Moveable 이벤트 핸들러 타입
export interface MoveableHandlers {
  onDrag?: (id: string, translate: [number, number]) => void;
  onResize?: (id: string, scale: [number, number]) => void;
  onRotate?: (id: string, rotate: number) => void;
  onEditStart?: (id: string) => void;
  onEditEnd?: (id: string) => void;
}

// Canvas 기반 이미지 변형 정보
export interface CanvasTransform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
}

// Canvas 기반 그리드 아이템
export interface CanvasGridItem {
  id: string;
  color: string;
  shape: 'circle' | 'square' | 'star' | 'heart' | 'ellipse';
  borderWidth: number;
  imageUrl?: string;
  isUnclipped: boolean;
  // Canvas에서의 이미지 변형 정보
  imageTransform: CanvasTransform;
  // 마스크(캔버스) 정보
  maskSize: { width: number; height: number };
  maskPosition: { x: number; y: number };
}

// Canvas 핸들러들
export interface CanvasHandlers {
  onImageTransform?: (id: string, transform: CanvasTransform) => void;
  onEditStart?: (id: string) => void;
  onEditEnd?: (id: string) => void;
}



export interface SvgItem {
  id: string;
  name: string;
  svgPath: string;
  clipPath: string;
}

// 이미지 변형 정보
export interface ImageTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

// 클리핑 패스 아이템
export interface ClipPathItem {
  id: string;
  name: string;
  pathData: string;  // SVG path 데이터
}

export interface DragItem extends SvgItem {
  position: GridPosition;
  backgroundImageUrl?: string;  // 배경 이미지 URL
  isClipped: boolean;          // 클리핑 상태
  imageTransform: ImageTransform; // 이미지 변형 정보
} 