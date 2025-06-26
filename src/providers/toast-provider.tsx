'use client';

import cx from 'clsx';
import { Toast } from '@/components/common/Toast';
import { useToast } from '@/hooks/store/useToastStore';

export const ToastProvider = () => {
  const { messages } = useToast();
  return (
    messages &&
    messages.length > 0 && (
      <div className={cx('toast_container')}>
        {messages.map((message, index) => (
          <Toast key={message.id} {...message} toastIdx={index} toastCnt={messages.length} />
        ))}
      </div>
    )
  );
};
