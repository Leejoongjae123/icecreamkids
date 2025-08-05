export interface ImagePosition {
  x: number;
  y: number;
  scale: number;
}

export interface ImageAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  currentPosition: ImagePosition;
  onSave: (position: ImagePosition) => void;
  imageIndex: number;
}