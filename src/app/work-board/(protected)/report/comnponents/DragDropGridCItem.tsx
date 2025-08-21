"use client";
import React from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import GridCElement from "./GridCElement";
import { ClipPathItem } from "../dummy/types";

export interface DragDropGridCItemProps {
  id: string;
  index: number;
  clipPathData: ClipPathItem;
  imageUrl: string;
  driveItemKey?: string; // driveItemKey 추가
  isClippingEnabled: boolean;
  isSelected?: boolean;
  onSelectChange?: (isSelected: boolean) => void;
  onDelete?: () => void;
  onImageUpload: (gridId: string, imageUrl: string, driveItemKey?: string) => void;
  onClipPathChange?: (gridId: string, clipPathData: ClipPathItem) => void;
  onIntegratedUpload?: () => void; // 통합 업로드 핸들러
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
  isOverlay = false,
  style,
  isAnimating = false,
  isUploadModalOpen,
}: DragDropGridCItemProps) {
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
    transition: isDragging ? 'none' : isAnimating ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'all 0.2s ease-out', // 애니메이션 상태에 따른 transition
    willChange: isDragging || isAnimating ? 'transform, opacity' : 'auto', // 성능 최적화
    zIndex: isDragging ? 1000 : isAnimating ? 10 : 1, // 드래그/애니메이션 중 z-index 조정
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
      <GridCElement
        index={index}
        gridId={id}
        clipPathData={clipPathData}
        imageUrl={imageUrl}
        driveItemKey={driveItemKey}
        isClippingEnabled={isClippingEnabled}
        isDragging={isDragging}
        dragAttributes={attributes}
        dragListeners={listeners}
        isSelected={isSelected}
        onSelectChange={onSelectChange}
        onDelete={onDelete}
        onImageUpload={onImageUpload}
        onClipPathChange={onClipPathChange}
        onIntegratedUpload={onIntegratedUpload}
        isUploadModalOpen={isUploadModalOpen}
      />
    </div>
  );
}

export default DragDropGridCItem;