import React, { forwardRef } from 'react';
import cx from 'clsx';
import { IButton } from '@/components/common/Button/types';

export const Button = forwardRef<HTMLButtonElement, IButton>(
  (
    { color = 'primary', type = 'button', className, size = 'medium', icon, iconAfter, children, ...props }: IButton,
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cx('btn', `btn-${size}`, `btn-${color}`, className && `${className}`)}
        {...props}
      >
        {icon && <span className={cx('ico-comm', `ico-${icon}`)} />}
        {children}
        {iconAfter && <span className={cx('ico-comm', `ico-${iconAfter}`)} />}
      </button>
    );
  },
);

Button.displayName = 'Button';
