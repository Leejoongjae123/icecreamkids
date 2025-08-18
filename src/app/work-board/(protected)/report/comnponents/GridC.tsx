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
import DragDropGridCItem from "./DragDropGridCItem";
import { clipPathItems } from "../dummy/svgData";
import { ClipPathItem } from "../dummy/types";
import { UploadModal } from "@/components/modal";
import { useImageUpload } from "@/hooks/useImageUpload";
import ApplyModal from "./ApplyModal";
import useGridCStore from "@/hooks/store/useGridCStore";
import useKeywordExpansionStore from "@/hooks/store/useKeywordExpansionStore";

interface GridCItem {
  id: string;
  index: number;
  clipPathData: ClipPathItem;
  imageUrl: string;
  driveItemKey?: string; // 이미지의 driveItemKey 추가
}

// 그리드 위치 정보 타입
interface GridPosition {
  row: number;
  col: number;
  width: number;
  height: number;
}

interface GridCProps {
  isClippingEnabled: boolean;
  photoCount: number;
}

function GridC({ isClippingEnabled, photoCount }: GridCProps) {
  const { setSelected, remove, setImage, clearAll } = useGridCStore();
  const { expandFirstImageGrid } = useKeywordExpansionStore();
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

  // ApplyModal 관련 상태
  const [isApplyModalOpen, setIsApplyModalOpen] = React.useState(false);
  const [pendingUploadFiles, setPendingUploadFiles] = React.useState<File[] | null>(null);

  // 통합 이미지 업로드 상태
  const [uploadedFiles, setUploadedFiles] = React.useState<File[]>([]);

  // 재업로드 시 내부 키워드 입력 로컬 상태 초기화를 강제하기 위한 버전 키
  const [resetVersion, setResetVersion] = React.useState(0);

  // 현재 빈 그리드 개수 계산
  const getEmptyGridCount = React.useCallback(() => {
    const defaultImage = "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg";
    return items.filter(item => item.imageUrl === defaultImage).length;
  }, [items]);

  // 기존 이미지가 있는지 확인하는 헬퍼 함수
  const hasExistingImages = React.useCallback(() => {
    const defaultImage = "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg";
    return items.some(item => item.imageUrl && item.imageUrl !== defaultImage);
  }, [items]);

  // 통합 이미지 업로드 훅
  const {
    isUploadModalOpen,
    handleOpenUploadModal,
    handleCloseUploadModal,
    handleConfirmUploadModal,
    handleSetItemData,
    processUploadedFiles,
  } = useImageUpload({
    uploadedFiles,
    onFilesUpload: (files: File[] | any[]) => {
      console.log('📥 GridC 통합 이미지 업로드 완료:', files);
      handleMultipleImageUpload(files);
    },
    maxDataLength: items.length, // 전체 그리드 개수에 따른 최대 업로드 제한
  });

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

  // 이미지가 있는 아이템들을 자동으로 체크박스 선택 상태로 만들기
  React.useEffect(() => {
    const defaultImage = "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg";
    const itemsWithImages = items.filter(item => item.imageUrl && item.imageUrl !== defaultImage);
    const idsWithImages = new Set(itemsWithImages.map(item => item.id));
    
    // 현재 선택된 아이템들과 비교해서 다르면 업데이트
    if (idsWithImages.size !== selectedItems.size || 
        !Array.from(idsWithImages).every(id => selectedItems.has(id))) {
      setSelectedItems(idsWithImages);
      
      // GridCStore에도 체크 상태 반영
      items.forEach(item => {
        const hasImage = !!(item.imageUrl && item.imageUrl !== defaultImage);
        setSelected(item.id, hasImage);
      });
    }
  }, [items, selectedItems, setSelected]);

  // 현재 드래그 중인 아이템
  const [activeId, setActiveId] = React.useState<string | null>(null);
  // 애니메이션 진행 상태
  const [isAnimating, setIsAnimating] = React.useState<boolean>(false);

  // photoCount가 3일 때 큰 아이템의 위치 추적 (0: 위쪽, 2: 아래쪽)
  const [largeItemPosition, setLargeItemPosition] = React.useState<number>(0);
  // photoCount가 8일 때 가로 2x1 넓은 영역의 행 위치 추적 (1행, 2행 또는 3행)
  const [wideRowForPhoto8, setWideRowForPhoto8] = React.useState<1 | 2 | 3>(3);
  // photoCount가 8일 때 2x1 블록의 시작 열(1 또는 2)
  const [wideColForPhoto8, setWideColForPhoto8] = React.useState<1 | 2>(2);
  // photoCount가 5일 때 3행 2x1 블록의 시작 열(1 또는 2)
  const [wideColForPhoto5Row3, setWideColForPhoto5Row3] = React.useState<1 | 2>(2);
  // photoCount가 7일 때 첫 번째 2x1 블록(인덱스 0)의 행 위치 (1, 2, 3)
  const [firstWideRowForPhoto7, setFirstWideRowForPhoto7] = React.useState<1 | 2 | 3>(1);
  // photoCount가 7일 때 첫 번째 2x1 블록(인덱스 0)의 시작 열 (1 또는 2)
  const [firstWideColForPhoto7, setFirstWideColForPhoto7] = React.useState<1 | 2>(1);
  // photoCount가 7일 때 두 번째 2x1 블록(인덱스 6)의 행 위치 (1, 2, 3)
  const [secondWideRowForPhoto7, setSecondWideRowForPhoto7] = React.useState<1 | 2 | 3>(3);
  // photoCount가 7일 때 두 번째 2x1 블록(인덱스 6)의 시작 열 (1 또는 2)
  const [secondWideColForPhoto7, setSecondWideColForPhoto7] = React.useState<1 | 2>(2);

  // 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // 간단한 collision detection
  const customCollisionDetection = closestCenter;

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

  // 드롭 좌표를 그리드 좌표로 변환하는 함수
  const getGridCoordinatesFromPoint = (x: number, y: number, gridElement: HTMLElement): { row: number; col: number } => {
    const rect = gridElement.getBoundingClientRect();
    const relativeX = x - rect.left;
    const relativeY = y - rect.top;
    
    // 그리드의 열과 행 수 계산
    const { cols, rows } = getGridDimensions(photoCount);
    
    // 각 셀의 크기 계산 (gap 고려)
    const gap = 16; // gap-4 = 1rem = 16px
    const availableWidth = rect.width - (cols - 1) * gap;
    const availableHeight = rect.height - (rows - 1) * gap;
    const cellWidth = availableWidth / cols;
    const cellHeight = availableHeight / rows;
    
    // 클릭한 위치가 어느 셀인지 계산
    const col = Math.floor(relativeX / (cellWidth + gap)) + 1;
    const row = Math.floor(relativeY / (cellHeight + gap)) + 1;
    
    // 경계값 처리
    return {
      row: Math.max(1, Math.min(row, rows)),
      col: Math.max(1, Math.min(col, cols))
    };
  };
  
  // photoCount에 따른 그리드 차원 계산
  const getGridDimensions = (photoCount: number): { cols: number; rows: number } => {
    switch (photoCount) {
      case 1: return { cols: 1, rows: 1 };
      case 2: return { cols: 2, rows: 1 };
      case 3: return { cols: 2, rows: 2 };
      case 4: return { cols: 2, rows: 2 };
      case 5: return { cols: 3, rows: 3 };
      case 6: return { cols: 3, rows: 3 };
      case 7: return { cols: 3, rows: 3 };
      case 8: return { cols: 3, rows: 3 };
      case 9: return { cols: 3, rows: 3 };
      default: return { cols: 3, rows: Math.ceil(photoCount / 3) };
    }
  };
  
  // photoCount 8 전용: 현재 wideRowForPhoto8에 따라 겹치지 않는 1x1 셀 좌표 목록을 생성
  const generatePositionsForPhoto8 = (wideRow: 1 | 2 | 3, wideCol: 1 | 2): Array<{ row: number; col: number }> => {
    const freeCells: Array<{ row: number; col: number }> = [];
    for (let row = 1; row <= 3; row++) {
      for (let col = 1; col <= 3; col++) {
        // wideRow의 (wideCol, wideRow)부터 2칸은 2x1이 차지
        if (row === wideRow && (col === wideCol || col === wideCol + 1)) continue;
        freeCells.push({ row, col });
      }
    }
    // row-major 순서 유지
    return freeCells;
  };

  // photoCount 7 전용: 두 개의 2x1 블록 위치에 따라 겹치지 않는 1x1 셀 좌표 목록을 생성
  const generatePositionsForPhoto7 = (
    firstWideRow: 1 | 2 | 3, firstWideCol: 1 | 2,
    secondWideRow: 1 | 2 | 3, secondWideCol: 1 | 2
  ): Array<{ row: number; col: number }> => {
    const freeCells: Array<{ row: number; col: number }> = [];
    for (let row = 1; row <= 3; row++) {
      for (let col = 1; col <= 3; col++) {
        // 첫 번째 2x1이 차지하는 영역 제외
        if (row === firstWideRow && (col === firstWideCol || col === firstWideCol + 1)) continue;
        // 두 번째 2x1이 차지하는 영역 제외
        if (row === secondWideRow && (col === secondWideCol || col === secondWideCol + 1)) continue;
        freeCells.push({ row, col });
      }
    }
    // row-major 순서 유지
    return freeCells;
  };
  
  // 드래그된 아이템이 새 위치에 배치될 때의 실제 그리드 위치 계산
  const calculateNewPosition = (draggedItem: GridCItem, targetRow: number, targetCol: number): GridPosition => {
    const draggedPos = getGridPositionForIndex(photoCount, draggedItem.index, largeItemPosition);
    
    return {
      row: targetRow,
      col: targetCol,
      width: draggedPos.width,
      height: draggedPos.height
    };
  };
  
  // 그리드 위치 유효성 검사
  const isValidGridPosition = (position: GridPosition, currentPhotoCount: number): boolean => {
    const { cols, rows } = getGridDimensions(currentPhotoCount);
    
    // 위치가 그리드 경계 내에 있는지 확인
    if (position.row < 1 || position.col < 1) {
      return false;
    }
    
    // 드래그된 아이템이 그리드를 벗어나지 않는지 확인
    if (position.row + position.height - 1 > rows) {
      return false;
    }
    
    if (position.col + position.width - 1 > cols) {
      return false;
    }
    
    return true;
  };

  // photoCount와 index에 따른 그리드 위치 정보 계산
  const getGridPositionForIndex = (photoCount: number, index: number, currentLargeItemPosition: number = 0): GridPosition => {
    switch (photoCount) {
      case 1:
        return { row: 1, col: 1, width: 1, height: 1 };
      
      case 2:
        return {
          row: 1,
          col: index + 1,
          width: 1,
          height: 1
        };
      
      case 3:
        if (currentLargeItemPosition === 0) {
          // 큰 아이템이 위쪽
          if (index === 0) return { row: 1, col: 1, width: 2, height: 1 };
          if (index === 1) return { row: 2, col: 1, width: 1, height: 1 };
          if (index === 2) return { row: 2, col: 2, width: 1, height: 1 };
        } else {
          // 큰 아이템이 아래쪽
          if (index === 0) return { row: 1, col: 1, width: 1, height: 1 };
          if (index === 1) return { row: 1, col: 2, width: 1, height: 1 };
          if (index === 2) return { row: 2, col: 1, width: 2, height: 1 };
        }
        break;
      
      case 4:
        return {
          row: Math.floor(index / 2) + 1,
          col: (index % 2) + 1,
          width: 1,
          height: 1
        };
      
      case 5:
        if (index === 0) return { row: 1, col: 1, width: 2, height: 2 };
        if (index === 1) return { row: 1, col: 3, width: 1, height: 1 };
        if (index === 2) return { row: 2, col: 3, width: 1, height: 1 };
        if (index === 3) return { row: 3, col: 1, width: 1, height: 1 };
        if (index === 4) return { row: 3, col: 2, width: 2, height: 1 };
        break;
      
      case 6:
        if (index === 0) return { row: 1, col: 1, width: 2, height: 2 };
        if (index === 1) return { row: 1, col: 3, width: 1, height: 1 };
        if (index === 2) return { row: 2, col: 3, width: 1, height: 1 };
        if (index === 3) return { row: 3, col: 1, width: 1, height: 1 };
        if (index === 4) return { row: 3, col: 2, width: 1, height: 1 };
        if (index === 5) return { row: 3, col: 3, width: 1, height: 1 };
        break;
      
      case 7: {
        // 첫 번째 2x1 블록 (인덱스 0)
        if (index === 0) return { row: firstWideRowForPhoto7, col: firstWideColForPhoto7, width: 2, height: 1 };
        // 두 번째 2x1 블록 (인덱스 6)
        if (index === 6) return { row: secondWideRowForPhoto7, col: secondWideColForPhoto7, width: 2, height: 1 };
        // 나머지 1x1 블록들 (인덱스 1~5)은 freeCells 순서로 배치
        const freeCells = generatePositionsForPhoto7(firstWideRowForPhoto7, firstWideColForPhoto7, secondWideRowForPhoto7, secondWideColForPhoto7);
        const cellIndex = index - 1; // 인덱스 1~5를 0~4로 변환
        if (cellIndex >= 0 && cellIndex < freeCells.length) {
          const pos = freeCells[cellIndex];
          return { row: pos.row, col: pos.col, width: 1, height: 1 };
        }
        break;
      }
      
      case 8: {
        // 주의: 여기서는 wideRowForPhoto8로 레이아웃을 계산한다.
        // 2x1 블록은 항상 (wideRowForPhoto8, 2)에서 시작하여 width=2
        if (index === 7) return { row: wideRowForPhoto8, col: wideColForPhoto8, width: 2, height: 1 };
        // 나머지 인덱스는 현재 wideRowForPhoto8 기준 freeCells로 계산
        const freeCells = generatePositionsForPhoto8(wideRowForPhoto8, wideColForPhoto8);
        const pos = freeCells[index];
        return { row: pos.row, col: pos.col, width: 1, height: 1 };
      }
      
      case 9:
        return {
          row: Math.floor(index / 3) + 1,
          col: (index % 3) + 1,
          width: 1,
          height: 1
        };
    }
    
    return { row: 1, col: 1, width: 1, height: 1 };
  };

  // 드래그 시작 핸들러
  const handleDragStart = (event: DragStartEvent) => {
    // 애니메이션 진행 중이면 드래그 시작 방지
    if (isAnimating) {
      return;
    }
    setActiveId(event.active.id as string);
  };

  // 그리드 컨테이너 ref
  const [gridContainer, setGridContainer] = React.useState<HTMLDivElement | null>(null);
  // 2x1 드래그 시 다중 드롭 하이라이트 대상 인덱스
  const [multiOverSet, setMultiOverSet] = React.useState<Set<number>>(new Set());
  
  // photoCount 8 전용: 특정 행/열의 1x1 셀을 담당하는 인덱스 찾기
  // 임의의 (row,col)을 덮는 인덱스를 일반적으로 탐색
  const findIndexForCellGeneric = (row: number, col: number): number => {
    for (let i = 0; i < photoCount; i++) {
      const pos = getGridPositionForIndex(photoCount, i, largeItemPosition);
      const withinRow = row >= pos.row && row < pos.row + pos.height;
      const withinCol = col >= pos.col && col < pos.col + pos.width;
      if (withinRow && withinCol) return i;
    }
    return -1;
  };

  // photoCount 8용: 임의 wideRow에 대한 (row,col) 담당 인덱스 찾기
  const findIndexForCellPhoto8 = (row: 1 | 2 | 3, col: 1 | 2 | 3, wideRow: 1 | 2 | 3): number => {
    if (row === wideRow && (col === wideColForPhoto8 || col === (wideColForPhoto8 + 1) as 2 | 3)) return 7;
    const cells = generatePositionsForPhoto8(wideRow, wideColForPhoto8);
    for (let i = 0; i < cells.length; i++) {
      if (cells[i].row === row && cells[i].col === col) return i;
    }
    return -1;
  };

  // photoCount 7용: 특정 (row,col)을 담당하는 인덱스 찾기
  const findIndexForCellPhoto7 = (row: 1 | 2 | 3, col: 1 | 2 | 3): number => {
    // 첫 번째 2x1 블록(인덱스 0) 체크
    if (row === firstWideRowForPhoto7 && (col === firstWideColForPhoto7 || col === (firstWideColForPhoto7 + 1) as 2 | 3)) {
      return 0;
    }
    // 두 번째 2x1 블록(인덱스 6) 체크
    if (row === secondWideRowForPhoto7 && (col === secondWideColForPhoto7 || col === (secondWideColForPhoto7 + 1) as 2 | 3)) {
      return 6;
    }
    // 나머지 1x1 셀들은 freeCells 순서로 인덱스 1~5에 매핑
    const cells = generatePositionsForPhoto7(firstWideRowForPhoto7, firstWideColForPhoto7, secondWideRowForPhoto7, secondWideColForPhoto7);
    for (let i = 0; i < cells.length; i++) {
      if (cells[i].row === row && cells[i].col === col) {
        return i + 1; // 인덱스 1~5에 매핑
      }
    }
    return -1;
  };

  // 드래그 이동 중 하이라이트 계산
  const handleDragMove = (event: any) => {
    const { active, over } = event;
    if (!over) {
      if (multiOverSet.size) setMultiOverSet(new Set());
      return;
    }
    const activeIdStr = String(active?.id ?? "");
    const overIdStr = String(over?.id ?? "");
    const overId = overIdStr.startsWith("drop-") ? overIdStr.replace("drop-", "") : overIdStr;
    setMultiOverSet(prev => {
      const next = new Set<number>();
      const idx = items.findIndex(it => it.id === activeIdStr);
      if (idx < 0) return next;
      const draggedPos = getGridPositionForIndex(photoCount, idx, largeItemPosition);
      const isMultiCell = draggedPos.width > 1 || draggedPos.height > 1;
      if (!isMultiCell) return next;

      const targetIndex = items.findIndex(it => it.id === overId);
      if (targetIndex < 0) return next;
      const targetPos = getGridPositionForIndex(photoCount, targetIndex, largeItemPosition);
      // 겹치는 모든 셀을 하이라이트 (경계 내로 정규화)
      const { cols, rows } = getGridDimensions(photoCount);
      const normCol = Math.min(targetPos.col, cols - draggedPos.width + 1);
      const normRow = Math.min(targetPos.row, rows - draggedPos.height + 1);
      for (let r = normRow; r < normRow + draggedPos.height; r++) {
        for (let c = normCol; c < normCol + draggedPos.width; c++) {
          const hitIdx = findIndexForCellGeneric(r, c);
          if (hitIdx >= 0) next.add(hitIdx);
        }
      }
      return next;
    });
  };

  // 드래그 종료 핸들러 (단순화)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    // activeId 초기화
    setActiveId(null);
    
    // 유효한 드롭 타겟이 없으면 종료
    if (!over) return;
    
    // 같은 아이템에 드롭하면 종료
    if (active.id === over.id) return;
    
    // drop-로 시작하는 ID에서 실제 아이템 ID 추출
    const overId = over.id.toString().startsWith('drop-') 
      ? over.id.toString().replace('drop-', '') 
      : over.id.toString();
    
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
      // 멀티셀(예: 2x1, 2x2 등) 일반 처리
      const draggedPos = getGridPositionForIndex(photoCount, draggedIndex, largeItemPosition);
      const targetPos = getGridPositionForIndex(photoCount, targetIndex, largeItemPosition);

      // 디버그 로그: 현재/이동 위치
      console.log('[GridC][dragEnd] draggedIndex:', draggedIndex, 'targetIndex:', targetIndex);
      console.log('[GridC][dragEnd] draggedPos:', draggedPos, 'wideRowForPhoto8:', wideRowForPhoto8, 'targetPos:', targetPos);

      if (draggedPos.width > 1 || draggedPos.height > 1) {
        // 드래그 대상이 차지하는 모든 셀과, 타겟의 기준 셀(top-left)을 맞춰 1:1 교환 수행
        const { cols, rows } = getGridDimensions(photoCount);
        const baseCol = Math.min(targetPos.col, cols - draggedPos.width + 1);
        const baseRow = Math.min(targetPos.row, rows - draggedPos.height + 1);

        // photo=5: 하단 2x1의 시작 열 변경 같은 행 이동 지원 (col2→col1 or col1→col2)
        if (photoCount === 5 && draggedPos.width === 2 && draggedPos.height === 1 && baseRow === 3) {
          if (baseCol !== wideColForPhoto5Row3) {
            console.log('[GridC][dragEnd][5] row3 2x1 move col', wideColForPhoto5Row3, '->', baseCol);
            setWideColForPhoto5Row3(baseCol as 1 | 2);
            setMultiOverSet(new Set());
            return currentItems.map((it, idx) => ({ ...it, index: idx }));
          }
        }

        // photoCount=3: 2x1 상/하 로우 이동을 레이아웃 + 인덱스 스왑으로 처리
        if (photoCount === 3 && draggedPos.width === 2 && draggedPos.height === 1) {
          const desiredLargeIndex = baseRow === 1 ? 0 : 2;
          const result = [...currentItems];
          if (draggedIndex !== desiredLargeIndex) {
            console.log('[GridC][dragEnd][3] move large to index', desiredLargeIndex);
            const tmp = result[desiredLargeIndex];
            result[desiredLargeIndex] = { ...result[draggedIndex], index: desiredLargeIndex };
            result[draggedIndex] = { ...tmp, index: draggedIndex };
          }
          setLargeItemPosition(desiredLargeIndex);
          setMultiOverSet(new Set());
          return result.map((it, idx) => ({ ...it, index: idx }));
        }

        // 같은 행 내부에서 2x1이 col2→col1로 이동하는 요청 처리 (photo=8)
        if (
          photoCount === 8 && draggedPos.width === 2 && draggedPos.height === 1 &&
          baseRow === draggedPos.row && baseCol === 1 && draggedPos.col === 2
        ) {
          // 2x1을 같은 행의 col1에 배치하고, 기존 col1의 1x1은 col3로 이동
          console.log('[GridC][dragEnd][2x1 same-row shift] row:', baseRow, ' col:2->1');
          setWideColForPhoto8(1);
          const result = [...currentItems];
          // col1 담당 인덱스, col3 담당 인덱스 계산 (현재 wideCol 기준)
          const idxCol1 = findIndexForCellPhoto8(baseRow as 1|2|3, 1, wideRowForPhoto8);
          const idxCol3 = findIndexForCellPhoto8(baseRow as 1|2|3, 3, wideRowForPhoto8);
          if (idxCol1 >= 0 && idxCol3 >= 0) {
            const tmp = result[idxCol1];
            result[idxCol1] = { ...result[idxCol3], index: idxCol1 };
            result[idxCol3] = { ...tmp, index: idxCol3 };
          }
          setMultiOverSet(new Set());
          return result.map((it, idx) => ({ ...it, index: idx }));
        }

        // photoCount=8의 2x1 레이아웃형 블록은 상태(wideRowForPhoto8)만 변경하면 의도한 스와핑이 이루어짐
        if (photoCount === 8 && draggedPos.width === 2 && draggedPos.height === 1) {
          console.log('[GridC][dragEnd][2x1] layout-only move baseRow/baseCol:', baseRow, baseCol);
          if (baseRow !== wideRowForPhoto8) setWideRowForPhoto8(baseRow as 1 | 2 | 3);
          if (baseCol !== wideColForPhoto8) setWideColForPhoto8(baseCol as 1 | 2);
          setMultiOverSet(new Set());
          return currentItems.map((it, idx) => ({ ...it, index: idx }));
        }

        // photoCount=7의 2x1 블록들도 상태 변경으로 레이아웃 스와핑 처리
        if (photoCount === 7 && draggedPos.width === 2 && draggedPos.height === 1) {
          console.log('[GridC][dragEnd][7] 2x1 move draggedIndex:', draggedIndex, 'targetIndex:', targetIndex, 'baseRow/baseCol:', baseRow, baseCol);
          
          // 드롭 위치에서 다른 2x1 블록과 겹치는지 확인하여 2x1 ↔ 2x1 스왑 결정
          const otherWideIndex = draggedIndex === 0 ? 6 : 0;
          const otherWidePos = getGridPositionForIndex(photoCount, otherWideIndex, largeItemPosition);
          
          // baseRow, baseCol에서 2x1이 배치될 때 다른 2x1과 겹치는지 확인
          const isOverlapping = (
            baseRow === otherWidePos.row && 
            ((baseCol === otherWidePos.col) || 
             (baseCol === otherWidePos.col - 1 && baseCol + 1 === otherWidePos.col) ||
             (baseCol === otherWidePos.col + 1 && baseCol === otherWidePos.col + 1))
          ) || (
            // 같은 영역에 완전히 겹치는 경우
            baseRow === otherWidePos.row && 
            Math.abs(baseCol - otherWidePos.col) <= 1
          );
          
          if (isOverlapping) {
            console.log('[GridC][dragEnd][7] 2x1 ↔ 2x1 swap detected - overlapping areas');
            // 아이템 배열 스왑은 하지 않고, 위치 상태만 서로 교환해야 시각적으로 교차 이동됨
            const currentFirstRow = firstWideRowForPhoto7;
            const currentFirstCol = firstWideColForPhoto7;
            const currentSecondRow = secondWideRowForPhoto7;
            const currentSecondCol = secondWideColForPhoto7;

            // 첫 번째 블록(인덱스 0)은 두 번째 블록의 현재 위치로
            setFirstWideRowForPhoto7(currentSecondRow);
            setFirstWideColForPhoto7(currentSecondCol);
            // 두 번째 블록(인덱스 6)은 첫 번째 블록의 현재 위치로
            setSecondWideRowForPhoto7(currentFirstRow);
            setSecondWideColForPhoto7(currentFirstCol);

            console.log('[GridC][dragEnd][7] State swapped - first:', currentSecondRow, currentSecondCol, 'second:', currentFirstRow, currentFirstCol);
            setMultiOverSet(new Set());
            return currentItems.map((it, idx) => ({ ...it, index: idx }));
          }
          
          // 일반적인 2x1 블록 위치 이동 (겹치지 않는 경우)
          if (draggedIndex === 0) {
            // 첫 번째 2x1 블록 이동
            if (baseRow !== firstWideRowForPhoto7) setFirstWideRowForPhoto7(baseRow as 1 | 2 | 3);
            if (baseCol !== firstWideColForPhoto7) setFirstWideColForPhoto7(baseCol as 1 | 2);
          } else if (draggedIndex === 6) {
            // 두 번째 2x1 블록 이동
            if (baseRow !== secondWideRowForPhoto7) setSecondWideRowForPhoto7(baseRow as 1 | 2 | 3);
            if (baseCol !== secondWideColForPhoto7) setSecondWideColForPhoto7(baseCol as 1 | 2);
          }
          
          setMultiOverSet(new Set());
          return currentItems.map((it, idx) => ({ ...it, index: idx }));
        }

        const result = [...currentItems];
        for (let r = 0; r < draggedPos.height; r++) {
          for (let c = 0; c < draggedPos.width; c++) {
            const srcIdx = findIndexForCellGeneric(draggedPos.row + r, draggedPos.col + c);
            const dstIdx = findIndexForCellGeneric(baseRow + r, baseCol + c);
            if (srcIdx >= 0 && dstIdx >= 0 && srcIdx !== dstIdx) {
              const tmp = result[srcIdx];
              result[srcIdx] = { ...result[dstIdx], index: srcIdx };
              result[dstIdx] = { ...tmp, index: dstIdx };
            }
          }
        }
        setMultiOverSet(new Set());
        return result.map((it, idx) => ({ ...it, index: idx }));
      }

      // 단순한 위치 교환만 수행
      console.log('[GridC][dragEnd] simple swap');
      const swapped = performSimpleSwap(currentItems, draggedIndex, targetIndex);
      // 하이라이트 초기화
      setMultiOverSet(new Set());
      return swapped.map((it, idx) => ({ ...it, index: idx }));
    });
  };

  // 단순 드래그 앤 드롭 처리 (그룹핑 방지)
  const performSimpleSwap = (
    currentItems: GridCItem[], 
    draggedIndex: number, 
    targetIndex: number
  ): GridCItem[] => {
    // 단순한 위치 교환만 수행
    const result = [...currentItems];
    
    // 두 아이템의 콘텐츠를 교환
    const draggedItem = result[draggedIndex];
    const targetItem = result[targetIndex];
    
    result[draggedIndex] = { ...targetItem, index: draggedIndex };
    result[targetIndex] = { ...draggedItem, index: targetIndex };
    
    return result;
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = (gridId: string, imageUrl: string, driveItemKey?: string) => {
    console.log("📥 GridC handleImageUpload:", { gridId, imageUrl: imageUrl.substring(0, 50) + "...", driveItemKey });
    
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === gridId 
          ? { ...item, imageUrl, driveItemKey }
          : item
      )
    );
  };

  // 다중 이미지 업로드 핸들러 - 1번째부터 순차적으로 새롭게 할당
  const handleMultipleImageUpload = React.useCallback((files: File[] | any[]) => {
    const defaultImage = "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg";
    
    console.log('📥 GridC 다중 이미지 업로드 시작:', {
      파일수: files.length,
      그리드수: items.length
    });
    
    setItems(prevItems => {
      const updatedItems = [...prevItems];
      const uploadedCount = { success: 0, total: files.length };
      
      // 1번째 그리드부터 순차적으로 이미지 배정 (기존 이미지가 있어도 덮어쓰기)
      for (let i = 0; i < Math.min(files.length, updatedItems.length); i++) {
        const file = files[i];
        let imageUrl = "";
        let driveItemKey = "";
        
        if (file instanceof File) {
          // File 타입인 경우
          imageUrl = URL.createObjectURL(file);
          driveItemKey = `local_${Date.now()}_${Math.random()}`;
        } else if (file && typeof file === 'object' && file.thumbUrl) {
          // SmartFolderItemResult 타입인 경우
          imageUrl = file.thumbUrl;
          driveItemKey = file.driveItemKey || `external_${Date.now()}_${Math.random()}`;
        }
        
        if (imageUrl) {
          // 기존 이미지가 있어도 새로운 이미지로 덮어쓰기
          updatedItems[i] = { ...updatedItems[i], imageUrl, driveItemKey };
          
          // GridCStore에 이미지 정보 저장 (optional)
          try {
            setImage(updatedItems[i].id, driveItemKey);
          } catch (error) {
            console.log('GridCStore 저장 실패:', error);
          }
          
          uploadedCount.success++;
          
          console.log(`📷 이미지 ${i + 1}/${files.length} 배정 완료:`, {
            gridId: updatedItems[i].id,
            gridIndex: i,
            imageUrl: imageUrl.substring(0, 50) + '...',
            덮어쓰기: updatedItems[i].imageUrl !== defaultImage
          });
        }
      }
      
      // 업로드된 파일 수가 그리드 수보다 많은 경우 알림
      const notAssignedCount = Math.max(0, files.length - updatedItems.length);
      
      console.log('✅ GridC 다중 이미지 업로드 완료:', {
        성공: uploadedCount.success,
        전체: uploadedCount.total,
        배정안됨: notAssignedCount,
        새롭게할당됨: `1번째부터 ${uploadedCount.success}번째까지`
      });
      
      // 이미지가 업로드되면 첫 번째 아이템만 키워드 영역 확장
      if (uploadedCount.success > 0) {
        const imageGridIds = updatedItems
          .filter(item => item.imageUrl && item.imageUrl !== defaultImage)
          .map(item => item.id);
        
        if (imageGridIds.length > 0) {
          expandFirstImageGrid(imageGridIds);
        }
      }
      
      return updatedItems;
    });
  }, [items.length]);

  // 통합 업로드 모달 열기 핸들러
  const handleOpenIntegratedUpload = React.useCallback(() => {
    const totalGridCount = items.length;
    
    if (totalGridCount === 0) {
      console.log('⚠️ 사용 가능한 그리드가 없어 업로드 불가');
      // 사용자에게 알림 (필요시 토스트 메시지 추가)
      return;
    }
    
    // 기존 이미지가 있는지 확인
    if (hasExistingImages()) {
      console.log('⚠️ 기존 이미지가 있어 ApplyModal 표시');
      setIsApplyModalOpen(true);
      return;
    }
    
    console.log(`📂 업로드 모달 열기 - 최대 ${totalGridCount}개 이미지 선택 가능 (1번째부터 순차 할당)`);
    handleOpenUploadModal();
  }, [handleOpenUploadModal, hasExistingImages, items.length]);

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
    
    // GridCStore에 체크 상태 반영
    setSelected(gridId, isSelected);
  };

  // 아이템 삭제 핸들러
  const handleDelete = (gridId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== gridId));
    setSelectedItems(prev => {
      const newSelected = new Set(prev);
      newSelected.delete(gridId);
      return newSelected;
    });
    
    // GridCStore에서도 제거
    remove(gridId);
  };

  // ApplyModal 확인 핸들러 - 기존 이미지 초기화하고 새로운 업로드 진행
  const handleApplyModalConfirm = React.useCallback(() => {
    console.log('🔄 기존 이미지 초기화 후 새로운 업로드 진행');
    
    // 모든 이미지를 기본 이미지로 초기화
    const defaultImage = "https://icecreamkids.s3.ap-northeast-2.amazonaws.com/noimage2.svg";
    setItems(prevItems => 
      prevItems.map(item => ({
        ...item,
        imageUrl: defaultImage
      }))
    );
    
    // 선택 상태 초기화
    setSelectedItems(new Set());
    
    // GridC 전역 스토어의 이미지/키워드/선택 상태 모두 초기화
    try { clearAll(); } catch (_) {}
    
    // 각 GridCElement의 로컬 입력 상태 초기화를 위해 재마운트 유도
    setResetVersion((v) => v + 1);
    
    // ApplyModal 닫기
    setIsApplyModalOpen(false);
    
    // 새로운 업로드 모달 열기
    handleOpenUploadModal();
  }, [handleOpenUploadModal]);

  // ApplyModal 취소 핸들러
  const handleApplyModalCancel = React.useCallback(() => {
    console.log('❌ 업로드 취소');
    setIsApplyModalOpen(false);
    setPendingUploadFiles(null);
  }, []);

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
        // 5개: 3x3격자에서 2x2(1,1~2,2), 1x1(1,3), 1x1(2,3), 1x1(3,1/3), 2x1(3, wideCol~wideCol+1)
        return {
          className: "grid grid-cols-3 grid-rows-3 gap-4 w-full h-full max-w-4xl mx-auto",
          itemStyles: {
            0: { gridColumn: "1 / 3", gridRow: "1 / 3" }, // 2x2 큰 영역
            1: { gridColumn: "3", gridRow: "1" },          // (3,1)
            2: { gridColumn: "3", gridRow: "2" },          // (3,2)
            3: wideColForPhoto5Row3 === 2
              ? { gridColumn: "1", gridRow: "3" }          // (1,3)
              : { gridColumn: "3", gridRow: "3" },         // (3,3)
            4: wideColForPhoto5Row3 === 2
              ? { gridColumn: "2 / 4", gridRow: "3" }      // (2,3)~(3,3)
              : { gridColumn: "1 / 3", gridRow: "3" }      // (1,3)~(2,3)
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
        // 8개: 3x3격자에서 2x1 블록 위치에 따라 다른 레이아웃
        if (wideRowForPhoto8 === 1) {
          // 첫 번째 행의 (1,2)와 (1,3)을 합치는 경우
          return {
            className: "grid grid-cols-3 grid-rows-3 gap-4 w-full h-full max-w-4xl mx-auto",
            itemStyles: {
              0: { gridColumn: "1", gridRow: "1" },          // (1,1)
              1: { gridColumn: "1", gridRow: "2" },          // (2,1) 
              2: { gridColumn: "1", gridRow: "3" },          // (3,1)
              3: { gridColumn: "2", gridRow: "2" },          // (2,2) ← 기존 (1,2)에서 밀려남  
              4: { gridColumn: "3", gridRow: "2" },          // (2,3) ← 기존 (2,2)에서 밀려남
              5: { gridColumn: "2", gridRow: "3" },          // (3,2)
              6: { gridColumn: "3", gridRow: "3" },          // (3,3) ← 기존 (1,3)에서 밀려남
              7: { gridColumn: "2 / 4", gridRow: "1" }       // (1,2)~(1,3)
            } as Record<number, React.CSSProperties>
          };
        } else if (wideRowForPhoto8 === 3) {
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
              7: { gridColumn: "2 / 4", gridRow: "3" }       // (2,3)~(3,3)
            } as Record<number, React.CSSProperties>
          };
        }
        // wideRowForPhoto8 === 2 인 경우: 두 번째 행의 (2,2)와 (3,2)를 합치고, 해당 자리에 있던 4,5 인덱스는 각각 (3,2)와 (3,3)으로 이동
        return {
          className: "grid grid-cols-3 grid-rows-3 gap-4 w-full h-full max-w-4xl mx-auto",
          itemStyles: {
            0: { gridColumn: "1", gridRow: "1" },          // (1,1)
            1: { gridColumn: "2", gridRow: "1" },          // (2,1)
            2: { gridColumn: "3", gridRow: "1" },          // (3,1)
            3: { gridColumn: "1", gridRow: "2" },          // (1,2)
            4: { gridColumn: "2", gridRow: "3" },          // (2,3) ← 기존 (2,2) 다운시프트
            5: { gridColumn: "3", gridRow: "3" },          // (3,3) ← 기존 (3,2) 다운시프트
            6: { gridColumn: "1", gridRow: "3" },          // (1,3)
            7: { gridColumn: "2 / 4", gridRow: "2" }       // (2,2)~(3,2)
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
        <div className="w-full h-full relative flex flex-col">
          <div 
            ref={setGridContainer}
            className={getGridLayoutConfig().className}
          >
            {items.map((item, index) => {
              // 위치 스타일을 단일 소스(getGridPositionForIndex)에서 계산하여 레이아웃/좌표 불일치 방지
              const pos = getGridPositionForIndex(photoCount, index, largeItemPosition);
              const gridColumn = pos.width === 1 ? `${pos.col}` : `${pos.col} / ${pos.col + pos.width}`;
              const gridRow = pos.height === 1 ? `${pos.row}` : `${pos.row} / ${pos.row + pos.height}`;
              const computedStyle: React.CSSProperties = { gridColumn, gridRow };
              
              return (
                <DragDropGridCItem
                  key={`${item.id}-${resetVersion}`}
                  id={item.id}
                  index={item.index}
                  clipPathData={item.clipPathData}
                  imageUrl={item.imageUrl}
                  driveItemKey={item.driveItemKey}
                  isClippingEnabled={isClippingEnabled}
                  isSelected={selectedItems.has(item.id)}
                  onSelectChange={(isSelected) => handleSelectChange(item.id, isSelected)}
                  onDelete={() => handleDelete(item.id)}
                  onImageUpload={handleImageUpload}
                  onClipPathChange={handleClipPathChange}
                  onIntegratedUpload={handleOpenIntegratedUpload}
                  style={computedStyle}
                  isAnimating={isAnimating}
                />
              );
            })}
          </div>
        </div>

        {/* 통합 이미지 업로드 모달 */}
        {isUploadModalOpen && (
          <UploadModal
            isOpen={isUploadModalOpen}
            onCancel={handleCloseUploadModal}
            onConfirm={handleConfirmUploadModal}
            setItemData={handleSetItemData}
            setFileData={(files: React.SetStateAction<File[]>) => {
              if (Array.isArray(files) && files.length > 0) {
                console.log('📁 GridC 통합 파일 선택됨:', files);
                processUploadedFiles(files);
              }
            }}
            isMultiUpload={true} // 다중 이미지 업로드 허용
            allowsFileTypes={['IMAGE']}
          />
        )}

        {/* 기존 이미지 재업로드 확인 모달 */}
        <ApplyModal
          open={isApplyModalOpen}
          onOpenChange={setIsApplyModalOpen}
          description="이미지가 이미 업로드되어 있습니다.&#10;새롭게 업로드하면 기존 이미지가 모두 초기화됩니다.&#10;계속 진행하시겠습니까?"
          onConfirm={handleApplyModalConfirm}
          onCancel={handleApplyModalCancel}
          confirmText="확인"
          cancelText="취소"
        >
          <div />
        </ApplyModal>
      </DndContext>
  );
}

export default GridC; 