'use client';

import type { ReactNode } from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

/**
 * * cf) https://ko.react.dev/reference/react/Component#static-getderivedstatefromerror
 * TODO: class component로 변경 예정
 */

function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  return (
    <ReactErrorBoundary
      fallback={fallback}
      onError={(error, errorInfo) => {
        console.error('ErrorBoundary error: ', error, errorInfo);
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}

export default ErrorBoundary;
