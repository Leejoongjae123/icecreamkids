import { DriveItemResult } from '@/service/file/schemas';

export interface IRegisteredImage {
  registerId: string;
  id: number;
  name: string;
  sortOrder: number;
  studentRecordId?: number;
  studentId?: number;
  photoDriveItemId?: number;
  isRepresent?: boolean;
  photoItem?: DriveItemResult;
  represent?: boolean;
  thumbUrl: string;
  originalFile?: File;
  type: 'FIEL' | 'SMART' | 'ATTACHED';
}
