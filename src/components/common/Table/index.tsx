import React, { forwardRef, useEffect, useRef, useState } from 'react';
import cx from 'clsx';
import { dateFormat } from '@/lib/dayjs';
import dayjs from 'dayjs';
import { Avatar } from '@/components/common/Avatar';
import { Select } from '@/components/common/Select';
import { Thumbnail } from '@/components/common/Thumbnail';
import { Checkbox } from '@/components/common/Checkbox';
import { TooltipContent } from '@/components/common/TooltipContent';
import { Pagination, PaginationProps } from '@/components/common/Pagination'; // PaginationProps 타입을 임포트합니다.
import { DropDownMenu } from '@/components/common/Thumbnail/_components/DropDownMenu';
import { formatFileSize, getFileExtension, removeFileExtension } from '@/utils';
import { SmartFolderItemResult } from '@/service/file/schemas';
import { Input } from '@/components/common/Input';
import { IThumbnail } from '@/components/common/Thumbnail/types';
import { IDropDownMenu } from '@/components/common/Thumbnail/_components/DropDownMenu/types';
import { useValidateFileName } from '@/hooks/useValidateFileName';
import useUserStore from '@/hooks/store/useUserStore';
import Link from 'next/link';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Data = { [key: string]: any };

export interface IColumn {
  key: string; // 컬럼 키 값
  title: string; // 헤더에 표시할 타이틀
  width?: string; // 컬럼 사이즈
  textAlign?: 'left' | 'center' | 'right'; // 텍스트 정렬
  textEllipsis?: boolean; // 말 줄임
  tooltip?: string; // 툴팁 메세지
  isThumbnail?: boolean; // 썸네일 노출 유무
  dataType?: 'string' | 'number' | 'thumbnail' | 'profile' | 'favorite' | 'date' | 'fileSize';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (data: any, rowData: Data) => React.ReactNode;
}

interface ITableProps extends Pick<IThumbnail, 'makeRenameFile'> {
  tabId?: number | string;
  columns: IColumn[]; // 테이블 컬럼리스트
  data: Data[]; // 데이터row 리스트// 데이터row 리스트 IntrinsicAttributes & ITableProps & RefAttributes<unknown>
  caption?: string;
  hasCheckBox?: boolean; // 체크박스 유무
  hasCheckBoxAll?: boolean; // 체크박스 전체 사용 유무
  hasMenu?: boolean; // 메뉴 유무
  pagination?: PaginationProps; // Pagination 컴포넌트 사용유무 및 옵션 여부
  perPageList?: number[];
  orderByList?: { text: string; value: string }[];
  hasPerpageList?: boolean; // n개씩 끊어보기 selectbox 여부
  hasOrderByList?: boolean; // 정렬 selectbox 여부
  buttonArea?: React.ReactNode; // 추가 버튼 영역
  selectRowItems?: number[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  refetchData?: (params: any) => void; // 테이블 데이터 재조회 이벤트 (parameter 전달 필요)
  onSelectAll?: (checked: boolean) => void; // 체크박스 전체선택 이벤트
  onSelectRow?: (rowData: Data, checked: boolean) => void; // 체크박스 이벤트
  onActionItems?: (action: 'COPY' | 'MOVE' | 'SAVE', items: SmartFolderItemResult) => void; // 선택 행 액션 (저장/이동/복사) 이벤트
  onRemoveItems?: (items: number[]) => Promise<void>; // 선택 행 삭제 이벤트
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClickShareLinkButton?: (params: any) => void; // 선택 행 공유 이벤트
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCopyItems?: (params: any) => void; // 선택 행 복사 이벤트
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSaveItems?: (params: any) => void; // 선택 행 저장 이벤트
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onFavorite?: (params: any) => void; // 선택 행 즐겨찾기 이벤트
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClickItem?: (params: any) => void; // 행 클릭 이벤트
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChangeItem?: (params: any) => void; // 행 변경 이벤트

  nameEditableInfo?: SmartFolderItemResult | null; // 이름 변경할 아이템

  dropDownMenu?: (item?: SmartFolderItemResult) => { list: IDropDownMenu['list'] }; // 드롭다운 리스트
  isMaterialSearch?: boolean; // 자료보드 검색 화면인지
}

// 보여줄 행 갯수 리스트 기본값
const PER_PAGE_LIST = [10, 20, 50];
const ORDER_BY_LIST = [
  { text: '최신순', value: 'latest' },
  { text: '등록순', value: 'register' },
];

export const Table = forwardRef(
  (
    {
      tabId,
      columns,
      data,
      caption = '',
      hasCheckBox = false,
      hasCheckBoxAll = false,
      hasMenu = false,
      hasPerpageList = false,
      hasOrderByList = false,
      perPageList = PER_PAGE_LIST,
      orderByList = ORDER_BY_LIST,
      buttonArea,
      selectRowItems,
      refetchData,
      onSelectAll,
      onSelectRow,
      onRemoveItems,
      onActionItems,
      onClickShareLinkButton,
      onCopyItems,
      onSaveItems,
      onFavorite,
      onClickItem,
      onChangeItem,
      pagination,
      nameEditableInfo,
      makeRenameFile,
      dropDownMenu,
      isMaterialSearch = false,
    }: ITableProps,
    ref,
  ) => {
    const { userInfo } = useUserStore();
    const [selectedRows, setSelectedRows] = useState<{ [key: string]: boolean }>({});
    const [allChecked, setAllChecked] = useState(false);
    const [orderBy, setOrderBy] = useState('latest');

    const [openDropDown, setOpenDropDown] = useState<string | number>();
    const [selectedRowItem, setSelectedRowItem] = useState<{ [key: string]: any }>({});
    const [hoverRowId, setHoverRowId] = useState<string | number>();

    const checkboxName = tabId ? `checkTable_${tabId}` : 'checkTable';
    const checkboxAll = tabId ? `checkAll_${tabId}` : 'checkAll';
    const checkboxId = tabId ? `checkRow_${tabId}` : 'checkRow';
    const dropDownMenuList = [
      {
        key: 'share',
        text: '공유 관리',
        action: () => {
          if (selectedRowItem && Object.keys(selectedRowItem)?.length > 0) {
            if (selectedRowItem?.id === openDropDown && onClickShareLinkButton) onClickShareLinkButton(selectedRowItem);
          }
        },
      },
      {
        key: 'delete',
        text: '삭제',
        action: () => {
          if (selectedRowItem && Object.keys(selectedRowItem)?.length > 0) {
            if (selectedRowItem?.id === openDropDown && onRemoveItems) onRemoveItems([selectedRowItem.id]);
          }
        },
      },
      {
        key: 'copy',
        text: '복사',
        action: () => {
          if (onActionItems) {
            onActionItems('COPY', selectedRowItem as SmartFolderItemResult);
          }
        },
      },
      {
        key: 'save',
        text: '저장',
        action: () => {
          if (onActionItems) {
            onActionItems('SAVE', selectedRowItem as SmartFolderItemResult);
          }
        },
      },
    ];

    const isNotMineList = ['share', 'copy'];
    const dropDownMenus = {
      list: selectedRowItem?.isMine
        ? dropDownMenuList
        : dropDownMenuList.filter((menu) => isNotMineList.includes(menu.key)),
    };

    useEffect(() => {
      // 페이지 변경 시 선택된 행 초기화
      setSelectedRows({});
      setAllChecked(false);
    }, [data]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { checked } = e.target;
      const newSelectedRows: { [key: string]: boolean } = {};
      data.forEach((row) => {
        newSelectedRows[row.id] = checked;
      });
      setSelectedRows(newSelectedRows);
      setAllChecked(checked);
      if (onSelectAll) onSelectAll(checked);
    };

    const handleSelectRow = (e: React.ChangeEvent<HTMLInputElement>, rowData: Data) => {
      const { checked } = e.target;
      if (selectRowItems) {
        if (onSelectRow) onSelectRow(rowData, checked);
      } else {
        setSelectedRows((prev) => {
          const newSelectedRows = { ...prev, [rowData.id]: checked };
          const allSelected = Object.values(newSelectedRows).every((value) => value === true);
          setAllChecked(allSelected);
          return newSelectedRows;
        });
      }
    };

    // 메뉴 : 더보기 메뉴 열기/닫기
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleDropDown = (event: React.MouseEvent<HTMLButtonElement>, rowData: any) => {
      event.preventDefault();
      setOpenDropDown(openDropDown !== rowData.id ? rowData.id : null);
      setSelectedRowItem(openDropDown !== rowData.id ? rowData : null);
    };

    // 즐겨찾기
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleFavorite = (event: React.MouseEvent<HTMLButtonElement>, rowData: any) => {
      event.preventDefault();
      if (onFavorite) onFavorite(rowData);
    };

    // 행 클릭 - 이름 영역만 사용
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleClickItem = (event: React.MouseEvent<HTMLTableDataCellElement, MouseEvent>, rowData: any) => {
      event.preventDefault();
      if (onClickItem) {
        onClickItem(rowData);
      }
    };

    // 공유 관리 클릭 시
    const handleClickShareLinkButton = (
      event: React.MouseEvent<HTMLTableDataCellElement, MouseEvent>,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rowData: any,
    ) => {
      event.preventDefault();
      if (onClickShareLinkButton) {
        onClickShareLinkButton(rowData);
      }
    };

    // table body tr mouse leave event
    const handleTreLeave = (event: React.MouseEvent<HTMLTableRowElement, MouseEvent>, rowData: any) => {
      event.preventDefault();
      if (openDropDown !== rowData.id) {
        setOpenDropDown('');
        setSelectedRowItem({});
      }
    };

    const renderValue = (col: IColumn, rowData: Data) => {
      if (col.render) {
        return col.render(rowData[col.key], rowData);
      }

      if (rowData.fileType !== 'FOLDER') {
        return removeFileExtension(rowData[col.key]);
      }

      return rowData[col.key];
    };

    const [inputFileName, setInputFileName] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);
    const validateFileName = useValidateFileName();

    useEffect(() => {
      if (nameEditableInfo) {
        setInputFileName(
          nameEditableInfo.fileType === 'FOLDER' ? nameEditableInfo.name : removeFileExtension(nameEditableInfo.name),
        );
      }
    }, [nameEditableInfo]);

    return (
      <>
        {(hasPerpageList || hasOrderByList) && (
          // 테이블 데이터 n개씩 끊어보기 혹은 정렬 선택박스 사용시
          <div className="title_area">
            <div className="wrap_form_area">
              <Select
                size="small"
                value={pagination?.perPage || 10}
                onChange={(e) => {
                  if (refetchData) {
                    refetchData({
                      currentPage: 1,
                      perPage: e,
                    });
                  }
                }}
                options={perPageList}
              />
              {/* 추후 sort 변경 */}
              <Select
                size="small"
                value={orderBy}
                onChange={(value) => {
                  setOrderBy(value as string);
                }}
                options={orderByList}
              />
            </div>
            {buttonArea && <div className="wrap_tit">{buttonArea}</div>}
          </div>
        )}

        <div className="item-table" style={{ borderTop: 'none' }}>
          <table className="item-table">
            <caption className="ir_caption">{caption}</caption>
            <colgroup>
              {hasCheckBox && <col style={{ width: '42px' }} />}
              {columns.map((col) => (
                <col key={col.key} style={{ width: col.width }} />
              ))}
              {hasMenu && <col style={{ width: '56px' }} />}
            </colgroup>
            <thead>
              <tr>
                {hasCheckBox && (
                  <th className="col-check" scope="col">
                    {hasCheckBoxAll && (
                      <Checkbox
                        name={checkboxName}
                        id={checkboxAll}
                        label="전체 선택"
                        labHidden
                        onChange={handleSelectAll}
                      />
                    )}
                  </th>
                )}
                {columns.map((col) => (
                  <th key={col.key} style={{ textAlign: col.textAlign || 'center' }} scope="col">
                    {col.title}
                    {col.tooltip && (
                      <div className="wrap-tooltip">
                        <span className="ico-comm ico-help-16-g">도움말</span>
                        <TooltipContent colorType="default" sizeType="small" position="top" contents={col.tooltip} />
                      </div>
                    )}
                  </th>
                ))}
                {hasMenu && (
                  <th className="col-menu" scope="col">
                    <span className="screen_out">메뉴</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((rowData) => (
                <tr
                  key={rowData.id}
                  onMouseEnter={(event) => handleTreLeave(event, rowData)}
                  /** selecto용 속성 지정 */
                  className={cx('selectable', {
                    selected: hasCheckBoxAll
                      ? selectedRows[rowData.id] || false
                      : selectRowItems && selectRowItems.includes(rowData.id),
                  })}
                  id="fileTableItem"
                  data-id={rowData.id}
                  data-file-type={rowData.fileType}
                >
                  {hasCheckBox && (
                    <td className="col-check">
                      {rowData.fileType !== 'FOLDER' && (
                        <Checkbox
                          name={checkboxName}
                          id={`${checkboxId}${rowData.id}`}
                          label="행 선택"
                          labHidden
                          checked={
                            hasCheckBoxAll
                              ? selectedRows[rowData.id] || false
                              : selectRowItems && selectRowItems.includes(rowData.id)
                          }
                          onChange={(e) => handleSelectRow(e, rowData)}
                        />
                      )}
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cx({
                        'col-name': col.key === 'name',
                        'col-favorite': col.key !== 'name' && col.dataType === 'favorite',
                      })}
                      style={{
                        textAlign: col.textAlign || 'center',
                        textDecoration: col.key === 'name' && hoverRowId === rowData.id ? 'underline' : 'none',
                      }}
                      onClick={(event) => {
                        const target = event.target as HTMLElement;

                        // const blockedSelectors = [
                        //   '.btn-download', // 다운로드
                        //   '.badge-util', // 대표 뱃지
                        //   '.btn-menu', // 드롭다운 메뉴
                        //   '.btn-favorite', // 즐겨찾기 버튼
                        //   '.btn-delete', // 닫기 버튼
                        //   '.btn-memo', // 수정 버튼
                        //   '#fileName', // 이름 수정
                        // ];
                        if (col.key === 'name') {
                          if (target.closest('#fileName')) {
                            event.stopPropagation();
                            return;
                          }
                          handleClickItem(event, rowData);
                        }
                      }}
                      onMouseEnter={() => setHoverRowId(rowData.id)}
                      onMouseLeave={() => setHoverRowId('')}
                    >
                      {
                        // eslint-disable-next-line no-nested-ternary, no-nested-ternary
                        col.dataType === 'thumbnail' ? (
                          <span className="wrap-name" style={{ width: col.width, cursor: 'pointer' }}>
                            <Thumbnail
                              contentHideen
                              fileType={rowData.fileType}
                              fileName={rowData.name}
                              thumbUrl={rowData?.thumbUrl || ''}
                              width={24}
                              style={{ borderRadius: 0 }}
                              visualClassName={rowData.fileType === 'FOLDER' ? 'type-folder' : undefined}
                              viewType="table"
                              storyBoard={rowData.storyBoard}
                              lecturePlan={rowData.lecturePlan}
                              lecturePlanReport={rowData.lectureReport}
                              userEditable={rowData.userEditable}
                            />
                            {nameEditableInfo?.id === rowData.id ? (
                              <Input
                                id="fileName"
                                ref={inputRef}
                                value={inputFileName}
                                maxLength={200}
                                onChange={(event) => setInputFileName(event.target.value)}
                                placeholder="폴더 명"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.nativeEvent.isComposing) return;

                                  const { key } = e;

                                  if (key === 'Enter' || key === 'Escape') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const extension = getFileExtension(rowData.name);
                                    const name =
                                      rowData.fileType !== 'FOLDER' && extension
                                        ? `${inputFileName.trim()}.${extension}`
                                        : inputFileName.trim();
                                    const fileNameNoExtension = removeFileExtension(rowData.name);
                                    if (key === 'Escape') {
                                      makeRenameFile?.({ name, type: 'cancel' });
                                    } else if (key === 'Enter' && name.trim().length > 0) {
                                      if (validateFileName(name, () => inputRef.current?.focus())) return;
                                      makeRenameFile?.({
                                        name,
                                        type: fileNameNoExtension.length > 0 ? 'rename' : 'make',
                                      });
                                    }
                                  }
                                }}
                              />
                            ) : (
                              <span className="txt-ellipsis">{renderValue(col, rowData)}</span>
                            )}
                          </span>
                        ) : // eslint-disable-next-line no-nested-ternary, no-nested-ternary
                        col.dataType === 'profile' ? (
                          <Link
                            href={`/my-board/story-board${rowData.userProfileCode ? `?user=${rowData.userProfileCode}` : ''}`}
                          >
                            <span className="wrap-name txt-ellipsis">
                              <Avatar
                                icon
                                width={24}
                                height={24}
                                src={isMaterialSearch ? userInfo?.photoUrl : rowData.userProfileThumbUrl}
                                classNames={cx('display-inline-block', {
                                  'ico-comm ico-gnb-user': isMaterialSearch
                                    ? !userInfo?.photoUrl
                                    : !rowData?.userProfileThumbUrl,
                                })}
                              />
                              <span
                                style={{
                                  marginLeft: '4px',
                                }}
                              >
                                {col.render
                                  ? col.render(rowData[col.key], rowData)
                                  : isMaterialSearch
                                    ? userInfo?.name
                                    : rowData[col.key]}
                              </span>
                            </span>
                          </Link>
                        ) : // eslint-disable-next-line no-nested-ternary, no-nested-ternary
                        col.dataType === 'favorite' ? (
                          rowData.fileType !== 'FOLDER' ? (
                            <button
                              type="button"
                              className={cx('btn-favorite', rowData.isFavorite && 'active')}
                              onClick={(event) => handleFavorite(event, rowData)}
                            >
                              <span className="ico-comm ico-favorite-20">즐겨찾기</span>
                            </button>
                          ) : (
                            ``
                          )
                        ) : // eslint-disable-next-line no-nested-ternary, no-nested-ternary
                        col.dataType === 'date' ? (
                          <span className="txt-ellipsis" style={{ width: col.width }}>
                            {dayjs(col.render ? col.render(rowData[col.key], rowData) : rowData[col.key]).format(
                              dateFormat.default,
                            )}
                          </span>
                        ) : // eslint-disable-next-line no-nested-ternary, no-nested-ternary
                        col.dataType === 'fileSize' ? (
                          rowData.fileType !== 'FOLDER' ? (
                            <span className="txt-ellipsis" style={{ width: col.width }}>
                              {formatFileSize(col.render ? col.render(rowData[col.key], rowData) : rowData[col.key])}
                            </span>
                          ) : (
                            ''
                          )
                        ) : // eslint-disable-next-line no-nested-ternary, no-nested-ternary
                        col.textEllipsis ? (
                          <span className="txt-ellipsis" style={{ width: col.width }}>
                            {col.render ? col.render(rowData[col.key], rowData) : rowData[col.key]}
                          </span>
                        ) : col.render ? (
                          col.render(rowData[col.key], rowData)
                        ) : (
                          rowData[col.key]
                        )
                      }
                    </td>
                  ))}
                  {hasMenu && (
                    <td className="col-menu">
                      {/** 시스템 폴더는 더보기 메뉴 비활성화 */}
                      {(rowData.fileType !== 'FOLDER' || rowData.userEditable) && (
                        <div className="wrap-menu" style={{ position: 'relative' }}>
                          <button
                            type="button"
                            className={cx('btn-menu', openDropDown === rowData.id && 'active')}
                            onClick={(event) => handleDropDown(event, rowData)}
                          >
                            <span className="ico-comm ico-options-vertical-20">메뉴</span>
                          </button>
                          <DropDownMenu
                            {...dropDownMenu}
                            show={openDropDown === rowData.id}
                            list={dropDownMenu?.(rowData as SmartFolderItemResult)?.list ?? dropDownMenus.list}
                            direction="left"
                          />
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination 컴포넌트 추가 */}
        {pagination && (
          <Pagination
            totalPage={pagination.totalPage}
            currentPage={pagination.currentPage}
            perPage={pagination.perPage}
            onClick={pagination.onClick}
          />
        )}
      </>
    );
  },
);

Table.displayName = 'Table';
export default Table;
