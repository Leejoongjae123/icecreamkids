"use client";
import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
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
import GridBElement from "./GridBElement";
import SortableGridBItem from "./SortableGridBItem";
import AddButton from "./AddButton";
import GridEditToolbar from "./GridEditToolbar";
import { GridBItem } from "./types";

interface GridBProps {
  gridCount?: number;
}

function GridBContent({ gridCount = 12 }: GridBProps) {
  const searchParams = useSearchParams();
  
  // searchParams에서 subject 값을 가져오고, 1~12 범위로 제한
  const subjectParam = searchParams.get('subject');
  const subjectCount = subjectParam ? Math.min(Math.max(parseInt(subjectParam), 1), 12) : 12;
  
  // 그리드 아이템 데이터 관리
  const [items, setItems] = React.useState<GridBItem[]>(() => {
    const initialItems: GridBItem[] = [];
    for (let i = 1; i <= 12; i++) {
      initialItems.push({
        id: `grid-b-${i}`,
        index: i,
        isSelected: false,
        isExpanded: false,
        isHidden: false,
        images: [],
        inputValue: ""
      });
    }
    return initialItems;
  });

  // 현재 드래그 중인 아이템
  const [activeId, setActiveId] = React.useState<string | null>(null);
  
  // 선택된 아이템 관리 (하나만 선택 가능)
  const [selectedItem, setSelectedItem] = React.useState<number | null>(null);
  
  // 숨겨진 아이템들을 관리하는 상태 (쓰레기통으로 삭제한 경우)
  const [hiddenItems, setHiddenItems] = React.useState<Set<number>>(new Set());
  
  // 제거된 아이템들을 관리하는 상태 (합치기로 완전히 제거된 경우)
  const [removedItems, setRemovedItems] = React.useState<Set<number>>(new Set());
  
  // 확장된 아이템들을 관리하는 상태 (col-span-2가 적용된 아이템)
  const [expandedItems, setExpandedItems] = React.useState<Set<number>>(new Set());

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

  // + 버튼 클릭 핸들러 (확장 기능)
  const handleExpand = (firstIndex: number, secondIndex: number) => {
    // 뒤쪽 아이템 완전히 제거 (DOM에서 제거)
    setRemovedItems(prev => {
      const newSet = new Set(prev);
      newSet.add(secondIndex);
      return newSet;
    });
    
    // 앞쪽 아이템 확장
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      newSet.add(firstIndex);
      return newSet;
    });
    
    // items 상태 업데이트
    setItems(prev => 
      prev.map(item => {
        if (item.index === firstIndex) {
          return { ...item, isExpanded: true };
        }
        return item;
      })
    );
    
    // 제거된 아이템이 선택되어 있다면 선택 해제
    if (selectedItem === secondIndex) {
      setSelectedItem(null);
    }
  };

  // 선택 상태 변경 핸들러
  const handleSelectChange = (index: number, isSelected: boolean) => {
    if (isSelected) {
      setSelectedItem(index);
    } else {
      setSelectedItem(null);
    }
    
    // items 상태 업데이트
    setItems(prev => 
      prev.map(item => ({
        ...item,
        isSelected: item.index === index ? isSelected : false
      }))
    );
  };

  // 삭제 핸들러 (쓰레기통 버튼 - 숨김 처리)
  const handleDelete = (index: number) => {
    setHiddenItems(prev => {
      const newSet = new Set(prev);
      newSet.add(index);
      return newSet;
    });
    
    // items 상태 업데이트
    setItems(prev => 
      prev.map(item => 
        item.index === index ? { ...item, isHidden: true } : item
      )
    );
    
    // 숨겨진 아이템이 선택되어 있다면 선택 해제
    if (selectedItem === index) {
      setSelectedItem(null);
    }
  };

  // 드래그 시작 핸들러
  const handleDragStart = (event: DragStartEvent) => {
    const draggedItem = items.find(item => item.id === event.active.id);
    if (draggedItem) {
      // 숨겨진 아이템이나 제거된 아이템은 드래그 시작 방지
      if (hiddenItems.has(draggedItem.index) || removedItems.has(draggedItem.index)) {
        return;
      }
    }
    setActiveId(event.active.id as string);
  };

  // 드래그 종료 핸들러 (1:1 swap 방식)
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
        
        // 숨겨진 아이템이나 제거된 아이템은 드래그 불가
        if (hiddenItems.has(activeItem.index) || removedItems.has(activeItem.index) ||
            hiddenItems.has(overItem.index) || removedItems.has(overItem.index)) {
          return currentItems;
        }

        // 새로운 배열 생성
        const newItems = [...currentItems];
        
        // 확장된 아이템 처리를 고려한 swap
        const activeGridIndex = activeItem.index;
        const overGridIndex = overItem.index;
        
        // 두 아이템의 모든 데이터를 교환 (인덱스 제외)
        const tempActiveItem = {
          ...activeItem,
          index: overGridIndex
        };
        const tempOverItem = {
          ...overItem,  
          index: activeGridIndex
        };
        
        // 배열에서 위치 교환
        newItems[activeIndex] = tempOverItem;
        newItems[overIndex] = tempActiveItem;

        return newItems;
      });

      // 확장/숨김 상태도 함께 교환
      const activeItem = items.find(item => item.id === activeItemId);
      const overItem = items.find(item => item.id === overItemId);
      
      if (activeItem && overItem) {
        const activeGridIndex = activeItem.index;
        const overGridIndex = overItem.index;
        
        // 확장 상태 교환
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

        // 숨김 상태 교환
        setHiddenItems(prev => {
          const newSet = new Set(prev);
          const activeHidden = prev.has(activeGridIndex);
          const overHidden = prev.has(overGridIndex);
          
          // 기존 상태 제거
          newSet.delete(activeGridIndex);
          newSet.delete(overGridIndex);
          
          // 교환된 상태 적용
          if (activeHidden) {
            newSet.add(overGridIndex);
          }
          if (overHidden) {
            newSet.add(activeGridIndex);
          }
          
          return newSet;
        });

        // 선택 상태 업데이트
        if (selectedItem === activeGridIndex) {
          setSelectedItem(overGridIndex);
        } else if (selectedItem === overGridIndex) {
          setSelectedItem(activeGridIndex);
        }
      }
    }

    setActiveId(null);
  };

  // 툴바 핸들러들
  const handleToolbarDelete = () => {
    if (selectedItem) {
      handleDelete(selectedItem);
    }
  };

  const handleToolbarEdit = () => {
    if (selectedItem) {
      // 편집 로직 구현
      console.log(`편집: 아이템 ${selectedItem}`);
    }
  };

  const handleToolbarDuplicate = () => {
    if (selectedItem) {
      // 복제 로직 구현
      console.log(`복제: 아이템 ${selectedItem}`);
    }
  };

  const handleToolbarMove = () => {
    if (selectedItem) {
      // 이동 로직 구현
      console.log(`이동: 아이템 ${selectedItem}`);
    }
  };

  // 그리드 아이템들을 렌더링하는 함수
  const renderGridItems = () => {
    // 항상 12개의 그리드를 렌더링하되, subjectCount에 따라 표시 여부 결정
    return items.slice(0, 12).map((item) => {
      // subjectCount를 초과하거나 완전히 제거된 아이템은 렌더링하지 않음
      if (item.index > subjectCount || removedItems.has(item.index)) {
        return null;
      }
      
      return (
        <SortableGridBItem
          key={item.id}
          id={item.id}
          index={item.index}
          isSelected={selectedItem === item.index}
          onSelectChange={(isSelected) => handleSelectChange(item.index, isSelected)}
          onDelete={() => handleDelete(item.index)}
          isExpanded={expandedItems.has(item.index)}
          isHidden={hiddenItems.has(item.index)}
          images={item.images}
        />
      );
    }).filter(Boolean); // null 값 제거
  };

  // floating 플러스 버튼들을 렌더링하는 함수
  const renderFloatingButtons = () => {
    const buttons: JSX.Element[] = [];
    
    // 각 행에서 1-2, 3-4 사이에 플러스 버튼 배치
    const buttonPositions = [
      { between: [1, 2], row: 0, position: 'left' },
      { between: [3, 4], row: 0, position: 'right' },
      { between: [5, 6], row: 1, position: 'left' },
      { between: [7, 8], row: 1, position: 'right' },
      { between: [9, 10], row: 2, position: 'left' },
      { between: [11, 12], row: 2, position: 'right' },
    ];

    buttonPositions.forEach(({ between, row, position }) => {
      const [first, second] = between;
      
      // 두 요소가 모두 표시되고 제거되지 않은 경우, 확장되지 않은 경우, 숨김처리되지 않은 경우에만 플러스 버튼 표시
      // 각 플러스 버튼을 개별적으로 판단 (행 전체가 아닌 해당 아이템들만 확인)
      if (first <= subjectCount && second <= subjectCount && 
          !removedItems.has(first) && !removedItems.has(second) &&
          !expandedItems.has(first) && !expandedItems.has(second) &&
          !hiddenItems.has(first) && !hiddenItems.has(second)) {
        // 각 행의 중앙 위치를 백분율로 계산 (행별로 33.33%씩 분할)
        const topPercentage = `${((row + 1) * 33.33) - 16.67}%`; // 각 행의 중앙 위치
        const leftPosition = position === 'left' ? '25%' : '75%'; // 좌측 또는 우측 중앙
        
        buttons.push(
          <div
            key={`floating-add-${first}-${second}`}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
            style={{
              top: topPercentage,
              left: leftPosition,
            }}
          >
            <AddButton
              onClick={() => handleExpand(first, second)}
            />
          </div>
        );
      }
    });
    
    return buttons;
  };

  const activeItem = items.find(item => item.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={items.filter(item => 
          item.index <= subjectCount && 
          !removedItems.has(item.index)
        ).map(item => item.id)} 
        strategy={rectSortingStrategy}
      >
        <div className="w-full h-full relative">
          {/* 기본 그리드 레이아웃 (4x3) */}
          <div className={`w-full h-full grid grid-cols-4 gap-3 transition-colors duration-200 ${
            activeId ? 'bg-primary/5' : ''
          }`}>
            {renderGridItems()}
          </div>
          
          {/* Floating 플러스 버튼들 */}
          {renderFloatingButtons()}
        </div>
      </SortableContext>
      
      <DragOverlay>
        {activeId && activeItem ? (
          <div className="rotate-6 scale-110 shadow-2xl border-2 border-primary rounded-2xl">
            <GridBElement
              index={activeItem.index}
              gridId={activeItem.id}
              isSelected={activeItem.isSelected}
              onSelectChange={() => {}}
              onDelete={() => {}}
              isExpanded={activeItem.isExpanded}
              isHidden={activeItem.isHidden}
              images={activeItem.images}
              placeholderText="ex) 아이들과 촉감놀이를 했어요"
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function GridB(props: GridBProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GridBContent {...props} />
    </Suspense>
  );
}

export default GridB; 