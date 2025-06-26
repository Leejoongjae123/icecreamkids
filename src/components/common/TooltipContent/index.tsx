import React from 'react';
import cx from 'clsx';
import { ITooltipBase } from '@/components/common/TooltipContent/types';

export function TooltipContent({ colorType, sizeType, position, title, sub, contents, isShow }: ITooltipBase) {
  const iconClass = cx('ico-comm', {
    'ico-tail-dark': sizeType === 'small' && colorType === 'dark',
    'ico-tail': sizeType === 'small' && colorType !== 'dark',
  });

  return (
    <div
      className={cx('tooltip-layer', {
        show: isShow,
        'type-small': sizeType === 'small',
        'type-dark': sizeType === 'small' && colorType === 'dark',
        [`type-${position}`]: sizeType === 'small' && !!position,
      })}
    >
      {iconClass && <span className={iconClass} />}
      <div className="inner-tooltip">
        {sizeType !== 'small' && title && <strong className="tit-tooltip">{title}</strong>}
        {sizeType !== 'small' && sub && <span className="sub-tooltip">{sub}</span>}
        <p className="txt-tooltip">{contents}</p>
      </div>
    </div>
  );
}

TooltipContent.displayName = 'TooltipContent';
export default TooltipContent;
