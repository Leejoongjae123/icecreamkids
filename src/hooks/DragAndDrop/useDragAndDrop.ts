import { useState, type Dispatch, type SetStateAction } from 'react';
import type { IDragAndDropFileState } from '@/components/common/DragAndDrop/types';

interface IUseDragAndDropProps<T> {
  initialItems: T[];
  onItemsChange?: (items: T[]) => void;
  onSelectionChange?: (ids: number[]) => void;
}

interface IUseDragAndDropReturn<T> {
  availableItems: T[];
  uploadedItems: T[];
  selectedIds: number[];
  setUploadedItems: Dispatch<SetStateAction<T[]>>;
  setSelectedIds: Dispatch<SetStateAction<number[]>>;
  updateAvailableItems: (items: T[]) => void;
}

export function useDragAndDrop<T>({
  initialItems,
  onItemsChange,
  onSelectionChange,
}: IUseDragAndDropProps<T>): IUseDragAndDropReturn<T> {
  const [state, setState] = useState<IDragAndDropFileState<T>>({
    availableItems: initialItems,
    uploadedItems: [],
    selectedIds: [],
  });

  const setUploadedItems: Dispatch<SetStateAction<T[]>> = (items) => {
    const newItems = typeof items === 'function' ? items(state.uploadedItems) : items;
    setState((prev) => ({
      ...prev,
      uploadedItems: newItems,
    }));
    onItemsChange?.(newItems);
  };

  const setSelectedIds: Dispatch<SetStateAction<number[]>> = (ids) => {
    const newIds = typeof ids === 'function' ? ids(state.selectedIds) : ids;
    setState((prev) => ({
      ...prev,
      selectedIds: newIds,
    }));
    onSelectionChange?.(newIds);
  };

  const updateAvailableItems = (items: T[]) => {
    setState((prev) => ({
      ...prev,
      availableItems: items,
    }));
  };

  return {
    ...state,
    setUploadedItems,
    setSelectedIds,
    updateAvailableItems,
  };
}
