import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { encryptData, decryptData } from '@/utils';
import dayjs from 'dayjs';

export async function POST(req: NextRequest) {
  const { postBody } = await req.json();

  const decryptedData = decryptData(decodeURIComponent(postBody));
  const { phoneNumber, useSession } = decryptedData;

  // 로그인 토큰이 있는 경우 자동 로그인 셋팅
  const authToken = cookies().get('authToken')?.value;
  if (!authToken) {
    return NextResponse.json({ error: 'Not found' }, { status: 400 });
  }

  const today = dayjs();
  const limitDayTiemstemp: number = today.add(90, 'day').unix();
  const encryptedAuthToken = cookies().get('autoLogin')?.value;
  const stopAutoLogging = cookies().get('stopAutoLogging')?.value;
  if (stopAutoLogging) cookies().set('stopAutoLogging', '', { maxAge: 0, path: '/' }); // 자동 로그인 중지 삭제

  // HTTP-Only 쿠키 (autoLogin) 설정
  // 이전 authLogin이 있는 경우
  if (encryptedAuthToken) {
    const todayTiemstemp: number = today.unix();
    const decryptedAuthLogin = decryptData(decodeURIComponent(encryptedAuthToken));
    const limitStemp = decryptedAuthLogin?.limit;
    const maxAgeNum = limitStemp - todayTiemstemp;
    const autoLogin = { token: authToken, limit: limitStemp, phoneNumber };
    const encryptedAuthLogin = encryptData(autoLogin);
    // console.log('갱신', maxAgeNum, decryptedAuthLogin);
    cookies().set('autoLogin', encryptedAuthLogin, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // 프로덕션에서만 secure 활성화
      maxAge: useSession ? undefined : maxAgeNum, // 잔여 시간 입력
      path: '/',
    });
  } else {
    const autoLogin = { token: authToken, limit: limitDayTiemstemp, phoneNumber };
    // console.log('신규', autoLogin);
    const encryptedAuthLogin = encryptData(autoLogin);
    cookies().set('autoLogin', encryptedAuthLogin, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // 프로덕션에서만 secure 활성화
      maxAge: useSession ? undefined : 60 * 60 * 24 * 90, // 기간 90일
      path: '/',
    });
  }

  return NextResponse.json({ message: 'OK' }, { status: 200 });
}
