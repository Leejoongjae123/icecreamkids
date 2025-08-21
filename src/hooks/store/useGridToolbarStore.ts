import { create } from 'zustand';

interface GridToolbarStoreState {
  lastCloseAllAt: number;
  triggerCloseAll: () => void;
}

export const useGridToolbarStore = create<GridToolbarStoreState>((set) => ({
  lastCloseAllAt: 0,
  triggerCloseAll: () => set({ lastCloseAllAt: Date.now() }),
}));


