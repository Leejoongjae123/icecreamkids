import React, { useEffect, useMemo, useState } from 'react';
import { Thumbnail } from '@/components/common';
import { FLOATING_BUTTON_TYPE } from '@/const';
import { useRouter } from 'next/navigation';
import { IMyBoardThumbnail } from '@/app/(auth)/my-board/_components/MyBoardThumbnail/types';

const MyBoardThumbnail = ({
  item,
  path,
  selected,
  floating,
  isSearching = false,
  onRemoveItems,
  onActionItems,
  onThumbnailChange,
  onClickShareLinkButton,
  onClickItem,
  onFavorite,
}: IMyBoardThumbnail) => {
  const isLecturePhoto = useMemo(() => {
    return path === 'lecture-photo';
  }, [path]);

  const isLecturePlan = useMemo(() => {
    return path === 'lecture-plan';
  }, [path]);

  const isStoryBoard = useMemo(() => {
    return path === 'story-board';
  }, [path]);

  const router = useRouter();

  // 부모 상태와 동기화되는 개별 로컬 상태
  const [localSelected, setLocalSelected] = useState(selected);

  const [openDropDown, setOpenDropDown] = useState<boolean>(false);

  // 부모로부터 전달받은 선택 상태가 바뀌면 동기화
  useEffect(() => {
    setLocalSelected(selected);
  }, [selected]);

  const onEditToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    const newValue = event.target.checked;
    setLocalSelected(newValue);
    onThumbnailChange(newValue);
  };

  const onDropDown = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setOpenDropDown((prev) => !prev);
  };

  // 썸네일 클릭 이벤트
  const handleClick = () => {
    if (onClickItem) {
      onClickItem(item);
    }
    // router.push(`/preview?smartFolderItemId=${item.id}&smartFolderApiType=${item.smartFolderApiType}`);
  };

  const isNotMineList = ['share', 'save'];
  const dropDownMenuList = [
    { key: 'share', text: '공유 관리', action: () => onClickShareLinkButton(item) },
    { key: 'delete', text: '삭제', action: () => onRemoveItems([item.id]) },
    { key: 'copy', text: '복사', action: () => onActionItems('COPY', item) },
    { key: 'save', text: '저장', action: () => onActionItems('SAVE', item) },
  ];

  const isNotMineDropDownMenu = {
    list: dropDownMenuList,
  };

  const isMineDropDownMenu = {
    list: dropDownMenuList.filter((menu) => isNotMineList.includes(menu.key)),
  };

  /* 놀이 사진 썸네일 - 메모 여부 확인 */
  const isMemoEditActive = useMemo(() => {
    return (item?.driveItemResult && item.driveItemResult?.memoCount > 0) ?? false;
  }, [item]);

  /* 놀이 사진 썸네일 - 메모 수정 관련 코드 */
  // const {
  //   isMemoEditActive,
  //   isEditModalOpen,
  //   driveItemMemoData,
  //   onChangeMemo,
  //   onEdit,
  //   handleCloseMemoEditModal,
  //   handleSaveEditedContent,
  // } = useHandleMemo(item);

  return (
    <>
      <Thumbnail
        visualClassName={item.fileType === 'LECTURE_PLAN' && isSearching ? 'type-card' : undefined}
        key={`${path}_${item.id}`}
        hover
        floatingType={
          isLecturePhoto && isMemoEditActive
            ? FLOATING_BUTTON_TYPE.CheckFavoriteDropdownEdit
            : FLOATING_BUTTON_TYPE.CheckFavoriteDropdown
        }
        thumbUrl={item?.thumbUrl ?? ''}
        fileType={item.fileType}
        floating={floating}
        isProfileImage
        fileName={item.name}
        placeholder="blur"
        onClick={handleClick}
        // onEdit={onEdit}
        isEditActive={localSelected}
        onEditToggle={(event) => onEditToggle(event)} // 개별 상태 토글 함수 전달
        dropDown={openDropDown}
        dropDownMenu={item.isMine ? isNotMineDropDownMenu : isMineDropDownMenu}
        onDropDown={(event) => onDropDown(event)}
        isMine={item.isMine}
        favorite={item.isFavorite}
        onFavorite={() => onFavorite(item)}
        likes={item.likeCount}
        date={isSearching ? '' : item.driveItemCreatedAt}
        views={item.viewCount}
        storyBoard={item.storyBoard}
        viewType={item.fileType === 'LECTURE_PLAN' && !isSearching ? 'lecturePlan' : 'thumbnail'}
        lecturePlan={item.lecturePlan}
        userProfileName={item.userProfileName}
        userProfileThumbUrl={item.userProfileThumbUrl}
        cardFloatingButton
        innerCard={item.lecturePlan?.creationType}
        userProfileCode={item.userProfileCode as string}
      />
      {/* 메모 편집 모달 */}
      {/* {isEditModalOpen && driveItemMemoData && ( */}
      {/*  <MemoEditModal */}
      {/*    memo={driveItemMemoData} */}
      {/*    isOpen={isEditModalOpen} */}
      {/*    onChangeMemo={onChangeMemo} */}
      {/*    onCancel={handleCloseMemoEditModal} */}
      {/*    onSave={handleSaveEditedContent} */}
      {/*  /> */}
      {/* )} */}
    </>
  );
};

export default MyBoardThumbnail;
