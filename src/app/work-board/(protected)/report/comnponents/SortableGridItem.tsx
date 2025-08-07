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
  isOverlay?: boolean; // 드래그 중 hover된 상태
  cardType?: 'large' | 'small'; // 카드 타입 추가
  isExpanded?: boolean; // 확장 상태 추가
  onDecreaseSubject?: () => void; // subject 감소 함수 추가
  imagePositions?: any[]; // 이미지 위치 정보
  onImagePositionsUpdate?: (positions: any[]) => void; // 이미지 위치 업데이트 핸들러
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
  isOverlay = false,
  cardType,
  isExpanded = false,
  onDecreaseSubject,
  imagePositions = [],
  onImagePositionsUpdate,
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
      className={`touch-none ${isDragging ? 'z-50' : ''} ${isOverlay ? 'ring-2 ring-primary ring-opacity-50' : ''}`}
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
      />
    </div>
  );
}

export default SortableGridItem; 