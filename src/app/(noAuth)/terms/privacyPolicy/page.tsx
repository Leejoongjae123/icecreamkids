'use client';

import { Children } from 'react';
import { Button } from '@/components/common';
import { useRouter } from 'next/navigation';
import NoAuthLayout from '@/components/layout/NoAuthLayout';
import { prefix } from '@/const';
import { TERMS_PRIVACY } from '@/const/terms';
import { termsContentItem } from '../type';

export default function Terms() {
  const router = useRouter();

  const renderContent = (content: any[] | string, isSub = false) => {
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
            return <li className="styleNone">{renderContent(item, true)}</li>;
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
      <h3 className="title-type2">개인정보 처리 방침</h3>
      <div className="box-terms">
        <h4 className="screen_out">{TERMS_PRIVACY.title}</h4>
        {renderList(TERMS_PRIVACY)}
      </div>
      <Button onClick={() => router.push(prefix.login)} size="xlarge" color="primary">
        메인 페이지로 이동
      </Button>
    </NoAuthLayout>
  );
}
