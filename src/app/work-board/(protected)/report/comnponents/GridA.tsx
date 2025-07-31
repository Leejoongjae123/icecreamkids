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
import GridAElement from "./GridAElement";
import SortableGridItem from "./SortableGridItem";
import { GridItem } from "./types";
import { useImageEditModalStore } from "@/hooks/store/useImageEditModalStore";

interface GridAProps {
  subject: number;
}

function GridA({ subject }: GridAProps) {
  // 각 이미지 영역의 체크 상태 관리
  const [checkedItems, setCheckedItems] = React.useState<Record<string, boolean>>({});
  const { isImageEditModalOpen } = useImageEditModalStore();
  
  // 그리드 아이템 데이터 관리
  const [items, setItems] = React.useState<GridItem[]>(() => {
    const initialItems: GridItem[] = [];
    for (let i = 0; i < subject; i++) {
      initialItems.push({
        id: `grid-${i}`,
        index: i,
        category: "촉감놀이",
        images: [],
        inputValue: "",
        cardType: subject === 3 ? (i === 0 ? 'large' : 'small') : undefined,
        colSpan: subject === 3 ? (i === 0 ? 2 : 1) : 1
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
      for (let i = 0; i < subject; i++) {
        const existingItem = prevItems.find(item => item.index === i);
        if (existingItem) {
          // 기존 아이템이 있으면 cardType과 colSpan을 subject에 맞게 업데이트
          newItems.push({
            ...existingItem,
            index: i,
            cardType: subject === 3 ? (i === 0 ? 'large' : 'small') : undefined,
            colSpan: subject === 3 ? (i === 0 ? 2 : 1) : 1
          });
        } else {
          // 새 아이템 생성
          newItems.push({
            id: `grid-${i}`,
            index: i,
            category: "촉감놀이",
            images: [],
            inputValue: "",
            cardType: subject === 3 ? (i === 0 ? 'large' : 'small') : undefined,
            colSpan: subject === 3 ? (i === 0 ? 2 : 1) : 1
          });
        }
      }
      return newItems.slice(0, subject);
    });
  }, [subject]);

  // 센서 설정 - 모달이 열려있으면 센서 비활성화
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

  // 레이아웃 재계산 함수 - subject에 따라 다른 레이아웃 적용
  const recalculateLayout = (items: GridItem[], targetSpanTwoIndex: number): GridItem[] => {
    if (subject !== 3) {
      // subject가 3이 아닌 경우 모든 아이템을 span 1로 설정
      return items.map((item, index) => ({
        ...item,
        index,
        cardType: undefined,
        colSpan: 1
      }));
    }
    
    // subject가 3인 경우만 span 2 아이템 배치
    // 2x2 그리드에서 span 2는 첫 번째 위치(0) 또는 마지막 위치에만 가능
    // targetSpanTwoIndex가 마지막 위치일 때만 마지막으로, 나머지는 첫 번째로
    const spanTwoIndex = targetSpanTwoIndex === items.length - 1 ? items.length - 1 : 0;
    
    return items.map((item, index) => ({
      ...item,
      index,
      cardType: index === spanTwoIndex ? 'large' as const : 'small' as const,
      colSpan: index === spanTwoIndex ? 2 : 1
    }));
  };

  // 드래그 시작 핸들러
  const handleDragStart = (event: DragStartEvent) => {
    // 모달이 열려있으면 드래그 시작하지 않음
    if (isImageEditModalOpen) {
      return;
    }
    setActiveId(event.active.id as string);
  };

  // 드래그 종료 핸들러 (2행 레이아웃 유지)
  const handleDragEnd = (event: DragEndEvent) => {
    // 모달이 열려있으면 드래그 종료 처리하지 않음
    if (isImageEditModalOpen) {
      setActiveId(null);
      return;
    }
    
    const { active, over } = event;

    if (active.id !== over?.id && over?.id) {
      setItems((currentItems) => {
        const activeIndex = currentItems.findIndex(item => item.id === active.id);
        const overIndex = currentItems.findIndex(item => item.id === over.id);

        if (activeIndex === -1 || overIndex === -1) return currentItems;

        // 배열 위치 이동 (arrayMove 사용)
        const reorderedItems = arrayMove(currentItems, activeIndex, overIndex);
        
        // subject가 3이 아닌 경우 단순 위치 이동만 처리
        if (subject !== 3) {
          return reorderedItems.map((item, index) => ({
            ...item,
            index
          }));
        }
        
        // subject가 3인 경우만 span 2 아이템 로직 처리
        // span 2 아이템이 있는지 확인
        const spanTwoItem = currentItems.find(item => item.colSpan === 2);
        
        if (spanTwoItem) {
          const activeWasSpanTwo = currentItems[activeIndex].colSpan === 2;
          
          if (activeWasSpanTwo) {
            // span 2 아이템을 드래그한 경우, 목표 위치에 따라 첫 번째나 마지막으로 배치
            return recalculateLayout(reorderedItems, overIndex);
          } else {
            // span 1 아이템을 드래그한 경우, span 2 아이템의 새 위치 계산
            const originalSpanTwoIndex = currentItems.findIndex(item => item.colSpan === 2);
            const spanTwoItemInReordered = reorderedItems.findIndex(item => item.id === spanTwoItem.id);
            
            return recalculateLayout(reorderedItems, spanTwoItemInReordered);
          }
        } else {
          // span 2 아이템이 없으면 단순 위치 이동
          return reorderedItems.map((item, index) => ({
            ...item,
            index
          }));
        }
      });

      // 체크 상태도 위치에 따라 이동
      setCheckedItems(prev => {
        const activeIndex = items.findIndex(item => item.id === active.id);
        const overIndex = items.findIndex(item => item.id === over.id);
        
        if (activeIndex === -1 || overIndex === -1) return prev;
        
        const reorderedItems = arrayMove(items, activeIndex, overIndex);
        const newCheckedItems: Record<string, boolean> = {};
        
        reorderedItems.forEach((item, index) => {
          const originalIndex = items.findIndex(originalItem => originalItem.id === item.id);
          newCheckedItems[item.id] = prev[items[originalIndex].id] || false;
        });
        
        return newCheckedItems;
      });
    }

    setActiveId(null);
  };

  // subject 개수에 따라 그리드 레이아웃 설정
  const getGridLayout = (count: number) => {
    switch (count) {
      case 1:
        return {
          className: "grid grid-cols-1 w-full h-full",
          style: { gridTemplateRows: "1fr", minHeight: "600px" }
        };
      case 2:
        return {
          className: "grid grid-cols-1 gap-3 w-full h-full",
          style: { gridTemplateRows: "1fr 1fr" }
        };
      case 3:
      case 4:
      default:
        return {
          className: "grid grid-cols-2 gap-3 w-full h-full",
          style: { gridTemplateRows: "auto auto" }
        };
    }
  };

  // 그리드 아이템들을 렌더링하는 함수
  const renderGridItems = () => {
    return items.map((item) => (
      <SortableGridItem
        key={item.id}
        id={item.id}
        index={item.index}
        style={{ gridColumn: item.colSpan === 2 ? "span 2" : "span 1" }}
        checked={checkedItems[item.id] || false}
        onCheckedChange={(checked: boolean) => handleCheckedChange(item.id, checked)}
        category={item.category}
        images={item.images}
        placeholderText={`(선택)놀이 키워드를 입력하거나 메모파일을 업로드해주세요`}
        cardType={item.cardType}
        isExpanded={item.colSpan === 2}
      />
    ));
  };

  const layout = getGridLayout(subject);
  const activeItem = items.find(item => item.id === activeId);

  return (
    <DndContext
      sensors={!isImageEditModalOpen ? sensors : []}
      collisionDetection={closestCenter}
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