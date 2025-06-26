'use client';

import React, { PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react';
import cx from 'clsx';
import { ITooltip } from '@/components/common/Tooltip/types';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useTooltipStore } from '@/hooks/store/useTooltipStore';

export const Tooltip: React.FC<PropsWithChildren<ITooltip>> = ({
  id,
  type = 'hover',
  children,
  title,
  contents,
  isOpen: controlledIsOpen,
  onToggle,
  className,
  style,
  parentRef,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const isControlled = controlledIsOpen !== undefined;

  const isActive = isControlled ? controlledIsOpen : isOpen;
  const { menuPositions, setMenuPosition, calculateMenuPosition, clearAllTooltips } = useTooltipStore();
  const menuPosition = menuPositions[id];

  const stableClearAllTooltips = useCallback(() => {
    clearAllTooltips();
  }, [clearAllTooltips]);

  useClickOutside(tooltipRef, () => {
    if (type !== 'hover') {
      if (isControlled) {
        onToggle?.(false);
      } else {
        setIsOpen(false);
      }
      setMenuPosition(id, { x: 0, y: 0 });
    }
  });
  useEffect(() => {
    if (!isControlled && !isOpen) {
      stableClearAllTooltips();
    }
  }, [isOpen, isControlled, stableClearAllTooltips]);

  const eventHandlers = {
    hover: {
      onMouseEnter: (e: React.MouseEvent) => {
        setIsOpen(true);
        const pos = calculateMenuPosition(e, { id, parentRef });
        if (pos) setMenuPosition(id, pos);
      },
      onMouseLeave: () => setIsOpen(false),
    },
    toggle: {
      onClick: (e: React.MouseEvent) => {
        setIsOpen((prev) => !prev);
        const pos = calculateMenuPosition(e, { id, parentRef });
        if (pos) setMenuPosition(id, pos);
      },
    },
    click: {
      onClick: (e: React.MouseEvent) => {
        setIsOpen(true);
        const pos = calculateMenuPosition(e, { id, parentRef });
        if (pos) setMenuPosition(id, pos);
      },
    },
    rightClick: {
      onContextMenu: (e: React.MouseEvent) => {
        e.preventDefault();
        if (isControlled) {
          onToggle?.(!isActive);
        } else {
          setIsOpen((prev) => !prev);
        }
        const pos = calculateMenuPosition(e, { id, parentRef });
        if (pos) setMenuPosition(id, pos);
      },
    },
  }[type];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setMenuPosition(id, { x: 0, y: 0 });
    }
  };

  return (
    <div
      className={cx('tooltip-item', { 'tooltip-active': isActive })}
      ref={tooltipRef}
      {...(type === 'hover' ? eventHandlers : {})}
    >
      <button
        className="btn-tooltip"
        tabIndex={0}
        {...(type !== 'hover' ? eventHandlers : {})}
        onKeyDown={handleKeyDown}
      >
        {children}
      </button>
      <div
        className={cx('tooltip-layer', className)}
        style={menuPosition ? { top: menuPosition.y, left: menuPosition.x, ...style } : style}
        id={id}
      >
        {title && <strong className="tooltip-title">{title}</strong>}
        <div className="tooltip-contents">{contents}</div>
        {type === 'click' && (
          <button
            className="btn-close"
            onClick={() => {
              setIsOpen(false);
              setMenuPosition(id, { x: 0, y: 0 });
            }}
            aria-label="Close tooltip"
          >
            <span className="ico_comm ico_del" />
          </button>
        )}
      </div>
    </div>
  );
};

Tooltip.displayName = 'Tooltip';
export default Tooltip;
