'use client';

import { useEffect, useState, type ReactNode } from 'react';

interface ClientOnlyContentProps {
  children: ReactNode;
}

export default function ClientOnlyContent({ children }: ClientOnlyContentProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return children;
}
