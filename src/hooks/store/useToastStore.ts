import { create } from 'zustand';
import { IToast, IToastStore, TOAST_MESSAGE_DURATION } from '@/components/common/Toast/types';

export const useToast = create<IToastStore>((set) => ({
  messages: [],
  add: (toastMessage: Omit<IToast, 'id'>) => {
    // 빠르게 올릴경우 사라지지 않는 이슈로 인해 고유아이디 처리
    const id = crypto.randomUUID();
    set((state) => ({
      messages: [...state.messages, { ...toastMessage, id }],
    }));
    setTimeout(() => {
      set((state) => ({
        messages: state.messages.filter((x) => x.id !== id),
      }));
    }, TOAST_MESSAGE_DURATION);
  },
  remove: (id: string) =>
    set((state) => ({
      messages: state.messages.filter((x) => x.id !== id),
    })),
}));
