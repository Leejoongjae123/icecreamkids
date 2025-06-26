import { IPhotoHomeList } from '@/app/(auth)/material-board/_components/PhotoHomeList/types';
import { Button, Loader, Select, Thumbnail } from '@/components/common';
import { FLOATING_BUTTON_TYPE, prefix } from '@/const';
import useClassManageStore from '@/hooks/store/useClassManageStore';
import useUserStore from '@/hooks/store/useUserStore';
import dayjs from '@/lib/dayjs';
import { SmartFolderItemResult, SmartFolderResult } from '@/service/file/schemas';
import { useRouter } from 'next/navigation';
import React, { useMemo } from 'react';

const PhotoHomeList: React.FC<IPhotoHomeList> = ({
  fileList,
  category,
  dropDown,
  onClick,
  classOptions,
  onChange,
  selectClass,
  onDropDown,
  dropDownActions,
  nameEditableInfo,
  makeRenameFile,
  handleCreatePhotoFolder,
  photoHomeLoading,
  classModalCallback,
}): React.ReactNode => {
  const router = useRouter();

  const { userInfo } = useUserStore();

  // 우리 반 관리
  const { openModal: openClassManageModal } = useClassManageStore();

  const dropDownMenu = (item: SmartFolderResult) => {
    const dropDownItem: SmartFolderItemResult = {
      ...item,
      fileType: 'FOLDER',
      isMine: true,
      originalCreatorAccountId: userInfo?.accountId ?? 0,
      originalCreatorProfileId: userInfo?.id ?? 0,
      viewCount: 0,
      likeCount: 0,
      hasLiked: false,
      isFavorite: false,
      addedAt: '',
      taskItemId: 0,
      copyCount: 0,
      replyCount: 0,
      totalSize: null,
      memoCount: 0,
    };
    const dropDownMenuList = [
      { key: 'save', text: '저장', action: () => dropDownActions('SAVE', dropDownItem) },
      { key: 'change', text: '이름변경', action: () => dropDownActions('RENAME', dropDownItem) },
      { key: 'delete', text: '삭제', action: () => dropDownActions('DELETE', dropDownItem) },
    ];

    return { list: dropDownMenuList };
  };

  const educationalList = useMemo(() => {
    return fileList
      .filter((file) => file.rootType === 'EDUCATIONAL_CLASS_STUDENT_PHOTO')
      .sort((a, b) => {
        // 1. userEditable 기준 우선 정렬
        if (a.userEditable !== b.userEditable) {
          return b.userEditable ? 1 : -1; // true가 먼저 오도록
        }
        // 2. 같은 그룹에서는 날짜 오름차순
        return dayjs(a.driveItemCreatedAt).valueOf() - dayjs(b.driveItemCreatedAt).valueOf();
      });
  }, [fileList]);

  const activityList = fileList
    .filter((file) => file.rootType === 'ACTIVITY_PHOTO')
    .sort((a, b) => {
      // 1. userEditable 기준 우선 정렬
      if (a.userEditable !== b.userEditable) {
        return b.userEditable ? 1 : -1; // true가 먼저 오도록
      }
      // 2. 같은 그룹에서는 날짜 오름차순
      return dayjs(a.driveItemCreatedAt).valueOf() - dayjs(b.driveItemCreatedAt).valueOf();
    });
  const aiList = fileList
    .filter((file) => file.rootType === 'AI_IMAGE_TASK')
    .sort((a, b) => {
      // 1. userEditable 기준 우선 정렬
      if (a.userEditable !== b.userEditable) {
        return b.userEditable ? 1 : -1; // true가 먼저 오도록
      }
      // 2. 같은 그룹에서는 날짜 오름차순
      return dayjs(a.driveItemCreatedAt).valueOf() - dayjs(b.driveItemCreatedAt).valueOf();
    });
  const photoSections = useMemo(() => {
    return [
      {
        title: '우리반 아이 사진',
        data: educationalList,
        link: `${prefix.materialBoard}/${category}/${educationalList[0]?.parentSmartFolderItemId}`, // 우리반 전체 사진 제외
      },
      {
        title: '활동 사진',
        data: activityList,
        link: `${prefix.materialBoard}/${category}/${activityList[0]?.parentSmartFolderItemId}`,
      },
      {
        title: '빠른 작업 사진',
        data: aiList,
        link: `${prefix.materialBoard}/${category}/${aiList[0]?.parentSmartFolderItemId}`,
      },
    ];
  }, [educationalList, activityList, aiList, category]);

  const classCloseCallback = () => {
    classModalCallback?.();
  };

  // 우리반 관리 팝업 오픈 이벤트 핸들러
  const handleOpenClassManageModal = () => {
    openClassManageModal('', undefined, classCloseCallback);
  };

  return (
    <div className="body-content">
      {photoHomeLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader loadingMessage={null} />
        </div>
      ) : (
        photoSections.map(({ title, link, data }) => {
          return (
            <div key={title} className="sub-content">
              <div className="head-list">
                <strong className="subtitle-type1">{title}</strong>
                <div className="util-head">
                  {title === '우리반 아이 사진' ? (
                    <>
                      <Select
                        className="w-160"
                        size="small"
                        options={classOptions}
                        value={selectClass}
                        onChange={(value) => onChange(value as number)}
                      />
                      <Button
                        type="button"
                        size="small"
                        color="line"
                        className="btn-manage"
                        onClick={handleOpenClassManageModal}
                      >
                        나의 반 관리
                      </Button>
                      <Button
                        size="small"
                        color="primary"
                        icon="plus-w"
                        className="btn-add"
                        onClick={() => handleCreatePhotoFolder?.('educational')}
                      >
                        폴더생성
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="small"
                      color="primary"
                      icon="plus-w"
                      className="btn-add"
                      onClick={() => handleCreatePhotoFolder?.(title === '활동 사진' ? 'activity' : 'ai')}
                    >
                      폴더생성
                    </Button>
                  )}
                  {data.length > 12 && (
                    <Button
                      size="small"
                      color="line"
                      iconAfter="arrow-next"
                      className="btn-more"
                      onClick={() => router.push(link)}
                    >
                      더보기
                    </Button>
                  )}
                </div>
              </div>
              {data.length > 0 ? (
                <ul className="list-thumbnail-grid">
                  {data
                    .slice(0, 12) // 최대 12개까지만
                    .map((file) => {
                      return (
                        <li key={`file_${file.id}`}>
                          <Thumbnail
                            hover
                            fileType="FOLDER"
                            visualClassName="type-folder"
                            className="type-upload"
                            fileName={file.name}
                            thumbUrl={file.userEditable ? '/images/thumb_folder.png' : file.thumbUrl || ''}
                            floatingType={file.id === 0 ? FLOATING_BUTTON_TYPE.None : FLOATING_BUTTON_TYPE.Dropdown}
                            dropDownMenu={dropDownMenu(file)}
                            dropDown={dropDown(file.id)}
                            onDropDown={(event) => onDropDown(event, file.id)}
                            onClick={() => {
                              onClick?.({
                                id: file.id,
                                fileType: 'FOLDER',
                                apiType: file.smartFolderApiType,
                              });
                            }}
                            makeRenameFile={({ name, type }) =>
                              makeRenameFile?.({ name, type, id: file.parentSmartFolderItemId })
                            }
                            nameEditable={file.id === nameEditableInfo?.id}
                            userEditable={file.userEditable}
                          />
                        </li>
                      );
                    })}
                </ul>
              ) : (
                <p className="no-data">폴더가 없습니다.</p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
PhotoHomeList.displayName = 'PhotoHomeList';
export default PhotoHomeList;
