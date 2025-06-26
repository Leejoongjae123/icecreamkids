import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const authToken = cookies().get('authToken')?.value;
  const encryptedUserInfo = cookies().get('userInfo')?.value;

  if (!authToken || !encryptedUserInfo) {
    return NextResponse.json({ message: 'NONE' }, { status: 200 });
  }

  return NextResponse.json({ message: 'OK' }, { status: 200 });
}
