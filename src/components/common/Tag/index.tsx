import { ITag } from '@/components/common/Tag/types';
import cx from 'clsx';
import React, { forwardRef, ForwardedRef } from 'react';

export const Tag = forwardRef<any, ITag>((props: ITag, ref?: ForwardedRef<any>) => {
  const { type = 'default', text = '' } = props;
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={props.onClick}
      className={cx('tag', type === 'delete' && 'tag-delete')}
      onKeyDown={() => {}}
      style={{ cursor: 'pointer' }}
    >
      {text}
      {type === 'delete' && (
        <button className="btn-delete">
          <span className="ico-comm ico-delete-12">삭제</span>
        </button>
      )}
    </span>
  );
});

Tag.displayName = 'Tag';
