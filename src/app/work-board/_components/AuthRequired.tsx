'use client';

import useUserStore from '@/hooks/store/useUserStore';
import type { ReactNode } from 'react';

interface AuthRequiredProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthRequired({ children, fallback = null }: AuthRequiredProps) {
  const { userInfo } = useUserStore();

  if (!userInfo) {
    return fallback;
  }

  return userInfo ? <div>{children}</div> : '';
}
