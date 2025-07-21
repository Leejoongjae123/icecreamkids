"use client";
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import GridAElement from "./GridAElement";

interface SortableGridItemProps {
  id: string;
  index: number;
  style?: React.CSSProperties;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  category?: string;
  images?: string[];
  placeholderText?: string;
}

function SortableGridItem({
  id,
  index,
  style,
  checked,
  onCheckedChange,
  category = "촉감놀이",
  images = [],
  placeholderText = "ex) 아이들과 촉감놀이를 했어요",
}: SortableGridItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    ...style,
  };

  return (
    <div
      ref={setNodeRef}
      style={sortableStyle}
      className={`touch-none ${isDragging ? 'z-50' : ''}`}
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
      />
    </div>
  );
}

export default SortableGridItem; 