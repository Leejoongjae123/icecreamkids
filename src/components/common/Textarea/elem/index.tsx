'use client';

import React, { forwardRef, ChangeEvent, CompositionEvent, useCallback, useEffect, useState } from 'react';
import { ITextAreaElemProps } from '@/components/common/Textarea/elem/types';

export const TextareaElem = forwardRef<HTMLTextAreaElement, ITextAreaElemProps>(
  ({ value = '', onChange = () => {}, libProps = {}, placeholder, maxLength, ...otherProps }, ref) => {
    const { onChange: onChangeLib = () => {}, ...otherLibProps } = libProps;
    const [isComposing, setIsComposing] = useState<boolean>(false); // 한글 입력 IME 관련 이슈 처리용
    const [internalValue, setInternalValue] = useState<string>(value);

    useEffect(() => {
      if (!isComposing && value !== internalValue) {
        setInternalValue(value);
      }
    }, [value, isComposing, internalValue]);

    const handleChange = useCallback(
      (e: ChangeEvent<HTMLTextAreaElement>) => {
        let newValue = e.target.value;
        if (!isComposing && typeof maxLength === 'number') {
          newValue = Array.from(newValue).slice(0, maxLength).join('');
        }
        setInternalValue(newValue);
        if (!isComposing) {
          onChange(newValue);
        }
        onChangeLib(e);
      },
      [isComposing, maxLength, onChange, onChangeLib],
    );

    const handleCompositionStart = useCallback((e: CompositionEvent<HTMLTextAreaElement>) => {
      setIsComposing(true);
    }, []);

    const handleCompositionEnd = useCallback(
      (e: CompositionEvent<HTMLTextAreaElement>) => {
        setIsComposing(false);
        let newValue = e.currentTarget.value;
        if (typeof maxLength === 'number') {
          newValue = Array.from(newValue).slice(0, maxLength).join('');
        }
        setInternalValue(newValue);
        onChange(newValue);
        onChangeLib(e as unknown as ChangeEvent<HTMLTextAreaElement>);
      },
      [maxLength, onChange, onChangeLib],
    );

    const textareaProps = isComposing ? { defaultValue: internalValue } : { value: internalValue };

    return (
      <textarea
        ref={ref}
        className="inp-text"
        placeholder={placeholder ?? '입력해 주세요.'}
        onChange={handleChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        {...textareaProps}
        {...otherProps}
        {...otherLibProps}
      />
    );
  },
);

TextareaElem.displayName = 'TextareaElem';
