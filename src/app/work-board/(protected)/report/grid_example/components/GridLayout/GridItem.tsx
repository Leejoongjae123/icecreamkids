'use client';

import { useDraggable, useDroppable } from '@dnd-kit/core';
import { GridItem as GridItemType, GridPosition } from './types';

interface GridItemProps {
  item: GridItemType;
  onSwap?: (fromPosition: GridPosition, toPosition: GridPosition) => void;
}

export default function GridItem({ item, onSwap }: GridItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: item.id,
    data: {
      position: { row: item.row, col: item.col },
      item
    }
    // 모든 셀이 드래그 가능
  });

  const {
    setNodeRef: setDropRef,
    isOver,
  } = useDroppable({
    id: `${item.row}-${item.col}`,
    data: {
      position: { row: item.row, col: item.col },
      item
    },
    disabled: false // 모든 셀에 드롭 가능하도록 변경
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    willChange: 'transform',
  } : undefined;

  const gridColumn = item.colSpan 
    ? `${item.col + 1} / span ${item.colSpan}`
    : `${item.col + 1}`;
  
  const gridRow = item.rowSpan 
    ? `${item.row + 1} / span ${item.rowSpan}`
    : `${item.row + 1}`;

  return (
    <div
      ref={(node) => {
        setDragRef(node);
        setDropRef(node);
      }}
      style={{
        ...style,
        gridColumn,
        gridRow,
        backgroundColor: item.color || '#f5f5f5',
      }}
      className={`
        dnd-item
        will-change-transform
        relative
        border-2 border-gray-300
        rounded-lg
        p-4
        text-center
        font-medium
        cursor-move
        hover:shadow-lg
        ${isDragging ? 'opacity-50 z-50 transition-none' : 'transition-all duration-200'}
        ${isOver && !isDragging ? 'border-blue-500 bg-blue-50' : ''}
        ${item.colSpan ? 'border-purple-400' : ''}
      `}
      {...attributes}
      {...listeners}
    >
      <div className="text-sm text-gray-700">
        {item.content}
      </div>
      {item.colSpan && (
        <div className="absolute top-1 right-1 text-xs text-purple-600 font-bold">
          병합됨
        </div>
      )}
    </div>
  );
}