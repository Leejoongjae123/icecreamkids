'use client';

import { ModalBase } from '@/components/common';
import React, { ReactNode } from 'react';
import Image from 'next/image';
import cx from 'clsx';
import { IPreviewImageModal } from './types';

const PreviewImage: React.FC<IPreviewImageModal> = ({ isOpen, onCancel, preview }): ReactNode => {
  return (
    <ModalBase
      isOpen={isOpen}
      className={cx('modal-material', isOpen && 'expand')}
      size="large"
      onCancel={() => {
        onCancel?.();
      }}
    >
      <div className="wrap-detail">
        <div className="inner-detail">
          <div className="content-detail" id="preview-layer">
            <div className="innet-content">
              <div className="body-content">
                <div className="inner-body">
                  <Image
                    src={preview?.fullImageUrl}
                    alt={preview ? preview.title : 'no image'}
                    style={{ maxHeight: 'initial !important' }}
                    width={1200}
                    height={900}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalBase>
  );
};

export default PreviewImage;
