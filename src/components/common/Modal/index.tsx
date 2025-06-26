import cx from 'clsx';
import React, { ReactNode } from 'react';
import { IModal } from '@/components/common/Modal/types';

export function Modal({
  isOpen,
  isClear,
  btns,
  className,
  hiddenTitle = false,
  message,
  description,
  size = 'small',
  onConfirm,
  onCancel,
  children,
}: IModal) {
  const handleOk = async () => {
    if (onConfirm) {
      await onConfirm();
    }
  };
  const handleCancel = async () => {
    if (onCancel) {
      await onCancel();
    }
  };

  return isOpen ? (
    <div className={cx('modal-layer', `type-${size}`, isClear && `type-clear`, className)}>
      <div className="inner-modal">
        {hiddenTitle ? (
          <strong className="screen_out">{message}</strong>
        ) : (
          <div className="modal-head">
            <strong className="tit-txt">{message}</strong>
          </div>
        )}
        <div className="modal-body">
          {description && <p className="content-area">{description}</p>}
          {children}
        </div>
        {btns ? (
          <div className="modal-foot">
            <div className="group-btn">
              {btns.map((btn, index) => (
                <button
                  key={btn.title}
                  className={cx(`btn btn-${btn.color} btn-${btn.size ? btn.size : 'medium'}`)}
                  onClick={btn.onClick === 'handleCancel' ? handleCancel : handleOk}
                >
                  {btn.icon && <span className={cx('ico-comm', `ico-${btn.icon}`)} />}
                  {btn.title}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <button className="btn btn-icon btn-close" onClick={handleCancel}>
          <span className="ico-comm ico-close-20">닫기</span>
        </button>
      </div>
    </div>
  ) : null;
}
