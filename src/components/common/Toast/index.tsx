import cx from 'clsx';
import { useState } from 'react';
import { IToast, TOAST_MESSAGE_DURATION_OFF } from '@/components/common/Toast/types';

export function Toast({ id, message, toastIdx = 0, toastCnt = 1 }: IToast) {
  const [isOffClass, setIsOffClass] = useState<boolean>(false);
  const positionIdx = toastCnt - toastIdx;
  setTimeout(() => {
    setIsOffClass(true);
  }, TOAST_MESSAGE_DURATION_OFF);
  return (
    <div
      id={`${id}_toast`}
      // className={cx('toast-layer', isOffClass && 'off')}
      className={cx('toast-layer')}
      // style={{ ...(positionIdx > 1 && { bottom: `calc(48px * ${positionIdx})` }) }}
    >
      {message && (
        // eslint-disable-next-line react/no-danger
        <p className="txt-toast" dangerouslySetInnerHTML={{ __html: message }} />
      )}
    </div>
  );
}
