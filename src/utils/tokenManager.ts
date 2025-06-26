import { encryptData, decryptData } from '@/utils';

export const tokenManager = {
  setToken: async (token: string, userData: object, useSession: boolean = false) => {
    const userInfo = encryptData(userData);
    const response = await fetch('/api/auth/set-cookie', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // 쿠키 포함 요청
      body: JSON.stringify({ token, userInfo, useSession }),
    });

    // 통신 결과 셋팅된 쿠키값 리턴 - 만료일자 추가됨
    if (!response.ok) return null;
    const data = await response.json();
    return {
      userInfo: decryptData(decodeURIComponent(data.userInfo)),
    };
  },

  setTokenProfile: async (userData: object) => {
    const userInfo = encryptData(userData);
    const response = await fetch('/api/auth/set-cookie-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // 쿠키 포함 요청
      body: JSON.stringify({ userInfo }),
    });

    // 통신 결과 셋팅된 쿠키값 리턴 - 만료일자 추가됨
    if (!response.ok) return null;
    const data = await response.json();
    return {
      userInfo: decryptData(decodeURIComponent(data.userInfo)),
    };
  },

  // 토큰 가져오기 (HTTP-Only 쿠키는 JavaScript에서 접근 불가능 → 서버에서 가져와야 함)
  getToken: async () => {
    const response = await fetch('/api/auth/get-cookie', {
      method: 'GET',
      credentials: 'include', // 쿠키 포함 요청
    });

    if (!response.ok) return null;
    const data = await response.json();
    return {
      token: data.token,
      userInfo: decryptData(decodeURIComponent(data.userInfo)),
    };
  },

  // 토큰 유무 가져오기 (HTTP-Only 쿠키는 JavaScript에서 접근 불가능 → 서버에서 가져와야 함)
  getCheckToken: async () => {
    const response = await fetch('/api/auth/get-check-cookie', {
      method: 'GET',
      credentials: 'include', // 쿠키 포함 요청
    });

    if (!response.ok) return null;
    const data = await response.json();
    return {
      state: data.message === 'OK',
    };
  },

  // 토큰 삭제 (서버에 요청하여 HTTP-Only 쿠키 삭제)
  clearToken: async () => {
    await fetch('/api/auth/clear-cookie', {
      method: 'POST',
      credentials: 'include', // 쿠키 포함 요청
    });
  },
};

export const automaticLoginManager = {
  setAutomaticToken: async (phoneNumber: string, useSession: boolean = false) => {
    const postBody = encryptData({ phoneNumber, useSession });
    await fetch('/api/auth/set-auto-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // 쿠키 포함 요청
      body: JSON.stringify({ postBody }),
    });
  },

  // 토큰 가져오기 (HTTP-Only 쿠키는 JavaScript에서 접근 불가능 → 서버에서 가져와야 함)
  getAutomaticToken: async () => {
    const response = await fetch('/api/auth/get-auto-login', {
      method: 'GET',
      credentials: 'include', // 쿠키 포함 요청
    });

    if (!response.ok) return null;
    const data = await response.json();
    let phoneNumber = null;
    let authLoginToken = null;
    let stopAuthAutoLogging = null;
    if (data.autoLogin) {
      const authLoginTokenItems = decryptData(decodeURIComponent(data.autoLogin));
      phoneNumber = authLoginTokenItems?.phoneNumber;
      authLoginToken = authLoginTokenItems?.token;
    }
    if (data.stopAutoLogging) {
      const decryptdedAuthAutoLogging = decryptData(decodeURIComponent(data.stopAutoLogging));
      if (decryptdedAuthAutoLogging) {
        stopAuthAutoLogging = JSON.parse(decryptdedAuthAutoLogging);
      }
    }
    return {
      phoneNumber,
      authToken: authLoginToken,
      stopAutoLogging: stopAuthAutoLogging,
    };
  },

  // 토큰 삭제 (서버에 요청하여 HTTP-Only 쿠키 삭제)
  clearAutomaticToken: async () => {
    await fetch('/api/auth/clear-auto-login', {
      method: 'POST',
      credentials: 'include', // 쿠키 포함 요청
    });
  },
};
