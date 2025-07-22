"use client";
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import GridBElement from "./GridBElement";

interface SortableGridBItemProps {
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
}

function SortableGridBItem({
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
}: SortableGridBItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    disabled: isHidden // 숨겨진 아이템은 드래그 비활성화
  });

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isHidden ? 0 : (isDragging ? 0.5 : 1),
    ...style,
  };

  return (
    <div
      ref={setNodeRef}
      style={sortableStyle}
      className={`touch-none ${isDragging ? 'z-50' : ''} ${isExpanded ? 'col-span-2' : ''} ${isHidden ? 'pointer-events-none' : ''}`}
      {...attributes}
      {...(!isHidden ? listeners : {})} // 숨겨진 아이템은 드래그 리스너 비활성화
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
      />
    </div>
  );
}

export default SortableGridBItem; 