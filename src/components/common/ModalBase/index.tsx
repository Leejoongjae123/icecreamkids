import cx from 'clsx';
import React, { PropsWithChildren, useEffect } from 'react';
import { IModal } from '@/components/common/ModalBase/types';
import { Button } from '@/components/common/Button';

export const ModalBase = ({
  isOpen,
  isClear,
  disabled,
  className,
  hiddenTitle = false,
  message,
  description,
  plusButton,
  size = 'small',
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
  children,
}: PropsWithChildren<IModal>) => {
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
    <>
      <style>
        {/* 모달 켜짐 시 스크롤 비활성화 */}
        {`
        body {
          overflow: hidden;
        }
      `}
      </style>
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
          <div className="modal-foot">
            <div className="group-btn">
              {cancelText && (
                <Button
                  color="gray"
                  className={cx((size === 'small' && 'btn-small') || 'btn-medium')}
                  onClick={handleCancel}
                >
                  {cancelText}
                </Button>
              )}
              {plusButton && plusButton}
              {onConfirm && (
                <Button
                  color="primary"
                  className={cx((size === 'small' && 'btn-small') || 'btn-medium')}
                  onClick={handleOk}
                  disabled={disabled}
                >
                  {confirmText}
                </Button>
              )}
            </div>
          </div>
          <button className="btn btn-icon btn-close" onClick={handleCancel}>
            <span className="ico-comm ico-close-20">닫기</span>
          </button>
        </div>
      </div>
    </>
  ) : null;
};

ModalBase.displayName = 'Modal';
export default ModalBase;
