// 3프리뷰 화면
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
