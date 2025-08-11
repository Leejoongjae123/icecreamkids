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
  placeholderText = "ex) 아이들과 촉감놀이를 했어요",
  imageCount,
  onImageCountChange,
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

  const setNodeRef = (node: HTMLDivElement | null) => {
    setDragRef(node);
    setDropRef(node);
  };

  return (
    <div
      ref={setNodeRef}
      style={dragDropStyle}
      className={`touch-none ${isDragging ? "z-50" : ""} ${isExpanded ? "col-span-2" : ""} ${
        isHidden ? "pointer-events-none" : ""
      }`}
      {...attributes}
      {...(!isHidden ? listeners : {})}
    >
      <GridBElement
        index={index}
        gridId={id}
        style={style}
        isSelected={isSelected}
        onSelectChange={onSelectChange}
        onDelete={onDelete}
        isExpanded={isExpanded}
        isHidden={isHidden}
        images={images}
        placeholderText={placeholderText}
        imageCount={imageCount}
        onImageCountChange={onImageCountChange}
      />
    </div>
  );
}

export default DragDropGridBItem;


