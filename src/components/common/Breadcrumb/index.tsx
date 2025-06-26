import { SmartFolderTreeResultSmartFolderApiType } from '@/service/file/schemas';
import cx from 'clsx';
import React from 'react';

export interface IBreadcrumbItem {
  label: string;
  href?: string;
  /** 업로드 폴더용 */
  smartFolderApiType?: SmartFolderTreeResultSmartFolderApiType | null;
  id?: string | number | null;
}

export interface IBreadcrumbProps {
  items: IBreadcrumbItem[];
  isFull?: boolean;
  isLastTwoItems?: boolean;
  onNavigate?: (item: IBreadcrumbItem) => void;
}

export const BreadCrumb: React.FC<IBreadcrumbProps> = ({
  items,
  onNavigate,
  isFull = true,
  isLastTwoItems = false,
}) => {
  // 2개 이하일 때는 모든 항목을 표시
  const showFullBreadcrumb = items.length <= 2;

  const firstItem = items[0];
  const prevLastItem = isLastTwoItems && items.length > 1 ? items[items.length - 2] : null;
  const lastItem = items[items.length - 1];
  // isLastTwoItems = false 일 때 첫 번째와 마지막을 제외한 중간 항목들
  // isLastTwoItems = true 일 때 마지막 2객을 제외한 나머지 항목들
  const middleItems = isLastTwoItems ? items.slice(0, items.length - 2) : items.slice(1, items.length - 1);

  const handleItemClick = (item: IBreadcrumbItem) => {
    onNavigate?.(item);
  };

  const renderLink = (item: IBreadcrumbItem) =>
    item?.href ? (
      <button type="button" onClick={() => handleItemClick(item)} className="truncate">
        {item?.label}
      </button>
    ) : (
      <span className="truncate">{item?.label}</span>
    );

  const handleEllipsisClick = () => {
    // "..." 클릭 시, 마지막 항목 바로 이전 항목으로 이동
    if (middleItems.length > 0) {
      const previousItem = middleItems[middleItems.length - 1]; // 마지막 항목 바로 이전 항목
      onNavigate?.(previousItem);
    }
  };

  return (
    <ol className="breadcrumb">
      {isFull ? (
        <>
          {items.map((item, idx) => (
            // fixedCount 이전의 엎단 노출
            <li key={`fixed-${idx + item.label}`} className={cx('link-crumb', !item.href && 'txt-crumb')}>
              {renderLink(item)}
            </li>
          ))}
        </>
      ) : (
        <>
          {!isLastTwoItems && (
            <>
              {/* 첫 번째 항목 */}
              <li key="first-item" className={cx('link-crumb', !firstItem?.href && 'txt-crumb')}>
                {renderLink(firstItem)}
              </li>
            </>
          )}

          {/* 중간 항목들 (3개 이상일 때만 '...' 표시) */}
          {!showFullBreadcrumb && middleItems.length > 0 && (
            <li className={cx('link-crumb')}>
              <button type="button" onClick={handleEllipsisClick}>
                ...
              </button>
            </li>
          )}
          {isLastTwoItems && (
            <>
              {/* 마지막에서 두번째 항목 */}
              {isLastTwoItems && prevLastItem && (
                <li key="prev-last-item" className="link-crumb">
                  {renderLink(prevLastItem)}
                </li>
              )}
              <li key="last-item" className="link-crumb">
                {renderLink(lastItem)}
              </li>
            </>
          )}
          {/* 마지막 항목 */}
          {!isLastTwoItems && items.length > 1 && (
            <li key="last-item" className="link-crumb">
              {renderLink(lastItem)}
            </li>
          )}
        </>
      )}
    </ol>
  );
};
