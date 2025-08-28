"use client";
import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  CollisionDetection,
} from "@dnd-kit/core";
import DragDropGridBItem from "./DragDropGridBItem";
import AddButton from "./AddButton";
import ApplyModal from "./ApplyModal";
import { GridBItem } from "./types";
import useGridContentStore from "@/hooks/store/useGridContentStore";
import { useSavedDataStore } from "@/hooks/store/useSavedDataStore";
import { useImageEditModalStore } from "@/hooks/store/useImageEditModalStore";

interface GridBProps {
  gridCount?: number;
  initialLayout?: {
    expanded?: number[];
    removed?: number[];
    hidden?: number[];
    imageCountByIndex?: Record<number, number>;
    orderIndices?: number[];
  };
}

export type GridBRef = {
  getGridData: () => {
    gridBLayout: {
      expanded: number[];
      removed: number[];
      hidden: number[];
      imageCountByIndex: Record<number, number>;
      orderIndices: number[];
    };
  };
};

function GridBContentImpl({ gridCount = 12, initialLayout }: GridBProps, ref: React.Ref<GridBRef>) {
  const searchParams = useSearchParams();
  
  // B타입에서는 prop으로 전달된 gridCount를 우선 사용, 없으면 URL subject 사용
  const subjectParam = searchParams.get('subject');
  const subjectCount = React.useMemo(() => {
    if (typeof gridCount === 'number') {
      return Math.min(Math.max(gridCount, 1), 12);
    }
    return subjectParam ? Math.min(Math.max(parseInt(subjectParam), 1), 12) : 12;
  }, [gridCount, subjectParam]);
  
  // Grid content store 사용 (초기화용)
  const { updatePlaySubject, updateImages, updateCategoryValue, updateAiGenerated, gridContents } = useGridContentStore();
  const { isImageEditModalOpen } = useImageEditModalStore();
  const { isSaved } = useSavedDataStore();
  
  // 그리드 아이템 데이터 관리
  const [items, setItems] = React.useState<GridBItem[]>(() => {
    const initialItems: GridBItem[] = [];
    for (let i = 1; i <= 12; i++) {
      initialItems.push({
        id: `grid-b-${i}`,
        index: i,
        category: "",
        isSelected: false,
        isExpanded: false,
        isHidden: false,
        images: [],
        inputValue: "",
        cardType: "small",
        colSpan: 1,
        imageCount: 1 // 기본 이미지 개수 1로 설정
      });
    }
    return initialItems;
  });

  // 현재 드래그 중인 아이템
  const [activeId, setActiveId] = React.useState<string | null>(null);
  
  // 선택된 아이템 관리 (하나만 선택 가능)
  const [selectedItem, setSelectedItem] = React.useState<number | null>(null);
  
  // ApplyModal 상태 관리
  const [isApplyModalOpen, setIsApplyModalOpen] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<{
    type: 'expand' | 'split';
    firstIndex: number;
    secondIndex: number;
  } | null>(null);
  
  // 숨겨진 아이템들을 관리하는 상태 (쓰레기통으로 삭제한 경우)
  const [hiddenItems, setHiddenItems] = React.useState<Set<number>>(new Set());
  
  // 제거된 아이템들을 관리하는 상태 (합치기로 완전히 제거된 경우)
  const [removedItems, setRemovedItems] = React.useState<Set<number>>(new Set());
  
  // 확장된 아이템들을 관리하는 상태 (col-span-2가 적용된 아이템)
  const [expandedItems, setExpandedItems] = React.useState<Set<number>>(new Set());

  // +/− 버튼 hover 시 미리보기 상태
  const [hoverPreview, setHoverPreview] = React.useState<{
    type: 'expand' | 'split';
    first: number;
    second: number;
  } | null>(null);

  // 초기 레이아웃 주입 (합치기/삭제/숨김/이미지 개수)
  React.useEffect(() => {
    if (!initialLayout) {
      return;
    }
    try {
      if (Array.isArray(initialLayout.expanded)) {
        setExpandedItems(new Set(initialLayout.expanded));
      }
      if (Array.isArray(initialLayout.removed)) {
        setRemovedItems(new Set(initialLayout.removed));
      }
      if (Array.isArray(initialLayout.hidden)) {
        setHiddenItems(new Set(initialLayout.hidden));
      }
      if (initialLayout.imageCountByIndex && typeof initialLayout.imageCountByIndex === 'object') {
        setItems(prev => prev.map(it => ({
          ...it,
          imageCount: initialLayout.imageCountByIndex?.[it.index] ?? it.imageCount,
        })));
      }
      if (Array.isArray(initialLayout.orderIndices) && initialLayout.orderIndices.length > 0) {
        setItems(prev => {
          const indexToItem = new Map<number, GridBItem>();
          prev.forEach(it => { indexToItem.set(it.index, it); });
          const reordered: GridBItem[] = [];
          initialLayout.orderIndices!.forEach(idx => {
            const found = indexToItem.get(idx);
            if (found) reordered.push(found);
          });
          // 누락된 항목은 기존 순서대로 뒤에 붙이기
          prev.forEach(it => {
            if (!reordered.includes(it)) reordered.push(it);
          });
          return reordered;
        });
      }
    } catch {}
  }, [initialLayout]);

  // 센서 설정
  // Hooks는 항상 동일한 순서/개수로 호출되어야 함: 드래그 비활성화 여부와 무관하게 모두 호출
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  });
  const sensorsEnabled = useSensors(pointerSensor);
  const sensorsDisabled = useSensors();
  const sensors = isImageEditModalOpen ? sensorsDisabled : sensorsEnabled;

  // 간단한 collision detection
  const customCollisionDetection: CollisionDetection = closestCenter;

  // + 버튼 클릭 핸들러 (확장 기능)
  const handleExpand = (firstIndex: number, secondIndex: number) => {
    // 모달 열기 전에 대기 중인 액션 설정
    setPendingAction({
      type: 'expand',
      firstIndex,
      secondIndex
    });
    setIsApplyModalOpen(true);
  };

  // 실제 확장 실행 함수 (모달 확인 후)
  const executeExpand = (firstIndex: number, secondIndex: number) => {
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
    
    // items 상태 업데이트 - 이미지와 입력값 초기화
    setItems(prev => 
      prev.map(item => {
        if (item.index === firstIndex || item.index === secondIndex) {
          return { 
            ...item, 
            isExpanded: item.index === firstIndex,
            images: [], // 이미지 초기화
            inputValue: "", // 텍스트 입력값 초기화
            imageCount: item.index === firstIndex ? 2 : 1 // 합치기 시 확장된 영역은 기본 2개로 설정
          };
        }
        return item;
      })
    );
    
    // Grid content store에서도 데이터 초기화
    const gridIds = [`grid-b-${firstIndex}`, `grid-b-${secondIndex}`];
    gridIds.forEach(gridId => {
      updatePlaySubject(gridId, ""); // 텍스트 초기화
      updateImages(gridId, []); // 이미지 초기화
      updateCategoryValue(gridId, ""); // 카테고리 값 초기화
      updateAiGenerated(gridId, false); // AI 생성 상태 초기화
    });
    
    // 제거된 아이템이 선택되어 있다면 선택 해제
    if (selectedItem === secondIndex) {
      setSelectedItem(null);
    }
  };

  // - 버튼 클릭 핸들러 (분할 기능)
  const handleSplit = (firstIndex: number, secondIndex: number) => {
    // 모달 열기 전에 대기 중인 액션 설정
    setPendingAction({
      type: 'split',
      firstIndex,
      secondIndex
    });
    setIsApplyModalOpen(true);
  };

  // 실제 분할 실행 함수 (모달 확인 후)
  const executeSplit = (firstIndex: number, secondIndex: number) => {
    // 뒤쪽 아이템 다시 활성화 (제거 상태 해제)
    setRemovedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(secondIndex);
      return newSet;
    });
    
    // 앞쪽 아이템 확장 해제
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(firstIndex);
      return newSet;
    });
    
    // items 상태 업데이트 - 이미지와 입력값 초기화
    setItems(prev => 
      prev.map(item => {
        if (item.index === firstIndex || item.index === secondIndex) {
          return { 
            ...item, 
            isExpanded: false,
            isSelected: false,
            isHidden: false,
            images: [], // 이미지 초기화
            inputValue: "", // 텍스트 입력값 초기화
            imageCount: 1 // 이미지 개수도 1로 초기화
          };
        }
        return item;
      })
    );
    
    // Grid content store에서도 데이터 초기화
    const gridIds = [`grid-b-${firstIndex}`, `grid-b-${secondIndex}`];
    gridIds.forEach(gridId => {
      updatePlaySubject(gridId, ""); // 텍스트 초기화
      updateImages(gridId, []); // 이미지 초기화
      updateCategoryValue(gridId, ""); // 카테고리 값 초기화
      updateAiGenerated(gridId, false); // AI 생성 상태 초기화
    });
    
    // 선택 상태도 초기화
    if (selectedItem === firstIndex || selectedItem === secondIndex) {
      setSelectedItem(null);
    }
  };

  // 전체 Grid를 기본 2개 상태로 초기화하는 함수
  const handleResetToBasicTwo = () => {
    // 모든 상태 초기화
    setRemovedItems(new Set());
    setExpandedItems(new Set());
    setHiddenItems(new Set());
    setSelectedItem(null);
    
    // items 상태를 기본으로 초기화 (처음 2개만 활성화)
    setItems(prev => 
      prev.map(item => ({
        ...item,
        isExpanded: false,
        isSelected: false,
        isHidden: item.index > 2, // 3번째부터는 숨김 처리
        images: [],
        inputValue: "",
        imageCount: 1 // 이미지 개수도 1로 초기화
      }))
    );
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

  // 이미지 개수 변경 핸들러
  const handleImageCountChange = (index: number, count: number) => {
    setItems(prev => 
      prev.map(item => 
        item.index === index ? { ...item, imageCount: count } : item
      )
    );
  };

  // 드래그 시작 핸들러
  const handleDragStart = (event: DragStartEvent) => {
    const activeIdStr = String(event.active.id ?? "").replace(/^drop-/, "");
    const draggedItem = items.find(item => item.id === activeIdStr);
    if (draggedItem) {
      if (hiddenItems.has(draggedItem.index) || removedItems.has(draggedItem.index)) {
        return;
      }
    }
    setActiveId(activeIdStr);
  };

  // 드래그 종료 핸들러: GridC 규칙 차용 (작은→큰 금지, 큰→작은 허용)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeItemId = String(active.id).replace(/^drop-/, "");
    const overRaw = String(over.id);
    const overItemId = overRaw.startsWith("drop-") ? overRaw.replace(/^drop-/, "") : overRaw;
    if (activeItemId === overItemId) return;

    const activeItem = items.find(it => it.id === activeItemId);
    const overItem = items.find(it => it.id === overItemId);
    if (!activeItem || !overItem) return;

    const activeGridIndex = activeItem.index;
    const overGridIndex = overItem.index;

    if (
      hiddenItems.has(activeGridIndex) ||
      removedItems.has(activeGridIndex) ||
      hiddenItems.has(overGridIndex) ||
      removedItems.has(overGridIndex)
    ) {
      return;
    }

    const isExpandedAt = (gridIndex: number) => expandedItems.has(gridIndex);
    const getPairFirst = (gridIndex: number) => (gridIndex % 2 === 0 ? gridIndex - 1 : gridIndex);
    const getPairSecond = (pairFirst: number) => pairFirst + 1;

    const activeIsBig = isExpandedAt(activeGridIndex);
    const overIsBig = isExpandedAt(overGridIndex);

    // 작은 → 큰 금지
    if (!activeIsBig && overIsBig) return;

    // 상태 업데이트를 위한 변수들
    let newExpandedItems: Set<number> | null = null;
    let newRemovedItems: Set<number> | null = null;
    let newSelectedItem: number | null = selectedItem;

    const newItems = (() => {
      const result = [...items];
      const aIdx = result.findIndex(it => it.id === activeItemId);
      const oIdx = result.findIndex(it => it.id === overItemId);
      if (aIdx < 0 || oIdx < 0) return items;

      const findByGridIndex = (gridIndex: number) => result.findIndex(it => it.index === gridIndex);

      if (activeIsBig && !overIsBig) {
        // 큰 → 작은: 대상 페어의 첫 칸으로 이동 + 상태 동기화
        const targetFirst = getPairFirst(overGridIndex);
        const targetSecond = getPairSecond(targetFirst);
        const leftIdx = findByGridIndex(targetFirst);
        if (leftIdx < 0) return items;

        const aItem = result[aIdx];
        const leftItem = result[leftIdx];

        result[aIdx] = { ...leftItem, index: aItem.index };
        result[leftIdx] = { ...aItem, index: targetFirst };

        // 상태 이동: source 페어 해제, target 페어 설정
        const sourceFirst = activeGridIndex;
        const sourceSecond = getPairSecond(sourceFirst);

        newExpandedItems = new Set(expandedItems);
        newExpandedItems.delete(sourceFirst);
        newExpandedItems.add(targetFirst);

        newRemovedItems = new Set(removedItems);
        newRemovedItems.delete(sourceSecond);
        newRemovedItems.add(targetSecond);

        if (selectedItem === sourceFirst) newSelectedItem = targetFirst;
        else if (selectedItem === targetFirst) newSelectedItem = sourceFirst;

        return result;
      }

      // 같은 유형 간 스왑 (작은↔작은, 큰↔큰)
      const a = result[aIdx];
      const b = result[oIdx];
      result[aIdx] = { ...b, index: a.index };
      result[oIdx] = { ...a, index: b.index };

      if (selectedItem === a.index) newSelectedItem = b.index;
      else if (selectedItem === b.index) newSelectedItem = a.index;

      return result;
    })();

    // 모든 상태를 한 번에 업데이트
    setItems(newItems);
    if (newExpandedItems !== null) {
      setExpandedItems(newExpandedItems);
    }
    if (newRemovedItems !== null) {
      setRemovedItems(newRemovedItems);
    }
    if (newSelectedItem !== selectedItem) {
      setSelectedItem(newSelectedItem);
    }
  };

  // ApplyModal 핸들러들
  const handleApplyModalConfirm = () => {
    if (pendingAction) {
      const { type, firstIndex, secondIndex } = pendingAction;
      if (type === 'expand') {
        executeExpand(firstIndex, secondIndex);
      } else if (type === 'split') {
        executeSplit(firstIndex, secondIndex);
      }
    }
    setIsApplyModalOpen(false);
    setPendingAction(null);
  };

  const handleApplyModalCancel = () => {
    setIsApplyModalOpen(false);
    setPendingAction(null);
  };

  // ApplyModal 메시지 생성
  const getApplyModalMessage = () => {
    if (!pendingAction) return "";
    
    if (pendingAction.type === 'expand') {
      return "기존에 입력한 내용이 모두 초기화됩니다.\n진행하시겠습니까?";
    } else {
      return "기존에 입력한 내용이 모두 초기화됩니다.\n진행하시겠습니까?";
    }
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

  const handleToolbarReset = () => {
    // 전체 Grid를 기본 2개 상태로 초기화
    handleResetToBasicTwo();
  };

  // 그리드 아이템들을 렌더링하는 함수
  const renderGridItems = () => {
    // 항상 12개의 그리드를 렌더링하되, subjectCount에 따라 표시 여부 결정
    return items.slice(0, 12).map((item) => {
      // subjectCount를 초과하거나 완전히 제거된 아이템은 렌더링하지 않음
      if (item.index > subjectCount || removedItems.has(item.index)) {
        return null;
      }
      // 저장 상태에서는 description(playSubjectText)이 비어있는 항목을 시각적으로만 숨김 처리 (공간은 유지)
      const gridId = item.id;
      const content = gridContents[gridId];
      const hasDescription = !!(content && content.playSubjectText && content.playSubjectText.trim().length > 0);
      // 저장된 이미지가 있으면 우선 사용
      const imagesFromStore = Array.isArray(content?.imageUrls) ? content?.imageUrls : undefined;
      const effectiveImages = imagesFromStore && imagesFromStore.length > 0 ? imagesFromStore : item.images;
      const effectiveImageCount = imagesFromStore && imagesFromStore.length > 0 ? imagesFromStore.length : item.imageCount;
      // 캡처 시 레이아웃이 유지되도록 print-hide는 사용하지 않음 (display:none으로 제거되면 그리드가 당겨짐)
      const isPrintHidden = false;
      const isInvisibleInSavedMode = isSaved && !hasDescription; // 화면/캡처 모두에서 시각적으로만 숨김 (레이아웃 유지)

      return (
        <DragDropGridBItem
          key={item.id}
          id={item.id}
          index={item.index}
          isSelected={selectedItem === item.index}
          onSelectChange={(isSelected) => handleSelectChange(item.index, isSelected)}
          onDelete={() => handleDelete(item.index)}
          isExpanded={expandedItems.has(item.index)}
          isHidden={hiddenItems.has(item.index)}
          images={effectiveImages}
          imageCount={effectiveImageCount}
          onImageCountChange={(count) => handleImageCountChange(item.index, count)}
          isPrintHidden={isPrintHidden}
          isInvisibleInSavedMode={isInvisibleInSavedMode}
          highlightMode={((): 'none' | 'full' | 'split' => {
            if (!hoverPreview) return 'none';
            if (
              hoverPreview.type === 'expand' &&
              (item.index === hoverPreview.first || item.index === hoverPreview.second)
            ) {
              return 'full';
            }
            if (
              hoverPreview.type === 'split' &&
              item.index === hoverPreview.first &&
              expandedItems.has(item.index)
            ) {
              return 'split';
            }
            return 'none';
          })()}
        />
      );
    }).filter(Boolean); // null 값 제거
  };

  // floating 플러스 버튼들을 렌더링하는 함수
  const renderFloatingButtons = () => {
    if (isSaved) {
      return null;
    }
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
            onMouseEnter={() => setHoverPreview({ type: 'expand', first, second })}
            onMouseLeave={() => setHoverPreview(null)}
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

  // floating 마이너스 버튼들을 렌더링하는 함수 (합쳐진 그리드를 쪼개기 위한)
  const renderSplitButtons = () => {
    if (isSaved) {
      return null;
    }
    const buttons: JSX.Element[] = [];
    
    // 각 행에서 1-2, 3-4 사이에 마이너스 버튼 배치 (확장된 그리드에서만)
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
      
      // 첫 번째 아이템이 확장되고 두 번째 아이템이 제거된 경우에만 마이너스 버튼 표시
      if (first <= subjectCount && second <= subjectCount && 
          expandedItems.has(first) && removedItems.has(second) &&
          !hiddenItems.has(first)) {
        // 마이너스 버튼은 확장된 그리드 내에서 1/4 높이 위치에 배치
        const topPercentage = `${(row * 33.33) + (33.33 * 0.25)}%`; // 각 행 시작점 + 1/4 지점
        const leftPosition = position === 'left' ? '25%' : '75%'; // 좌측 또는 우측 중앙
        
        buttons.push(
          <div
            key={`floating-split-${first}-${second}`}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
            style={{
              top: topPercentage,
              left: leftPosition,
            }}
            onMouseEnter={() => setHoverPreview({ type: 'split', first, second })}
            onMouseLeave={() => setHoverPreview(null)}
          >
            <button
              onClick={() => handleSplit(first, second)}
              className="w-8 h-8 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
              title="그리드 쪼개기"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-black"
              >
                <path
                  d="M5 12H19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        );
      }
    });
    
    return buttons;
  };

  const activeItem = items.find(item => item.id === activeId);

  // ref로 GridB 상태를 외부로 노출
  React.useImperativeHandle(ref, () => ({
    getGridData: () => {
      const imageCountByIndex: Record<number, number> = {};
      items.forEach(it => { imageCountByIndex[it.index] = it.imageCount; });
      return {
        gridBLayout: {
          expanded: Array.from(expandedItems),
          removed: Array.from(removedItems),
          hidden: Array.from(hiddenItems),
          imageCountByIndex,
          orderIndices: items.map(it => it.index),
        },
      };
    }
  }), [items, expandedItems, removedItems, hiddenItems]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
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
          
          {/* Floating 마이너스 버튼들 (그리드 쪼개기) */}
          {renderSplitButtons()}
        </div>
        
        {/* ApplyModal */}
        <ApplyModal
          open={isApplyModalOpen}
          onOpenChange={setIsApplyModalOpen}
          description={getApplyModalMessage()}
          onConfirm={handleApplyModalConfirm}
          onCancel={handleApplyModalCancel}
          confirmText="확인"
          cancelText="취소"
        >
          <div />
        </ApplyModal>
      {/* DragOverlay 제거됨: 중복 기울기 프리뷰 방지 */}
    </DndContext>
  );
}

const GridBContent = React.forwardRef<GridBRef, GridBProps>(GridBContentImpl);

const GridB = React.forwardRef<GridBRef, GridBProps>((props, ref) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GridBContent {...props} ref={ref} />
    </Suspense>
  );
});

export default GridB; 