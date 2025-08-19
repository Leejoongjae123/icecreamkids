import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(
      'http://3.37.227.162:8080/file/v1/play-record/decoration-category-list?contentType=DecorationItem',
      {
        method: 'GET',
        headers: {
          'accept': '*/*',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: '카테고리 목록을 가져오는데 실패했습니다.' },
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
