import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

type RouteParams = {
  params: Promise<{ id?: string }>
};

export async function GET(request: NextRequest, ctx?: RouteParams) {
  // 규칙 준수: params 비동기 처리 (동적 세그먼트가 없는 경우 안전하게 처리)
  const safeParams: Promise<{ id?: string }> = ctx?.params ?? Promise.resolve({});
  const { id } = await safeParams;

  // 규칙 준수: supabase 클라이언트 생성 (이번 라우트에서는 사용하지 않음)
  const supabase = await createClient();
  void supabase;

  const searchParams = request.nextUrl.searchParams;
  const articleId = searchParams.get('articleId');

  if (!articleId) {
    return NextResponse.json(
      {
        success: false,
        message: 'articleId가 필요합니다.',
      },
      { status: 400 }
    );
  }

  // 외부 API 프록시 호출: GET /file/v1/play-record/{id}?includes=smartFolderItem
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://3.37.227.162:8080';
  const url = `${baseUrl}/file/v1/play-record/${encodeURIComponent(articleId)}?includes=smartFolderItem`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { accept: '*/*' },
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return NextResponse.json(
        {
          success: false,
          message: '원격 API 호출 실패',
          status: res.status,
          details: text,
        },
        { status: 200 }
      );
    }

    const payload = await res.json();
    const record: any = (payload && typeof payload === 'object' && 'result' in payload) ? (payload as any).result : payload;

    // stringData(JSON 문자열)에 저장된 리포트 본문을 파싱하여 반환
    let parsed: unknown = undefined;
    try {
      if (record && typeof record === 'object' && 'stringData' in record && typeof (record as any).stringData === 'string') {
        parsed = JSON.parse((record as any).stringData as string);
      }
    } catch {}

    return NextResponse.json(
      {
        success: true,
        data: parsed ?? {},
      },
      { status: 200 }
    );
  } catch (_e) {
    return NextResponse.json(
      {
        success: false,
        message: '요청 처리 중 오류가 발생했습니다.',
      },
      { status: 200 }
    );
  }
}


