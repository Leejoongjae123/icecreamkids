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

interface CardData {
  cardOrder: number;
  photoDriveItemId: number;
  title: string;
  contents: string;
  isUserEdited: boolean;
  playCardId?: number;
  playCardName?: string;
  memoCardId?: number;
  photoDriveItemResult?: {
    id?: number;
    name: string;
    fileType: string;
    thumbUrl?: string;
    originalFile?: any;
    driveItemKey?: string;
  };
  referenceMemoKey?: string;
}
export interface IPreviewData {
  id?: number;
  subject: string;
  objective: string;
  support: string;
  startsAt: string;
  endsAt: string;
  studentAge: number;
  cards?: CardData[];
}
export interface IPreviewContent {
  onBackEdit: (updatedData: IPreviewData, isOverPreview?: boolean) => void;
  previewData: IPreviewData;
}