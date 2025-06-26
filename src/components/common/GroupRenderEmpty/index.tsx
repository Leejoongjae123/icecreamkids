import cx from 'clsx';
import { Button } from '../Button';

interface EmptyProps {
  errorMessage?: string;
  desc?: string;
  type?: string;
  icon?: string;
  isTitle?: boolean;
  searchValue?: string;
  txtClassName?: string;
  buttonName?: string;
  onClick?: () => void;
}

function GroupRenderEmpty({
  searchValue,
  errorMessage = '데이터가 없습니다.',
  desc,
  type = 'type3',
  icon = 'ico-illust6',
  txtClassName,
  buttonName,
  onClick,
  isTitle = true,
}: EmptyProps) {
  return (
    <div className="group-empty">
      <div className={cx('item-empty', type)}>
        <span className={cx('ico-comm', icon)} style={{ ...(icon !== '' ? '' : { minHeight: '120px' }) }} />
        {searchValue && (
          <strong className="tit-empty">
            검색어 <em className="font-bold">{`"${searchValue}"`}</em>에 대한 검색 결과가 없습니다.
          </strong>
        )}
        {errorMessage ? (
          <strong className={cx('tit-empty', txtClassName)} dangerouslySetInnerHTML={{ __html: errorMessage }} />
        ) : isTitle ? (
          <strong className={cx('tit-empty', txtClassName)}>&nbsp;</strong>
        ) : null}
        {desc ? (
          <p className="txt-empty" dangerouslySetInnerHTML={{ __html: desc }} />
        ) : (
          <p className="txt-empty">&nbsp;</p>
        )}
        {buttonName && (
          <Button type="button" size="medium" color="line" style={{ marginTop: '20px' }} onClick={onClick}>
            {buttonName}
          </Button>
        )}
      </div>
    </div>
  );
}

export default GroupRenderEmpty;
