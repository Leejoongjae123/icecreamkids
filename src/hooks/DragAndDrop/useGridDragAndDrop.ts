import { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { DragItem } from "./types";

interface UseGridDragAndDropProps {
  id: string;
  index: number;
  moveCard: (dragIndex: number, hoverIndex: number) => void;
}

export function useGridDragAndDrop({ id, index, moveCard }: UseGridDragAndDropProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: string | symbol }>({
    accept: "card",
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId()
      };
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      moveCard(dragIndex, hoverIndex);
      item.index = hoverIndex;
    }
  });

  const [{ isDragging }, drag] = useDrag({
    type: "card",
    item: () => {
      return { id, index };
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging()
    })
  });

  drag(drop(ref));
  return { ref, isDragging, handlerId };
} 