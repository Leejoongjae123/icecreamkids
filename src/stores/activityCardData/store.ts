import type { LecturePlanResult } from '@/service/aiAndProxy/schemas';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const storageActivityCardDataId = 'activityCardDataStorage';
interface ActivityCardState {
  responseData: any | null;
  storageId: string;
  setActivityCardData: (data: any) => void;
  removeActivityCardData: () => void;
}

// export const useActivityCardDataStore = create<ActivityCardState>((set) => ({
//   responseData: null,
//   setActivityCardData: (data: any) => set({ responseData: data }),
// }));

const storage = createJSONStorage(() => sessionStorage);

export const useActivityCardDataStore = create<ActivityCardState>()(
  persist(
    (set) => ({
      responseData: null,
      storageId: storageActivityCardDataId,
      setActivityCardData: (data: any) => set({ responseData: data }),
      removeActivityCardData: () => {
        storage?.removeItem(storageActivityCardDataId);
        set({ responseData: null });
      },
    }),
    {
      name: storageActivityCardDataId,
      storage,
    },
  ),
);
