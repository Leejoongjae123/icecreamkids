import { Thumbnail } from '@/components/common';
import type { SmartFolderItemResult } from '@/service/file/schemas';
import React, { useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { FLOATING_BUTTON_TYPE } from '@/const';
import { usePreview } from '@/lib/react-dnd-preview';
import { getEmptyImage } from 'react-dnd-html5-backend';

export const DraggableThumbnailLayer = () => {
  const preview = usePreview<SmartFolderItemResult | SmartFolderItemResult[]>({
    placement: 'top',
    padding: { x: -20, y: 0 },
  });
  if (!preview.display) {
    return null;
  }

  const { itemType, item, style } = preview;
  if (!item || itemType !== 'THUMBNAIL') return null;

  // 다중 아이템 드래그 시 처리
  if (Array.isArray(item)) {
    const count = item.length;
    const firstItem = item[0];

    return (
      <div style={{ ...style, zIndex: 9999 }}>
        <Thumbnail
          floating={false}
          floatingType={FLOATING_BUTTON_TYPE.Default}
          fileType={firstItem.fileType}
          thumbUrl={firstItem.thumbUrl ?? ''}
          fileName={firstItem.name}
          visualClassName="type-square"
          width={120}
          lecturePlan={firstItem.lecturePlan}
        />
        {count > 1 && (
          <div
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              backgroundColor: '#ff5722',
              color: 'white',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            {count}
          </div>
        )}
      </div>
    );
  }

  // 단일 아이템 처리 (기존 코드)
  return (
    <Thumbnail
      style={{ ...style, zIndex: 9999 }}
      floating={false}
      floatingType={FLOATING_BUTTON_TYPE.Default}
      fileType={item.fileType}
      thumbUrl={item.thumbUrl ?? ''}
      fileName={item.name}
      visualClassName="type-square"
      width={120}
      lecturePlan={item.lecturePlan}
    />
  );
};

export function DraggableThumbnail({
  item,
  onClickHandler,
  onDoubleClickHandler,
  selectedItems = new Set(),
  selectedItemsData = [],
  onDragStart,
  onDragEnd,
}: {
  item: SmartFolderItemResult;
  onClickHandler?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onDoubleClickHandler?: (event: React.MouseEvent<HTMLDivElement>) => void;
  selectedItems?: Set<string>;
  selectedItemsData?: SmartFolderItemResult[];
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  const { fileType, thumbUrl, name } = item;

  // 다중 선택된 아이템이 있고 현재 아이템이 선택된 경우, 모든 선택된 아이템을 드래그
  const isItemSelected = selectedItems.has(item.id.toString());
  const dragItem = isItemSelected && selectedItemsData.length > 1 ? selectedItemsData : item;

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'THUMBNAIL',
    item: dragItem,
    canDrag: item.fileType !== 'FOLDER', // 폴더만 드래그 불가
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: () => {
      onDragEnd?.();
    },
  });

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  useEffect(() => {
    if (isDragging) {
      onDragStart?.();
    }
  }, [isDragging, onDragStart]);

  return (
    <div
      ref={(node) => {
        drag(node);
      }}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
      }}
    >
      <Thumbnail
        style={{ cursor: item.fileType === 'FOLDER' ? 'pointer' : 'move' }}
        floating={false}
        floatingType={FLOATING_BUTTON_TYPE.Default}
        fileType={fileType}
        thumbUrl={thumbUrl ?? ''}
        storyBoard={item.storyBoard}
        fileName={name}
        onClick={onClickHandler}
        onDoubleClick={onDoubleClickHandler}
        lecturePlan={item.lecturePlan}
        visualClassName="type-square"
        userEditable={item.userEditable}
      />
    </div>
  );
}
