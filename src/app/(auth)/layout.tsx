'use client';

import { type PropsWithChildren, useEffect, useState, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import useUserStore from '@/hooks/store/useUserStore';
import { useRouter } from 'next/navigation';
import { tokenManager } from '@/utils/tokenManager';
import { prefix } from '@/const';

export default function AuthLayout({ children }: PropsWithChildren) {
  const { userInfo, setUserInfo } = useUserStore();
  const router = useRouter();

  const [isHydrated, setIsHydrated] = useState(false);
  const [isCheckUserInfo, setIsCheckUserInfo] = useState(false);

  useEffect(() => {
    // 클라이언트에서만 실행
    setIsHydrated(true);
  }, []);

  const callChkeckToken = useCallback(async () => {
    const result = await tokenManager.getCheckToken();
    let isLogin = false;
    if (result) {
      isLogin = result.state;
    }
    if (!isLogin) router.push(prefix.login);
    else {
      setIsCheckUserInfo(true);
      if (!userInfo) {
        tokenManager.getToken().then((res) => {
          if (res) {
            const userInfoData = res?.userInfo;
            if (userInfoData) setUserInfo(userInfoData);
          }
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isHydrated) callChkeckToken();
  }, [callChkeckToken, isHydrated]);

  // Hydration 체크 후 렌더링
  if (!isHydrated) return null;

  return isCheckUserInfo ? <AppLayout>{children}</AppLayout> : null;
}
