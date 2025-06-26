'use client';

import { useRouter } from 'next/navigation';
import { Loader } from '@/components/common';
import { useQueryClient } from '@tanstack/react-query';

const PlanListPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  queryClient.clear();
  setTimeout(() => {
    router.replace('/work-board/playing-plan');
  }, 300);
  return <Loader hasOverlay loadingMessage="놀이 계획으로 이동 중입니다." />;
};

export default PlanListPage;
