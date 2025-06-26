import { create } from 'zustand';

interface IModalState {
  isModalOpen: boolean;
  activatedTab: '' | 'class' | 'children';
  selectedClassId?: number | undefined;
  openModal: (tab?: '' | 'class' | 'children', classId?: number | undefined, callback?: () => void) => void;
  closeModal: () => void;
  toggleModal: () => void;
  onCloseCallback?: () => void;
}

const useClassManageStore = create<IModalState>((set, get) => ({
  isModalOpen: false, // 초기 상태는 닫힌 상태
  activatedTab: '', // 초기 상태는 선택 없음 - 우리반 관리가가 기본 노출 탭
  selectedClassId: undefined,
  onCloseCallback: undefined,
  openModal: (tab, classId, callback) =>
    set({ isModalOpen: true, activatedTab: tab, selectedClassId: classId, onCloseCallback: callback }),
  closeModal: () => {
    const callback = get().onCloseCallback;
    set({ isModalOpen: false, activatedTab: '', selectedClassId: undefined, onCloseCallback: undefined });
    if (callback) callback();
  },
  toggleModal: () => set((state) => ({ isModalOpen: !state.isModalOpen })),
}));

export default useClassManageStore;
