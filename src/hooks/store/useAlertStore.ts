import { create } from 'zustand';
import { IModal, IModalStore } from '@/components/common/ModalBase/types';

export const useAlertStore = create<IModalStore>((set: any, get: any) => ({
  alert: {
    isOpen: false,
    isConfirm: false,
    message: '',
    description: '',
    onCancel: null,
    onConfirm: null,
    isConfirmDisabled: false, // 중복클릭 방지용
  },

  showAlert: ({ message, onCancel, onConfirm, description }: IModal) => {
    set({
      alert: {
        isOpen: true,
        isConfirm: !!onCancel,
        message,
        description,
        isConfirmDisabled: false,
        onCancel: async () => {
          if (onCancel) {
            await onCancel();
          }
          get().closeAlert();
        },
        onConfirm: async () => {
          const { alert } = get();

          // 이미 confirm 버튼이 비활성화라면 중단
          if (alert.isConfirmDisabled) return;

          // 첫 클릭 시점에 버튼 비활성화
          set((prev: any) => ({
            alert: {
              ...prev.alert,
              isConfirmDisabled: true,
            },
          }));

          // 실제 onConfirm 로직 수행
          if (onConfirm) {
            await onConfirm();
          }
          get().closeAlert();
        },
      },
    });
  },
  closeAlert: () => {
    set({
      alert: {
        isOpen: false,
        message: '',
        description: '',
        isConfirm: false,
        onCancel: null,
        onConfirm: null,
        isConfirmDisabled: false,
      },
    });
  },

  setAlertInfo: ({ isOpen, isConfirm, message, onCancel, onConfirm, description }: IModal) => {
    set({
      alert: {
        isOpen,
        isConfirm,
        message,
        description,
        onCancel,
        onConfirm,
      },
    });
  },
}));
