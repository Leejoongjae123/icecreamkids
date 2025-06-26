import { useLoadingStore } from '@/hooks/store/useLoadingStore';
import { Loader } from '@/components/common';
import type React from 'react';

export default function GlobalLoading() {
  const isLoading = useLoadingStore((state) => state.isLoading);

  if (!isLoading) return null;

  return (
    <div
      style={{
        position: 'fixed',
        width: '100%',
        height: '100%',
        backgroundColor: 'black',
        opacity: 0.4,
        zIndex: 3000,
        paddingTop: '50%',
      }}
    >
      <Loader />
    </div>
  );
}
