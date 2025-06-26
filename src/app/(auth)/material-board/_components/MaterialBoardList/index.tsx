import React, { useCallback, useState } from 'react';
import Empty from '@/app/(auth)/material-board/_components/Empty';
import { Thumbnail } from '@/components/common';
import { Table, IColumn } from '@/components/common/Table';
import {
  SmartFolderItemResult,
  SmartFolderItemResultFileType,
  SmartFolderItemResultSmartFolderApiType,
} from '@/service/file/schemas';

import { isEmpty, visualClassName } from '@/utils';
import { FLOATING_BUTTON_TYPE } from '@/const';
import useUserStore from '@/hooks/store/useUserStore';
import { MemoEditModal } from '@/components/modal/memo-edit';
import { useToast } from '@/hooks/store/useToastStore';
import { useUpdateMemoFile } from '@/service/file/fileStore';
import { useQueryClient } from '@tanstack/react-query';
import { IMaterialBoardList, TRowData } from './types';

const MaterialBoardList: React.FC<IMaterialBoardList> = ({
  currentViewMode,
  hasFile,
  fileList,
  category,
  searchKeyword,
  dropDown,
  onClick,
  onDropDown,
  onEditToggle,
  onClickShareLinkButton,
  selectedIds,
  dropDownActions,
  handleFavorite,
  nameEditableInfo,
  makeRenameFile,
  deleteActions,
  isFavoriteFolder,
}): React.ReactNode => {
  const { userInfo } = useUserStore();
  const addToast = useToast((state) => state.add);
  const queryClient = useQueryClient();
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
    ...(category === 'search' || category === 'trash'
      ? []
      : [
          {
            key: 'hasLiked',
            title: '즐겨찾기',
            width: '71px',
            dataType: 'favorite',
          } as IColumn,
        ]),
  ];

  const dropDownMenu = (item: SmartFolderItemResult) => {
    let finalList: {
      key: string;
      text: string;
      action: () => void;
    }[] = [];
    const baseMenu = [
      {
        key: 'share',
        text: '공유 관리',
        action: () => onClickShareLinkButton(item),
      },
      { key: 'copy', text: '복사', action: () => dropDownActions('COPY', item) },
      { key: 'save', text: '저장', action: () => dropDownActions('SAVE', item) },
      { key: 'move', text: '이동', action: () => dropDownActions('MOVE', item) },
    ];

    const nameAndDeleteMenu = [
      { key: 'change', text: '이름변경', action: () => dropDownActions('RENAME', item) },
      { key: 'delete', text: '삭제', action: () => dropDownActions('DELETE', item) },
    ];

    const trashMenu = [
      { key: 'restore', text: '복원', action: () => deleteActions?.('restore', item) },
      { key: 'permanentDelete', text: '영구삭제', action: () => deleteActions?.('removeFromService', item) },
    ];

    // 폴더일 경우 baseMenu 제거
    const effectiveMenu =
      item.fileType === 'FOLDER' ? baseMenu.filter((menu) => ['save'].includes(menu.key)) : [...baseMenu];
    // const effectiveMenu = [...baseMenu];

    if (category === 'photo' || category === 'docs') {
      if (item.fileType === 'FOLDER') {
        finalList = [...effectiveMenu, ...nameAndDeleteMenu];
      } else {
        finalList = [
          {
            key: 'tagManagement',
            text: '태그 관리',
            action: () => dropDownActions('TAG', item),
          },
          ...effectiveMenu,
          ...nameAndDeleteMenu,
        ];
      }
    }

    if (category === 'folder') {
      // 내 자료 or 타인의 자료
      finalList = [...effectiveMenu, ...nameAndDeleteMenu];
    }
    // 공개자료
    if (category === 'public') {
      const { isMine } = item;
      const keys = isMine ? ['share', 'block', 'copy', 'save'] : ['share', 'block', 'save'];

      finalList = effectiveMenu.filter((menu) => keys.includes(menu.key));
    }

    // 휴지통
    if (category === 'trash') {
      finalList = trashMenu;
    }

    if (isFavoriteFolder) {
      finalList = [
        ...effectiveMenu.filter((menu) => !['share'].includes(menu.key)),
        ...nameAndDeleteMenu.filter((menu) => ![item.fileType === 'FOLDER' ? '' : 'change'].includes(menu.key)),
      ];
    }

    if (item.fileType === 'STUDENT_RECORD' || item.fileType === 'LECTURE_PLAN_REPORT') {
      finalList = finalList.filter((menu) => menu.key !== 'share');
    }

    return { list: finalList };
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

  const floatingType = (id: number, memoCount: number) => {
    if (id === 0 || category === 'search') {
      return FLOATING_BUTTON_TYPE.None;
    }
    if (category === 'trash') {
      return FLOATING_BUTTON_TYPE.CheckboxDropdown;
    }
    return memoCount > 0 ? FLOATING_BUTTON_TYPE.CheckFavoriteDropdownEdit : FLOATING_BUTTON_TYPE.CheckFavoriteDropdown;
  };

  /** 모바일 메모 */
  const [memoItem, setMemoItem] = useState<SmartFolderItemResult | null>(null);
  const { mutateAsync: updateMemo } = useUpdateMemoFile();
  const [memoData, setMemoData] = useState({
    title: '',
    memo: '',
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleChangeMemo = (val: Record<string, any>) => {
    const key = Object.keys(val)[0];
    const value = Object.values(val)[0];

    setMemoData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearData = () => {
    setIsEditModalOpen(false);
    setMemoItem(null);
    setMemoData({
      memo: '',
      title: '',
    });
  };

  // 메모저장
  const handleSaveEditedContent = async (item: SmartFolderItemResult) => {
    try {
      const body = {
        smartFolderApiType: item.smartFolderApiType,
        smartFolderItemId: item.id,
        memo: memoData.memo,
        title: memoData.title,
        taggedStudentIds: item.studentIds,
      };

      await updateMemo({
        data: body,
      });
      // 쿼리 재호출
      await queryClient.refetchQueries({
        queryKey: ['itemLists', 'UserFolder'],
        type: 'active', // 활성 상태인 쿼리만
      });
      addToast({ message: '메모를 수정하였습니다.' });
      clearData();
    } catch (error) {
      addToast({ message: '메모 수정 중 오류가 발생했습니다.' });
    }
  };

  const renderContent = () => {
    if (!hasFile) {
      return <Empty category={category} searchKeyword={searchKeyword} />;
    }

    if (currentViewMode === 'grid') {
      return (
        <ul className="list-thumbnail-grid">
          {fileList.map((file) => (
            <li
              key={`${category}_${file.name}_${file.id}_${file.driveItemCreatedAt}`}
              /** selecto용 속성 지정 */
              id="fileItem"
              data-id={file.id}
              data-file-type={file.fileType}
            >
              <Thumbnail
                hover={category !== 'search'}
                fileType={file.fileType as SmartFolderItemResultFileType}
                fileName={file.name}
                thumbUrl={file.thumbUrl || ''}
                floatingType={floatingType(file.id, file.memoCount)}
                views={
                  (file.fileType as SmartFolderItemResultFileType) === SmartFolderItemResultFileType.FOLDER
                    ? undefined
                    : file.viewCount
                }
                likes={
                  (file.fileType as SmartFolderItemResultFileType) === SmartFolderItemResultFileType.FOLDER
                    ? undefined
                    : file.likeCount
                }
                date={
                  (file.fileType as SmartFolderItemResultFileType) === SmartFolderItemResultFileType.FOLDER
                    ? undefined
                    : file.driveItemCreatedAt
                }
                floating={Object.entries(selectedIds).find((state) => state[1]) !== undefined}
                isEditActive={!!selectedIds[file.id]} // 개별 파일의 상태 전달
                onEditToggle={() => onEditToggle?.(file.id)} // 개별 상태 토글 함수 전달
                dropDownMenu={dropDownMenu(file)}
                dropDown={dropDown(file.id)}
                onDropDown={(event) => onDropDown(event, file.id)}
                favorite={file.isFavorite}
                onClick={() => {
                  if (file.fileType === 'TEXT_MEMO' && file.driveItemResult?.memoContents) {
                    const { title, memo } = file.driveItemResult.memoContents;
                    setMemoData({
                      title: title ?? '',
                      memo,
                    });
                    setMemoItem(file);
                    setIsEditModalOpen(true);
                    return;
                  }
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
                visualClassName={visualClassName(file.fileType)}
                nameEditable={file.id === nameEditableInfo?.id}
                makeRenameFile={makeRenameFile}
                className={
                  (file.fileType as SmartFolderItemResultFileType) === SmartFolderItemResultFileType.FOLDER
                    ? 'type-upload'
                    : ''
                }
                isProfileImage={
                  (file.fileType as SmartFolderItemResultFileType) !== SmartFolderItemResultFileType.FOLDER
                }
                userProfileThumbUrl={category === 'search' ? userInfo?.photoUrl : file.userProfileThumbUrl}
                userEditable={file.fileType === 'STORY_BOARD' ? false : file.userEditable}
                folderCheckBox={category === 'trash'}
                userProfileCode={file.userProfileCode as string}
              />
            </li>
          ))}
        </ul>
      );
    }

    return (
      <Table
        hasCheckBox={category !== 'search'}
        hasMenu={category !== 'search'}
        columns={TABLE_COLUMNS}
        data={fileList}
        selectRowItems={selectRowItems()}
        onSelectRow={handleTableToggle}
        onActionItems={(action, items) => dropDownActions(action, items)}
        nameEditableInfo={nameEditableInfo}
        // onClickShareLinkButton={handleClickShareLinkButton}
        // onRemoveItems={handleRemoveItems}
        onClickItem={handleClickItem}
        onFavorite={(rowData) => handleFavorite(rowData)}
        onChangeItem={(rowData) => dropDownActions('RENAME', rowData)}
        makeRenameFile={makeRenameFile}
        dropDownMenu={(rowData) => dropDownMenu(rowData as SmartFolderItemResult)}
        isMaterialSearch
      />
    );
  };

  return (
    <div className="body-content">
      {renderContent()}
      {isEditModalOpen && memoItem && (
        <MemoEditModal
          memo={memoData}
          isOpen={isEditModalOpen}
          onChangeMemo={handleChangeMemo}
          onCancel={clearData}
          onSave={() => handleSaveEditedContent(memoItem)}
        />
      )}
    </div>
  );
};

MaterialBoardList.displayName = 'MaterialBoardList';
export default MaterialBoardList;
