'use client';

import { type FC, type PropsWithChildren, useId, useState } from 'react';
import cx from 'clsx';
import type { ITextareaProps } from '../Textarea/types';
import { TextareaElem } from './elem';

export const InputTextarea: FC<PropsWithChildren<ITextareaProps>> = ({
  style,
  children,
  errorMessage,
  infoMessage,
  value,
  label = '입력',
  maxLength = 1000,
  itemClassName = '',
  disabled,
  readOnly,
  ...otherProps
}) => {
  const uniqueId = useId();
  const [isFocus, setIsFocus] = useState(false);
  return (
    <div className={cx('item-text type-textarea', itemClassName)} style={style}>
      <div
        className={cx(
          'inner-text',
          isFocus && 'focus',
          disabled && 'disabled',
          readOnly && 'readonly',
          errorMessage && 'error',
        )}
      >
        <label htmlFor={`textarea_${uniqueId}`} className="screen_out">
          {label}
        </label>
        <TextareaElem
          id={`textarea_${uniqueId}`}
          value={value}
          maxLength={maxLength}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          {...otherProps}
        />
        {children}
        {maxLength && (
          <div className="count-text">
            <span className="current-count">
              <span className="screen_out">현재글자수</span>
              <span className="txt-count">{value?.length ?? 0}</span>
            </span>
            /
            <span className="max-count">
              <span className="screen_out">최대글자수</span>
              <span className="txt-count">{maxLength}</span>
            </span>
          </div>
        )}
      </div>
      {infoMessage && <p className="txt-info">{infoMessage}</p>}
      {errorMessage && <p className="txt-error">{errorMessage}</p>}
    </div>
  );
};
