import React, { FC, PropsWithChildren } from 'react';
import cx from 'clsx';
import { useSnackbar } from '@/hooks/store/useSnackbarStore';
import { ISnackbar } from '@/components/common/Snackbar/types';
import { useTimeout } from 'ahooks';

const SNACKBAR_MESSAGE_DURATION = 5000;

export const Snackbar: FC<PropsWithChildren<ISnackbar>> = ({ id, message, actionFunc, actionText }: ISnackbar) => {
  const removeSnackbar = useSnackbar((state) => state.remove);

  useTimeout(() => {
    // 컴포넌트가 언마운트되거나 조건이 변경되면 타이머를 자동으로 해제
    removeSnackbar(id);
  }, SNACKBAR_MESSAGE_DURATION);

  const handleDelete = () => {
    removeSnackbar(id);
  };

  return (
    <div id={`${id}_snackbar`} className={cx('snackbar_message_wrap')}>
      <div className={cx('snackbar_message')}>{message}</div>
      <button className="snackbar_action_btn" onClick={actionFunc} style={{ float: 'right' }}>
        <span className="snackbar_action_text">{actionText}</span>
      </button>
      <button onClick={handleDelete}>
        <span className="ico_comm ico_del" />
      </button>
    </div>
  );
};

Snackbar.displayName = 'Snackbar';
export default Snackbar;
