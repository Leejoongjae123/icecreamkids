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

        if (activeIndex === -1 || overIndex === -1) {
          return currentItems;
        }

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
  const getGridLayoutConfig = () => {
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
        // 3개: 2x2격자에서 1,1과 1,2를 합치고 2,1과 2,2는 별도로 구성
        return {
          className: "grid grid-cols-2 grid-rows-2 gap-4 w-full h-full max-w-4xl mx-auto",
          itemStyles: {
            0: { gridColumn: "1 / 3", gridRow: "1" }, // 첫 번째 행 전체
            1: { gridColumn: "1", gridRow: "2" },      // 두 번째 행 왼쪽
            2: { gridColumn: "2", gridRow: "2" }       // 두 번째 행 오른쪽
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
      collisionDetection={closestCenter}
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
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default GridC; 