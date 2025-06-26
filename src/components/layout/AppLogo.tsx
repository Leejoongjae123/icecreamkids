import { useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useUserStore from '@/hooks/store/useUserStore';
import { decryptData } from '@/utils';
import { tokenManager } from '@/utils/tokenManager';

let isCallSessionData = false;
const shaareChannelName = 'data-share-channel';
const AppLogo = () => {
  // 로그인 세션스토리지 broadCastMessage 설정
  const { userInfo, setUserInfo, clearUserInfo } = useUserStore();
  useEffect(() => {
    const chennel = new BroadcastChannel(shaareChannelName);
    if (!userInfo) {
      const handleMessage = (event: MessageEvent) => {
        if (!userInfo) {
          if (event.data.type === 'RESPONSE_SESSION_DATA') {
            sessionStorage.setItem('encryptedUserInfo', event.data.session.encryptedUserInfo);
            const encryptedData = decryptData(event.data.session.encryptedUserInfo); // 🔹 자동 복호화
            if (encryptedData) {
              setUserInfo(encryptedData);
            }
          }
        }
      };
      chennel.onmessage = handleMessage;
    }
    return () => {
      chennel.close();
    };
  }, [setUserInfo, userInfo]);

  const callChk = useCallback(() => {
    if (!userInfo) {
      if (!isCallSessionData) {
        isCallSessionData = true;
        tokenManager.getCheckToken().then((response) => {
          let isLogin = false;
          if (response) {
            isLogin = response.state;
          }
          if (isLogin) {
            tokenManager.getToken().then((res) => {
              if (res) {
                const userInfoData = res?.userInfo;
                if (userInfoData) setUserInfo(userInfoData);
              } else {
                clearUserInfo();
                isCallSessionData = false;
              }
            });
          } else {
            isCallSessionData = false;
          }
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo]);

  useEffect(() => {
    callChk();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <h1 className="doc-title">
      <Link href="/introduce" className="link-logo">
        <Image src="/images/logo@2x.png" width="222" height="42" className="img-logo" alt="kinderboard beta" priority />
      </Link>
    </h1>
  );
};

export default AppLogo;
