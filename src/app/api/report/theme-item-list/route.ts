import { NextRequest, NextResponse } from 'next/server';
import type { ThemeItemListResponse, ReportTypeABC } from './types';

const mapType = (typeParam: string | null): ReportTypeABC | null => {
  if (!typeParam) {
    return null;
  }
  const upper = typeParam.toUpperCase();
  if (upper === 'A') {
    return 'TypeA';
  }
  if (upper === 'B') {
    return 'TypeB';
  }
  if (upper === 'C') {
    return 'TypeC';
  }
  return null;
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // 타입 파라미터는 선택적으로 처리 (타입 무관하게 모든 테마 가져오기)
  const typeParam = searchParams.get('type');
  const reportType = mapType(typeParam);

  const offsetWithLimit = searchParams.get('offsetWithLimit') || '0,20';
  const sorts = searchParams.get('sorts') || 'createdAt.desc,name.asc';

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://3.37.227.162:8080';
  // 타입 무관하게 모든 테마를 가져오도록 URL 구성
  const url = `${baseUrl}/file/v1/play-record/theme-item-list?offsetWithLimit=${encodeURIComponent(offsetWithLimit)}&sorts=${encodeURIComponent(sorts)}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        accept: '*/*'
      }
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return NextResponse.json(
        {
          success: false,
          message: '원격 API 호출 실패',
          status: response.status,
          details: errorText
        },
        { status: response.status }
      );
    }

    const data = (await response.json()) as ThemeItemListResponse;
    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        message: '요청 처리 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}


