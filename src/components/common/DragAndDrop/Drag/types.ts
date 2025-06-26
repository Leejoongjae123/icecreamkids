import type { ReactNode } from 'react';

interface IDraggableItemProps {
  file: any;
  selectedIds: number[];
  children: ReactNode;
  Container?: React.ElementType;
}

interface IDraggedItems {
  selectedIds: number[];
  type: string;
}
interface IDraggableItemListProps<T> {
  items: T[];
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  renderItem: (item: T) => ReactNode;
  Container?: React.ElementType;
  prev: string;
  next: string;
}

interface ISelectoGridProps {
  onSelectionChange: (selectedIds: number[]) => void;
}

export type { IDraggableItemProps, IDraggedItems, IDraggableItemListProps, ISelectoGridProps };
