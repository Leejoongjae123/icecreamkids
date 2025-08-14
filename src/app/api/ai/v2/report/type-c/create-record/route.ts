import { NextRequest, NextResponse } from 'next/server';

interface TypeCImageItem {
  imageDriveItemKey: string;
  userTextForImage: string;
}

type TypeCCreateRecordRequest = {
  profileId: number;
  age: number;
  images: TypeCImageItem[];
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown as TypeCCreateRecordRequest;
    
    // 필수 필드 검증 (Type C 스키마)
    const isValid = Boolean(body && body.profileId && typeof body.age === 'number' && Array.isArray(body.images) && body.images.length > 0);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid request: profileId, age, images[] are required' },
        { status: 400 }
      );
    }

    // 실제 외부 API 호출 (Type C)
    const response = await fetch(String(process.env.NEXT_PUBLIC_DRIVE_URL) + '/ai/v2/report/type-c/create-record', {
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
  } catch (_) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
