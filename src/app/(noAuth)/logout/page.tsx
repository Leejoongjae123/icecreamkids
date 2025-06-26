'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NoAuthLayout from '@/components/layout/NoAuthLayout';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

const LogoutPage = () => {
  const router = useRouter();
  const { logout } = useAuth(); // store에서 userInfo 삭제

  useEffect(() => {
    logout();
  }, [logout, router]);

  return (
    <NoAuthLayout>
      <div className="wrap-auth wrap-login">
        <Image src="/images/logo_auth@2x.png" width="300" height="57" className="img-logo" alt="kinderboard beta" />
        <h3 className="tit-auth">로그아웃</h3>
      </div>
    </NoAuthLayout>
  );
};

export default LogoutPage;
