import React, { Fragment } from 'react';
import { Checkbox, Thumbnail } from '@/components/common';
import { Table, IColumn } from '@/components/common/Table';
import {
  SmartFolderItemResult,
  SmartFolderItemResultFileType,
  SmartFolderItemResultSmartFolderApiType,
} from '@/service/file/schemas';
import dayjs from 'dayjs';
import { dateFormat } from '@/lib/dayjs';
import { IPhotoDateList } from '@/app/(auth)/material-board/_components/PhotoDateList/types';
import { TRowData } from '@/app/(auth)/material-board/_components/MaterialBoardList/types';
import { isEmpty, visualClassName } from '@/utils';
import { FLOATING_BUTTON_TYPE } from '@/const';

const PhotoDateList: React.FC<IPhotoDateList> = ({
  currentViewMode,
  fileList,
  category,
  dropDown,
  onClick,
  onDropDown,
  onEditToggle,
  selectedIds,
  setSelectedIds,
  dropDownActions,
  onClickShareLinkButton,
  handleFavorite,
  makeRenameFile,
  nameEditableInfo,
}): React.ReactNode => {
  // 날짜별로 그룹화
  const groupedFiles = fileList.reduce<Record<string, { items: SmartFolderItemResult[]; onlyFolder: boolean }>>(
    (acc, file) => {
      const formattedDate = dayjs(file.driveItemCreatedAt).format(dateFormat.default); // 날짜 변환

      if (!acc[formattedDate]) acc[formattedDate] = { items: [], onlyFolder: true };
      acc[formattedDate].items.push(file);
      if (file.fileType !== 'FOLDER') {
        acc[formattedDate].onlyFolder = false;
      }
      return acc;
    },
    {},
  );

  const filterDateIds = (targetDate: string) => {
    const dateList = groupedFiles[targetDate];
    if (!dateList) return;

    setSelectedIds((prev) => {
      const newSelectedIds = { ...prev };

      dateList.items.forEach((item) => {
        // 이전 값의 반댓값으로 변경
        if (item.fileType !== 'FOLDER') {
          const key = item.id;
          newSelectedIds[key] = !prev[key];
        }
      });

      return newSelectedIds;
    });
  };

  const isDateFullySelected = (targetDate: string) => {
    const dateList = groupedFiles[targetDate];
    if (!dateList) return false; // 해당 날짜에 파일이 없으면 비활성화

    return dateList.items.every((item) => selectedIds[item.id]); // 모든 항목이 선택되었는지 확인
  };

  const TABLE_COLUMNS: IColumn[] = [
    {
      key: 'name',
      title: '이름',
      textAlign: 'left',
      dataType: 'thumbnail',
    },
    {
      key: 'userProfileName',
      title: '사용자',
      textAlign: 'left',
      textEllipsis: true,
      width: '149px',
      tooltip: 'tooltip text',
      dataType: 'profile',
    },
    {
      key: 'totalSize',
      title: '크기',
      width: '111px',
      dataType: 'fileSize',
    },
    {
      key: 'driveItemCreatedAt',
      title: '등록일',
      width: '133px',
      dataType: 'date',
    },
    {
      key: 'hasLiked',
      title: '즐겨찾기',
      width: '71px',
      dataType: 'favorite',
    },
  ];

  const dropDownMenu = (item: SmartFolderItemResult) => {
    let dropDownMenuList = [
      ...(item.fileType === 'FOLDER'
        ? []
        : [
            {
              key: 'share',
              text: '공유 관리',
              action: () => {
                onClickShareLinkButton(item);
              },
            },
            { key: 'copy', text: '복사', action: () => dropDownActions('COPY', item) },
            { key: 'save', text: '저장', action: () => dropDownActions('SAVE', item) },
            { key: 'move', text: '이동', action: () => dropDownActions('MOVE', item) },
            { key: 'tag', text: '태그 관리', action: () => dropDownActions('TAG', item) },
          ]),

      { key: 'change', text: '이름변경', action: () => dropDownActions('RENAME', item) },
      { key: 'delete', text: '삭제', action: () => dropDownActions('DELETE', item) },
    ];

    if (item.fileType === 'STUDENT_RECORD' || item.fileType === 'LECTURE_PLAN_REPORT') {
      dropDownMenuList = dropDownMenuList.filter((menu) => menu.key !== 'share');
    }

    return { list: dropDownMenuList };
  };

  // 선택한 file id
  const selectRowItems = () => {
    return Object.keys(selectedIds)
      .filter((key: any) => selectedIds[key])
      .map((key: any) => parseInt(key, 10)); // key가 숫자라는 전제로 parseInt 처리
  };

  // 리스트 체크박스 선택 이벤트
  const handleTableToggle = (rowData: TRowData) => {
    const { id } = rowData;
    // if (isEmpty(id)) { // 유효성 검사 필요 시 추가
    //   addToast({ message: '선택된 항목이 없습니다.' });
    //   showAlert({ message: '선택된 항목이 없습니다.' });
    //   return;
    // }
    onEditToggle?.(id);
  };

  // 선택 객체 클릭 이벤트 - 미리보기 이벤트
  const handleClickItem = (selectItem: SmartFolderItemResult) => {
    const { id, fileType, smartFolderApiType } = selectItem;
    if (
      isEmpty(id) ||
      isEmpty(fileType) ||
      !(fileType in SmartFolderItemResultFileType) ||
      isEmpty(smartFolderApiType) ||
      !(smartFolderApiType in SmartFolderItemResultSmartFolderApiType)
    ) {
      // addToast({ message: '선택된 항목이 없습니다.' });
      // showAlert({ message: '선택된 항목이 없습니다.' });
      // return;
    }
    onClick?.({ id, fileType, apiType: smartFolderApiType });
  };

  const fileType = (id: number, memoCount: number) => {
    if (id === 0) {
      return FLOATING_BUTTON_TYPE.None;
    }
    return memoCount > 0 ? FLOATING_BUTTON_TYPE.CheckFavoriteDropdownEdit : FLOATING_BUTTON_TYPE.CheckFavoriteDropdown;
  };

  const renderContent = (renderDate: string, renderData: SmartFolderItemResult[]) => {
    if (renderData.length === 0) {
      return (
        <div className="item-empty type2">
          <span className="ico-comm ico-empty" />
          <p className="txt-empty">자료가 없습니다.</p>
        </div>
      );
    }

    if (currentViewMode === 'grid') {
      return (
        <ul className="list-thumbnail-grid">
          {renderData.map((file) => (
            <li
              key={`${category}_${renderDate}_${file.name}_${file.id}`}
              /** selecto용 속성 지정 */
              id="fileItem"
              data-id={file.id}
              data-file-type={file.fileType}
            >
              <Thumbnail
                hover
                fileType={file.fileType as SmartFolderItemResultFileType}
                fileName={file.name}
                thumbUrl={file.thumbUrl || ''}
                floatingType={fileType(file.id, file.memoCount)}
                className="type-upload"
                floating={Object.entries(selectedIds).find((state) => state[1]) !== undefined}
                isEditActive={selectedIds[file.id]} // 개별 파일의 상태 전달
                onEditToggle={() => onEditToggle?.(file.id)} // 개별 상태 토글 함수 전달
                dropDownMenu={dropDownMenu(file)}
                dropDown={dropDown(file.id)}
                onDropDown={(event) => onDropDown(event, file.id)}
                favorite={file.isFavorite}
                onClick={() => {
                  onClick?.({
                    id: file.id,
                    fileType: file.fileType,
                    apiType: file.smartFolderApiType,
                  });
                }}
                onFavorite={() => handleFavorite(file)}
                storyBoard={file.storyBoard}
                lecturePlan={file.lecturePlan}
                lecturePlanReport={file.lectureReport}
                isMine={file.isMine}
                makeRenameFile={makeRenameFile}
                nameEditable={file.id === nameEditableInfo?.id}
                userEditable={file.userEditable}
                visualClassName={visualClassName(file.fileType)}
                userProfileCode={file.userProfileCode as string}
              />
            </li>
          ))}
        </ul>
      );
    }

    return (
      <Table
        hasCheckBox
        hasMenu
        columns={TABLE_COLUMNS}
        data={renderData}
        selectRowItems={selectRowItems()}
        onSelectRow={handleTableToggle}
        onActionItems={(action, items) => dropDownActions(action, items)}
        nameEditableInfo={nameEditableInfo}
        // onClickShareLinkButton={handleClickShareLinkButton}
        // onRemoveItems={handleRemoveItems}
        // onChangeItem
        onClickItem={handleClickItem}
        onFavorite={(rowData) => handleFavorite(rowData)}
        onChangeItem={(rowData) => dropDownActions('RENAME', rowData)}
        makeRenameFile={makeRenameFile}
        dropDownMenu={(rowData) => dropDownMenu(rowData as SmartFolderItemResult)}
      />
    );
  };

  return (
    <div className="body-content">
      {Object.entries(groupedFiles).map(([date, data]) => (
        <Fragment key={date}>
          <div className="head-list">
            {!data.onlyFolder && (
              <Checkbox
                className="item-all"
                name={date}
                id={date}
                labHidden
                label="전체 선택"
                checked={isDateFullySelected(date)}
                onChange={() => filterDateIds(date)}
              />
            )}

            <strong className="subtitle-type1">{dayjs(date).format('YYYY년 MM월 DD일')}</strong>
          </div>
          {renderContent(date, data.items)}
        </Fragment>
      ))}
    </div>
  );
};

PhotoDateList.displayName = 'PhotoDateList';
export default PhotoDateList;
