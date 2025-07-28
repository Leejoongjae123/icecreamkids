"use client";
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import GridCElement from "./GridCElement";
import { ClipPathItem } from "../dummy/types";

interface SortableGridCItemProps {
  id: string;
  index: number;
  clipPathData: ClipPathItem;
  imageUrl: string;
  isClippingEnabled: boolean;
  isSelected?: boolean;
  onSelectChange?: (isSelected: boolean) => void;
  onDelete?: () => void;
  onImageUpload: (gridId: string, imageUrl: string) => void;
  isOverlay?: boolean;
}

function SortableGridCItem({
  id,
  index,
  clipPathData,
  imageUrl,
  isClippingEnabled,
  isSelected = false,
  onSelectChange,
  onDelete,
  onImageUpload,
  isOverlay = false,
}: SortableGridCItemProps) {
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
  };

  return (
    <div
      ref={setNodeRef}
      style={sortableStyle}
      className={`touch-none ${isDragging ? 'z-50' : ''} ${isOverlay ? 'ring-2 ring-primary ring-opacity-50' : ''}`}
    >
      <GridCElement
        index={index}
        gridId={id}
        clipPathData={clipPathData}
        imageUrl={imageUrl}
        isClippingEnabled={isClippingEnabled}
        isDragging={isDragging}
        dragAttributes={attributes}
        dragListeners={listeners}
        isSelected={isSelected}
        onSelectChange={onSelectChange}
        onDelete={onDelete}
        onImageUpload={onImageUpload}
      />
    </div>
  );
}

export default SortableGridCItem; 