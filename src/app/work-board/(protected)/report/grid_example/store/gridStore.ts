import { create } from 'zustand';
import { GridItem, GridPosition } from '@/app/components/GridLayout/types';
import { calculateSwitchPositions } from '@/app/utils/gridCalculator';

interface GridStore {
  items: GridItem[];
  initializeGrid: () => void;
  swapItems: (fromPosition: GridPosition, toPosition: GridPosition) => void;
  moveMergedItem: (mergedItem: GridItem, toPosition: GridPosition) => boolean;
  getItemAt: (position: GridPosition) => GridItem | undefined;
  getItemsInArea: (startPos: GridPosition, colSpan: number, rowSpan: number) => GridItem[];
  getValidDropzones: (mergedItem: GridItem) => GridPosition[];
  getDropzonePreview: (mergedItem: GridItem, dropPosition: GridPosition) => {
    affected: GridItem[];
    valid: boolean;
  };
}

export const useGridStore = create<GridStore>((set, get) => ({
  items: [],
  
  initializeGrid: () => {
    const initialItems: GridItem[] = [
      // 첫 번째 행 - 1,1과 1,2 셀 병합
      {
        id: 'merged-1-1-2',
        content: 'Merged Cell (1,1 + 1,2)',
        row: 0,
        col: 0,
        colSpan: 2,
        color: '#e3f2fd'
      },
      {
        id: 'item-1-3',
        content: 'Item (1,3)',
        row: 0,
        col: 2,
        color: '#f3e5f5'
      },
      // 두 번째 행
      {
        id: 'item-2-1',
        content: 'Item (2,1)',
        row: 1,
        col: 0,
        color: '#e8f5e8'
      },
      {
        id: 'item-2-2',
        content: 'Item (2,2)',
        row: 1,
        col: 1,
        color: '#fff3e0'
      },
      {
        id: 'item-2-3',
        content: 'Item (2,3)',
        row: 1,
        col: 2,
        color: '#fce4ec'
      },
      // 세 번째 행
      {
        id: 'item-3-1',
        content: 'Item (3,1)',
        row: 2,
        col: 0,
        color: '#e0f2f1'
      },
      {
        id: 'item-3-2',
        content: 'Item (3,2)',
        row: 2,
        col: 1,
        color: '#e1f5fe'
      },
      {
        id: 'item-3-3',
        content: 'Item (3,3)',
        row: 2,
        col: 2,
        color: '#f9fbe7'
      }
    ];
    
    set({ items: initialItems });
  },
  
  swapItems: (fromPosition: GridPosition, toPosition: GridPosition) => {
    const { items } = get();
    const fromItem = items.find(item => item.row === fromPosition.row && item.col === fromPosition.col);
    const toItem = items.find(item => item.row === toPosition.row && item.col === toPosition.col);
    
    if (!fromItem || !toItem) return;
    
    // 병합된 셀은 스왑하지 않음
    if (fromItem.colSpan || toItem.colSpan) return;
    
    const updatedItems = items.map(item => {
      if (item.id === fromItem.id) {
        return { ...item, row: toPosition.row, col: toPosition.col };
      }
      if (item.id === toItem.id) {
        return { ...item, row: fromPosition.row, col: fromPosition.col };
      }
      return item;
    });
    
    set({ items: updatedItems });
  },
  
  getItemAt: (position: GridPosition) => {
    const { items } = get();
    return items.find(item => {
      const itemStartRow = item.row;
      const itemEndRow = item.row + (item.rowSpan || 1) - 1;
      const itemStartCol = item.col;
      const itemEndCol = item.col + (item.colSpan || 1) - 1;
      
      return position.row >= itemStartRow && position.row <= itemEndRow &&
             position.col >= itemStartCol && position.col <= itemEndCol;
    });
  },

  getItemsInArea: (startPos: GridPosition, colSpan: number, rowSpan: number) => {
    const { items } = get();
    const itemsInArea: GridItem[] = [];
    
    for (let row = startPos.row; row < startPos.row + rowSpan; row++) {
      for (let col = startPos.col; col < startPos.col + colSpan; col++) {
        const item = items.find(item => 
          item.row === row && 
          item.col === col && 
          !item.colSpan && 
          !item.rowSpan
        );
        if (item) {
          itemsInArea.push(item);
        }
      }
    }
    
    return itemsInArea;
  },

  getValidDropzones: (mergedItem: GridItem) => {
    const colSpan = mergedItem.colSpan || 1;
    const rowSpan = mergedItem.rowSpan || 1;
    const validDropzones: GridPosition[] = [];
    
    // 3x3 그리드에서 병합된 셀이 들어갈 수 있는 모든 위치 계산
    for (let row = 0; row <= 3 - rowSpan; row++) {
      for (let col = 0; col <= 3 - colSpan; col++) {
        // 자기 자신의 현재 위치가 아닌 경우만 추가
        if (!(row === mergedItem.row && col === mergedItem.col)) {
          validDropzones.push({ row, col });
        }
      }
    }
    
    return validDropzones;
  },

  getDropzonePreview: (mergedItem: GridItem, dropPosition: GridPosition) => {
    const { items } = get();

    const { valid, affectedItems } = calculateSwitchPositions(items, mergedItem, dropPosition);
    return { affected: affectedItems, valid };
  },

  moveMergedItem: (mergedItem: GridItem, toPosition: GridPosition) => {
    const { items } = get();
    const { valid, updatedItems } = calculateSwitchPositions(items, mergedItem, toPosition);
    if (!valid) {
      return false;
    }
    set({ items: updatedItems });
    return true;
  }
}));