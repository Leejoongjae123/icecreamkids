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
  arrayMove,
} from "@dnd-kit/sortable";
import GridCElement from "./GridCElement";
import SortableGridCItem from "./SortableGridCItem";
import { clipPathItems } from "../dummy/svgData";
import { ClipPathItem } from "../dummy/types";

interface GridCItem {
  id: string;
  index: number;
  clipPathData: ClipPathItem;
  imageUrl: string;
}

interface GridCProps {
  isClippingEnabled: boolean;
  photoCount: number;
}

function GridC({ isClippingEnabled, photoCount }: GridCProps) {
  // photoCount에 따라 그리드 아이템 데이터 관리
  const [items, setItems] = React.useState<GridCItem[]>(() => {
    const initialItems: GridCItem[] = [];
    const defaultImage = "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg";
    
    for (let i = 0; i < photoCount; i++) {
      const clipPath = clipPathItems[i] || clipPathItems[0]; // clipPathItems 배열을 초과하면 첫 번째 사용
      initialItems.push({
        id: `grid-c-${i}`,
        index: i,
        clipPathData: clipPath,
        imageUrl: defaultImage,
      });
    }
    return initialItems;
  });

  // photoCount가 변경되면 items 재생성
  React.useEffect(() => {
    const defaultImage = "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg";
    const newItems: GridCItem[] = [];
    
    for (let i = 0; i < photoCount; i++) {
      const clipPath = clipPathItems[i] || clipPathItems[0];
      newItems.push({
        id: `grid-c-${i}`,
        index: i,
        clipPathData: clipPath,
        imageUrl: defaultImage,
      });
    }
    setItems(newItems);
  }, [photoCount]);

  // 현재 드래그 중인 아이템
  const [activeId, setActiveId] = React.useState<string | null>(null);

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

  // 드래그 시작 핸들러
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // 드래그 종료 핸들러
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && over?.id) {
      setItems((currentItems) => {
        const activeIndex = currentItems.findIndex(item => item.id === active.id);
        const overIndex = currentItems.findIndex(item => item.id === over.id);

        if (activeIndex === -1 || overIndex === -1) return currentItems;

        // 배열 위치 이동
        const reorderedItems = arrayMove(currentItems, activeIndex, overIndex);
        
        // 인덱스 재정렬
        return reorderedItems.map((item, index) => ({
          ...item,
          index
        }));
      });
    }

    setActiveId(null);
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = (gridId: string, imageUrl: string) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === gridId 
          ? { ...item, imageUrl }
          : item
      )
    );
  };

  const activeItem = items.find(item => item.id === activeId);

  // 그리드 컬럼 수 계산 (최대 3컬럼)
  const getGridCols = () => {
    if (photoCount <= 3) return photoCount;
    return 3;
  };

  // 그리드 클래스 생성
  const getGridClass = () => {
    const cols = getGridCols();
    const colsClass = `grid-cols-${cols}`;
    return `grid ${colsClass} gap-4 w-full h-full min-h-[600px] max-w-4xl mx-auto`;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={items.map(item => item.id)} 
        strategy={rectSortingStrategy}
      >
        <div className="w-full h-full relative">
          <div className={getGridClass()}>
            {items.map((item) => (
              <SortableGridCItem
                key={item.id}
                id={item.id}
                index={item.index}
                clipPathData={item.clipPathData}
                imageUrl={item.imageUrl}
                isClippingEnabled={isClippingEnabled}
                onImageUpload={handleImageUpload}
              />
            ))}
          </div>
        </div>
      </SortableContext>
      
      <DragOverlay>
        {activeId && activeItem ? (
          <div className="rotate-6 scale-110 shadow-2xl border-2 border-primary rounded-2xl">
            <GridCElement
              index={activeItem.index}
              gridId={activeItem.id}
              clipPathData={activeItem.clipPathData}
              imageUrl={activeItem.imageUrl}
              isClippingEnabled={isClippingEnabled}
              isDragging={true}
              onImageUpload={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default GridC; 