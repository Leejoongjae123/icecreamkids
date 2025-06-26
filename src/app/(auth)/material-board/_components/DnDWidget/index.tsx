import { ISortItem } from '@/app/(auth)/material-board/_components/DnDWidget/types';
import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import cx from 'clsx';

// 개별 위젯 컴포넌트
// TODO: 추후 순서 정렬도 막을 지 논의 필요 hidable: true면 위젯 숨김 및 순서 정렬 가능, 값이 없을 시 불가능
const SortItem: React.FC<ISortItem> = ({ widget, onChange, index, reorderWidgets, selectedWidgets, onDelete }) => {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [{ isDragging }, drag] = useDrag({
    type: 'WIDGET',
    item: { id: widget.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: widget.hidable || false,
  });

  /** 드롭 설정 (순서 변경) */
  const [, drop] = useDrop({
    accept: 'WIDGET',
    hover: (draggedItem: { id: number; index: number }) => {
      if (!ref.current) return;
      if (draggedItem.index !== index) {
        reorderWidgets(draggedItem.index, index);
        Object.assign(draggedItem, { index });
      }
    },
  });

  drag(drop(ref));
  return (
    <>
      {isDragging && <div className="drag-line" />}
      <div
        ref={ref}
        onChange={() => onChange(`right_${widget.id}`)}
        className={cx(
          'item-choice',
          isDragging && 'drag',
          (!!selectedWidgets[`right_${widget.id}`] || !widget.hidable) && 'checked',
          !widget.hidable && 'disabled',
        )}
      >
        <input
          id={`check2${index}`}
          className="inp-comm"
          type="checkbox"
          name="check"
          checked={!!selectedWidgets[`right_${widget.id}`] || !widget.hidable || false}
          onChange={() => {}}
        />
        <label htmlFor={`check2${index}`} className="lab-check">
          <span className="ico-comm ico-inp-check" />
          <span className="txt-check">{widget.name}</span>
        </label>
        <button className="btn-widget" onClick={() => onDelete(widget.id)}>
          <span className="ico-comm ico-close-16" />
        </button>
        <button className="btn-widget">
          <span className="ico-comm ico-grid-16" />
        </button>
      </div>
    </>
  );
};

SortItem.displayName = 'SortItem';
export default SortItem;
