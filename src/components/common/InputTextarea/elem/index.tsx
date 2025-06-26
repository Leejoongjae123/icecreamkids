'use client';

import type { ChangeEvent, FC } from 'react';
import type { ITextAreaElemProps } from '@/components/common/Textarea/elem/types';

export const TextareaElem: FC<ITextAreaElemProps> = ({
  onChange = () => {},
  libProps = {},
  placeholder,
  ...otherProps
}) => {
  const { onChange: onChangeLib = () => {}, ...otherLibProps } = libProps;

  const onChangeInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const {
      target: { value: targetValue },
    } = e;

    if (typeof otherProps.maxLength === 'number' && otherProps?.maxLength < targetValue.length) {
      return;
    }

    onChange(targetValue);
    onChangeLib(e);
  };

  return (
    <textarea
      className="inp-text"
      placeholder={placeholder ?? '입력해 주세요.'}
      {...otherProps}
      {...otherLibProps}
      onChange={onChangeInput}
    />
  );
};
