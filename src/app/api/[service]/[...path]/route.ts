import { type NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { decryptData } from '@/utils';
import { IP_ADDRESS } from '@/const';
import { isPublicPreview } from '@/utils/publicPreview';
// import { IPathCondition } from '@/app/api/[service]/[...path]/types';

const allowedServices = ['core', 'file', 'member', 'message'];

// const PUBLIC_PREVIEW_PATHS: IPathCondition[] = [
//   {
//     required: ['public-url-item'],
//     optional: ['detailed-info', 'recommand-items-for-detailed-info'],
//   },
//   {
//     required: ['v2', 'drive-items', 'presigned-urls'],
//   },
// ];

// const isPublicPreview = (path: string[] | undefined): boolean => {
//   if (!path) return false;

//   return PUBLIC_PREVIEW_PATHS.some(({ required, optional }) => {
//     const hasRequired = required.every((key) => path.includes(key));
//     const hasOptional = optional ? optional.some((key) => path.includes(key)) : true;
//     return hasRequired && hasOptional;
//   });
// };

async function handleRequest(request: NextRequest, params: { service: string; path?: string[] }) {
  const { service, path } = params;

  const clientIP = process.env.NODE_ENV === 'development' ? IP_ADDRESS : headers().get('x-forwarded-for') || IP_ADDRESS; // 기본 IP

  const authToken = cookies().get('authToken')?.value;
  const userInfo = cookies().get('userInfo')?.value;

  // `/accounts` 요청 예외 처리: authToken, userInfo가 없어도 진행
  const isAccountsRequest = path?.includes('open-api');

  // /auth/get-check-cookie 쿠키 확인 경우 예외 처리 추가
  const isCheckCookie = path?.includes('/auth/get-check-cookie');

  // et-atomatic-login 요청 예외 처리 추가: 자동 로그인 유무 추가
  const isAutomaticLogin = path?.includes('-auto-login');

  // console.log(
  //   `Log > api route < authToken : ${authToken}, userInfo : ${userInfo}, isAccountsRequest : ${isAccountsRequest}, ip: ${clientIP}`,
  // );
  if (
    !isAccountsRequest &&
    !isCheckCookie &&
    !isAutomaticLogin &&
    (!allowedServices.includes(service) || !authToken || !userInfo) &&
    !isPublicPreview(path)
  ) {
    // console.log(`Log > api route 401`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log(`api route path : ${path}`);
  let PROFILE_ID: number | undefined;
  let ACCOUNT_ID: number | undefined;

  if (!isAccountsRequest && userInfo) {
    try {
      const decodedUserInfo = decodeURIComponent(userInfo);
      const decryptUserInfo = decryptData(decodedUserInfo);

      if (decryptUserInfo && typeof decryptUserInfo === 'object') {
        PROFILE_ID = Number(decryptUserInfo.id);
        ACCOUNT_ID = Number(decryptUserInfo.accountId);
      } else {
        console.error('Decryption failed: Invalid userInfo format');
      }
    } catch (error) {
      console.error('Decryption failed:', error);
    }
  }

  const subPath = path ? path.join('/') : '';
  const urlSearchParams = new URLSearchParams(request.nextUrl.search);

  if (PROFILE_ID !== undefined && ACCOUNT_ID !== undefined) {
    urlSearchParams.set('profileId', PROFILE_ID.toString());
    urlSearchParams.set('accountId', ACCOUNT_ID.toString());
  }

  const queryString = urlSearchParams.toString() ? `?${urlSearchParams.toString()}` : '';
  const destination = `${process.env.NEXT_PUBLIC_API_URL}/${service}/${subPath}${queryString}`;

  const reqHeaders = Object.fromEntries(request.headers.entries());

  if (authToken) {
    reqHeaders.Authorization = `Bearer ${authToken}`;
  }
  reqHeaders.ip = clientIP;

  let body: string | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const requestBody = await request.text();
    if (requestBody) {
      try {
        const parsedBody = JSON.parse(requestBody);
        if (PROFILE_ID !== undefined && ACCOUNT_ID !== undefined) {
          parsedBody.profileId = PROFILE_ID;
          parsedBody.accountId = ACCOUNT_ID;
        }
        body = JSON.stringify(parsedBody);
        reqHeaders['content-length'] = Buffer.byteLength(body).toString();
      } catch (error) {
        console.error('Body Parsing Error:', error);
        body = undefined;
      }
    }
  }

  const init: RequestInit = {
    method: request.method,
    headers: reqHeaders,
    body: body || undefined,
  };

  try {
    const response = await fetch(destination, init);
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }
    const data = await response.text();
    return new NextResponse(data, { status: response.status });
  } catch (err) {
    console.error('API Proxy Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { service: string; path?: string[] } }) {
  return handleRequest(request, params);
}

export async function POST(request: NextRequest, { params }: { params: { service: string; path?: string[] } }) {
  return handleRequest(request, params);
}

export async function PUT(request: NextRequest, { params }: { params: { service: string; path?: string[] } }) {
  return handleRequest(request, params);
}

export async function DELETE(request: NextRequest, { params }: { params: { service: string; path?: string[] } }) {
  return handleRequest(request, params);
}
