import { NextRequest, NextResponse } from 'next/server';

interface RemoveBackgroundRequest {
  profileId: number;
  driveItemKeys: string[];
  threshold: number;
  responseWithFolder: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: RemoveBackgroundRequest = await request.json();
    
    console.log('배경 제거 API 요청:', body);

    // 실제 외부 API 호출
    const response = await fetch('https://dev.i-screamdrive.com/ai/v1/remove-background', {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('배경 제거 API 오류:', errorText);
      return NextResponse.json(
        { error: '배경 제거에 실패했습니다.' },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('배경 제거 API 응답:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.log('배경 제거 API 처리 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
