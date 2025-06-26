'use client';

import { useState, useEffect, useMemo, type ReactNode, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AppHeader from '@/components/layout/AppHeader';
import useUserStore from '@/hooks/store/useUserStore';
import AppFooter from '@/components/layout/AppFooter';
import { MaterialBoardGnb } from '@/app/(auth)/material-board/_components/MaterialBoardGnb';
import { MyBoardSnb } from 'src/app/(auth)/my-board/_components/MyBoardSnb';
import { WorkBoardSnb } from 'src/components/workBoard/WorkBoardSnb';
import { clsx as cx } from 'clsx';
import { SnbProvider } from '@/context/SnbContext';
import { useWindowScroll } from '@/hooks/useWindowScroll';
import { TopButton } from '../common';

interface PropsWithChildren {
  children: ReactNode;
  className?: string;
  bgColor?: string;
  isSnb?: boolean; // 놀이보고서 SNB 불필요
  customDocClass?: string; // 업무보드는 화면별 Class가 다름....
  customContainerClass?: string | null; // 업무보드때문에...
  showFooter : boolean | true;
  // docClass?: string;
}
export default function AppLayout({
  children,
  className,
  bgColor,
  isSnb = true,
  customDocClass,
  customContainerClass,
  showFooter
  // ...props
}: PropsWithChildren) {
  const { userInfo } = useUserStore();
  const router = useRouter();
  const pathName = usePathname();

  /* 스크롤 이동 제어 */
  // const [scrollY, setScrollY] = useState(0);
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
   * * 업무보드 > 놀이계획 > 반응형 대응
   */
  const mainRef = useRef<HTMLElement>(null); // 메인 영역에 대한 ref 추가

  const [isSnbOpen, setIsSnbOpen] = useState(false);

  const toggleSnb = () => setIsSnbOpen((prev) => !prev);

  /**
   * * Hydration 체크
   */
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // 클라이언트에서만 실행
    setIsHydrated(true);
    // 워크보드 lnb 펼침 애니메이션을 위한 딜레이
    // 세션 삭제 처리
    if (!pathName.includes('/work-board/student-record')) {
      sessionStorage.removeItem('openWorkboardSnB');
    }
    // 해당 세션이 있는 경우 기본값 변경
    const openWorkboardSnB = sessionStorage.getItem('openWorkboardSnB');
    if (openWorkboardSnB === 'true') setIsSnbOpen(true);
    setTimeout(() => {
      if (openWorkboardSnB !== 'true') {
        setIsSnbOpen(true);
      }
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isHydrated && router && !userInfo) {
      // router.push('/introduce');
    }
  }, [isHydrated, userInfo, router]);

  const [previousPath, setPreviousPath] = useState<string | null>(null);

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
  // const [isOpen, setIsOpen] = useState(false);

  const targetPath = pathName === '/preview' ? previousPath || '' : pathName;

  const isMaterialBoard = useMemo(() => {
    return targetPath.includes('material-board');
  }, [targetPath]);

  const isMyBoard = useMemo(() => {
    return targetPath.includes('my-board');
  }, [targetPath]);

  const isWorkBoard = useMemo(() => {
    return targetPath.includes('work-board');
  }, [targetPath]);

  const isIntroduce = useMemo(() => {
    return targetPath.includes('introduce');
  }, [targetPath]);

  const isStudentRecordPreview = useMemo(() => {
    return /student-record\/preview\/[a-zA-Z0-9]+$/.test(targetPath);
  }, [targetPath]);

  const isWorkBoardHistory = useMemo(() => {
    if (isWorkBoard) {
      return targetPath.includes('recent-work-history');
    }
    return false;
  }, [targetPath, isWorkBoard]);

  const containerType = useMemo(() => {
    if (customContainerClass) return customContainerClass || null;
    if (isMaterialBoard) return 'container-type2';
    if (isWorkBoardHistory) return 'container-type5';
    if (isIntroduce) return 'container-type5';
    if (isWorkBoard) return 'container-type3';
    if (isMyBoard) return 'container-type4';
    return '';
  }, [isMaterialBoard, isMyBoard, isWorkBoard, isIntroduce, customContainerClass, isWorkBoardHistory]);

  const docClass = useMemo(() => {
    if (customDocClass) return customDocClass || null;
    if (targetPath.includes('my-info')) return 'doc-my';
    if (isStudentRecordPreview) return 'doc-observation';
    if (isWorkBoardHistory) return 'doc-history';
    if (isWorkBoard) return 'doc-workboard';
    if (isMaterialBoard) return 'doc-material';
    if (isMyBoard) return 'doc-myboard';
    if (isIntroduce) return 'doc-intro';
    return '';
  }, [
    isMaterialBoard,
    isMyBoard,
    isWorkBoard,
    targetPath,
    isIntroduce,
    customDocClass,
    isWorkBoardHistory,
    isStudentRecordPreview,
  ]);

  const docScreenOutTitle = useMemo(() => {
    if (targetPath.includes('my-info')) return '내 정보';
    if (isStudentRecordPreview) return '업무 보드';
    if (isWorkBoardHistory) return '업무 보드';
    if (isWorkBoard) return '업무 보드';
    if (isMaterialBoard) return '자료 보드';
    if (isMyBoard) return '마이 보드';
    if (isIntroduce) return '서비스 소개';
    return '';
  }, [isMaterialBoard, isMyBoard, isWorkBoard, targetPath, isIntroduce, isWorkBoardHistory, isStudentRecordPreview]);

  // Hydration 체크 후 렌더링
  if (!isHydrated) return null;

  return (
    <div
      className={cx(
        className,
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
      {isWorkBoard ? (
        <SnbProvider value={{ isSnbOpen, toggleSnb }}>
          <main ref={mainRef} className={cx('doc-main', docClass)}>
            <h2 className="screen_out">{docScreenOutTitle}</h2>
            <section className="inner-main">
              {isSnb && (
                <>
                  {!isWorkBoardHistory && !isStudentRecordPreview && (
                    <WorkBoardSnb externalIsOpen={isSnbOpen} externalToggleSnb={toggleSnb} />
                  )}
                  {/* 다른 SNB 컴포넌트들 */}
                </>
              )}
              <div className={cx('main-content', bgColor && `bg-${bgColor}`)}>
                <article id="mainContent" className="content-article">
                  {children}
                </article>
              </div>
              {/* floating quick menu */}
              <TopButton isIndependent={false} />
              {/* floating quick menu */}
            </section>
          </main>
        </SnbProvider>
      ) : (
        <main ref={mainRef} className={cx(`doc-main ${docClass}`)}>
          <h2 className="screen_out">{docScreenOutTitle}</h2>
          <section className="inner-main">
            {isSnb && (
              <>
                {!isWorkBoardHistory && !isStudentRecordPreview && isWorkBoard && (
                  <WorkBoardSnb externalIsOpen={isSnbOpen} />
                )}
                {isMaterialBoard && <MaterialBoardGnb />}
                {isMyBoard && <MyBoardSnb />}
              </>
            )}
            <div className={cx('main-content', bgColor && `bg-${bgColor}`)}>
              <article id="mainContent" className="content-article">
                {children}
              </article>
            </div>
            {/* floating quick menu */}
            <TopButton isIndependent={false} />
            {/* floating quick menu */}
          </section>
        </main>
      )}
      { showFooter && (
          <AppFooter />
      )}
    </div>
  );
}
