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
} from "@dnd-kit/core";
import DragDropGridAItem from "./DragDropGridAItem";
import { GridItem } from "./types";
import { useImageEditModalStore } from "@/hooks/store/useImageEditModalStore";
import useGridContentStore from "@/hooks/store/useGridContentStore";

interface GridAProps {
  subject: number;
  onDecreaseSubject?: () => void;
  initialGridLayout?: GridItem[];
  initialImagePositionsMap?: Record<string, any[]>;
}

export interface GridARef {
  checkGridValidation: () => boolean;
  getGridData: () => {
    gridLayout: GridItem[];
    imagePositionsMap: Record<string, any[]>;
  };
}

const GridA = React.forwardRef<GridARef, GridAProps>(({ subject, onDecreaseSubject, initialGridLayout, initialImagePositionsMap }, ref) => {
  // 각 이미지 영역의 체크 상태 관리
  const [checkedItems, setCheckedItems] = React.useState<Record<string, boolean>>({});
  const { isImageEditModalOpen } = useImageEditModalStore();
  const { gridContents } = useGridContentStore();
  
  // 그리드 아이템 데이터 관리
  const [items, setItems] = React.useState<GridItem[]>(() => {
    const initialItems: GridItem[] = [];
    for (let i = 0; i < subject; i++) {
      initialItems.push({
        id: `grid-${i}`,
        index: i,
        category: "",
        images: [],
        inputValue: "",
        cardType: subject === 3 ? (i === 0 ? 'large' : 'small') : 'small',
        colSpan: subject === 3 ? (i === 0 ? 2 : 1) : 1,
        imageCount: 1
      });
    }
    return initialItems;
  });

  // 각 그리드 아이템의 이미지 위치 정보 관리 (DnD 시에도 유지됨)
  const [imagePositionsMap, setImagePositionsMap] = React.useState<Record<string, any[]>>({});

  // 초기 데이터 주입 (최초 마운트 시 한 번만)
  const didInitFromPropsRef = React.useRef(false);
  React.useEffect(() => {
    if (didInitFromPropsRef.current) {
      return;
    }
    
    // initialGridLayout이 있고, gridContents에 데이터가 있을 때만 초기화
    if (initialGridLayout && initialGridLayout.length > 0 && Object.keys(gridContents).length > 0) {
      const normalized = initialGridLayout.map((it, i) => {
        const gridId = it.id || `grid-${i}`;
        const content = gridContents[gridId];
        
        // gridContents에 이미지 데이터가 있으면 우선 사용
        let images = it.images || [];
        let imageCount = it.imageCount || 1;
        
        if (content && Array.isArray(content.imageUrls) && content.imageUrls.length > 0) {
          // API에서 받아온 이미지 데이터를 우선시
          images = [...content.imageUrls];
          imageCount = Math.max(1, Math.min(content.imageUrls.length, 3));
        }
        
        return {
          ...it,
          id: gridId,
          index: typeof it.index === 'number' ? it.index : i,
          cardType: subject === 3 ? (i === 0 ? 'large' : 'small') : 'small',
          colSpan: subject === 3 ? (i === 0 ? 2 : 1) : 1,
          images,
          imageCount,
        };
      });
      setItems(normalized);
      didInitFromPropsRef.current = true;
    }
    
    if (initialImagePositionsMap) {
      setImagePositionsMap({ ...initialImagePositionsMap });
    }
  }, [initialGridLayout, initialImagePositionsMap, subject, gridContents]);

  // gridContents에 저장된 이미지 URL들을 items.images에 반영
  React.useEffect(() => {
    // 초기 데이터 주입이 완료되지 않았으면 건너뛰기
    if (!didInitFromPropsRef.current) {
      return;
    }
    
    setItems((prevItems) => {
      let hasDifference = false;
      const next = prevItems.map((it) => {
        const content = gridContents[it.id];
        if (content && Array.isArray(content.imageUrls)) {
          const desiredCount = content.imageUrls.length > 0
            ? Math.max(1, Math.min(content.imageUrls.length, 3))
            : (it.imageCount || 1);
          const urls = [...content.imageUrls].slice(0, desiredCount);
          while (urls.length < desiredCount) {
            urls.push("");
          }
          const isImageCountChanged = (it.imageCount || 1) !== desiredCount;
          const areImagesChanged = it.images.length !== urls.length || it.images.some((v, i) => v !== urls[i]);
          if (isImageCountChanged || areImagesChanged) {
            hasDifference = true;
            return { ...it, images: urls, imageCount: desiredCount };
          }
          return it;
        }
        return it;
      });
      return hasDifference ? next : prevItems;
    });
  }, [gridContents]);

  // gridContents의 categoryValue → items.category, playSubjectText → items.inputValue 반영
  React.useEffect(() => {
    // 초기 데이터 주입이 완료되지 않았으면 건너뛰기
    if (!didInitFromPropsRef.current) {
      return;
    }
    
    setItems((prevItems) => {
      let hasDifference = false;
      const next = prevItems.map((it) => {
        const content = gridContents[it.id];
        if (!content) return it;
        const nextCategory = typeof content.categoryValue === 'string' ? content.categoryValue : it.category;
        const nextInput = typeof content.playSubjectText === 'string' ? content.playSubjectText : it.inputValue;
        const isCategoryChanged = it.category !== nextCategory;
        const isInputChanged = it.inputValue !== nextInput;
        if (isCategoryChanged || isInputChanged) {
          hasDifference = true;
          return {
            ...it,
            category: nextCategory,
            inputValue: nextInput,
          };
        }
        return it;
      });
      return hasDifference ? next : prevItems;
    });
  }, [gridContents]);

  // 현재 드래그 중인 아이템
  const [activeId, setActiveId] = React.useState<string | null>(null);
  // 애니메이션 진행 상태
  const [isAnimating, setIsAnimating] = React.useState<boolean>(false);
  


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
            cardType: subject === 3 ? (i === 0 ? 'large' : 'small') : 'small',
            colSpan: subject === 3 ? (i === 0 ? 2 : 1) : 1,
            imageCount: existingItem.imageCount || 1
          });
        } else {
          // 새 아이템 생성
          newItems.push({
            id: `grid-${i}`,
            index: i,
            category: "",
            images: [],
            inputValue: "",
            cardType: subject === 3 ? (i === 0 ? 'large' : 'small') : 'small',
            colSpan: subject === 3 ? (i === 0 ? 2 : 1) : 1,
            imageCount: 1
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
    useSensor(KeyboardSensor)
  );

  // 체크 상태 변경 핸들러
  const handleCheckedChange = (id: string, checked: boolean) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: checked
    }));
  };

  // 이미지 위치 정보 업데이트 핸들러
  const handleImagePositionsUpdate = (gridId: string, imagePositions: any[]) => {
    setImagePositionsMap(prev => ({
      ...prev,
      [gridId]: imagePositions
    }));
  };

  // 그리드 유효성 검사 함수
  const checkGridValidation = React.useCallback(() => {
    // 현재 subject 수만큼 그리드를 검사
    for (let i = 0; i < subject; i++) {
      const gridId = `grid-${i}`;
      const content = gridContents[gridId];
      
      if (!content) continue;
      
      // 이미지는 있지만 카테고리나 놀이주제가 없는 경우
      if (content.hasImages && (!content.hasCategoryValue && !content.hasPlaySubject)) {
        return false;
      }
      
      // 카테고리나 놀이주제는 있지만 이미지가 없는 경우
      if ((content.hasCategoryValue || content.hasPlaySubject) && !content.hasImages) {
        return false;
      }
    }
    
    return true;
  }, [subject, gridContents]);

  // 그리드 데이터 수집 함수
  const getGridData = React.useCallback(() => {
    return {
      gridLayout: [...items], // 현재 그리드 레이아웃 정보
      imagePositionsMap: { ...imagePositionsMap }, // 이미지 위치 정보
    };
  }, [items, imagePositionsMap]);

  // ref를 통해 함수 expose
  React.useImperativeHandle(ref, () => ({
    checkGridValidation,
    getGridData
  }), [checkGridValidation, getGridData]);

  // 레이아웃 재계산 함수 - subject에 따라 다른 레이아웃 적용
  const recalculateLayout = (items: GridItem[], targetSpanTwoIndex: number): GridItem[] => {
    if (subject !== 3) {
      // subject가 3이 아닌 경우 모든 아이템을 span 1로 설정
      return items.map((item, index) => ({
        ...item,
        index,
        cardType: 'small',
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

  // 단순 1:1 스와핑 처리 함수 (GridC의 performSimpleSwap 참고)
  const performSimpleSwap = (
    currentItems: GridItem[], 
    draggedIndex: number, 
    targetIndex: number
  ): GridItem[] => {
    console.log('[GridA][performSimpleSwap] draggedIndex:', draggedIndex, 'targetIndex:', targetIndex);
    
    // 단순한 위치 교환만 수행
    const result = [...currentItems];
    
    // 두 아이템의 콘텐츠를 교환
    const draggedItem = result[draggedIndex];
    const targetItem = result[targetIndex];
    
    result[draggedIndex] = { ...targetItem, index: draggedIndex };
    result[targetIndex] = { ...draggedItem, index: targetIndex };
    
    console.log('[GridA][performSimpleSwap] swapped items:', {
      draggedToTarget: { ...targetItem, index: draggedIndex },
      targetToDragged: { ...draggedItem, index: targetIndex }
    });
    
    return result;
  };

  // 드래그 시작 핸들러
  const handleDragStart = (event: DragStartEvent) => {
    // 모달이 열려있거나 애니메이션 진행 중이면 드래그 시작하지 않음
    if (isImageEditModalOpen || isAnimating) {
      return;
    }
    setActiveId(event.active.id as string);
  };

  // 드래그 종료 핸들러 (GridC 방식 참고)
  const handleDragEnd = (event: DragEndEvent) => {
    // 모달이 열려있으면 드래그 종료 처리하지 않음
    if (isImageEditModalOpen) {
      setActiveId(null);
      return;
    }
    
    const { active, over } = event;
    
    // activeId 초기화
    setActiveId(null);
    
    // 유효한 드롭 타겟이 없으면 종료
    if (!over) {
      return;
    }
    
    // 같은 아이템에 드롭하면 종료
    if (active.id === over.id) {
      return;
    }
    
    // drop-로 시작하는 ID에서 실제 아이템 ID 추출 (GridC와 동일)
    const overId = over.id.toString().startsWith('drop-') 
      ? over.id.toString().replace('drop-', '') 
      : over.id.toString();
    
    console.log('[GridA][dragEnd] active.id:', active.id, 'over.id:', over.id, 'overId:', overId);
    
    setItems((currentItems) => {
      const draggedIndex = currentItems.findIndex(item => item.id === active.id);
      const targetIndex = currentItems.findIndex(item => item.id === overId);
      
      // 유효하지 않은 인덱스면 변경 없음
      if (draggedIndex === -1 || targetIndex === -1) {
        return currentItems;
      }
      
      // 애니메이션 시작
      setIsAnimating(true);
      
      // 애니메이션 완료 후 상태 초기화
      setTimeout(() => {
        setIsAnimating(false);
      }, 350);
      
      console.log('[GridA][dragEnd] draggedIndex:', draggedIndex, 'targetIndex:', targetIndex);
      console.log('[GridA][dragEnd] subject:', subject, 'draggedItem:', currentItems[draggedIndex], 'targetItem:', currentItems[targetIndex]);
      
      // subject가 3이고 2x1 span 아이템이 관련된 경우 특별 처리 (GridC photoCount=3 로직 참고)
      if (subject === 3) {
        const draggedItem = currentItems[draggedIndex];
        
        // 2x1 아이템(colSpan === 2)을 드래그하는 경우
        if (draggedItem.colSpan === 2) {
          console.log('[GridA][dragEnd] 2x1 item dragged - special handling');
          
          // 현재 2x1 아이템의 위치 확인
          const currentSpanTwoIndex = currentItems.findIndex(item => item.colSpan === 2);
          
          // 타겟이 어느 행에 속하는지 결정
          // targetIndex 0 = 첫 번째 행, targetIndex 1,2 = 두 번째 행
          const targetRow = targetIndex === 0 ? 1 : 2;
          const desiredLargeIndex = targetRow === 1 ? 0 : 2;
          
          console.log('[GridA][dragEnd] current 2x1 at index:', currentSpanTwoIndex, 'targetIndex:', targetIndex, 'targetRow:', targetRow, 'desiredLargeIndex:', desiredLargeIndex);
          
          // 2x1이 위치를 바꾸는 경우에만 특별 처리
          if (currentSpanTwoIndex !== desiredLargeIndex) {
            console.log('[GridA][dragEnd] moving 2x1 from index', currentSpanTwoIndex, 'to index', desiredLargeIndex);
            
            const result = [...currentItems];
            
            // GridC와 동일한 로직: 2x1을 새 위치로 이동하고, 기존 위치의 아이템들을 재배치
            if (currentSpanTwoIndex === 0 && desiredLargeIndex === 2) {
              // 2x1이 첫 번째 행에서 두 번째 행으로 이동
              // index 0 (2x1) → index 2로
              // index 1 → index 0으로  
              // index 2 → index 1로
              const item0 = result[0]; // 2x1 아이템
              const item1 = result[1]; // 2,1 위치 아이템
              const item2 = result[2]; // 2,2 위치 아이템
              
              result[0] = { ...item1, index: 0 }; // 2,1에 있던 아이템이 1,1로
              result[1] = { ...item2, index: 1 }; // 2,2에 있던 아이템이 1,2로
              result[2] = { ...item0, index: 2 }; // 2x1 아이템이 두 번째 행으로
              
            } else if (currentSpanTwoIndex === 2 && desiredLargeIndex === 0) {
              // 2x1이 두 번째 행에서 첫 번째 행으로 이동
              // index 2 (2x1) → index 0으로
              // index 0 → index 1로
              // index 1 → index 2로
              const item0 = result[0]; // 1,1 위치 아이템
              const item1 = result[1]; // 1,2 위치 아이템  
              const item2 = result[2]; // 2x1 아이템
              
              result[0] = { ...item2, index: 0 }; // 2x1 아이템이 첫 번째 행으로
              result[1] = { ...item0, index: 1 }; // 1,1에 있던 아이템이 2,1로
              result[2] = { ...item1, index: 2 }; // 1,2에 있던 아이템이 2,2로
            }
            
            // 레이아웃 재계산 (2x1 아이템의 새 위치 기준)
            return recalculateLayout(result, desiredLargeIndex);
          }
        }
        
        // 1x1 아이템을 2x1 아이템과 교환하는 경우
        const targetItem = currentItems[targetIndex];
        if (targetItem.colSpan === 2) {
          console.log('[GridA][dragEnd] 1x1 item swapped with 2x1 item');
          
          // 위와 동일한 로직 적용
          const currentSpanTwoIndex = currentItems.findIndex(item => item.colSpan === 2);
          const targetRow = draggedIndex === 0 ? 1 : 2;
          const desiredLargeIndex = targetRow === 1 ? 0 : 2;
          
          if (currentSpanTwoIndex !== desiredLargeIndex) {
            const result = [...currentItems];
            
            if (currentSpanTwoIndex === 0 && desiredLargeIndex === 2) {
              const item0 = result[0];
              const item1 = result[1];
              const item2 = result[2];
              
              result[0] = { ...item1, index: 0 };
              result[1] = { ...item2, index: 1 };
              result[2] = { ...item0, index: 2 };
              
            } else if (currentSpanTwoIndex === 2 && desiredLargeIndex === 0) {
              const item0 = result[0];
              const item1 = result[1];
              const item2 = result[2];
              
              result[0] = { ...item2, index: 0 };
              result[1] = { ...item0, index: 1 };
              result[2] = { ...item1, index: 2 };
            }
            
            return recalculateLayout(result, desiredLargeIndex);
          }
        }
      }
      
      // 일반적인 경우: 단순한 1:1 스와핑
      console.log('[GridA][dragEnd] simple swap');
      return performSimpleSwap(currentItems, draggedIndex, targetIndex);
    });

    // 체크 상태도 1:1 스와핑 (overId 사용)
    setCheckedItems(prev => {
      const draggedIndex = items.findIndex(item => item.id === active.id);
      const targetIndex = items.findIndex(item => item.id === overId);
      
      if (draggedIndex === -1 || targetIndex === -1) {
        return prev;
      }
      
      const newCheckedItems = { ...prev };
      const draggedId = items[draggedIndex].id;
      const targetId = items[targetIndex].id;
      
      // 체크 상태 스와핑
      const draggedChecked = newCheckedItems[draggedId] || false;
      const targetChecked = newCheckedItems[targetId] || false;
      
      newCheckedItems[draggedId] = targetChecked;
      newCheckedItems[targetId] = draggedChecked;
      
      return newCheckedItems;
    });
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
      <DragDropGridAItem
        key={item.id}
        id={item.id}
        index={item.index}
        style={{ gridColumn: item.colSpan === 2 ? "span 2" : "span 1" }}
        checked={checkedItems[item.id] || false}
        onCheckedChange={(checked: boolean) => handleCheckedChange(item.id, checked)}
        category={item.category}
        images={item.images}
        // 입력값은 zustand의 gridContents로 관리
        placeholderText={`(선택)놀이 키워드를 입력하거나 메모파일을 업로드해주세요`}
        cardType={item.cardType as 'large' | 'small' | undefined}
        isExpanded={item.colSpan === 2}
        onDecreaseSubject={onDecreaseSubject}
        imagePositions={imagePositionsMap[item.id] || []}
        onImagePositionsUpdate={(positions: any[]) => handleImagePositionsUpdate(item.id, positions)}
        imageCount={item.imageCount || 1}
        gridCount={subject}
        isAnimating={isAnimating}
      />
    ));
  };

  const layout = getGridLayout(subject);
  
  return (
    <DndContext
      sensors={isImageEditModalOpen || isAnimating ? [] : sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
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
      {/* DragOverlay 제거됨: 중복 기울기 프리뷰 방지 */}
    </DndContext>
  );
});

GridA.displayName = 'GridA';

export default GridA; 