import cx from 'clsx';
import { FOOTER_MENU_LIST } from '@/const/menu';
import { IMenuItem } from '@/const/menu/types';

export default function AppFooter() {
  return (
    <footer className="doc-footer">
      <div className="inner-footer">
        <ul className="list-footer">
          {FOOTER_MENU_LIST.map((item: IMenuItem) => (
            <li key={item.id}>
              {item.path ? (
                <a href={item.path} className={cx('link-footer', item?.bold && 'txt_bold')}>
                  {item.name}
                </a>
              ) : (
                // eslint-disable-next-line jsx-a11y/anchor-is-valid
                <a className="link-footer">{item.name}</a>
              )}
            </li>
          ))}
        </ul>
        {/* TODO: markup 푸터 관련사이트 영역 */}
        <dl className="info-footer">
          <dt>주소</dt>
          <dd>경기도 성남시 대왕판교로 660 유스페이스1 B동 604호 </dd>
          <dt>대표전화</dt>
          <dd>02-6909-8553</dd>
          <dt>대표팩스</dt>
          <dd>031-720-9505</dd>
        </dl>
        <small className="copy-footer">&copy; i-Scream Media Corporation. All rights reserved.</small>
      </div>
    </footer>
  );
}
