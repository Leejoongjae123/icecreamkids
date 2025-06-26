import { DriveItemMemoResult } from '@/service/file/schemas';

export interface IEditMemoData {
  title?: string | null | undefined;
  memo: string;
}

export interface IEditMemoModal {
  memo: DriveItemMemoResult | IEditMemoData;
  onChangeMemo: (memo: Partial<IEditMemoData>) => void;
  onCancel: () => void;
  onSave: () => void;
  isOpen: boolean;
}
