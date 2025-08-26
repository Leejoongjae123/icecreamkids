"use client";
import React from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import GridCElement from "./GridCElement";
import { ClipPathItem } from "../dummy/types";

export interface GridCItemPropsWithHidden {
  id: string;
  index: number;
  clipPathData: ClipPathItem;
  imageUrl: string;
  driveItemKey?: string; // driveItemKey 추가
  isClippingEnabled: boolean;
  isSelected?: boolean;
  isHidden?: boolean;
  onSelectChange?: (isSelected: boolean) => void;
  onDelete?: () => void;
  onImageUpload: (gridId: string, imageUrl: string, driveItemKey?: string) => void;
  onClipPathChange?: (gridId: string, clipPathData: ClipPathItem) => void;
  onIntegratedUpload?: () => void; // 통합 업로드 핸들러
  onSingleUpload?: (gridId: string) => void; // 단일 업로드 핸들러
  hasAnyImage?: boolean;
  onDropFiles?: (gridId: string, files: File[]) => void; // 파일 드롭 핸들러
  isOverlay?: boolean;
  style?: React.CSSProperties;
  isAnimating?: boolean;
  isUploadModalOpen?: boolean;
}

function DragDropGridCItem({
  id,
  index,
  clipPathData,
  imageUrl,
  driveItemKey,
  isClippingEnabled,
  isSelected = false,
  onSelectChange,
  onDelete,
  onImageUpload,
  onClipPathChange,
  onIntegratedUpload,
  onSingleUpload,
  hasAnyImage,
  onDropFiles,
  isOverlay = false,
  style,
  isAnimating = false,
  isUploadModalOpen,
  isHidden = false,
}: GridCItemPropsWithHidden) {
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id,
    disabled: isHidden,
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
    opacity: isHidden ? 0 : (isDragging ? 0.5 : 1),
    backgroundColor: isOver ? 'rgba(0, 123, 255, 0.1)' : undefined,
    transition: isDragging ? 'none' : isAnimating ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'all 0.2s ease-out',
    willChange: isDragging || isAnimating ? 'transform, opacity' : 'auto',
    zIndex: isDragging ? 1000 : isAnimating ? 10 : 1,
    pointerEvents: isHidden ? 'none' : undefined,
    ...style,
  } as React.CSSProperties;

  const setNodeRef = (node: HTMLDivElement | null) => {
    setDragRef(node);
    setDropRef(node);
  };

  return (
    <div
      ref={setNodeRef}
      style={dragDropStyle}
      className={`touch-none ${isDragging ? 'z-50' : ''} ${isOverlay ? 'ring-2 ring-primary ring-opacity-50' : ''} ${isOver ? 'ring-2 ring-blue-400 ring-opacity-50' : ''} ${isHidden ? 'pointer-events-none' : ''}`}
    >
      <GridCElement
        index={index}
        gridId={id}
        clipPathData={clipPathData}
        imageUrl={imageUrl}
        driveItemKey={driveItemKey}
        isClippingEnabled={isClippingEnabled}
        isDragging={isDragging}
        dragAttributes={attributes}
        dragListeners={isHidden ? undefined : listeners}
        isSelected={isSelected}
        onSelectChange={onSelectChange}
        onDelete={onDelete}
        onImageUpload={onImageUpload}
        onClipPathChange={onClipPathChange}
        onIntegratedUpload={onIntegratedUpload}
        onSingleUpload={onSingleUpload}
        hasAnyImage={hasAnyImage}
        onDropFiles={onDropFiles}
        isUploadModalOpen={isUploadModalOpen}
      />
    </div>
  );
}

export default DragDropGridCItem;