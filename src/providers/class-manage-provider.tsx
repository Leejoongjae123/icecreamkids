'use client';

import ClassManageModalClient from '@/components/modal/classManageMent';
import useClassManageStore from '@/hooks/store/useClassManageStore';

export default function ClassManageModalProvider() {
  const { openModal } = useClassManageStore();
  if (!openModal) return null;

  return <ClassManageModalClient />;
}
