"use client";
import * as React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import GridAElement from "./GridAElement";
import SortableGridItem from "./SortableGridItem";
import { GridItem } from "./types";

interface GridAProps {
  subject: number;
}

function GridA({ subject }: GridAProps) {
  // 각 이미지 영역의 체크 상태 관리
  const [checkedItems, setCheckedItems] = React.useState<Record<string, boolean>>({});
  
  // 그리드 아이템 데이터 관리
  const [items, setItems] = React.useState<GridItem[]>(() => {
    const initialItems: GridItem[] = [];
    for (let i = 1; i <= subject; i++) {
      initialItems.push({
        id: `grid-${i}`,
        index: i,
        category: "촉감놀이",
        images: [],
        inputValue: ""
      });
    }
    return initialItems;
  });

  // 현재 드래그 중인 아이템
  const [activeId, setActiveId] = React.useState<string | null>(null);

  // subject가 변경되면 items 업데이트
  React.useEffect(() => {
    setItems(prevItems => {
      const newItems: GridItem[] = [];
      for (let i = 1; i <= subject; i++) {
        const existingItem = prevItems.find(item => item.index === i);
        newItems.push(existingItem || {
          id: `grid-${i}`,
          index: i,
          category: "촉감놀이",
          images: [],
          inputValue: ""
        });
      }
      return newItems.slice(0, subject);
    });
  }, [subject]);

  // 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 체크 상태 변경 핸들러
  const handleCheckedChange = (id: string, checked: boolean) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: checked
    }));
  };

  // 드래그 시작 핸들러
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // 드래그 종료 핸들러 (1:1 swap 방식)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && over?.id) {
      setItems((items) => {
        const activeIndex = items.findIndex(item => item.id === active.id);
        const overIndex = items.findIndex(item => item.id === over.id);

        if (activeIndex === -1 || overIndex === -1) return items;

        // 1:1 swap: 두 아이템의 위치만 교환
        const newItems = [...items];
        const activeItem = { ...newItems[activeIndex] };
        const overItem = { ...newItems[overIndex] };
        
        // 인덱스 값만 서로 교환
        const tempIndex = activeItem.index;
        activeItem.index = overItem.index;
        overItem.index = tempIndex;
        
        // 배열에서 위치 교환
        newItems[activeIndex] = overItem;
        newItems[overIndex] = activeItem;

        // subject가 3일 때 카드 타입 업데이트
        if (subject === 3) {
          newItems[activeIndex].cardType = newItems[activeIndex].index === 1 ? 'large' : 'small';
          newItems[overIndex].cardType = newItems[overIndex].index === 1 ? 'large' : 'small';
        }

        return newItems;
      });
    }

    setActiveId(null);
  };

  // subject 개수에 따라 그리드 레이아웃 설정
  const getGridLayout = (count: number) => {
    switch (count) {
      case 1:
        return {
          className: "grid grid-cols-1 gap-3 w-full h-full",
          style: { gridTemplateRows: "1fr" }
        };
      case 2:
        return {
          className: "grid grid-cols-1 gap-3 w-full h-full",
          style: { gridTemplateRows: "1fr 1fr" }
        };
      case 3:
        return {
          className: "grid grid-cols-2 gap-3 w-full h-full",
          style: { 
            gridTemplateRows: "1fr 1fr",
            gridTemplateAreas: "'top top' 'bottom-left bottom-right'"
          }
        };
      case 4:
        return {
          className: "grid grid-cols-2 gap-3 w-full h-full",
          style: { gridTemplateRows: "1fr 1fr" }
        };
      default:
        return {
          className: "grid grid-cols-2 gap-3 w-full h-full",
          style: { gridTemplateRows: "1fr 1fr" }
        };
    }
  };

  // 3개일 때 특별한 그리드 에어리어 스타일 적용
  const getItemStyle = (index: number) => {
    if (subject === 3) {
      switch (index) {
        case 1:
          return { gridArea: "top" };
        case 2:
          return { gridArea: "bottom-left" };
        case 3:
          return { gridArea: "bottom-right" };
        default:
          return {};
      }
    }
    return {};
  };

  const layout = getGridLayout(subject);
  const activeItem = items.find(item => item.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map(item => item.id)} strategy={rectSortingStrategy}>
        <div 
          className={`${layout.className} grid-container relative transition-colors duration-200 ${
            activeId ? 'bg-primary/5' : ''
          }`}
          style={layout.style}
        >
          {items.map((item) => (
            <SortableGridItem
              key={item.id}
              id={item.id}
              index={item.index}
              style={getItemStyle(item.index)}
              checked={checkedItems[item.id] || false}
              onCheckedChange={(checked: boolean) => handleCheckedChange(item.id, checked)}
              category={item.category}
              images={item.images}
              placeholderText={`ex) 아이들과 ${item.category}를 했어요`}
              cardType={subject === 3 ? (item.index === 1 ? 'large' : 'small') : undefined}
            />
          ))}
        </div>
      </SortableContext>
      
      <DragOverlay>
        {activeId && activeItem ? (
          <div className="rotate-6 scale-110 shadow-2xl border-2 border-primary rounded-2xl">
            <GridAElement
              index={activeItem.index}
              gridId={activeItem.id}
              checked={checkedItems[activeItem.id] || false}
              onCheckedChange={() => {}}
              category={activeItem.category}
              images={activeItem.images}
              placeholderText={`ex) 아이들과 ${activeItem.category}를 했어요`}
              isDragging={true}
              cardType={subject === 3 ? (activeItem.index === 1 ? 'large' : 'small') : undefined}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default GridA; 