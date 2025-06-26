import React, { useEffect } from 'react';
import { Button, Checkbox } from '@/components/common';
import { IActionButton, IFloatingMenu } from '@/components/common/FloatingMenu/types';
import cx from 'clsx';

const FloatingMenu = ({
  isChecked = true,
  isAllSelected,
  handleAllSelected,
  floatingActionButton = false,
  actionButton,
  buttonLabel = '파일추가',
  handleButton = () => {},
  renderButton = true,
  filter,
  currentViewMode = 'grid',
  setCurrentViewMode,
}: IFloatingMenu) => {
  useEffect(() => {
    if (setCurrentViewMode) {
      setCurrentViewMode(currentViewMode);
    }
  }, [currentViewMode, setCurrentViewMode]);

  return (
    <div className="filter-content">
      <div className="util-left">
        {isChecked && (
          <Checkbox
            className="item-all"
            name="checkAll00"
            id="checkAll00"
            label="전체선택"
            labHidden
            checked={isAllSelected}
            onChange={handleAllSelected}
          />
        )}
        {floatingActionButton &&
          actionButton?.map((btn: IActionButton) => (
            <Button color="line" size="small" key={btn.key} onClick={btn.action} icon={btn.icon}>
              {btn.label}
            </Button>
          ))}
      </div>
      <div className="util-head">
        <button
          type="button"
          className={cx('btn-view-list', { active: currentViewMode === 'list' })}
          onClick={() => setCurrentViewMode('list')}
        >
          <span className="ico-comm ico-list-20">리스트형</span>
        </button>
        <button
          type="button"
          className={cx('btn-view-grid', { active: currentViewMode === 'grid' })}
          onClick={() => setCurrentViewMode('grid')}
        >
          <span className="ico-comm ico-grid-20">그리드형</span>
        </button>
        {filter && filter}
        {renderButton && (
          <Button size="small" onClick={handleButton}>
            <span className="ico-comm ico-plus-w" />
            {buttonLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default FloatingMenu;
