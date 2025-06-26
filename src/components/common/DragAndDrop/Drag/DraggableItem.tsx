'use client';

import cx from 'clsx';
import { useDrag } from 'react-dnd';
import { useRef } from 'react';
import styles from './DraggableItem.module.scss';
import type { IDraggableItemProps, IDraggedItems } from './types';

const DraggableItem = ({ file, selectedIds, children, Container = 'div' }: IDraggableItemProps) => {
  const ref = useRef<HTMLDivElement | null>(null);

  const isSelected = selectedIds.includes(file.id);
  const draggedItemIds = isSelected ? selectedIds : [file.id];

  const [{ isDragging }, drag] = useDrag<IDraggedItems, void, { isDragging: boolean }>(
    () => ({
      type: 'FILE_ITEM',
      item: { selectedIds: draggedItemIds, type: 'DRAG_FILES' },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [draggedItemIds],
  );

  drag(ref);

  return (
    <Container
      ref={ref}
      data-id={file.id}
      className={cx('selectable', isSelected && styles.selected, isDragging && styles.dragging)}
    >
      {/* 드래그될 요소 */}
      {children}
    </Container>
  );
};

export default DraggableItem;
