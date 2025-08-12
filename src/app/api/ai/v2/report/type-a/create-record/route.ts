import { NextRequest, NextResponse } from 'next/server';

interface ReportCaption {
  title: string;
  contents: string;
}

interface CreatePlayRecordRequest {
  profileId: number;
  subject: string;
  age: number;
  startsAt: string;
  endsAt: string;
  reportCaptions: ReportCaption[];
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePlayRecordRequest = await request.json();
    
    // 필수 필드 검증
    const { profileId, subject, age, startsAt, endsAt, reportCaptions } = body;
    
    if (!profileId || !subject || age === undefined || !startsAt || !endsAt || !reportCaptions) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('놀이기록 생성 요청:', body);

    // 실제 외부 API 호출
    const response = await fetch(process.env.NEXT_PUBLIC_DRIVE_URL + '/ai/v2/report/type-a/create-record', {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('외부 API 호출 실패:', errorText);
      return NextResponse.json(
        { error: 'External API call failed', details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('놀이기록 생성 성공:', result);
    console.log('외부 API 응답 구조 확인:', JSON.stringify(result, null, 2));

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('놀이기록 생성 중 오류:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
