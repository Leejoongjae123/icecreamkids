"use client";
import * as React from "react";
import {
  DndContext,
  closestCenter,
  closestCorners,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  CollisionDetection,
  getFirstCollision,
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
        inputValue: "",
        cardType: subject === 3 ? (i === 1 ? 'large' : 'small') : undefined
      });
    }
    return initialItems;
  });

  // 현재 드래그 중인 아이템
  const [activeId, setActiveId] = React.useState<string | null>(null);
  
  // 확장된 아이템들을 관리하는 상태 (3개 레이아웃에서 large 카드)
  const [expandedItems, setExpandedItems] = React.useState<Set<number>>(() => {
    if (subject === 3) {
      return new Set([1]); // index 1은 large 카드로 확장된 상태
    }
    return new Set();
  });

  // subject가 변경되면 items와 expandedItems 업데이트
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
          inputValue: "",
          cardType: subject === 3 ? (i === 1 ? 'large' : 'small') : undefined
        });
      }
      return newItems.slice(0, subject);
    });

    // expandedItems 업데이트
    if (subject === 3) {
      setExpandedItems(new Set([1]));
    } else {
      setExpandedItems(new Set());
    }
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

  // 커스텀 collision detection - 확장된 아이템을 고려
  const customCollisionDetection: CollisionDetection = (args) => {
    const { active, collisionRect, droppableRects, droppableContainers } = args;
    
    // 먼저 rect intersection으로 충돌 감지
    const rectCollisions = rectIntersection(args);
    
    // rect collision이 있으면 우선 사용
    if (rectCollisions.length > 0) {
      return rectCollisions;
    }
    
    // 없으면 closest center로 fallback
    return closestCenter(args);
  };

  // 체크 상태 변경 핸들러
  const handleCheckedChange = (id: string, checked: boolean) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: checked
    }));
  };

  // 드래그 시작 핸들러
  const handleDragStart = (event: DragStartEvent) => {
    const draggedItem = items.find(item => item.id === event.active.id);
    if (draggedItem) {
      // 필요한 경우 드래그 시작 조건 확인
    }
    setActiveId(event.active.id as string);
  };

  // 드래그 종료 핸들러 (확장된 아이템을 고려한 swap 방식)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && over?.id) {
      const activeItemId = active.id as string;
      const overItemId = over.id as string;
      
      setItems((currentItems) => {
        const activeIndex = currentItems.findIndex(item => item.id === activeItemId);
        const overIndex = currentItems.findIndex(item => item.id === overItemId);

        if (activeIndex === -1 || overIndex === -1) return currentItems;

        const activeItem = currentItems[activeIndex];
        const overItem = currentItems[overIndex];

        // 새로운 배열 생성
        const newItems = [...currentItems];
        
        // subject가 3일 때 특별한 교환 로직 (확장된 아이템 고려)
        if (subject === 3) {
          const activeGridIndex = activeItem.index;
          const overGridIndex = overItem.index;
          
          // 확장된 아이템(large)과 일반 아이템(small) 간의 교환
          if (expandedItems.has(activeGridIndex) || expandedItems.has(overGridIndex)) {
            // 확장된 아이템과 일반 아이템의 교환은 모든 데이터 교환
            const tempActiveData = {
              category: activeItem.category,
              images: activeItem.images,
              inputValue: activeItem.inputValue,
            };
            const tempOverData = {
              category: overItem.category,
              images: overItem.images,
              inputValue: overItem.inputValue,
            };
            
            // 데이터 교환 (인덱스와 cardType은 유지)
            newItems[activeIndex] = {
              ...activeItem,
              category: tempOverData.category,
              images: tempOverData.images,
              inputValue: tempOverData.inputValue,
            };
            newItems[overIndex] = {
              ...overItem,
              category: tempActiveData.category,
              images: tempActiveData.images,
              inputValue: tempActiveData.inputValue,
            };

            return newItems;
          }
        }
        
        // 일반적인 교환 로직
        const tempActiveData = {
          category: activeItem.category,
          images: activeItem.images,
          inputValue: activeItem.inputValue,
        };
        const tempOverData = {
          category: overItem.category,
          images: overItem.images,
          inputValue: overItem.inputValue,
        };
        
        // 데이터 교환 (인덱스와 cardType은 유지)
        newItems[activeIndex] = {
          ...activeItem,
          category: tempOverData.category,
          images: tempOverData.images,
          inputValue: tempOverData.inputValue,
        };
        newItems[overIndex] = {
          ...overItem,
          category: tempActiveData.category,
          images: tempActiveData.images,
          inputValue: tempActiveData.inputValue,
        };

        return newItems;
      });

      // 확장 상태와 체크 상태도 함께 교환
      const activeItem = items.find(item => item.id === activeItemId);
      const overItem = items.find(item => item.id === overItemId);
      
      if (activeItem && overItem) {
        const activeGridIndex = activeItem.index;
        const overGridIndex = overItem.index;
        
        // 확장 상태 교환 (subject === 3인 경우에만)
        if (subject === 3) {
          setExpandedItems(prev => {
            const newSet = new Set(prev);
            const activeExpanded = prev.has(activeGridIndex);
            const overExpanded = prev.has(overGridIndex);
            
            // 기존 상태 제거
            newSet.delete(activeGridIndex);
            newSet.delete(overGridIndex);
            
            // 교환된 상태 적용
            if (activeExpanded) {
              newSet.add(overGridIndex);
            }
            if (overExpanded) {
              newSet.add(activeGridIndex);
            }
            
            return newSet;
          });
        }

        // 체크 상태 교환
        setCheckedItems(prev => {
          const newCheckedItems = { ...prev };
          const activeChecked = prev[activeItemId] || false;
          const overChecked = prev[overItemId] || false;
          
          // 체크 상태 교환
          newCheckedItems[activeItemId] = overChecked;
          newCheckedItems[overItemId] = activeChecked;
          
          return newCheckedItems;
        });
      }
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

  // 그리드 아이템들을 렌더링하는 함수
  const renderGridItems = () => {
    return items.map((item) => (
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
        cardType={item.cardType}
        isExpanded={expandedItems.has(item.index)}
      />
    ));
  };

  const layout = getGridLayout(subject);
  const activeItem = items.find(item => item.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={items.map(item => item.id)} 
        strategy={rectSortingStrategy}
      >
        <div className="w-full h-full relative">
          <div 
            className={`${layout.className} grid-container relative transition-colors duration-200 ${
              activeId ? 'bg-primary/5' : ''
            }`}
            style={layout.style}
          >
            {renderGridItems()}
          </div>
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
              cardType={activeItem.cardType}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default GridA; 