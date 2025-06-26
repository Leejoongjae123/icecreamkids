import React, { forwardRef, FC, PropsWithChildren, useCallback, FocusEvent, useId } from 'react';
import cx from 'clsx';
import { ITextareaProps } from '@/components/common/Textarea/types';
import { TextareaElem } from '@/components/common/Textarea/elem';

export const Textarea = forwardRef<HTMLTextAreaElement, PropsWithChildren<ITextareaProps>>((props, ref) => {
  const {
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
    onChange,
    ...otherProps
  } = props;

  const uniqueId = useId();

  const handleChange = useCallback(
    (newValue: string) => {
      if (onChange) onChange(newValue);
    },
    [onChange],
  );

  const { onFocus: onFocusProp, onBlur: onBlurProp, ...rest } = otherProps;
  const handleFocus = (e: FocusEvent<HTMLTextAreaElement>) => {
    if (onFocusProp) onFocusProp(e);
  };
  const handleBlur = (e: FocusEvent<HTMLTextAreaElement>) => {
    if (onBlurProp) onBlurProp(e);
  };

  return (
    <div className={cx('item-text type-textarea', itemClassName)} style={style}>
      <div
        className={cx('inner-text', {
          focus: false,
          disabled,
          readOnly,
          error: !!errorMessage,
        })}
      >
        <label htmlFor={`textarea_${uniqueId}`} className="screen_out">
          {label}
        </label>
        <TextareaElem
          id={`textarea_${uniqueId}`}
          value={value}
          maxLength={maxLength}
          disabled={disabled}
          readOnly={readOnly}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          ref={ref}
          {...rest}
        />
        {children}
        {!readOnly && !disabled && maxLength && (
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
});

Textarea.displayName = 'Textarea';
