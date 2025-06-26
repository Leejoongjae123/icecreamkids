import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import dayjs from 'dayjs';

import type { ProfileResult } from '@/service/member/schemas';
import { decryptData, encryptData } from '@/utils';
import { useAlertStore } from '@/hooks/store/useAlertStore';

// 🔹 타입 정의
export interface UserInfo extends ProfileResult {
  email: string;
  phoneNumber?: string;
  maxAgeUnix?: number;
}

export interface UserStore {
  userInfo: UserInfo | null;
  isAuthenticated: boolean;
  userSessionExpiresAt: number | null;
  setUserInfo: (user: UserInfo | null) => void;
  clearUserInfo: () => void;
  _reinitializeTimerOnHydration: () => void;
}

// setTimeout I를 저장 변수
let userSessionTimeoutId: string | number | NodeJS.Timeout | null | undefined = null;

// 🔹 Zustand 상태 관리 (자동 복호화 포함)
const useUserStore = create<UserStore>()(
  persist(
    (set, get) => {
      /**
       * 로그인 사용자 초기화
       */
      const clearStotrUserInfo = () => {
        // 이전 타이머 초기화
        if (userSessionTimeoutId) {
          clearTimeout(userSessionTimeoutId);
          userSessionTimeoutId = null;
        }
        // sessionStorage.removeItem('encryptedUserInfo');
        // sessionStorage.removeItem('user-storage');
        set({ userInfo: null, isAuthenticated: false, userSessionExpiresAt: null });
        // 세션 스토리지 초기화
        sessionStorage.clear();
      };

      const clearExpirationTimeLimits = async () => {
        await clearStotrUserInfo();
        // useAlertStore.getState().showAlert({ message: '로그아웃 되었습니다.', onConfirm: () => { console.log(1); } });
        window.location.href = '/login';
      };

      /**
       * 로그인 쿠키 만료 시 스토어 초기화 내부 함수
       * @param expireationTimestamp
       * @returns
       */
      const userSessionStoreReset = (expireationTimestamp: number | null = null) => {
        // 이전 타이머 초기화
        if (userSessionTimeoutId) {
          clearTimeout(userSessionTimeoutId);
          userSessionTimeoutId = null;
        }

        // 만료 시간이 없는 경우 초기화 타이머 설정을 하지 않음
        if (!expireationTimestamp) {
          return;
        }

        const timestemp = dayjs().valueOf();
        const timeUntilExpiry = expireationTimestamp - timestemp;

        if (timeUntilExpiry < 0) {
          clearExpirationTimeLimits();
        } else {
          userSessionTimeoutId = setTimeout(() => {
            clearExpirationTimeLimits();
            userSessionTimeoutId = null;
          }, timeUntilExpiry);
        }
      };

      return {
        userInfo: null,
        isAuthenticated: false,
        userSessionExpiresAt: null,
        setUserInfo: (user: UserInfo | null) => {
          if (user) {
            // 🛠 암호화하여 sessionStorage에 저장
            const { maxAgeUnix = null } = user;
            const expirationTimestampMs = maxAgeUnix ? (maxAgeUnix + 1) * 1000 : null; // middleware 이슈로 1초 추가
            const encryptedUser = encryptData(user);
            sessionStorage.setItem('encryptedUserInfo', encodeURIComponent(encryptedUser));
            set({ userInfo: user, isAuthenticated: true, userSessionExpiresAt: expirationTimestampMs });
            userSessionStoreReset(expirationTimestampMs);
          } else {
            sessionStorage.removeItem('encryptedUserInfo');
            set({ userInfo: null });
          }
        },
        clearUserInfo: clearStotrUserInfo,
        _reinitializeTimerOnHydration: () => {
          const { isAuthenticated = false, userSessionExpiresAt = null } = get();

          if (isAuthenticated && userSessionExpiresAt) {
            userSessionStoreReset(userSessionExpiresAt);
          } else {
            const isAuth = !isAuthenticated && userSessionExpiresAt;
            if (isAuth) clearExpirationTimeLimits();
          }
        },
      };
    },
    {
      name: 'user-storage',
      storage: {
        getItem: (key) => {
          const encryptedData = sessionStorage.getItem(key);
          const decyptUserInfo = encryptedData ? decryptData(decodeURIComponent(encryptedData)) : null; // 🔹 자동 복호화
          return decyptUserInfo;
        },
        setItem: (key, value) => {
          const encryptedData = encryptData(value);
          sessionStorage.setItem(key, encodeURIComponent(encryptedData));
        },
        removeItem: (key) => sessionStorage.removeItem(key),
      },
      onRehydrateStorage: () => {
        return (hydratedState?: UserStore, error?: unknown | any) => {
          if (error) {
            // sessionStorage 관련에러 미노출 처리
            if (error?.name !== 'ReferenceError' && error?.message !== 'sessionStorage is not defined') {
              console.error('Zustand 스토리지 리하이드레이션 중 오류 발생:', error);
            }
            // 오류 발생 시 스토어를 안전하게 초기 상태로 설정할 수도 있습니다.
            return;
          }
          if (hydratedState) {
            // console.log('Zustand 스토리지에서 상태 로드 완료. 타이머 재초기화 액션 호출 예정.');
            // setTimeout을 사용하여 현재의 rehydration 프로세스 및 관련 렌더링이 완료된 후
            // 다음 이벤트 루프에서 액션이 실행되도록 합니다.
            setTimeout(() => {
              // eslint-disable-next-line no-underscore-dangle
              useUserStore.getState()._reinitializeTimerOnHydration();
            }, 0);
          }
        };
      },
    },
  ),
);

export default useUserStore;
