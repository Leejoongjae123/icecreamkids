'use client';

import React, { PropsWithChildren, useMemo } from 'react';
import NoAuthHeader from '@/components/layout/NoAuthHeader';
import AppHeader from '@/components/layout/AppHeader';
import { usePathname } from 'next/navigation';
import cx from 'clsx';
import useUserStore from '@/hooks/store/useUserStore';

export default function NoAuthLayout({ children }: PropsWithChildren) {
  const { userInfo } = useUserStore();
  const pathName = usePathname();
  const isWorkBoard = useMemo(() => {
    return pathName.includes('work-board');
  }, [pathName]);

  const containerType = useMemo(() => {
    if (isWorkBoard) return 'container-type5';
    return 'container-type1';
  }, [isWorkBoard]);

  const docClass = useMemo(() => {
    if (pathName.includes('signup') || pathName.includes('login') || pathName.includes('findPassword'))
      return 'doc-auth';
    if (pathName.startsWith('/terms')) return 'doc-terms';
    if (isWorkBoard) return 'doc-workmain';
    return '';
  }, [isWorkBoard, pathName]);

  // const isAuthUser = useMemo(() => {
  //   return !!userInfo;
  // }, [userInfo]);

  return (
    <div className={cx(`container-doc ${containerType}`)}>
      {userInfo ? <AppHeader /> : <NoAuthHeader />}
      <main className={cx(`doc-main`, `${docClass}`)}>
        <section className="inner-main">
          <div className="main-content">
            <article id="mainContent" className="content-article">
              {children}
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
