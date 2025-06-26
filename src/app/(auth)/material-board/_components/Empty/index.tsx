import React from 'react';
import { TSlugType } from '@/app/(auth)/material-board/[...slug]/types';

interface EmptyProps {
  category: TSlugType;
  searchKeyword?: string;
}

const Empty = ({ searchKeyword, category }: EmptyProps) => {
  const message = () => {
    if (searchKeyword) {
      return (
        <>
          <strong className="tit-empty">
            검색어 <em className="font-bold">{`"${searchKeyword}"`}</em>에 대한 검색 결과가 없습니다.
          </strong>
          <p className="txt-empty">오타가 없는지 확인하거나 다른 검색어를 사용해 보세요.</p>
        </>
      );
    }

    if (category === 'public') {
      return <strong className="tit-empty">아직 공개된 자료가 없어요.</strong>;
    }

    return (
      <>
        <strong className="tit-empty">자료가 없습니다.</strong>
        <p className="txt-empty" />
      </>
    );
  };

  return (
    <div className="group-empty">
      <div className="item-empty type3">
        <span className="ico-comm ico-illust6" />
        {message()}
      </div>
    </div>
  );
};

export default Empty;
