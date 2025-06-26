'use client';

import { useAlertStore } from '@/hooks/store/useAlertStore';
import { ModalAlert } from 'src/components/common/ModalAlert';

export const AlertProvider = () => {
  const { alert } = useAlertStore();

  return <ModalAlert {...alert} />;
};
