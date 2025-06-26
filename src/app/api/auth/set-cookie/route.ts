import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { encryptData, decryptData } from '@/utils';
import dayjs from 'dayjs';

export async function POST(req: NextRequest) {
  const { token, userInfo, useSession } = await req.json();

  if (!token || !userInfo) {
    return NextResponse.json({ error: 'Not found' }, { status: 400 });
  }

  const cookiesMaxAge = useSession ? undefined : 60 * 60 * 24;
  // HTTP-Only 쿠키 (auth_token) 설정
  cookies().set('authToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // 프로덕션에서만 secure 활성화
    maxAge: cookiesMaxAge,
    path: '/',
  });

  // HTTP-Only 쿠키 (userInfo) 설정 - 만료일자 titmestemp로 저장
  const today = dayjs();
  const todayUnix = today.unix();
  const maxAgeDate = cookiesMaxAge ? cookiesMaxAge + todayUnix : -1;
  const decryptUserInfo = decryptData(decodeURIComponent(userInfo));
  const encryptUserInfo = encryptData({
    ...decryptUserInfo,
    ...{ maxAgeUnix: maxAgeDate },
  });

  const encodeURIUserInfo = encodeURIComponent(encryptUserInfo);

  cookies().set('userInfo', encodeURIUserInfo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // 프로덕션에서만 secure 활성화
    maxAge: cookiesMaxAge,
    path: '/',
  });

  return NextResponse.json({ message: 'OK', userInfo: encodeURIUserInfo }, { status: 200 });
}
