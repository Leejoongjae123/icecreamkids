type DraggableFileType = any;

interface IDragAndDropFileState<T> {
  availableItems: T[];
  uploadedItems: T[];
  selectedIds: number[];
}
export type { DraggableFileType, IDragAndDropFileState };
