"use client";
import * as React from "react";
import GridAElement from "./GridAElement";

interface GridAProps {
  subject: number;
}

function GridA({ subject }: GridAProps) {
  // 각 이미지 영역의 체크 상태 관리
  const [checkedItems, setCheckedItems] = React.useState<Record<number, boolean>>({});

  // 체크 상태 변경 핸들러
  const handleCheckedChange = (index: number, checked: boolean) => {
    setCheckedItems(prev => ({
      ...prev,
      [index]: checked
    }));
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

  // subject 개수만큼 이미지 영역 생성
  const renderImageAreas = () => {
    const areas = [];
    for (let i = 1; i <= subject; i++) {
      areas.push(
        <GridAElement
          key={i}
          index={i}
          gridId={`grid-${i}`}
          style={getItemStyle(i)}
          checked={checkedItems[i] || false}
          onCheckedChange={(checked) => handleCheckedChange(i, checked)}
        />
      );
    }
    return areas;
  };

  const layout = getGridLayout(subject);

  return (
    <div 
      className={`${layout.className} grid-container relative`}
      style={layout.style}
    >
      {renderImageAreas()}
    </div>
  );
}

export default GridA; 