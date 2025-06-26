import React, { useCallback, useMemo } from 'react';

import cx from 'clsx';

enum Direction {
  FIRST = 'FIRST',
  PREV = 'PREV',
  NEXT = 'NEXT',
  LAST = 'LAST',
}

export interface PaginationProps {
  /**
   * 전체 페이지 수
   */
  totalPage: number;
  /**
   * 현재 페이지
   */
  currentPage: number;
  /**
   * 화면에 나타날 페이지 개수 ( 1 ~ 몇개 )
   */
  perPage?: number;
  /**
   * 콜백
   */
  onClick: (page: number) => void;
}

export function Pagination({ perPage = 10, onClick, currentPage, totalPage }: PaginationProps) {
  const currentGroupIndex = Math.ceil(currentPage / perPage);

  const displayPages = useMemo(() => {
    const lastPage = Math.min(currentGroupIndex * perPage, totalPage);
    const firstPage = Math.max(lastPage - perPage + 1, 1);

    const pages: number[] = [];
    for (let i = firstPage; i <= lastPage; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentGroupIndex, perPage, totalPage]);

  const handleDirectionClick = useCallback(
    (direction: Direction) => {
      switch (direction) {
        case Direction.FIRST:
          onClick(1);
          break;
        case Direction.PREV:
          onClick(Math.max(currentPage - 1, 1));
          break;
        case Direction.NEXT:
          onClick(Math.min(currentPage + 1, totalPage));
          break;
        case Direction.LAST:
          onClick(totalPage);
          break;
        default:
          break;
      }
    },
    [onClick, currentPage, totalPage],
  );

  const handlePageClick = (page: number) => {
    onClick(page);
  };

  return (
    <div className={cx('item_paging')}>
      <button
        type="button"
        className={cx('btn_first')}
        disabled={currentPage === 1}
        onClick={() => handleDirectionClick(Direction.FIRST)}
      >
        <span className="ico_comm ico_arr_l_g2">맨 처음</span>
      </button>
      <button
        type="button"
        className={cx('btn_prev')}
        disabled={currentPage === 1}
        onClick={() => handleDirectionClick(Direction.PREV)}
      >
        <span className="ico_comm ico_arr_l_g1">이전</span>
      </button>

      {displayPages.map((p) => {
        const active = currentPage === p;
        return (
          <button type="button" key={p} className={cx('link_page', { active })} onClick={() => handlePageClick(p)}>
            {p}
          </button>
        );
      })}
      <button
        type="button"
        className={cx('btn_next')}
        disabled={currentPage === totalPage}
        onClick={() => handleDirectionClick(Direction.NEXT)}
      >
        <span className="ico_comm ico_arr_l_g1 type_reverse">다음</span>
      </button>
      <button
        type="button"
        className={cx('btn_last')}
        disabled={currentPage === totalPage}
        onClick={() => handleDirectionClick(Direction.LAST)}
      >
        <span className="ico_comm ico_arr_l_g2 type_reverse">맨 끝</span>
      </button>
    </div>
  );
}
