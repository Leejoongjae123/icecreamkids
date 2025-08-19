import { NextRequest, NextResponse } from 'next/server';
import articleData from '@/app/work-board/(protected)/report/comnponents/articleData';
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

  // 모사: 실제 외부 요청 없이, 로컬 articleData를 반환
  return NextResponse.json(
    {
      success: true,
      data: articleData,
    },
    { status: 200 }
  );
}


