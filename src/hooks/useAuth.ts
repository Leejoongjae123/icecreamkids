import useUserStore from '@/hooks/store/useUserStore';
import { SignInWithPhoneRequest, RefreshAuthSessionRequest, ProfileResult } from '@/service/member/schemas';
import { tokenManager, automaticLoginManager } from '@/utils/tokenManager';
import { getByPhoneNumber1, useSignIn2, useRefreshSignIn1 } from '@/service/member/memberStore';
import { useQueryClient } from '@tanstack/react-query';
// 🔹 타입 정의
export interface UserInfo extends ProfileResult {
  email: string;
  phoneNumber?: string;
}

export const useAuth = () => {
  const { setUserInfo, clearUserInfo } = useUserStore();
  // const router = useRouter();
  const { mutateAsync: loginWithPhone } = useSignIn2();
  const { mutateAsync: refreshToken } = useRefreshSignIn1();
  const queryClient = useQueryClient();

  // 로그인 후 쿠키 및 userInfo setting
  const recordUserInfo = async (token: string | undefined, phoneNumber: string = '') => {
    // token이 있는 경우만 동작 처리
    if (token) {
      // document.cookie = `refreshToken=${data.result.token}; path=/;`;
      // phoneNumber를 이용하여 회원정보 불러오기
      const { result: userInfoResponse, status } = await getByPhoneNumber1(
        {
          includes: 'profiles',
        },
        phoneNumber,
      );
      if (status === 200 && userInfoResponse) {
        const userData = {
          ...userInfoResponse.profiles![0],
          email: userInfoResponse.email ?? '',
          phoneNumber,
        };
        const result = await tokenManager.setToken(token || '', userData);
        await setUserInfo(result?.userInfo ? result.userInfo : userData);
      }
    }
  };

  // 로그인 처리
  const login = async (credentials: SignInWithPhoneRequest) => {
    const response = await loginWithPhone({
      data: credentials,
    });
    if (response.status === 200) {
      try {
        const data = response;
        // 공통 사용자 정보 셋팅
        await recordUserInfo(data?.result?.token, credentials.phoneNumber);
      } catch (error) {
        console.error('Error parsing JSON response:', error);
        throw new Error('로그인 응답 처리 중 오류 발생');
      }
    } else {
      throw new Error('로그인 실패');
    }
  };
  // 자동 로그인 (리프레시 토큰 이용)
  const refreshLogin = async ({
    phoneNumber,
    token,
    refreshAuthSessionRequest,
  }: {
    phoneNumber: string;
    token: string;
    refreshAuthSessionRequest: RefreshAuthSessionRequest;
  }) => {
    // token 전달방식이 httponly로 변경됨에 따라 token을 path에서 제외하는 api가 있어야함.
    const response = await refreshToken({
      token,
      data: refreshAuthSessionRequest,
    });
    try {
      // // 공통 사용자 정보 셋팅
      await recordUserInfo(response?.result?.token, phoneNumber);
      // 토큰
      await automaticLoginManager.setAutomaticToken(phoneNumber);
    } catch (error) {
      clearUserInfo();
      throw new Error('자동 로그인 실패');
    }
  };

  // 로그아웃 처리
  const logout = async () => {
    await tokenManager.clearToken();
    await clearUserInfo();
    const chennelogout = new BroadcastChannel('data-share-remove-channel');
    // chennelogout.postMessage('REQUEST_SESSION_REMOVE');
    chennelogout.postMessage('REQUEST_SESSION_REMOVE');
    chennelogout.close();
    queryClient.clear();
  };

  const updatedUserInfo = async (updateUserInfoData: UserInfo | null, updateKey: string = '') => {
    const result = await tokenManager.getToken();
    const token = result?.token;
    const cookieUserInfo = result?.userInfo;

    if (token) {
      if (updateUserInfoData && !updateKey) {
        await tokenManager.setToken(token, updatedUserInfo);
        setUserInfo(updateUserInfoData);
      } else {
        const phoneNumber = cookieUserInfo?.phoneNumber;
        if (phoneNumber) {
          await recordUserInfo(token, phoneNumber);
        } else if (updateKey) {
          if (updateUserInfoData) {
            if (updateKey in updateUserInfoData) {
              const targetValue = updateUserInfoData[updateKey as keyof UserInfo];
              const targetUpdateUserInfo = { ...cookieUserInfo };
              targetUpdateUserInfo[updateKey as keyof UserInfo] = targetValue;
            }
          }
        }
      }
    }
  };

  return { login, refreshLogin, logout, updatedUserInfo };
};
