import { create } from 'zustand';
import { ISnackbar, ISnackbarStore } from '@/components/common/Snackbar/types';

export const useSnackbar = create<ISnackbarStore>((set) => ({
  messages: [],
  add: (snackbarMessage: Omit<ISnackbar, 'id'>) =>
    set(({ messages }) => {
      const id = Date.now(); // 자동 생성 ID
      return { messages: [...messages, { ...snackbarMessage, id }] };
    }),
  remove: (id: number) => set(({ messages }) => ({ messages: messages.filter((x) => x.id !== id) })),
}));
