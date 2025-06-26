import { IMenuPosition } from '@/components/common/Tooltip/types';
import { create } from 'zustand';

interface TooltipState {
  menuPositions: Record<string, IMenuPosition>;
  setMenuPosition: (id: string, pos: IMenuPosition) => void;
  calculateMenuPosition: (
    e: React.MouseEvent | PointerEvent,
    {
      id,
      parentRef,
    }: {
      id: string;
      parentRef?: React.RefObject<HTMLDivElement>;
    },
  ) => IMenuPosition | null;
  clearAllTooltips: (excludeId?: string) => void;
}

export const useTooltipStore = create<TooltipState>((set) => ({
  menuPositions: {},

  setMenuPosition: (id, pos) =>
    set((state) => ({
      menuPositions: { ...state.menuPositions, [id]: pos },
    })),
  calculateMenuPosition: (e, { id, parentRef }) => {
    const tooltip = document.querySelector(`.tooltip-layer1[id="${id}"]`) as HTMLElement;
    if (!tooltip) return null;

    const rect = tooltip.getBoundingClientRect();
    const parentRect = parentRef?.current?.getBoundingClientRect() ?? {
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const margin = 8;

    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    /**
     * x가 벗어났을때
     */
    if (e.clientX + rect.width > parentRect.width) {
      x = -(e.clientX + rect.width - parentRect.width) / 2 - margin;
    }
    /**
     * y가 벗어났을때
     */

    if (e.clientY + rect.height > parentRect.height) {
      y = -(e.clientY + rect.height - parentRect.height) / 2 - margin;
    }

    return { x, y };
  },
  clearAllTooltips: (excludeId) =>
    set((state) => ({
      menuPositions: Object.fromEntries(
        Object.entries(state.menuPositions).map(([tooltipId, pos]) => [
          tooltipId,
          tooltipId === excludeId ? pos : { x: 0, y: 0 }, // 제외할 ID는 유지, 나머지는 초기화
        ]),
      ),
    })),
}));
