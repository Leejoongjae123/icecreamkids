import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import cx from 'clsx';
import { ISplitButton } from '@/components/common/SplitButton/types';
import { DropDownMenu } from '@/components/common/Thumbnail/_components/DropDownMenu';

export const SplitButton = forwardRef<HTMLButtonElement, ISplitButton>(
  ({ color = 'primary', type = 'button', className, size = 'medium', icon, children, options, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const positionRef = useRef<{ top: number; left: number }>();
    const dropDownMenuRef = useRef<HTMLDivElement>(null);
    if (buttonRef?.current) {
      const rect = buttonRef?.current?.getBoundingClientRect();

      positionRef.current = {
        top: (rect?.bottom as number) + window.scrollY + 1,
        left: (rect?.left as number) + window.scrollX,
      };
    }

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        if (!buttonRef.current?.contains(target) && !dropDownMenuRef.current?.contains(target)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }, []);

    const handleDropdown = () => {
      setIsOpen(false);
    };

    return (
      <>
        <button
          ref={buttonRef}
          type={type}
          className={cx('btn', `btn-${size}`, `btn-${color}`, className && `${className}`)}
          style={{ position: 'relative', paddingRight: '38px' }}
          {...props}
          onClick={() => setIsOpen(!isOpen)}
        >
          {icon && <span className={cx('ico-comm', `ico-${icon}`)} />}
          {children}
          <div
            style={{
              position: 'absolute',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '24px',
              height: '34px',
              right: '0px',
              borderLeft: '1px solid #ffffff',
            }}
          >
            <span style={{ transform: 'rotate(90deg)' }}>&rsaquo;</span>
          </div>
        </button>
        {isOpen &&
          createPortal(
            <DropDownMenu
              ref={dropDownMenuRef}
              show={isOpen}
              top={positionRef.current?.top}
              left={positionRef.current?.left}
              list={options}
              onDropDown={handleDropdown}
            />,
            document.body,
          )}
      </>
    );
  },
);

SplitButton.displayName = 'Button';
