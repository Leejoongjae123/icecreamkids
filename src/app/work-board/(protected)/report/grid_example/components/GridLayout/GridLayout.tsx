'use client';

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { useState, useEffect } from 'react';
import { useGridStore } from '@/app/store/gridStore';
import GridItem from './GridItem';
import { GridItem as GridItemType, GridPosition } from './types';

export default function GridLayout() {
  const { items, initializeGrid, swapItems, moveMergedItem, getItemAt, getValidDropzones, getDropzonePreview } = useGridStore();
  const [activeItem, setActiveItem] = useState<GridItemType | null>(null);
  const [validDropzones, setValidDropzones] = useState<GridPosition[]>([]);
  const [hoveredDropzone, setHoveredDropzone] = useState<GridPosition | null>(null);

  useEffect(() => {
    initializeGrid();
  }, [initializeGrid]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const draggedItem = items.find(item => item.id === active.id);
    setActiveItem(draggedItem || null);
    
    // 병합된 셀을 드래그하는 경우 dropzone 표시
    if (draggedItem && (draggedItem.colSpan || draggedItem.rowSpan)) {
      const dropzones = getValidDropzones(draggedItem);
      setValidDropzones(dropzones);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);
    setValidDropzones([]);
    setHoveredDropzone(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || !overData) return;

    const fromPosition: GridPosition = activeData.position;
    const toPosition: GridPosition = overData.position;
    // 디버깅용: 이동 좌표 출력 (0-index → 1-index 변환하여 보기 쉬움)
    console.log(`DragEnd → from (${fromPosition.row + 1},${fromPosition.col + 1}) to (${toPosition.row + 1},${toPosition.col + 1})`);
    const draggedItem = activeData.item as GridItemType;

    // 같은 위치로 드롭하면 무시
    if (fromPosition.row === toPosition.row && fromPosition.col === toPosition.col) {
      return;
    }

    // 병합된 셀을 드래그하는 경우
    if (draggedItem.colSpan || draggedItem.rowSpan) {
      // 병합된 셀 이동 시도
      const success = moveMergedItem(draggedItem, toPosition);
      if (!success) {
        // 이동 실패 시 원래 위치로 되돌림 (이미 원래 위치에 있음)
        return;
      }
      return;
    }

    // 일반 셀의 경우
    // 드롭 대상 좌표를 스마트하게 조정
    const adjustDropPosition = (pos: GridPosition): GridPosition => {
      // 1) 먼저 해당 위치에 있는 아이템 확인
      const targetItem = getItemAt(pos);
      
      // 2) 병합된 셀이면 그 시작 좌표로 조정
      if (targetItem?.colSpan) {
        console.log(`Drop on merged cell detected, adjusting (${pos.row + 1},${pos.col + 1}) → (${targetItem.row + 1},${targetItem.col + 1})`);
        return { row: targetItem.row, col: targetItem.col };
      }
      
      // 3) 병합된 셀 주변 영역 체크: 사용자가 병합된 셀 바로 옆에 드롭했을 때 
      //    실제로는 병합된 셀 영역을 의도했을 가능성이 높음
      for (const item of items) {
        if (!item.colSpan && !item.rowSpan) continue; // 병합된 셀만 확인
        
        const mergedEndRow = item.row + (item.rowSpan || 1) - 1;
        const mergedEndCol = item.col + (item.colSpan || 1) - 1;
        
        // 병합된 셀 바로 옆 칸에 드롭한 경우
        if ((pos.row >= item.row && pos.row <= mergedEndRow) && 
            (pos.col === mergedEndCol + 1)) { // 오른쪽 인접
          console.log(`Smart adjustment: (${pos.row + 1},${pos.col + 1}) → (${item.row + 1},${item.col + 1}) - adjacent to merged cell`);
          return { row: item.row, col: item.col };
        }
        
        if ((pos.col >= item.col && pos.col <= mergedEndCol) && 
            (pos.row === mergedEndRow + 1)) { // 아래쪽 인접
          console.log(`Smart adjustment: (${pos.row + 1},${pos.col + 1}) → (${item.row + 1},${item.col + 1}) - adjacent to merged cell`);
          return { row: item.row, col: item.col };
        }
      }
      
      return pos;
    };
    
    const adjustedPosition = adjustDropPosition(toPosition);
    toPosition.row = adjustedPosition.row;
    toPosition.col = adjustedPosition.col;

    // 일반 셀 간의 스왑
    swapItems(fromPosition, toPosition);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
        3x3 드래그 앤 드롭 그리드
      </h1>
      <div className="text-sm text-center mb-4 text-gray-600">
        아이템을 드래그해서 위치를 바꿔보세요! 병합된 셀도 이동 가능합니다.
      </div>
      
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div 
          className="relative grid grid-cols-3 gap-2 w-full aspect-square max-w-lg mx-auto"
          style={{
            gridTemplateRows: 'repeat(3, 1fr)',
            gridTemplateColumns: 'repeat(3, 1fr)'
          }}
        >
          {items.map((item) => (
            <GridItem 
              key={item.id} 
              item={item}
            />
          ))}
          
          {/* Dropzone 오버레이 */}
          {validDropzones.length > 0 && activeItem && (
            <div className="absolute inset-0 pointer-events-none">
              {validDropzones.map((dropzone, index) => {
                const colSpan = activeItem.colSpan || 1;
                const rowSpan = activeItem.rowSpan || 1;
                const preview = getDropzonePreview(activeItem, dropzone);
                const isHovered = hoveredDropzone?.row === dropzone.row && hoveredDropzone?.col === dropzone.col;
                
                return (
                  <div
                    key={`dropzone-${dropzone.row}-${dropzone.col}`}
                    className={`
                      absolute border-2 border-dashed rounded-lg pointer-events-auto cursor-pointer
                      transition-all duration-200
                      ${preview.valid 
                        ? (isHovered ? 'border-green-500 bg-green-100/80' : 'border-green-400 bg-green-50/60') 
                        : (isHovered ? 'border-red-500 bg-red-100/80' : 'border-red-400 bg-red-50/60')
                      }
                      ${isHovered ? 'scale-105 shadow-lg' : ''}
                    `}
                    style={{
                      gridColumn: `${dropzone.col + 1} / span ${colSpan}`,
                      gridRow: `${dropzone.row + 1} / span ${rowSpan}`,
                      zIndex: 10
                    }}
                    onMouseEnter={() => setHoveredDropzone(dropzone)}
                    onMouseLeave={() => setHoveredDropzone(null)}
                    onClick={() => {
                      if (preview.valid && activeItem) {
                        console.log(`Dropzone click → target (${dropzone.row + 1},${dropzone.col + 1})`);
                        const success = moveMergedItem(activeItem, dropzone);
                        if (success) {
                          setValidDropzones([]);
                          setHoveredDropzone(null);
                          setActiveItem(null);
                        }
                      }
                    }}
                  >
                    <div className="flex items-center justify-center h-full text-xs font-medium">
                      <div className="text-center">
                        <div className={preview.valid ? 'text-green-700' : 'text-red-700'}>
                          {preview.valid ? '✓ 이동 가능' : '✗ 불가능'}
                        </div>
                        {isHovered && preview.affected.length > 0 && (
                          <div className="mt-1 text-xs opacity-75">
                            {preview.affected.length}개 아이템 영향
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DragOverlay>
          {activeItem ? (
            <div 
              className="dnd-overlay will-change-transform bg-white border-2 border-blue-400 rounded-lg p-4 text-center font-medium shadow-lg opacity-90"
              style={{ 
                backgroundColor: activeItem.color || '#f5f5f5',
                transform: 'rotate(3deg) scale(1.05)',
                minWidth: activeItem.colSpan ? '200px' : '80px',
                minHeight: '80px'
              }}
            >
              {activeItem.content}
              {activeItem.colSpan && (
                <div className="absolute top-1 right-1 text-xs text-purple-600 font-bold">
                  병합됨
                </div>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">사용법:</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• 일반 셀을 드래그해서 다른 일반 셀과 위치를 바꿀 수 있습니다</li>
          <li>• 보라색 테두리의 병합된 셀도 이동 가능합니다! 🎉</li>
          <li>• <span className="font-medium">병합된 셀 드래그 시</span>: 초록색 dropzone이 표시됩니다</li>
          <li>• <span className="text-green-600">✓ 초록색 영역</span>: 이동 가능, <span className="text-red-600">✗ 빨간색 영역</span>: 이동 불가</li>
          <li>• dropzone을 클릭하거나 드롭하여 이동 완료</li>
          <li>• 영향받는 아이템들은 자동으로 병합된 셀의 원래 위치로 이동됩니다</li>
        </ul>
      </div>
    </div>
  );
}