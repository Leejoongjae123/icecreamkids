import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  
  try {
    const body = await request.json();
    
    const {
      profileId,
      subject,
      age,
      startsAt,
      endsAt,
      photoDriveItemKeys,
      keywords
    } = body;

    // 필수 필드 검증
    if (!profileId || !subject || !age || !photoDriveItemKeys || photoDriveItemKeys.length === 0) {
      return NextResponse.json(
        { 
          error: '필수 필드가 누락되었습니다.',
          details: {
            profileId: !!profileId,
            subject: !!subject,
            age: !!age,
            photoDriveItemKeys: photoDriveItemKeys?.length > 0
          }
        },
        { status: 400 }
      );
    }

    // 외부 LLM API 호출
    const apiUrl = process.env.NEXT_PUBLIC_DRIVE_URL + '/ai/v2/report/type-a/analyze-image';
    
    const requestData = {
      profileId: Number(profileId),
      subject: String(subject),
      age: Number(age),
      startsAt: startsAt || new Date().toISOString().split('T')[0], // 기본값: 오늘
      endsAt: endsAt || new Date().toISOString().split('T')[0], // 기본값: 오늘
      photoDriveItemKeys: Array.isArray(photoDriveItemKeys) ? photoDriveItemKeys : [photoDriveItemKeys],
      keywords: keywords || ''
    };

    console.log('LLM API 요청 데이터:', requestData);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.text();

      return NextResponse.json(
        { 
          error: 'LLM API 호출에 실패했습니다.',
          status: response.status,
          details: errorData 
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('LLM API 응답:', result);

    // LLM API 응답 구조 확인: result.result.contents
    if (result && result.result && result.result.contents) {
      return NextResponse.json({
        success: true,
        data: {
          status: 200,
          result: {
            title: result.result.title || '제목 없음',
            contents: result.result.contents
          },
          timestamp: new Date().toISOString()
        }
      });
    }

    // 직접 result.contents가 있는 경우
    if (result && result.contents) {
      return NextResponse.json({
        success: true,
        data: {
          status: 200,
          result: {
            title: result.title || '제목 없음',
            contents: result.contents
          },
          timestamp: new Date().toISOString()
        }
      });
    }

    // LLM API 응답이 이미 새로운 구조라면 그대로 반환
    if (result && result.success && result.data) {
      return NextResponse.json(result);
    }

    // 다른 형태의 응답이라면 변환
    return NextResponse.json({
      success: true,
      data: {
        status: 200,
        result: {
          title: result.title || '제목 없음',
          contents: result.content || '내용이 없습니다.'
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {

    return NextResponse.json(
      { 
        error: 'API 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
