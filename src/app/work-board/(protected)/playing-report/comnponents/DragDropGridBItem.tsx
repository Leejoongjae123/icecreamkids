"use client";
import React from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import GridBElement from "./GridBElement";

interface DragDropGridBItemProps {
  id: string;
  index: number;
  style?: React.CSSProperties;
  isSelected: boolean;
  onSelectChange: (isSelected: boolean) => void;
  onDelete: () => void;
  isExpanded: boolean;
  isHidden: boolean;
  images?: string[];
  placeholderText?: string;
  imageCount?: number;
  onImageCountChange?: (count: number) => void;
  isPrintHidden?: boolean;
  // 저장 후 descriptionText가 비어있는 경우 시각적으로 숨김 처리 (레이아웃은 유지)
  isInvisibleInSavedMode?: boolean;
  highlightMode?: 'none' | 'full' | 'split';
  imagePositions?: { x: number; y: number; scale: number }[];
  onImagePositionsUpdate?: (positions: { x: number; y: number; scale: number }[]) => void;
}

function DragDropGridBItem({
  id,
  index,
  style,
  isSelected,
  onSelectChange,
  onDelete,
  isExpanded,
  isHidden,
  images = [],
  placeholderText = "(선택)놀이 키워드 입력 또는 메모 파일 업로드",
  imageCount,
  onImageCountChange,
  isPrintHidden,
  isInvisibleInSavedMode,
  highlightMode = 'none',
  imagePositions,
  onImagePositionsUpdate,
}: DragDropGridBItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id,
    data: { type: "grid-b-item", index },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${id}`,
    data: { type: "grid-b-item", index },
  });

  const dragDropStyle: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isHidden ? 0 : isDragging ? 0.5 : 1,
    backgroundColor: isOver ? "rgba(0, 123, 255, 0.06)" : undefined,
    ...style,
  };

  const setNodeRef = React.useCallback((node: HTMLDivElement | null) => {
    setDragRef(node);
    setDropRef(node);
  }, [setDragRef, setDropRef]);

  return (
    <div
      ref={setNodeRef}
      style={dragDropStyle}
      className={`touch-none ${isDragging ? "z-50" : ""} ${isExpanded ? "col-span-2" : ""} ${
        isHidden ? "pointer-events-none" : ""
      } ${isPrintHidden ? "print-hide" : ""} ${isInvisibleInSavedMode ? "invisible pointer-events-none" : ""}`}
      {...attributes}
      {...(!isHidden ? listeners : {})}
    >
      <GridBElement
        index={index}
        gridId={id}
        style={style}
        isDragging={isDragging}
        isSelected={isSelected}
        onSelectChange={onSelectChange}
        onDelete={onDelete}
        isExpanded={isExpanded}
        isHidden={isHidden}
        images={images}
        placeholderText={placeholderText}
        imageCount={imageCount}
        onImageCountChange={onImageCountChange}
        highlightMode={highlightMode}
        imagePositions={imagePositions}
        onImagePositionsUpdate={onImagePositionsUpdate}
      />
    </div>
  );
}

export default DragDropGridBItem;


