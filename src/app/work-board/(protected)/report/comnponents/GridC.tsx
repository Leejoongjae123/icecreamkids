"use client";
import * as React from "react";
import {
  DndContext,
  closestCenter,
  rectIntersection,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  CollisionDetection,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import GridCElement from "./GridCElement";
import SortableGridCItem from "./SortableGridCItem";
import { clipPathItems } from "../dummy/svgData";
import { ClipPathItem } from "../dummy/types";

interface GridCItem {
  id: string;
  index: number;
  clipPathData: ClipPathItem;
  imageUrl: string;
}

// 그리드 위치 정보 타입
interface GridPosition {
  row: number;
  col: number;
  width: number;
  height: number;
}

interface GridCProps {
  isClippingEnabled: boolean;
  photoCount: number;
}

function GridC({ isClippingEnabled, photoCount }: GridCProps) {
  // photoCount에 따라 그리드 아이템 데이터 관리
  const [items, setItems] = React.useState<GridCItem[]>(() => {
    const initialItems: GridCItem[] = [];
    const defaultImage = "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg";
    
    for (let i = 0; i < photoCount; i++) {
      // circle-1과 rounded-square-2 중에서 랜덤 선택
      const randomIndex = Math.floor(Math.random() * clipPathItems.length);
      const clipPath = clipPathItems[randomIndex];
      initialItems.push({
        id: `grid-c-${i}`,
        index: i,
        clipPathData: clipPath,
        imageUrl: defaultImage,
      });
    }
    return initialItems;
  });

  // 선택된 아이템들 관리
  const [selectedItems, setSelectedItems] = React.useState<Set<string>>(new Set());

  // photoCount가 변경되면 items 재생성
  React.useEffect(() => {
    const defaultImage = "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg";
    const newItems: GridCItem[] = [];
    
    for (let i = 0; i < photoCount; i++) {
      // circle-1과 rounded-square-2 중에서 랜덤 선택
      const randomIndex = Math.floor(Math.random() * clipPathItems.length);
      const clipPath = clipPathItems[randomIndex];
      newItems.push({
        id: `grid-c-${i}`,
        index: i,
        clipPathData: clipPath,
        imageUrl: defaultImage,
      });
    }
    setItems(newItems);
    // 아이템이 변경되면 선택 상태 초기화
    setSelectedItems(new Set());
    // photoCount가 3일 때 큰 아이템 위치 초기화 (기본값: 위쪽)
    if (photoCount === 3) {
      setLargeItemPosition(0);
    }
  }, [photoCount]);

  // 현재 드래그 중인 아이템
  const [activeId, setActiveId] = React.useState<string | null>(null);

  // photoCount가 3일 때 큰 아이템의 위치 추적 (0: 위쪽, 2: 아래쪽)
  const [largeItemPosition, setLargeItemPosition] = React.useState<number>(0);
  // photoCount가 8일 때 가로 2x1 넓은 영역의 행 위치 추적 (2행 또는 3행)
  const [wideRowForPhoto8, setWideRowForPhoto8] = React.useState<2 | 3>(3);

  // 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 커스텀 collision detection - 다양한 크기의 그리드를 고려
  const customCollisionDetection: CollisionDetection = (args) => {
    // 1) 포인터가 위치한 droppable 우선
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }

    // 2) 사각형 교차 영역 확인
    const rectCollisions = rectIntersection(args);
    if (rectCollisions.length > 0) {
      return rectCollisions;
    }

    // 3) 마지막으로 center 기준
    return closestCenter(args);
  };

  // photoCount가 3일 때 레이아웃 재계산 함수
  const recalculateLayoutForPhoto3 = (items: GridCItem[], targetLargeIndex: number): GridCItem[] => {
    if (photoCount !== 3) {
      return items;
    }
    
    // 2x2 그리드에서 큰 아이템은 첫 번째 위치(0) 또는 마지막 위치(2)에만 가능
    // targetLargeIndex가 마지막 위치일 때만 마지막으로, 나머지는 첫 번째로
    const largeIndex = targetLargeIndex === items.length - 1 ? items.length - 1 : 0;
    
    // 큰 아이템 위치 state 업데이트
    setLargeItemPosition(largeIndex);
    
    return items.map((item, index) => ({
      ...item,
      index,
    }));
  };

  // 드롭 좌표를 그리드 좌표로 변환하는 함수
  const getGridCoordinatesFromPoint = (x: number, y: number, gridElement: HTMLElement): { row: number; col: number } => {
    const rect = gridElement.getBoundingClientRect();
    const relativeX = x - rect.left;
    const relativeY = y - rect.top;
    
    // 그리드의 열과 행 수 계산
    const { cols, rows } = getGridDimensions(photoCount);
    
    // 각 셀의 크기 계산 (gap 고려)
    const gap = 16; // gap-4 = 1rem = 16px
    const availableWidth = rect.width - (cols - 1) * gap;
    const availableHeight = rect.height - (rows - 1) * gap;
    const cellWidth = availableWidth / cols;
    const cellHeight = availableHeight / rows;
    
    // 클릭한 위치가 어느 셀인지 계산
    const col = Math.floor(relativeX / (cellWidth + gap)) + 1;
    const row = Math.floor(relativeY / (cellHeight + gap)) + 1;
    
    // 경계값 처리
    return {
      row: Math.max(1, Math.min(row, rows)),
      col: Math.max(1, Math.min(col, cols))
    };
  };
  
  // photoCount에 따른 그리드 차원 계산
  const getGridDimensions = (photoCount: number): { cols: number; rows: number } => {
    switch (photoCount) {
      case 1: return { cols: 1, rows: 1 };
      case 2: return { cols: 2, rows: 1 };
      case 3: return { cols: 2, rows: 2 };
      case 4: return { cols: 2, rows: 2 };
      case 5: return { cols: 3, rows: 3 };
      case 6: return { cols: 3, rows: 3 };
      case 7: return { cols: 3, rows: 3 };
      case 8: return { cols: 3, rows: 3 };
      case 9: return { cols: 3, rows: 3 };
      default: return { cols: 3, rows: Math.ceil(photoCount / 3) };
    }
  };
  
  // 드래그된 아이템이 새 위치에 배치될 때의 실제 그리드 위치 계산
  const calculateNewPosition = (draggedItem: GridCItem, targetRow: number, targetCol: number): GridPosition => {
    const draggedPos = getGridPositionForIndex(photoCount, draggedItem.index, largeItemPosition);
    
    return {
      row: targetRow,
      col: targetCol,
      width: draggedPos.width,
      height: draggedPos.height
    };
  };
  
  // 범용 겹침 감지 및 재배치 로직
  const performUniversalSwap = (draggedIndex: number, newPosition: GridPosition, currentItems: GridCItem[]): GridCItem[] => {
    // 1. 드래그된 아이템의 원래 위치 저장
    const draggedOriginalPos = getGridPositionForIndex(photoCount, draggedIndex, largeItemPosition);
    
    // 2. 새로운 위치에서 겹치는 아이템들 찾기
    const affectedItems: Array<{ item: GridCItem; index: number }> = [];
    
    currentItems.forEach((item, index) => {
      if (index === draggedIndex) return; // 드래그된 아이템 제외
      
      const itemPos = getGridPositionForIndex(photoCount, index, largeItemPosition);
      if (isOverlapping(newPosition, itemPos)) {
        affectedItems.push({ item, index });
      }
    });
    
    // 3. 겹치는 아이템들이 없으면 단순 이동
    if (affectedItems.length === 0) {
      // 인덱스 재매핑 필요
      return redistributeItems(currentItems, draggedIndex, newPosition);
    }
    
    // 4. 겹치는 아이템들을 드래그된 아이템의 원래 위치 영역으로 재배치
    const resultItems = [...currentItems];
    
    // 4-1. 드래그된 아이템을 새 위치에 해당하는 인덱스로 이동
    const newIndex = findIndexForPosition(newPosition, photoCount, largeItemPosition);
    
    // 4-2. 겹치는 아이템들을 원래 위치로 이동
    const availablePositions = getAvailablePositionsInArea(draggedOriginalPos, photoCount, largeItemPosition);
    
    affectedItems.forEach((affected, i) => {
      if (i < availablePositions.length) {
        const targetIndex = findIndexForPosition(availablePositions[i], photoCount, largeItemPosition);
        if (targetIndex !== -1) {
          resultItems[targetIndex] = affected.item;
        }
      }
    });
    
    // 4-3. 드래그된 아이템을 새 위치에 설정
    if (newIndex !== -1) {
      resultItems[newIndex] = currentItems[draggedIndex];
    }
    
    return resultItems.map((item, index) => ({
      ...item,
      index
    }));
  };
  
  // 특정 그리드 위치에 해당하는 아이템 인덱스 찾기
  const findIndexForPosition = (position: GridPosition, currentPhotoCount: number, currentLargeItemPosition: number): number => {
    for (let i = 0; i < currentPhotoCount; i++) {
      const pos = getGridPositionForIndex(currentPhotoCount, i, currentLargeItemPosition);
      if (pos.row === position.row && pos.col === position.col) {
        return i;
      }
    }
    return -1;
  };
  
  // 특정 영역 내에서 사용 가능한 위치들 계산
  const getAvailablePositionsInArea = (area: GridPosition, currentPhotoCount: number, currentLargeItemPosition: number): GridPosition[] => {
    const positions: GridPosition[] = [];
    
    for (let row = area.row; row < area.row + area.height; row++) {
      for (let col = area.col; col < area.col + area.width; col++) {
        positions.push({ row, col, width: 1, height: 1 });
      }
    }
    
    return positions;
  };
  
  // 아이템들을 새로운 배치로 재분배
  const redistributeItems = (currentItems: GridCItem[], movedItemIndex: number, newPosition: GridPosition): GridCItem[] => {
    const result = [...currentItems];
    const newIndex = findIndexForPosition(newPosition, photoCount, largeItemPosition);
    
    if (newIndex !== -1 && newIndex !== movedItemIndex) {
      // arrayMove와 유사한 재배치
      const [moved] = result.splice(movedItemIndex, 1);
      result.splice(newIndex, 0, moved);
    }
    
    return result.map((item, index) => ({
      ...item,
      index
    }));
  };
  
  // 그리드 위치 유효성 검사
  const isValidGridPosition = (position: GridPosition, currentPhotoCount: number): boolean => {
    const { cols, rows } = getGridDimensions(currentPhotoCount);
    
    // 위치가 그리드 경계 내에 있는지 확인
    if (position.row < 1 || position.col < 1) {
      return false;
    }
    
    // 드래그된 아이템이 그리드를 벗어나지 않는지 확인
    if (position.row + position.height - 1 > rows) {
      return false;
    }
    
    if (position.col + position.width - 1 > cols) {
      return false;
    }
    
    return true;
  };

  // photoCount와 index에 따른 그리드 위치 정보 계산
  const getGridPositionForIndex = (photoCount: number, index: number, currentLargeItemPosition: number = 0): GridPosition => {
    switch (photoCount) {
      case 1:
        return { row: 1, col: 1, width: 1, height: 1 };
      
      case 2:
        return {
          row: 1,
          col: index + 1,
          width: 1,
          height: 1
        };
      
      case 3:
        if (currentLargeItemPosition === 0) {
          // 큰 아이템이 위쪽
          if (index === 0) return { row: 1, col: 1, width: 2, height: 1 };
          if (index === 1) return { row: 2, col: 1, width: 1, height: 1 };
          if (index === 2) return { row: 2, col: 2, width: 1, height: 1 };
        } else {
          // 큰 아이템이 아래쪽
          if (index === 0) return { row: 1, col: 1, width: 1, height: 1 };
          if (index === 1) return { row: 1, col: 2, width: 1, height: 1 };
          if (index === 2) return { row: 2, col: 1, width: 2, height: 1 };
        }
        break;
      
      case 4:
        return {
          row: Math.floor(index / 2) + 1,
          col: (index % 2) + 1,
          width: 1,
          height: 1
        };
      
      case 5:
        if (index === 0) return { row: 1, col: 1, width: 2, height: 2 };
        if (index === 1) return { row: 1, col: 3, width: 1, height: 1 };
        if (index === 2) return { row: 2, col: 3, width: 1, height: 1 };
        if (index === 3) return { row: 3, col: 1, width: 1, height: 1 };
        if (index === 4) return { row: 3, col: 2, width: 2, height: 1 };
        break;
      
      case 6:
        if (index === 0) return { row: 1, col: 1, width: 2, height: 2 };
        if (index === 1) return { row: 1, col: 3, width: 1, height: 1 };
        if (index === 2) return { row: 2, col: 3, width: 1, height: 1 };
        if (index === 3) return { row: 3, col: 1, width: 1, height: 1 };
        if (index === 4) return { row: 3, col: 2, width: 1, height: 1 };
        if (index === 5) return { row: 3, col: 3, width: 1, height: 1 };
        break;
      
      case 7:
        if (index === 0) return { row: 1, col: 1, width: 2, height: 1 };
        if (index === 1) return { row: 1, col: 3, width: 1, height: 1 };
        if (index === 2) return { row: 2, col: 1, width: 1, height: 1 };
        if (index === 3) return { row: 2, col: 2, width: 1, height: 1 };
        if (index === 4) return { row: 2, col: 3, width: 1, height: 1 };
        if (index === 5) return { row: 3, col: 1, width: 1, height: 1 };
        if (index === 6) return { row: 3, col: 2, width: 2, height: 1 };
        break;
      
      case 8:
        if (index === 7) {
          // wideRowForPhoto8에 따라 다른 위치
          if (wideRowForPhoto8 === 2) {
            return { row: 2, col: 2, width: 2, height: 1 };
          } else {
            return { row: 3, col: 2, width: 2, height: 1 };
          }
        }
        return {
          row: Math.floor(index / 3) + 1,
          col: (index % 3) + 1,
          width: 1,
          height: 1
        };
      
      case 9:
        return {
          row: Math.floor(index / 3) + 1,
          col: (index % 3) + 1,
          width: 1,
          height: 1
        };
    }
    
    return { row: 1, col: 1, width: 1, height: 1 };
  };

  // 그리드 경계 검사
  const isValidMove = (fromIndex: number, toIndex: number): boolean => {
    const fromPos = getGridPositionForIndex(photoCount, fromIndex, largeItemPosition);
    const toPos = getGridPositionForIndex(photoCount, toIndex, largeItemPosition);
    
    // 드래그된 아이템을 타겟 위치에 배치했을 때의 새로운 위치
    const newPosition: GridPosition = {
      row: toPos.row,
      col: toPos.col,
      width: fromPos.width,
      height: fromPos.height
    };
    
    // 그리드 경계 검사
    let maxCols = 3, maxRows = 3;
    switch (photoCount) {
      case 1: maxCols = 1; maxRows = 1; break;
      case 2: maxCols = 2; maxRows = 1; break;
      case 3:
      case 4: maxCols = 2; maxRows = 2; break;
      default: maxCols = 3; maxRows = 3; break;
    }
    
    return newPosition.col >= 1 && 
           newPosition.row >= 1 && 
           newPosition.col + newPosition.width - 1 <= maxCols && 
           newPosition.row + newPosition.height - 1 <= maxRows;
  };

  // 두 그리드 위치가 겹치는지 확인하는 범용 함수
  const isOverlapping = (pos1: GridPosition, pos2: GridPosition): boolean => {
    return !(pos1.col + pos1.width <= pos2.col || 
             pos2.col + pos2.width <= pos1.col || 
             pos1.row + pos1.height <= pos2.row || 
             pos2.row + pos2.height <= pos1.row);
  };

  // 특정 위치에 아이템을 배치했을 때 겹치는 아이템들을 찾는 범용 함수
  const findAffectedItems = (
    draggedIndex: number, 
    newPosition: GridPosition, 
    items: GridCItem[]
  ): number[] => {
    const affected: number[] = [];
    
    for (let i = 0; i < items.length; i++) {
      if (i === draggedIndex) continue;
      
      const itemPosition = getGridPositionForIndex(photoCount, i, largeItemPosition);
      if (isOverlapping(newPosition, itemPosition)) {
        affected.push(i);
      }
    }
    
    return affected;
  };

  // 범용 스마트 스와핑 계산기
  const performSmartSwap = (draggedIndex: number, targetIndex: number, items: GridCItem[]): GridCItem[] => {
    // photoCount 8 특수 처리 (기존 로직 유지)
    if (photoCount === 8 && draggedIndex === 7) {
      if (targetIndex === 4 || targetIndex === 5) {
        setWideRowForPhoto8(2);
        return items;
      }
      if (targetIndex === 6 || targetIndex === 7) {
        setWideRowForPhoto8(3);
        return items;
      }
    }
    
    const draggedPos = getGridPositionForIndex(photoCount, draggedIndex, largeItemPosition);
    const targetPos = getGridPositionForIndex(photoCount, targetIndex, largeItemPosition);
    
    // 드래그된 아이템을 타겟 위치에 배치했을 때의 새로운 위치
    const newDraggedPosition: GridPosition = {
      row: targetPos.row,
      col: targetPos.col,
      width: draggedPos.width,
      height: draggedPos.height
    };
    
    // 경계 검사
    if (!isValidMove(draggedIndex, targetIndex)) {
      return items; // 이동 취소
    }
    
    // 새로운 위치에서 겹치는 아이템들 찾기
    const affectedItems = findAffectedItems(draggedIndex, newDraggedPosition, items);
    
    if (affectedItems.length === 0) {
      // 겹치는 아이템이 없으면 단순 이동
      return arrayMove(items, draggedIndex, targetIndex);
    }
    
    // 범용 재배치 로직
    const result = [...items];
    
    // 1. 드래그된 아이템을 새 위치로 이동
    const draggedItem = result[draggedIndex];
    result.splice(draggedIndex, 1);
    result.splice(targetIndex, 0, draggedItem);
    
    // 2. 영향받은 아이템들을 드래그된 아이템의 원래 위치 근처로 재배치
    const draggedOriginalPos = getGridPositionForIndex(photoCount, draggedIndex, largeItemPosition);
    
    // 드래그된 아이템의 원래 셀들 계산
    const originalCells: Array<{row: number, col: number}> = [];
    for (let r = draggedOriginalPos.row; r < draggedOriginalPos.row + draggedOriginalPos.height; r++) {
      for (let c = draggedOriginalPos.col; c < draggedOriginalPos.col + draggedOriginalPos.width; c++) {
        originalCells.push({row: r, col: c});
      }
    }
    
    // 영향받은 아이템들을 순차적으로 재배치
    affectedItems.forEach((affectedIndex, i) => {
      const currentItemIndex = result.findIndex(item => item.id === items[affectedIndex].id);
      if (currentItemIndex !== -1) {
        const item = result[currentItemIndex];
        result.splice(currentItemIndex, 1);
        
        // 드래그된 아이템의 원래 위치 근처에 배치
        // 가능한 한 원래 공간의 셀에 맞춰 배치
        let insertIndex = draggedIndex;
        
        // 원래 셀에 해당하는 인덱스 찾기
        if (i < originalCells.length) {
          const targetCell = originalCells[i];
          for (let idx = 0; idx < photoCount; idx++) {
            const pos = getGridPositionForIndex(photoCount, idx, largeItemPosition);
            if (pos.row <= targetCell.row && targetCell.row < pos.row + pos.height &&
                pos.col <= targetCell.col && targetCell.col < pos.col + pos.width) {
              insertIndex = idx;
              break;
            }
          }
        }
        
        // 안전한 삽입 위치 보장
        insertIndex = Math.min(insertIndex, result.length);
        result.splice(insertIndex, 0, item);
      }
    });
    
    return result;
  };

  // 드래그 시작 핸들러
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // 그리드 컨테이너 ref
  const [gridContainer, setGridContainer] = React.useState<HTMLDivElement | null>(null);
  
  // 그리드 컨테이너를 droppable로 설정
  const { setNodeRef } = useDroppable({
    id: 'grid-container',
  });
  
  // 드래그 종료 핸들러 (범용 계산기)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, activatorEvent } = event;
    
    setItems((currentItems) => {
      const draggedIndex = currentItems.findIndex(item => item.id === active.id);
      
      if (draggedIndex === -1) {
        return currentItems;
      }
      
      const draggedItem = currentItems[draggedIndex];
      
      // 1. 드래그된 아이템과 over된 아이템이 있는 경우 (기존 아이템 간 스와핑)
      if (over?.id && over.id !== 'grid-container') {
        const overIndex = currentItems.findIndex(item => item.id === over.id);
        if (overIndex !== -1) {
          // 기존 스마트 스와핑 로직 사용
          return performSmartSwap(draggedIndex, overIndex, currentItems);
        }
      }
      
      // 2. 그리드 컨테이너에 드롭된 경우 (자유로운 위치 드래그)
      if (over?.id === 'grid-container' && activatorEvent && gridContainer) {
        // 마우스 이벤트에서 좌표 추출
        let clientX: number, clientY: number;
        
        if ('clientX' in activatorEvent && typeof activatorEvent.clientX === 'number') {
          clientX = activatorEvent.clientX;
          clientY = ('clientY' in activatorEvent && typeof activatorEvent.clientY === 'number') ? activatorEvent.clientY : clientX;
        } else {
          // 터치 이벤트의 경우
          const touches = 'touches' in activatorEvent && Array.isArray(activatorEvent.touches) ? activatorEvent.touches : [];
          if (touches.length > 0 && touches[0] && typeof touches[0].clientX === 'number') {
            clientX = touches[0].clientX;
            clientY = touches[0].clientY;
          } else {
            return currentItems; // 좌표를 얻을 수 없으면 변경하지 않음
          }
        }
        
        // 좌표를 그리드 좌표로 변환
        const { row, col } = getGridCoordinatesFromPoint(clientX, clientY, gridContainer);
        
        // 새로운 위치 계산
        const newPosition = calculateNewPosition(draggedItem, row, col);
        
        // 경계 검사
        if (!isValidGridPosition(newPosition, photoCount)) {
          return currentItems; // 유효하지 않으면 변경하지 않음
        }
        
        // 범용 스와핑 로직 적용
        return performUniversalSwap(draggedIndex, newPosition, currentItems);
      }
      
      // 3. 기타 경우 변경하지 않음
      return currentItems;
    });

    setActiveId(null);
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = (gridId: string, imageUrl: string) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === gridId 
          ? { ...item, imageUrl }
          : item
      )
    );
  };

  // 클립패스 변경 핸들러
  const handleClipPathChange = (gridId: string, clipPathData: ClipPathItem) => {
    console.log("GridC - 클립패스 변경:", { gridId, clipPathData });
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === gridId ? { ...item, clipPathData } : item
      )
    );
  };

  // 선택 상태 변경 핸들러
  const handleSelectChange = (gridId: string, isSelected: boolean) => {
    setSelectedItems(prev => {
      const newSelected = new Set(prev);
      if (isSelected) {
        newSelected.add(gridId);
      } else {
        newSelected.delete(gridId);
      }
      return newSelected;
    });
  };

  // 아이템 삭제 핸들러
  const handleDelete = (gridId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== gridId));
    setSelectedItems(prev => {
      const newSelected = new Set(prev);
      newSelected.delete(gridId);
      return newSelected;
    });
  };

  const activeItem = items.find(item => item.id === activeId);

  // photo 값에 따른 그리드 레이아웃 설정
  const getGridLayoutConfig = (currentItems: GridCItem[] = items) => {
    switch (photoCount) {
      case 1:
        // 1개: 전체를 하나로 구성
        return {
          className: "grid grid-cols-1 grid-rows-1 gap-4 w-full h-full max-w-4xl mx-auto",
          itemStyles: {
            0: { gridColumn: "1 / -1", gridRow: "1 / -1" }
          } as Record<number, React.CSSProperties>
        };
      
      case 2:
        // 2개: 전체를 가로로 2개 배치
        return {
          className: "grid grid-cols-2 grid-rows-1 gap-4 w-full h-full max-w-4xl mx-auto",
          itemStyles: {
            0: { gridColumn: "1", gridRow: "1" },
            1: { gridColumn: "2", gridRow: "1" }
          } as Record<number, React.CSSProperties>
        };
      
      case 3:
        // 3개: 2x2격자에서 큰 아이템 위치에 따라 동적 레이아웃
        // 큰 아이템이 위에 있으면: 첫 번째 행 전체 + 두 번째 행 좌우
        // 큰 아이템이 아래에 있으면: 첫 번째 행 좌우 + 두 번째 행 전체
        
        // largeItemPosition state를 사용하여 큰 아이템 위치 결정
        const isLargeAtBottom = largeItemPosition === 2;
        const isLargeAtTop = !isLargeAtBottom;
        
        return {
          className: "grid grid-cols-2 grid-rows-2 gap-4 w-full h-full max-w-4xl mx-auto",
          itemStyles: isLargeAtTop ? {
            0: { gridColumn: "1 / 3", gridRow: "1" }, // 첫 번째 행 전체 (큰 아이템)
            1: { gridColumn: "1", gridRow: "2" },      // 두 번째 행 왼쪽 (작은 아이템)
            2: { gridColumn: "2", gridRow: "2" }       // 두 번째 행 오른쪽 (작은 아이템)
          } : {
            0: { gridColumn: "1", gridRow: "1" },      // 첫 번째 행 왼쪽 (작은 아이템)
            1: { gridColumn: "2", gridRow: "1" },      // 첫 번째 행 오른쪽 (작은 아이템)  
            2: { gridColumn: "1 / 3", gridRow: "2" }   // 두 번째 행 전체 (큰 아이템)
          } as Record<number, React.CSSProperties>
        };
      
      case 4:
        // 4개: 2x2격자로 구성
        return {
          className: "grid grid-cols-2 grid-rows-2 gap-4 w-full h-full max-w-4xl mx-auto",
          itemStyles: {
            0: { gridColumn: "1", gridRow: "1" },
            1: { gridColumn: "2", gridRow: "1" },
            2: { gridColumn: "1", gridRow: "2" },
            3: { gridColumn: "2", gridRow: "2" }
          } as Record<number, React.CSSProperties>
        };
      
      case 5:
        // 5개: 3x3격자에서 1,1과 1,2와 2,1과 2,2를 합치고, 3,2와 3,3을 합치고, 나머지는 개별격자로 구성
        return {
          className: "grid grid-cols-3 grid-rows-3 gap-4 w-full h-full max-w-4xl mx-auto",
          itemStyles: {
            0: { gridColumn: "1 / 3", gridRow: "1 / 3" }, // 큰 영역 (1,1부터 2,2까지)
            1: { gridColumn: "3", gridRow: "1" },          // 오른쪽 위 (3,1)
            2: { gridColumn: "3", gridRow: "2" },          // 오른쪽 중간 (3,2)
            3: { gridColumn: "1", gridRow: "3" },          // 아래쪽 왼쪽 (1,3)
            4: { gridColumn: "2 / 4", gridRow: "3" }       // 아래쪽 오른쪽 합친 영역 (2,3부터 3,3까지)
          } as Record<number, React.CSSProperties>
        };
      
      case 6:
        // 6개: 3x3격자에서 1,1과 1,2와 2,1과 2,2를 합치고 나머지는 개별격자로 구성
        return {
          className: "grid grid-cols-3 grid-rows-3 gap-4 w-full h-full max-w-4xl mx-auto",
          itemStyles: {
            0: { gridColumn: "1 / 3", gridRow: "1 / 3" }, // 큰 영역 (1,1부터 2,2까지)
            1: { gridColumn: "3", gridRow: "1" },          // 오른쪽 위 (3,1)
            2: { gridColumn: "3", gridRow: "2" },          // 오른쪽 중간 (3,2)
            3: { gridColumn: "1", gridRow: "3" },          // 아래쪽 왼쪽 (1,3)
            4: { gridColumn: "2", gridRow: "3" },          // 아래쪽 중간 (2,3)
            5: { gridColumn: "3", gridRow: "3" }           // 아래쪽 오른쪽 (3,3)
          } as Record<number, React.CSSProperties>
        };
      
      case 7:
        // 7개: 3x3격자에서 1,1과 1,2를 합치고 3,2와 3,3을 합치고 나머지는 개별격자로 구성
        return {
          className: "grid grid-cols-3 grid-rows-3 gap-4 w-full h-full max-w-4xl mx-auto",
          itemStyles: {
            0: { gridColumn: "1 / 3", gridRow: "1" },      // 첫 번째 행 합친 영역 (1,1부터 1,2까지)
            1: { gridColumn: "3", gridRow: "1" },          // 오른쪽 위 (3,1)
            2: { gridColumn: "1", gridRow: "2" },          // 두 번째 행 왼쪽 (1,2)
            3: { gridColumn: "2", gridRow: "2" },          // 두 번째 행 중간 (2,2)
            4: { gridColumn: "3", gridRow: "2" },          // 두 번째 행 오른쪽 (3,2)
            5: { gridColumn: "1", gridRow: "3" },          // 세 번째 행 왼쪽 (1,3)
            6: { gridColumn: "2 / 4", gridRow: "3" }       // 세 번째 행 합친 영역 (2,3부터 3,3까지)
          } as Record<number, React.CSSProperties>
        };
      
      case 8:
        // 8개: 3x3격자에서 3,2와 3,3을 합치고 나머지는 개별격자로 구성
        if (wideRowForPhoto8 === 3) {
          return {
            className: "grid grid-cols-3 grid-rows-3 gap-4 w-full h-full max-w-4xl mx-auto",
            itemStyles: {
              0: { gridColumn: "1", gridRow: "1" },          // (1,1)
              1: { gridColumn: "2", gridRow: "1" },          // (2,1)
              2: { gridColumn: "3", gridRow: "1" },          // (3,1)
              3: { gridColumn: "1", gridRow: "2" },          // (1,2)
              4: { gridColumn: "2", gridRow: "2" },          // (2,2)
              5: { gridColumn: "3", gridRow: "2" },          // (3,2)
              6: { gridColumn: "1", gridRow: "3" },          // (1,3)
              7: { gridColumn: "2 / 4", gridRow: "3" }       // (2,3)~(3,3)
            } as Record<number, React.CSSProperties>
          };
        }
        // wideRowForPhoto8 === 2 인 경우: 두 번째 행의 (2,2)와 (3,2)를 합치고, 해당 자리에 있던 4,5 인덱스는 각각 (3,2)와 (3,3)으로 이동
        return {
          className: "grid grid-cols-3 grid-rows-3 gap-4 w-full h-full max-w-4xl mx-auto",
          itemStyles: {
            0: { gridColumn: "1", gridRow: "1" },          // (1,1)
            1: { gridColumn: "2", gridRow: "1" },          // (2,1)
            2: { gridColumn: "3", gridRow: "1" },          // (3,1)
            3: { gridColumn: "1", gridRow: "2" },          // (1,2)
            4: { gridColumn: "2", gridRow: "3" },          // (2,3) ← 기존 (2,2) 다운시프트
            5: { gridColumn: "3", gridRow: "3" },          // (3,3) ← 기존 (3,2) 다운시프트
            6: { gridColumn: "1", gridRow: "3" },          // (1,3)
            7: { gridColumn: "2 / 4", gridRow: "2" }       // (2,2)~(3,2)
          } as Record<number, React.CSSProperties>
        };
      
      case 9:
        // 9개: 3x3격자로 구성
        return {
          className: "grid grid-cols-3 grid-rows-3 gap-4 w-full h-full max-w-4xl mx-auto",
          itemStyles: {
            0: { gridColumn: "1", gridRow: "1" },          // (1,1)
            1: { gridColumn: "2", gridRow: "1" },          // (2,1)
            2: { gridColumn: "3", gridRow: "1" },          // (3,1)
            3: { gridColumn: "1", gridRow: "2" },          // (1,2)
            4: { gridColumn: "2", gridRow: "2" },          // (2,2)
            5: { gridColumn: "3", gridRow: "2" },          // (3,2)
            6: { gridColumn: "1", gridRow: "3" },          // (1,3)
            7: { gridColumn: "2", gridRow: "3" },          // (2,3)
            8: { gridColumn: "3", gridRow: "3" }           // (3,3)
          } as Record<number, React.CSSProperties>
        };
      
      default:
        // 기본값 (기존 로직)
        const cols = Math.min(photoCount, 3);
        const rows = Math.ceil(photoCount / cols);
        return {
          className: `grid grid-cols-${cols} gap-4 w-full h-full max-w-4xl mx-auto`,
          itemStyles: {} as Record<number, React.CSSProperties>,
          gridTemplateRows: `repeat(${rows}, 1fr)`
        };
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={items.map(item => item.id)} 
        strategy={rectSortingStrategy}
      >
        <div className="w-full h-full relative flex flex-col">
          <div 
            ref={(node) => {
              setNodeRef(node);
              setGridContainer(node);
            }}
            className={getGridLayoutConfig().className}
          >
            {items.map((item, index) => {
              const layoutConfig = getGridLayoutConfig();
              const itemStyle = layoutConfig.itemStyles[index] || {};
              
              return (
                <SortableGridCItem
                  key={item.id}
                  id={item.id}
                  index={item.index}
                  clipPathData={item.clipPathData}
                  imageUrl={item.imageUrl}
                  isClippingEnabled={isClippingEnabled}
                  isSelected={selectedItems.has(item.id)}
                  onSelectChange={(isSelected) => handleSelectChange(item.id, isSelected)}
                  onDelete={() => handleDelete(item.id)}
                  onImageUpload={handleImageUpload}
                  onClipPathChange={handleClipPathChange}
                  style={itemStyle}
                />
              );
            })}
          </div>
        </div>
      </SortableContext>
      
      <DragOverlay>
        {activeId && activeItem ? (
          <div className="rotate-6 scale-110 shadow-2xl border-2 border-primary rounded-2xl">
            <GridCElement
              index={activeItem.index}
              gridId={activeItem.id}
              clipPathData={activeItem.clipPathData}
              imageUrl={activeItem.imageUrl}
              isClippingEnabled={isClippingEnabled}
              isDragging={true}
              isSelected={selectedItems.has(activeItem.id)}
              onImageUpload={() => {}}
              onClipPathChange={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default GridC; 