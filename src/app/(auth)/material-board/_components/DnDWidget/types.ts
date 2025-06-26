import { SmartFolderResult } from '@/service/file/schemas';

export interface ISortItem {
  widget: SmartFolderResult;
  index: number;
  reorderWidgets: (dragIndex: number, hoverIndex: number) => void;
  onChange: (id: number | string) => void;
  selectedWidgets: Record<number | string, boolean>;
  onDelete: (id: number) => void;
}
