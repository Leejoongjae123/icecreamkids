import React, { useRef, useLayoutEffect, useEffect } from 'react';
import { IModal } from '@/components/common/ModalBase/types';

export const ModalAlert = ({ isOpen, message, isConfirm, onConfirm, onCancel }: IModal) => {
  // // 모달 활성화시 스크롤 막기
  // useEffect(() => {
  //   if (isOpen) {
  //     document.body.style.overflow = 'hidden';
  //   } else {
  //     document.body.style.overflow = '';
  //   }

  //   // 컴포넌트 언마운트 시 스크롤 다시 활성화
  //   return () => {
  //     document.body.style.overflow = ''; // 기본 상태로 복원
  //   };
  // }, [isOpen]);

  const buttonRef = useRef<HTMLButtonElement>(null);
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

  useLayoutEffect(() => {
    if (isOpen) {
      buttonRef.current?.focus();
    }
  }, [isOpen, isConfirm, buttonRef]);

  useEffect(() => {
    const escKeyModalClose = (e: KeyboardEvent) => {
      if (e.keyCode === 27 || e.key === 'Escape') {
        if (onCancel) {
          onCancel();
        }
      }
    };
    window.addEventListener('keydown', escKeyModalClose);

    return () => {
      window.removeEventListener('keydown', escKeyModalClose);
    };
  }, [onCancel]);

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
      <div>
        <div className="modal-layer modal-alert">
          <div className="inner-modal">
            <div className="modal-body">
              <div className="wrap-txt">
                {message && <strong className="tit-alert" dangerouslySetInnerHTML={{ __html: message }} />}
              </div>
            </div>
            <div className="modal-foot">
              {isConfirm && (
                <button type="button" className="btn-alert" onClick={handleCancel}>
                  취소
                </button>
              )}
              <button ref={buttonRef} type="button" className="btn-alert btn-complete" onClick={handleOk}>
                확인
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  ) : null;
};

ModalAlert.displayName = 'ModalAlert';
export default ModalAlert;
