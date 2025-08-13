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

    // 실제 외부 API 호출 (Type B)
    const response = await fetch(process.env.NEXT_PUBLIC_DRIVE_URL + '/ai/v2/report/type-b/create-record', {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'External API call failed', details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
