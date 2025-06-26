'use client';

import { Children } from 'react';
import { Button } from '@/components/common';
import { useRouter } from 'next/navigation';
import NoAuthLayout from '@/components/layout/NoAuthLayout';
import { TERMS_USE } from '@/const/terms';
import { termsContentItem } from '../type';

export default function Terms() {
  const router = useRouter();

  const renderContent = (content: any[] | string) => {
    if (typeof content === 'string') {
      // eslint-disable-next-line react/no-danger
      return <p className="text-type1" key={content} dangerouslySetInnerHTML={{ __html: content }} />;
    }
    return (
      <ul className="list-terms">
        {Children.toArray(
          content.map((item: any[]) => {
            if (typeof item === 'string') {
              // eslint-disable-next-line react/no-danger
              return <li dangerouslySetInnerHTML={{ __html: item }} />;
            }
            return <li className="styleNone">{renderContent(item)}</li>;
          }),
        )}
      </ul>
    );
  };

  const renderList = ({ contentItem }: { contentItem: termsContentItem[] }) => {
    return contentItem.map((item: termsContentItem) => (
      <div className="wrap-terms" key={item.title}>
        {item.title && <strong className="subtitle-type2">{item.title}</strong>}
        {Children.toArray(
          item.contents.map((childItem) => {
            return renderContent(childItem);
          }),
        )}
      </div>
    ));
  };

  return (
    <NoAuthLayout>
      <h3 className="title-type2">이용 약관</h3>
      <div className="box-terms">
        <h4 className="screen_out">{TERMS_USE.title}</h4>
        {renderList(TERMS_USE)}
      </div>
      <Button onClick={() => router.push('/login')} size="xlarge" color="primary">
        메인 페이지로 이동
      </Button>
    </NoAuthLayout>
  );
}
