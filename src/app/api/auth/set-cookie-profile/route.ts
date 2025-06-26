import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { encryptData, decryptData } from '@/utils';
import dayjs from 'dayjs';

export async function POST(req: NextRequest) {
  const { userInfo } = await req.json();

  const encryptedUserInfo = cookies().get('userInfo')?.value;
  if (!userInfo || !encryptedUserInfo) {
    return NextResponse.json({ error: 'Not found' }, { status: 400 });
  }

  const preUserInfo = decryptData(decodeURIComponent(encryptedUserInfo));
  const cookiesMaxAge = dayjs(preUserInfo.maxAgeUnix * 1000).unix() - dayjs().unix();

  // HTTP-Only 쿠키 (userInfo) 설정 - 이전 만료일자 titmestemp로 저장
  const decryptUserInfo = decryptData(decodeURIComponent(userInfo));
  const encryptUserInfo = encryptData({
    ...preUserInfo,
    ...decryptUserInfo,
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
