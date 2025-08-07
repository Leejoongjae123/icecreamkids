'use client';

import { GridItem, GridPosition } from '@/app/components/GridLayout/types';

/**
 * 병합된 셀을 새로운 위치로 옮길 때 영향을 받는 아이템을 계산하고
 * 이동 결과가 유효한지(즉, 병합된 셀의 원래 영역이 영향을 받는 아이템 수를 담을 수 있는지)
 * 여부와 함께 업데이트된 아이템 배열을 반환합니다.
 *
 * 3x3 고정 그리드를 가정하며, 좌표는 0-index 입니다.
 */
export function calculateSwitchPositions(
  items: GridItem[],
  mergedItem: GridItem,
  toPosition: GridPosition
): {
  valid: boolean;
  updatedItems: GridItem[];
  affectedItems: GridItem[];
} {
  const colSpan = mergedItem.colSpan || 1;
  const rowSpan = mergedItem.rowSpan || 1;

  // 1) 그리드 범위를 벗어나면 무효
  if (
    toPosition.row < 0 ||
    toPosition.col < 0 ||
    toPosition.row + rowSpan > 3 ||
    toPosition.col + colSpan > 3
  ) {
    return { valid: false, updatedItems: items, affectedItems: [] };
  }

  // 2) 드랍존(옮길 위치)이 차지하게 될 셀의 좌표를 계산
  const targetArea: GridPosition[] = [];
  for (let r = toPosition.row; r < toPosition.row + rowSpan; r++) {
    for (let c = toPosition.col; c < toPosition.col + colSpan; c++) {
      targetArea.push({ row: r, col: c });
    }
  }

  // 3) targetArea 안에 포함된 셀 검사
  //    • 다른 병합 셀이 하나라도 있으면 무효 처리
  //    • 일반 셀은 affectedItems 에 수집
  let invalidBecauseOfMerged = false;
  const affectedItems: { item: GridItem; position: GridPosition }[] = [];
  for (const pos of targetArea) {
    const itemAtPos = items.find((it) => it.row === pos.row && it.col === pos.col);
    if (!itemAtPos) {
      continue;
    }

    // 다른 병합 셀이 있다면 즉시 무효 처리
    if ((itemAtPos.colSpan || itemAtPos.rowSpan) && itemAtPos.id !== mergedItem.id) {
      invalidBecauseOfMerged = true;
      break;
    }

    // 일반 셀이라면 영향 리스트에 추가
    if (!itemAtPos.colSpan && !itemAtPos.rowSpan && itemAtPos.id !== mergedItem.id) {
      affectedItems.push({ item: itemAtPos, position: pos });
    }
  }

  if (invalidBecauseOfMerged) {
    return { valid: false, updatedItems: items, affectedItems: [] };
  }

  // 4) 병합된 셀의 원래 영역(좌상단 -> 우하단 순) 계산
  const originalArea: GridPosition[] = [];
  for (let r = mergedItem.row; r < mergedItem.row + rowSpan; r++) {
    for (let c = mergedItem.col; c < mergedItem.col + colSpan; c++) {
      originalArea.push({ row: r, col: c });
    }
  }

  // 5) 영향을 받는 아이템이 병합된 셀의 원래 영역보다 많으면 무효 (빈 칸이 있어도 허용하려면 '<=' 로 바꿀 수 있음)
  if (affectedItems.length > originalArea.length) {
    return { valid: false, updatedItems: items, affectedItems: affectedItems.map((a) => a.item) };
  }

  // 6) 아이템 위치 업데이트 계산
  const updatedItems = items.map((it) => {
    // 병합된 셀은 새 위치로 이동
    if (it.id === mergedItem.id) {
      return { ...it, row: toPosition.row, col: toPosition.col };
    }

    // 영향을 받은 아이템은 originalArea 순서대로 이동
    const idx = affectedItems.findIndex((a) => a.item.id === it.id);
    if (idx !== -1) {
      const newPos = originalArea[idx];
      return { ...it, row: newPos.row, col: newPos.col };
    }

    return it;
  });

  return {
    valid: true,
    updatedItems,
    affectedItems: affectedItems.map((a) => a.item),
  };
}
