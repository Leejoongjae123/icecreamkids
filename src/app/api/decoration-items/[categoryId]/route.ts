import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const supabase = await createClient();
    const { categoryId } = await params;
    const { searchParams } = new URL(request.url);
    
    // 기본값 설정
    const offsetWithLimit = searchParams.get('offsetWithLimit') || '0,20';
    const sorts = searchParams.get('sorts') || 'createdAt.desc,name.asc';

    const response = await fetch(
      `http://3.37.227.162:8080/file/v1/play-record/decoration-item-list?decorationCategoryId=${categoryId}&offsetWithLimit=${encodeURIComponent(offsetWithLimit)}&sorts=${encodeURIComponent(sorts)}`,
      {
        method: 'GET',
        headers: {
          'accept': '*/*',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: '장식 아이템 목록을 가져오는데 실패했습니다.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
