import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { tokenManager } from '@/utils/tokenManager';
import { prefix } from '@/const';

// (noAuth) 폴더 하위에 있는 페이지들의 경로 배열
const NO_AUTH_PATHS = [
  '/login',
  '/introduce',
  '/work-board',
  '/signup',
  '/findPassword',
  '/terms',
  '/error',
  '/preview',
  '/example',
  '/s3', // s3 파일
];
const apiVersions = ['/v1', '/v2', 'auth']; // v1, v2: BE API, auth: 내부 프록시

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // API 요청이면 미들웨어를 통과
  // if (pathname.includes('/v2') || pathname.includes('/v1')) {
  //   return NextResponse.next();
  // }

  if (apiVersions.some((version) => pathname.includes(version))) {
    return NextResponse.next();
  }

  // /favicon.png 제외
  if (pathname === '/favicon.png') {
    return NextResponse.next();
  }

  const userInfoCookie = request.cookies.get('authToken');

  // 쿠키의 value를 가져와서 비교
  // const userInfoValue = userInfoCookie?.value || null;
  // 쿠키 값이 "null"일 경우 null로 처리
  const userInfo = !!userInfoCookie;
  // const userInfo = userInfoValue && userInfoValue !== 'null' ? JSON.parse(decodeURIComponent(userInfoValue)) : null;

  /**
   * * 업무보드 페이지 접근 권한 체크
   * ! [정책] 업무보드 메인페이지는 로그인 하지 않은 사용자도 접근 가능 / 단, work-board 하위 페이지는 로그인한 사용자만 접근 가능
   * TODO: refactoring 필요
   */

  const isProtectedWorkboardPath = (path: string) => {
    return path.startsWith('/work-board/') && !NO_AUTH_PATHS.includes(path);
  };

  // 메인 work-board 페이지는 항상 접근 가능
  if (pathname === '/work-board') {
    return NextResponse.next();
  }

  // 보호된(로그인 정보가 필요한) work-board 하위 경로에 대한 처리 > 로그인 하지않고 로그인 정보가 필요한 페이지로 접근시 로그인 페이지로 리다이렉트
  if (isProtectedWorkboardPath(pathname) && !userInfo) {
    return NextResponse.redirect(new URL(prefix.login, request.url));
  }

  /**
   * * 기존 미들웨어 로직
   */
  // noAuth 페이지 체크
  const isNoAuthPage = NO_AUTH_PATHS.some((path) => pathname.startsWith(path));
  // 서비스 소개 페이지로 리다이렉트
  if (pathname === prefix.root) {
    return NextResponse.redirect(new URL(prefix.introduce, request.url));
  }

  // 로그인 상태일 때
  if (userInfo) {
    if (pathname === prefix.login) {
      return NextResponse.redirect(new URL(prefix.root, request.url));
    }
    return NextResponse.next();
  }

  // 로그아웃 상태일 때 로그인,회원가입 페이지 유지
  if (!userInfo && isNoAuthPage) {
    return NextResponse.next();
  }

  // // 인증되지 않은 사용자는 로그인 페이지로 내부 경로 매핑
  if (!userInfo && !isNoAuthPage) {
    return NextResponse.redirect(new URL(prefix.login, request.url));
  }

  return NextResponse.next();
}
// export const config = {
//   matcher: ['/((?!_next/static|_next/image|favicon.ico|images|fonts).*)'], // 정적 리소스 제외
// };
export const config = {
  matcher: ['/((?!v1|!v2|_next/static|_next/image|favicon.jpg|images|video|fonts).*)'],
};
