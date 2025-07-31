import { create } from 'zustand';

interface ImageEditModalStore {
  isImageEditModalOpen: boolean;
  setImageEditModalOpen: (isOpen: boolean) => void;
}

export const useImageEditModalStore = create<ImageEditModalStore>((set) => ({
  isImageEditModalOpen: false,
  setImageEditModalOpen: (isOpen) => {
    console.log("🔄 [전역 상태] ImageEditModal 상태 변경:", isOpen);
    set({ isImageEditModalOpen: isOpen });
  },
})); 