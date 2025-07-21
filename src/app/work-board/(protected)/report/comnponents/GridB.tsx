"use client";
import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import GridBElement from "./GridBElement";
import AddButton from "./AddButton";

interface GridBProps {
  gridCount?: number;
}

function GridBContent({ gridCount = 12 }: GridBProps) {
  const searchParams = useSearchParams();
  
  // searchParams에서 subject 값을 가져오고, 1~12 범위로 제한
  const subjectParam = searchParams.get('subject');
  const subjectCount = subjectParam ? Math.min(Math.max(parseInt(subjectParam), 1), 12) : 12;
  
  // 각 이미지 영역의 체크 상태 관리
  const [checkedItems, setCheckedItems] = React.useState<Record<number, boolean>>({});

  // 체크 상태 변경 핸들러
  const handleCheckedChange = (index: number, checked: boolean) => {
    setCheckedItems(prev => ({
      ...prev,
      [index]: checked
    }));
  };

  // 그리드 아이템들을 렌더링하는 함수
  const renderGridItems = () => {
    const items = [];
    
    for (let i = 1; i <= 12; i++) {
      if (i <= subjectCount) {
        items.push(
          <GridBElement
            key={i}
            index={i}
            onClick={() => console.log(`이미지 영역 ${i} 클릭됨`)}
            checked={checkedItems[i] || false}
            onCheckedChange={(checked) => handleCheckedChange(i, checked)}
          />
        );
      } else {
        // subject 범위를 벗어나면 빈 공간
        items.push(<div key={`empty-${i}`} />);
      }
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
      
      // 두 요소가 모두 표시되는 경우에만 플러스 버튼 표시
      if (first <= subjectCount && second <= subjectCount) {
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
              onClick={() => console.log(`+ 버튼 클릭됨: ${first}-${second} 사이`)}
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