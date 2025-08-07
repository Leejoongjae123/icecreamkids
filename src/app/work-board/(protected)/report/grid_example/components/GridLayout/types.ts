export interface GridItem {
  id: string;
  content: string;
  row: number;
  col: number;
  rowSpan?: number;
  colSpan?: number;
  color?: string;
}

export interface GridPosition {
  row: number;
  col: number;
}

export interface GridLayoutProps {
  items: GridItem[];
  onItemsChange: (items: GridItem[]) => void;
}

export interface GridItemProps {
  item: GridItem;
  isActive?: boolean;
  isOver?: boolean;
  onMove?: (fromPosition: GridPosition, toPosition: GridPosition) => void;
}