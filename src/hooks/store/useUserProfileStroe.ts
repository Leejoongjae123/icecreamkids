import type { ProfileResult } from '@/service/member/schemas';
import { create } from 'zustand';

interface IUserProfile {
  userProfile?: ProfileResult | undefined;
  setUserProfile: (userProfile: ProfileResult) => void;
}

export const useUserProfileStroe = create<IUserProfile>((set) => ({
  userProfile: undefined,
  setUserProfile: (profile) =>
    set(() => ({
      userProfile: profile || undefined,
    })),
}));
