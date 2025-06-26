import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  cookies().set('autoLogin', '', { maxAge: 0, path: '/' }); // 자동 로그인 삭제
  cookies().set('stopAutoLogging', '', { maxAge: 0, path: '/' }); // 자동 로그인 중지 삭제

  return NextResponse.json({ message: 'OK' }, { status: 200 });
}
