import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const EXTERNAL_URL = 'http://3.37.227.162:8080/file/v1/play-record/photo-frame-list';

export async function GET(_req: Request): Promise<Response> {
  const supabase = await createClient();
  try {
    const res = await fetch(EXTERNAL_URL, {
      method: 'GET',
      headers: { accept: '*/*' },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          status: res.status,
          result: [],
          timestamp: new Date().toISOString(),
        },
        { status: 200 },
      );
    }

    const data = await res.json();
    // data 구조를 그대로 전달 (status, result, timestamp)
    return NextResponse.json(data, { status: 200 });
  } catch (_e) {
    return NextResponse.json(
      {
        status: 500,
        result: [],
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  }
}


