export interface MemoIndicatorProps {
  show: boolean;
  driveItemKey?: string;
  onMemoClick?: () => void;
}

export interface MemoData {
  title?: string | null;
  memo: string;
}
