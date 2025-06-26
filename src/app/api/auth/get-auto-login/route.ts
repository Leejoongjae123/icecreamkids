import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const autoLogin = cookies().get('autoLogin')?.value;
  const stopAutoLogging = cookies().get('stopAutoLogging')?.value;

  return NextResponse.json({ message: 'OK', autoLogin, stopAutoLogging }, { status: 200 });
}
