import cx from 'clsx';
import React, { type FC, type PropsWithChildren } from 'react';
import type { ITab } from './types';

export const Tab: FC<PropsWithChildren<ITab>> = ({
  fullType = false,
  sizeType = 'medium',
  focusIdx = 0,
  items = [],
  theme = 'undefined',
  className,
  contentsHide = false,
  onChange = () => {},
  commonArea,
  children,
  panelRef,
  onPanelScroll,
}) => {
  const onClickTab = (index: number) => {
    if (focusIdx === index) {
      return;
    }

    onChange(index);
  };

  return (
    <>
      <ul
        className={cx(
          'tab',
          `tab-${sizeType}`,
          theme !== 'undefined' && `tab-${theme}`,
          fullType && 'tab-full',
          className,
        )}
        role="tablist"
      >
        {items.map((item, index) => (
          <li key={item.tabId}>
            <button
              type="button"
              id={item.tabId}
              className="btn-tab"
              role="tab"
              disabled={item.disabled}
              aria-selected={focusIdx === index}
              aria-controls={item.contentsId}
              onClick={() => onClickTab(index)}
            >
              <span className="button__text"> {item?.text ?? '-'} </span>
            </button>
          </li>
        ))}
      </ul>
      {commonArea && commonArea}
      {!contentsHide &&
        items.map((item, index) => (
          <div
            key={item.contentsId}
            id={item.contentsId}
            ref={focusIdx === index && panelRef ? panelRef : null}
            className={cx('tab-panel', {
              active: focusIdx === index,
            })}
            aria-labelledby={item.tabId}
            role="tabpanel"
            onScroll={onPanelScroll}
          >
            {React.Children.toArray(children)[index]}
          </div>
        ))}
    </>
  );
};
