'use client';

import { useState, useEffect, useMemo, Suspense, type ReactNode, useCallback } from 'react';
import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/error/ErrorBoundary';
import { clsx as cx } from 'clsx';
import { usePathname } from 'next/navigation';
import useUserStore from '@/hooks/store/useUserStore';
import { tokenManager } from '@/utils/tokenManager';
import { useWindowScroll } from '@/hooks/useWindowScroll';
import { TopButton } from '@/components/common';
import AppFooter from '../AppFooter';
import AppHeader from '../AppHeader';
import LayoutWithoutSnbSkeleton from './LayoutWithoutSnbSkeleton';

/**
 * * dynamic import 사용을 통해 클라이언트 사이드 렌더링을 보장
 * ! 추가적인 HTTP 요청에 유의
 */
const ClientOnlyContent = dynamic(() => import('./ClientOnlyContent'), { ssr: false });

interface AppLayoutWithoutSNBProps {
  children: ReactNode;
}

function AppLayoutWithoutSNB({ children }: AppLayoutWithoutSNBProps) {
  const { userInfo, clearUserInfo } = useUserStore();
  const pathName = usePathname();

  const [previousPath, setPreviousPath] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // 클라이언트에서만 실행
    setIsHydrated(true);
  }, []);

  // sessionStorage 이전 경로 저장 이후 /preview에서는 이전 경로 유지
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPath = sessionStorage.getItem('previousPath');

      if (pathName !== '/preview') {
        sessionStorage.setItem('previousPath', pathName);
      }

      setPreviousPath(storedPath);
    }
  }, [pathName]);

  const targetPath = pathName === '/preview' ? previousPath || '' : pathName;

  const isWorkBoard = useMemo(() => {
    return targetPath.includes('work-board');
  }, [targetPath]);

  const isWorkBoardMain = useMemo(() => {
    return (
      isWorkBoard &&
      !(
        targetPath.includes('playing-plan') ||
        targetPath.includes('playing-report') ||
        targetPath.includes('student-record')
      )
    );
  }, [isWorkBoard, targetPath]);

  const isStudentRecord = useMemo(() => {
    return targetPath.includes('student-record');
  }, [targetPath]);

  const isActivityCardPageInWorkBoard = useMemo(() => {
    if (isWorkBoard) {
      return targetPath.includes('work-board/playing-plan/activity-card');
    }
    return false;
  }, [targetPath, isWorkBoard]);

  const containerType = useMemo(() => {
    if (isActivityCardPageInWorkBoard) return 'container-type6';
    if (isWorkBoardMain) return 'container-type5';
    if (isWorkBoard) return 'container-type3';
    return '';
  }, [isWorkBoardMain, isWorkBoard, isActivityCardPageInWorkBoard]);

  const docClass = useMemo(() => {
    if (isActivityCardPageInWorkBoard) return 'doc-playplan';
    if (isStudentRecord) return 'doc-observation';
    if (isWorkBoardMain) return 'doc-workmain';
    if (isWorkBoard) return 'doc-workboard';
    return '';
  }, [isActivityCardPageInWorkBoard, isWorkBoardMain, isWorkBoard, isStudentRecord]);

  const docScreenOutTitle = useMemo(() => {
    if (isActivityCardPageInWorkBoard) return '놀이 카드';
    if (isWorkBoardMain) return '업무보드 메인';
    if (isWorkBoard) return '업무보드';
    return '';
  }, [isWorkBoardMain, isWorkBoard, isActivityCardPageInWorkBoard]);

  const callChkeckToken = useCallback(async () => {
    // 로그인 객체가 있을 경우만 실행
    if (userInfo) {
      const result = await tokenManager.getCheckToken();
      let isLogin = false;
      if (result) {
        isLogin = result.state;
      }
      if (!isLogin) clearUserInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isHydrated) callChkeckToken();
  }, [callChkeckToken, isHydrated]);

  /* 스크롤 이동 */
  const [scrollDirection, setScrollDirection] = useState('');
  const [hideHeader, setHideHeader] = useState<boolean>(false);
  const [isHeaderFixed, setIsHeaderFixed] = useState<boolean>(false);
  const { clearHideTimeout, setHideTimeout } = useWindowScroll({
    scrollDirection,
    hideHeader,
    setScrollDirection,
    setHideHeader,
    setIsHeaderFixed,
  });

  /**
   * * ErrorBoundary fallback
   * ! ErrorBoundary는 Suspense보다 먼저 렌더링되므로, Suspense fallback은 ErrorBoundary에 포함되어야 함
   */
  const errorFallback = <div>AppLayoutWithoutSNB 컴포넌트상 Error Boundary</div>;
  return (
    <div
      className={cx(
        `container-doc ${containerType}`,
        scrollDirection === 'up' && 'sticky',
        hideHeader && 'sticky-hide',
        isHeaderFixed && 'fixed',
      )}
    >
      <AppHeader
        scrollDirection={scrollDirection}
        clearHideTimeout={clearHideTimeout}
        setHideTimeout={setHideTimeout}
      />
      <main className={cx('doc-main', `${docClass}`)}>
        <ErrorBoundary fallback={errorFallback}>
          <Suspense fallback={<LayoutWithoutSnbSkeleton />}>
            <h2 className="screen_out">{docScreenOutTitle}</h2>
            <section className="inner-main">
              <ClientOnlyContent>{children}</ClientOnlyContent>
              {/* floating quick menu */}
              <TopButton isIndependent={false} />
              {/* floating quick menu */}
            </section>
          </Suspense>
        </ErrorBoundary>
      </main>
      <AppFooter />
    </div>
  );
}

export default AppLayoutWithoutSNB;
