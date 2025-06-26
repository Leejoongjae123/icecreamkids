'use client';

import cx from 'clsx';
import { useSnackbar } from '@/hooks/store/useSnackbarStore';
import { ISnackbar, ISnackbarStore } from '@/components/common/Snackbar/types';
import { Snackbar } from '@/components/common';

export const SnackbarProvider = () => {
  const messages = useSnackbar((state: ISnackbarStore) => state.messages);
  return (
    <div className={cx('snackbar_container')}>
      {messages.map((message: ISnackbar) => (
        <Snackbar key={message.id} {...message} />
      ))}
    </div>
  );
};
