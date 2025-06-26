import { cookies } from 'next/headers';
import { decryptData } from '@/utils';
import { NextResponse } from 'next/server';
import dayjs from 'dayjs';

export async function GET() {
  const authToken = cookies().get('authToken')?.value;
  const encryptedUserInfo = cookies().get('userInfo')?.value;

  if (!authToken || !encryptedUserInfo) {
    return NextResponse.json({ message: 'No Cookie' }, { status: 401 });
  }
  // 복호화 진행
  // const userInfo = decryptData(decodeURIComponent(encryptedUserInfo));

  return NextResponse.json({ message: 'OK', token: authToken, userInfo: encryptedUserInfo }, { status: 200 });
}
