import React, { forwardRef } from 'react';
import cx from 'clsx';
import { ICheckboxProps } from './types';

export const Checkbox = forwardRef<HTMLInputElement, ICheckboxProps>(
  (
    {
      name,
      id,
      type = 'checkbox',
      label,
      labHidden,
      className,
      isIcoHidden = true,
      isImage = false,
      thumbnail,
      checkNum,
      ...props
    },
    ref,
  ) => {
    return (
      <div className={cx('item-choice', className && `${className}`)}>
        {/* @ts-expect-error: boolean value 허용을 위해 타입 검사 무시 */}
        <input type={type} name={name} id={id} className={cx('inp-comm')} ref={ref} {...props} />
        <label htmlFor={id} className={cx(type === 'radio' ? 'lab-radio' : 'lab-check')}>
          {isIcoHidden && <span className="ico-comm ico-inp-check" />}
          <span
            className={cx(
              { 'txt-item': className === 'type-num' }, // 놀이보고서 타입
              labHidden ? 'screen_out' : type === 'radio' ? 'txt-radio' : 'txt-check',
            )}
          >
            {label}
          </span>
          {checkNum && <span className="num-check">{checkNum}</span>}
          {isImage && <span className="img-thumbnail" style={{ backgroundImage: `url(${thumbnail})` }} />}
        </label>
      </div>
    );
  },
);

// displayName 추가 (개발 도구에서 컴포넌트 식별을 위해)
Checkbox.displayName = 'Checkbox';
