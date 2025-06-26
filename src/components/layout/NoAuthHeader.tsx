import React from 'react';
import AppLogo from '@/components/layout/AppLogo';
import { Button } from '@/components/common';
import { useRouter } from 'next/navigation';
import { prefix } from '@/const';

const NoAuthHeader = () => {
  const router = useRouter();
  const handleRoute = (href: string) => {
    router.push(href);
  };

  return (
    <header className="doc-header">
      <div className="inner-header">
        <AppLogo />
        <div className="util-header">
          <Button size="medium" color="black" onClick={() => handleRoute(prefix.signup)}>
            회원가입
          </Button>
          <Button size="medium" color="line" onClick={() => handleRoute(prefix.login)}>
            로그인
          </Button>
        </div>
      </div>
    </header>
  );
};

export default NoAuthHeader;
