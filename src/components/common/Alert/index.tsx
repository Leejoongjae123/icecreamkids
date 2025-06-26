import React from 'react';
import { IAlert } from '@/components/common/Alert/types';

export function Alert({ isOpen, message, description, isConfirm, onConfirm, onCancel }: IAlert) {
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
    <div>
      <div className="alert_layer comm_layer">
        <div className="inner_layer">
          <div className="layer_body">
            <div className="wrap_txt">
              <strong className="tit_alert" id="confirmLayerMsg">
                {message}
              </strong>
              {description && (
                <span className="txt_alert" id="confirmLayerTxt">
                  {description}
                </span>
              )}
            </div>
          </div>
          <div className="layer_foot">
            {isConfirm && (
              <button type="button" className="btn_alert" id="confirmLayerBtnCncl" onClick={handleCancel}>
                취소
              </button>
            )}
            <button type="button" className="btn_alert btn_complete" id="confirmLayerBtnOk" onClick={handleOk}>
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;
}
