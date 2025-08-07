"use client";
import * as React from "react";
import {
  DndContext,
  closestCenter,
  rectIntersection,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  CollisionDetection,
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
      // circle-1과 rounded-square-2 중에서 랜덤 선택
      const randomIndex = Math.floor(Math.random() * clipPathItems.length);
      const clipPath = clipPathItems[randomIndex];
      initialItems.push({
        id: `grid-c-${i}`,
        index: i,
        clipPathData: clipPath,
        imageUrl: defaultImage,
      });
    }
    return initialItems;
  });

  // 선택된 아이템들 관리
  const [selectedItems, setSelectedItems] = React.useState<Set<string>>(new Set());

  // photoCount가 변경되면 items 재생성
  React.useEffect(() => {
    const defaultImage = "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg";
    const newItems: GridCItem[] = [];
    
    for (let i = 0; i < photoCount; i++) {
      // circle-1과 rounded-square-2 중에서 랜덤 선택
      const randomIndex = Math.floor(Math.random() * clipPathItems.length);
      const clipPath = clipPathItems[randomIndex];
      newItems.push({
        id: `grid-c-${i}`,
        index: i,
        clipPathData: clipPath,
        imageUrl: defaultImage,
      });
    }
    setItems(newItems);
    // 아이템이 변경되면 선택 상태 초기화
    setSelectedItems(new Set());
    // photoCount가 3일 때 큰 아이템 위치 초기화 (기본값: 위쪽)
    if (photoCount === 3) {
      setLargeItemPosition(0);
    }
  }, [photoCount]);

  // 현재 드래그 중인 아이템
  const [activeId, setActiveId] = React.useState<string | null>(null);

  // photoCount가 3일 때 큰 아이템의 위치 추적 (0: 위쪽, 2: 아래쪽)
  const [largeItemPosition, setLargeItemPosition] = React.useState<number>(0);

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

  // 커스텀 collision detection - 다양한 크기의 그리드를 고려
  const customCollisionDetection: CollisionDetection = (args) => {
    // 1) 포인터가 위치한 droppable 우선
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }

    // 2) 사각형 교차 영역 확인
    const rectCollisions = rectIntersection(args);
    if (rectCollisions.length > 0) {
      return rectCollisions;
    }

    // 3) 마지막으로 center 기준
    return closestCenter(args);
  };

  // photoCount가 3일 때 레이아웃 재계산 함수
  const recalculateLayoutForPhoto3 = (items: GridCItem[], targetLargeIndex: number): GridCItem[] => {
    if (photoCount !== 3) {
      return items;
    }
    
    // 2x2 그리드에서 큰 아이템은 첫 번째 위치(0) 또는 마지막 위치(2)에만 가능
    // targetLargeIndex가 마지막 위치일 때만 마지막으로, 나머지는 첫 번째로
    const largeIndex = targetLargeIndex === items.length - 1 ? items.length - 1 : 0;
    
    // 큰 아이템 위치 state 업데이트
    setLargeItemPosition(largeIndex);
    
    return items.map((item, index) => ({
      ...item,
      index,
    }));
  };

  // 드래그 시작 핸들러
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // 드래그 종료 핸들러 (GridA와 동일한 로직)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && over?.id) {
      setItems((currentItems) => {
        const activeIndex = currentItems.findIndex(item => item.id === active.id);
        const overIndex = currentItems.findIndex(item => item.id === over.id);

        if (activeIndex === -1 || overIndex === -1) {
          return currentItems;
        }

        // 배열 위치 이동 (arrayMove 사용)
        const reorderedItems = arrayMove(currentItems, activeIndex, overIndex);
        
        // photoCount가 3이 아닌 경우 단순 위치 이동만 처리
        if (photoCount !== 3) {
          return reorderedItems.map((item, index) => ({
            ...item,
            index
          }));
        }
        
        // photoCount가 3인 경우만 큰 아이템 로직 처리
        // 큰 아이템은 첫 번째(위쪽 큰 영역) 또는 마지막(아래쪽 큰 영역)에 위치
        const isLargeAtTop = (index: number) => index === 0;
        const isLargeAtBottom = (index: number) => index === 2;
        const isCurrentlyLargeAtTop = isLargeAtTop(0); // 항상 현재 레이아웃에서 첫 번째가 큰 영역
        
        // 드래그된 아이템이 첫 번째나 마지막 위치로 이동한 경우
        const activeWasFirst = activeIndex === 0;
        const overIsFirst = overIndex === 0;
        const overIsLast = overIndex === 2;
        
        if (activeWasFirst) {
          // 첫 번째(큰) 아이템을 드래그한 경우
          return recalculateLayoutForPhoto3(reorderedItems, overIndex);
        } else if (overIsFirst || overIsLast) {
          // 작은 아이템을 첫 번째나 마지막 위치로 드래그한 경우
          return recalculateLayoutForPhoto3(reorderedItems, overIndex);
        } else {
          // 작은 아이템들끼리의 위치 변경
          return reorderedItems.map((item, index) => ({
            ...item,
            index
          }));
        }
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

  // 클립패스 변경 핸들러
  const handleClipPathChange = (gridId: string, clipPathData: ClipPathItem) => {
    console.log("GridC - 클립패스 변경:", { gridId, clipPathData });
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === gridId ? { ...item, clipPathData } : item
      )
    );
  };

  // 선택 상태 변경 핸들러
  const handleSelectChange = (gridId: string, isSelected: boolean) => {
    setSelectedItems(prev => {
      const newSelected = new Set(prev);
      if (isSelected) {
        newSelected.add(gridId);
      } else {
        newSelected.delete(gridId);
      }
      return newSelected;
    });
  };

  // 아이템 삭제 핸들러
  const handleDelete = (gridId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== gridId));
    setSelectedItems(prev => {
      const newSelected = new Set(prev);
      newSelected.delete(gridId);
      return newSelected;
    });
  };

  const activeItem = items.find(item => item.id === activeId);

  // photo 값에 따른 그리드 레이아웃 설정
  const getGridLayoutConfig = (currentItems: GridCItem[] = items) => {
    switch (photoCount) {
      case 1:
        // 1개: 전체를 하나로 구성
        return {
          className: "grid grid-cols-1 grid-rows-1 gap-4 w-full h-full max-w-4xl mx-auto",
          itemStyles: {
            0: { gridColumn: "1 / -1", gridRow: "1 / -1" }
          } as Record<number, React.CSSProperties>
        };
      
      case 2:
        // 2개: 전체를 가로로 2개 배치
        return {
          className: "grid grid-cols-2 grid-rows-1 gap-4 w-full h-full max-w-4xl mx-auto",
          itemStyles: {
            0: { gridColumn: "1", gridRow: "1" },
            1: { gridColumn: "2", gridRow: "1" }
          } as Record<number, React.CSSProperties>
        };
      
      case 3:
        // 3개: 2x2격자에서 큰 아이템 위치에 따라 동적 레이아웃
        // 큰 아이템이 위에 있으면: 첫 번째 행 전체 + 두 번째 행 좌우
        // 큰 아이템이 아래에 있으면: 첫 번째 행 좌우 + 두 번째 행 전체
        
        // largeItemPosition state를 사용하여 큰 아이템 위치 결정
        const isLargeAtBottom = largeItemPosition === 2;
        const isLargeAtTop = !isLargeAtBottom;
        
        return {
          className: "grid grid-cols-2 grid-rows-2 gap-4 w-full h-full max-w-4xl mx-auto",
          itemStyles: isLargeAtTop ? {
            0: { gridColumn: "1 / 3", gridRow: "1" }, // 첫 번째 행 전체 (큰 아이템)
            1: { gridColumn: "1", gridRow: "2" },      // 두 번째 행 왼쪽 (작은 아이템)
            2: { gridColumn: "2", gridRow: "2" }       // 두 번째 행 오른쪽 (작은 아이템)
          } : {
            0: { gridColumn: "1", gridRow: "1" },      // 첫 번째 행 왼쪽 (작은 아이템)
            1: { gridColumn: "2", gridRow: "1" },      // 첫 번째 행 오른쪽 (작은 아이템)  
            2: { gridColumn: "1 / 3", gridRow: "2" }   // 두 번째 행 전체 (큰 아이템)
          } as Record<number, React.CSSProperties>
        };
      
      case 4:
        // 4개: 2x2격자로 구성
        return {
          className: "grid grid-cols-2 grid-rows-2 gap-4 w-full h-full max-w-4xl mx-auto",
          itemStyles: {
            0: { gridColumn: "1", gridRow: "1" },
            1: { gridColumn: "2", gridRow: "1" },
            2: { gridColumn: "1", gridRow: "2" },
            3: { gridColumn: "2", gridRow: "2" }
          } as Record<number, React.CSSProperties>
        };
      
      case 5:
        // 5개: 3x3격자에서 1,1과 1,2와 2,1과 2,2를 합치고, 3,2와 3,3을 합치고, 나머지는 개별격자로 구성
        return {
          className: "grid grid-cols-3 grid-rows-3 gap-4 w-full h-full max-w-4xl mx-auto",
          itemStyles: {
            0: { gridColumn: "1 / 3", gridRow: "1 / 3" }, // 큰 영역 (1,1부터 2,2까지)
            1: { gridColumn: "3", gridRow: "1" },          // 오른쪽 위 (3,1)
            2: { gridColumn: "3", gridRow: "2" },          // 오른쪽 중간 (3,2)
            3: { gridColumn: "1", gridRow: "3" },          // 아래쪽 왼쪽 (1,3)
            4: { gridColumn: "2 / 4", gridRow: "3" }       // 아래쪽 오른쪽 합친 영역 (2,3부터 3,3까지)
          } as Record<number, React.CSSProperties>
        };
      
      case 6:
        // 6개: 3x3격자에서 1,1과 1,2와 2,1과 2,2를 합치고 나머지는 개별격자로 구성
        return {
          className: "grid grid-cols-3 grid-rows-3 gap-4 w-full h-full max-w-4xl mx-auto",
          itemStyles: {
            0: { gridColumn: "1 / 3", gridRow: "1 / 3" }, // 큰 영역 (1,1부터 2,2까지)
            1: { gridColumn: "3", gridRow: "1" },          // 오른쪽 위 (3,1)
            2: { gridColumn: "3", gridRow: "2" },          // 오른쪽 중간 (3,2)
            3: { gridColumn: "1", gridRow: "3" },          // 아래쪽 왼쪽 (1,3)
            4: { gridColumn: "2", gridRow: "3" },          // 아래쪽 중간 (2,3)
            5: { gridColumn: "3", gridRow: "3" }           // 아래쪽 오른쪽 (3,3)
          } as Record<number, React.CSSProperties>
        };
      
      case 7:
        // 7개: 3x3격자에서 1,1과 1,2를 합치고 3,2와 3,3을 합치고 나머지는 개별격자로 구성
        return {
          className: "grid grid-cols-3 grid-rows-3 gap-4 w-full h-full max-w-4xl mx-auto",
          itemStyles: {
            0: { gridColumn: "1 / 3", gridRow: "1" },      // 첫 번째 행 합친 영역 (1,1부터 1,2까지)
            1: { gridColumn: "3", gridRow: "1" },          // 오른쪽 위 (3,1)
            2: { gridColumn: "1", gridRow: "2" },          // 두 번째 행 왼쪽 (1,2)
            3: { gridColumn: "2", gridRow: "2" },          // 두 번째 행 중간 (2,2)
            4: { gridColumn: "3", gridRow: "2" },          // 두 번째 행 오른쪽 (3,2)
            5: { gridColumn: "1", gridRow: "3" },          // 세 번째 행 왼쪽 (1,3)
            6: { gridColumn: "2 / 4", gridRow: "3" }       // 세 번째 행 합친 영역 (2,3부터 3,3까지)
          } as Record<number, React.CSSProperties>
        };
      
      case 8:
        // 8개: 3x3격자에서 3,2와 3,3을 합치고 나머지는 개별격자로 구성
        return {
          className: "grid grid-cols-3 grid-rows-3 gap-4 w-full h-full max-w-4xl mx-auto",
          itemStyles: {
            0: { gridColumn: "1", gridRow: "1" },          // (1,1)
            1: { gridColumn: "2", gridRow: "1" },          // (2,1)
            2: { gridColumn: "3", gridRow: "1" },          // (3,1)
            3: { gridColumn: "1", gridRow: "2" },          // (1,2)
            4: { gridColumn: "2", gridRow: "2" },          // (2,2)
            5: { gridColumn: "3", gridRow: "2" },          // (3,2)
            6: { gridColumn: "1", gridRow: "3" },          // (1,3)
            7: { gridColumn: "2 / 4", gridRow: "3" }       // 세 번째 행 합친 영역 (2,3부터 3,3까지)
          } as Record<number, React.CSSProperties>
        };
      
      case 9:
        // 9개: 3x3격자로 구성
        return {
          className: "grid grid-cols-3 grid-rows-3 gap-4 w-full h-full max-w-4xl mx-auto",
          itemStyles: {
            0: { gridColumn: "1", gridRow: "1" },          // (1,1)
            1: { gridColumn: "2", gridRow: "1" },          // (2,1)
            2: { gridColumn: "3", gridRow: "1" },          // (3,1)
            3: { gridColumn: "1", gridRow: "2" },          // (1,2)
            4: { gridColumn: "2", gridRow: "2" },          // (2,2)
            5: { gridColumn: "3", gridRow: "2" },          // (3,2)
            6: { gridColumn: "1", gridRow: "3" },          // (1,3)
            7: { gridColumn: "2", gridRow: "3" },          // (2,3)
            8: { gridColumn: "3", gridRow: "3" }           // (3,3)
          } as Record<number, React.CSSProperties>
        };
      
      default:
        // 기본값 (기존 로직)
        const cols = Math.min(photoCount, 3);
        const rows = Math.ceil(photoCount / cols);
        return {
          className: `grid grid-cols-${cols} gap-4 w-full h-full max-w-4xl mx-auto`,
          itemStyles: {} as Record<number, React.CSSProperties>,
          gridTemplateRows: `repeat(${rows}, 1fr)`
        };
    }
  };

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
        <div className="w-full h-full relative flex flex-col">
          <div className={getGridLayoutConfig().className}>
            {items.map((item, index) => {
              const layoutConfig = getGridLayoutConfig();
              const itemStyle = layoutConfig.itemStyles[index] || {};
              
              return (
                <SortableGridCItem
                  key={item.id}
                  id={item.id}
                  index={item.index}
                  clipPathData={item.clipPathData}
                  imageUrl={item.imageUrl}
                  isClippingEnabled={isClippingEnabled}
                  isSelected={selectedItems.has(item.id)}
                  onSelectChange={(isSelected) => handleSelectChange(item.id, isSelected)}
                  onDelete={() => handleDelete(item.id)}
                  onImageUpload={handleImageUpload}
                  onClipPathChange={handleClipPathChange}
                  style={itemStyle}
                />
              );
            })}
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
              isSelected={selectedItems.has(activeItem.id)}
              onImageUpload={() => {}}
              onClipPathChange={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default GridC; 