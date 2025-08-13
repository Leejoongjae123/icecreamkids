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

  const typeParam = searchParams.get('type');
  const reportType = mapType(typeParam);

  if (!reportType) {
    return NextResponse.json(
      {
        success: false,
        message: '유효한 type 파라미터가 필요합니다. (A | B | C)'
      },
      { status: 400 }
    );
  }

  const offsetWithLimit = searchParams.get('offsetWithLimit') || '0,20';
  const sorts = searchParams.get('sorts') || 'createdAt.desc,name.asc';

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://3.37.227.162:8080';
  const url = `${baseUrl}/file/v1/play-record/theme-item-list?reportType=${encodeURIComponent(
    reportType
  )}&offsetWithLimit=${encodeURIComponent(offsetWithLimit)}&sorts=${encodeURIComponent(sorts)}`;

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


