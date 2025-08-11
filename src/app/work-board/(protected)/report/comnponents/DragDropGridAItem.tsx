"use client";
import React from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import GridAElement from "./GridAElement";

interface DragDropGridAItemProps {
  id: string;
  index: number;
  style?: React.CSSProperties;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  category?: string;
  images?: string[];
  placeholderText?: string;
  isOverlay?: boolean; // 드래그 중 hover된 상태
  cardType?: 'large' | 'small'; // 카드 타입 추가
  isExpanded?: boolean; // 확장 상태 추가
  onDecreaseSubject?: () => void; // subject 감소 함수 추가
  imagePositions?: any[]; // 이미지 위치 정보
  onImagePositionsUpdate?: (positions: any[]) => void; // 이미지 위치 업데이트 핸들러
  imageCount?: number; // 이미지 개수 추가
  gridCount?: number; // 그리드 갯수 추가
  isAnimating?: boolean; // 애니메이션 상태
}

function DragDropGridAItem({
  id,
  index,
  style,
  checked,
  onCheckedChange,
  category = "",
  images = [],
  placeholderText = "ex) 아이들과 촉감놀이를 했어요",
  isOverlay = false,
  cardType,
  isExpanded = false,
  onDecreaseSubject,
  imagePositions = [],
  onImagePositionsUpdate,
  imageCount = 1,
  gridCount,
  isAnimating = false,
}: DragDropGridAItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id,
    data: {
      type: 'grid-item',
      index,
    }
  });

  const {
    setNodeRef: setDropRef,
    isOver,
  } = useDroppable({
    id: `drop-${id}`,
    data: {
      type: 'grid-item',
      index,
    }
  });

  const dragDropStyle = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isOver ? 'rgba(0, 123, 255, 0.1)' : undefined,
    transition: isDragging ? 'none' : isAnimating ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'all 0.2s ease-out',
    willChange: isDragging || isAnimating ? 'transform, opacity' : 'auto',
    zIndex: isDragging ? 1000 : isAnimating ? 10 : 1,
    ...style, // 그리드 레이아웃 스타일 적용
  };

  const setNodeRef = (node: HTMLDivElement | null) => {
    setDragRef(node);
    setDropRef(node);
  };

  return (
    <div
      ref={setNodeRef}
      style={dragDropStyle}
      className={`touch-none ${isDragging ? 'z-50' : ''} ${isOverlay ? 'ring-2 ring-primary ring-opacity-50' : ''} ${isOver ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
    >
      <GridAElement
        index={index}
        gridId={id}
        style={style}
        checked={checked}
        onCheckedChange={onCheckedChange}
        category={category}
        images={images}
        placeholderText={placeholderText}
        isDragging={isDragging}
        dragAttributes={attributes}
        dragListeners={listeners}
        cardType={cardType}
        isExpanded={isExpanded}
        onDecreaseSubject={onDecreaseSubject}
        imagePositions={imagePositions}
        onImagePositionsUpdate={onImagePositionsUpdate}
        imageCount={imageCount}
        gridCount={gridCount}
      />
    </div>
  );
}

export default DragDropGridAItem;
