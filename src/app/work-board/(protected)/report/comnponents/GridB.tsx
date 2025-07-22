"use client";
import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import GridBElement from "./GridBElement";
import AddButton from "./AddButton";
import GridEditToolbar from "./GridEditToolbar";

interface GridBProps {
  gridCount?: number;
}

function GridBContent({ gridCount = 12 }: GridBProps) {
  const searchParams = useSearchParams();
  
  // searchParams에서 subject 값을 가져오고, 1~12 범위로 제한
  const subjectParam = searchParams.get('subject');
  const subjectCount = subjectParam ? Math.min(Math.max(parseInt(subjectParam), 1), 12) : 12;
  
  // 선택된 아이템 관리 (하나만 선택 가능)
  const [selectedItem, setSelectedItem] = React.useState<number | null>(null);
  
  // 숨겨진 아이템들을 관리하는 상태 (쓰레기통으로 삭제한 경우)
  const [hiddenItems, setHiddenItems] = React.useState<Set<number>>(new Set());
  
  // 제거된 아이템들을 관리하는 상태 (합치기로 완전히 제거된 경우)
  const [removedItems, setRemovedItems] = React.useState<Set<number>>(new Set());
  
  // 확장된 아이템들을 관리하는 상태 (col-span-2가 적용된 아이템)
  const [expandedItems, setExpandedItems] = React.useState<Set<number>>(new Set());

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
  };

  // 삭제 핸들러 (쓰레기통 버튼 - 숨김 처리)
  const handleDelete = (index: number) => {
    setHiddenItems(prev => {
      const newSet = new Set(prev);
      newSet.add(index);
      return newSet;
    });
    // 숨겨진 아이템이 선택되어 있다면 선택 해제
    if (selectedItem === index) {
      setSelectedItem(null);
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

  // 그리드 아이템들을 렌더링하는 함수
  const renderGridItems = () => {
    const items = [];
    
    for (let i = 1; i <= 12; i++) {
      // subjectCount 범위 내에 있고, 제거되지 않은 아이템만 렌더링
      if (i <= subjectCount && !removedItems.has(i)) {
        items.push(
          <GridBElement
            key={i}
            index={i}
            isSelected={selectedItem === i}
            onSelectChange={(isSelected) => handleSelectChange(i, isSelected)}
            onDelete={() => handleDelete(i)}
            isExpanded={expandedItems.has(i)}
            isHidden={hiddenItems.has(i)} // 숨김 상태 전달
          />
        );
      }
      // 제거된 아이템은 아예 렌더링하지 않음 (빈 div도 생성하지 않음)
    }
    
    return items;
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
      
      // 두 요소가 모두 표시되고 제거되지 않은 경우, 확장되지 않은 경우, 그리고 숨김처리되지 않은 경우에만 플러스 버튼 표시
      if (first <= subjectCount && second <= subjectCount && 
          !removedItems.has(first) && !removedItems.has(second) &&
          !expandedItems.has(first) && !expandedItems.has(second) &&
          !hiddenItems.has(first) && !hiddenItems.has(second)) {
        const topPosition = `${(row * 33.33) + 16.67}%`; // 각 행의 중앙
        const leftPosition = position === 'left' ? '25%' : '75%'; // 좌측 또는 우측 중앙
        
        buttons.push(
          <div
            key={`floating-add-${first}-${second}`}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
            style={{
              top: topPosition,
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

  return (
    <div className="w-full h-full relative">
      {/* 기본 그리드 레이아웃 (4x3) */}
      <div className="w-full h-full grid grid-cols-4 grid-rows-3 gap-3">
        {renderGridItems()}
      </div>
      
      {/* Floating 플러스 버튼들 */}
      {renderFloatingButtons()}
    </div>
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