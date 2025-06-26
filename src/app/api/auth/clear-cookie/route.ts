import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { encryptData } from '@/utils';

export async function POST() {
  cookies().set('authToken', '', { maxAge: 0, path: '/' }); // 토큰 삭제
  cookies().set('userInfo', '', { maxAge: 0, path: '/' }); // 유저 정보 삭제
  const autoLogin = cookies().get('autoLogin')?.value; // 자동 로그인 여부
  // 자동 로그인 여부에 따른 구분
  if (autoLogin) {
    const strStopAutoLogging = encryptData('true');
    cookies().set('stopAutoLogging', strStopAutoLogging, { maxAge: 60 * 60 * 24 * 7, path: '/' }); // 자동 로그인 중지 추가
    cookies().set('autoLogin', '', { maxAge: 0, path: '/' }); // 자동 로그인 삭제
  }

  return NextResponse.json({ message: 'OK' }, { status: 200 });
}
