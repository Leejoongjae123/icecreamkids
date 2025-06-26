'use client';

import { FC, PropsWithChildren, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface IErrorProps {
  status: number;
}

export const ErrorPage: FC<PropsWithChildren<IErrorProps>> = ({ status = 500 }) => {
  const matchedErrorInfo = useMemo(() => {
    let errorInfo = {
      imgURL: '',
      title: '이용에 불편을 드려 죄송합니다.',
      desc: '서비스가 일시적으로 중단되었습니다.<br/>잠시 후 다시 한 번 시도해 주세요.',
    };
    switch (status) {
      case 403:
        errorInfo = {
          imgURL: '',
          title: '사용 권한이 없어 요청이 거부되었습니다.',
          desc: '요청한 페이지에 대한 사용 권한이 없어 서버에서 요청을 거부하였습니다.',
        };
        break;
      case 404:
        errorInfo = {
          imgURL: '',
          title: '페이지를 찾을 수 없습니다.',
          desc: '요청한 페이지는 변경 또는 삭제되었거나, 현재 사용할 수 없는 페이지입니다.<br/>입력한 주소가 정확한지 다시 한 번 확인해주세요.',
        };
        break;
      case 503:
        errorInfo = {
          imgURL: '',
          title: '시스템 점검 중입니다.',
          desc: '보다 안정적인 서비스 제공을 위한 작업을 진행 중입니다.<br/>서비스 이용에 불편을 드려 죄송합니다.',
        };
        break;
      default:
        break;
    }

    return errorInfo;
  }, [status]);

  return (
    <div className="container-doc">
      <header>
        <h1 className="screen-out">kinder board</h1>
      </header>
      <main className="doc-main doc-error">
        <div className="inner-main">
          <article className="content-article">
            <strong className="tit-blank">{matchedErrorInfo.title}</strong>
            <p className="txt-blank">
              {matchedErrorInfo.desc.split('<br/>').map((text) => (
                <div key={text}>
                  {text}
                  <br />
                </div>
              ))}
            </p>
          </article>
        </div>
      </main>
    </div>
  );
};
