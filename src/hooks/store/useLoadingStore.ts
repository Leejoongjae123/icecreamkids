// stores/useLoadingStore.ts
import { create } from 'zustand';

interface LoadingState {
  count: number;
  isLoading: boolean;
  increment: () => void;
  decrement: () => void;
}

export const useLoadingStore = create<LoadingState>((set, get) => ({
  count: 0,
  isLoading: false,
  increment: () => {
    const count = get().count + 1;
    set({ count, isLoading: true });
  },
  decrement: () => {
    const count = Math.max(get().count - 1, 0);
    set({ count, isLoading: count > 0 });
  },
}));
