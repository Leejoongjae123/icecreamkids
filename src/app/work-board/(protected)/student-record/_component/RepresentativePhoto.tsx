import cx from 'clsx';
import React, { useState, useRef, useMemo, useEffect } from 'react';

import { UploadModal } from '@/components/modal';
import { useImageUpload } from '@/hooks/useImageUpload';

import { Thumbnail, Button } from '@/components/common';
import {
  SmartFolderItemResult,
  SmartFolderItemResultFileType,
  StudentRecordAttachedPhotoResult,
} from '@/service/file/schemas';
import { useToast } from '@/hooks/store/useToastStore';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import useWindowSize from '@/hooks/useWindowSize';
import { useFileContext } from '@/context/fileContext';
import PreviewImage from '@/components/common/PreviewImageLayer';
import { IRegisteredImage } from './type';

type RepresentativePhotoProps = {
  attachedPhotos?: StudentRecordAttachedPhotoResult[];
  isMultiUpload?: boolean;
  disabled?: boolean;
  studentRecordId?: number;
  onChangeAttachedPhoto?: (item: IRegisteredImage[]) => void;
};

export default function RepresentativePhoto({
  attachedPhotos = [],
  isMultiUpload = true,
  disabled,
  studentRecordId,
  onChangeAttachedPhoto,
}: RepresentativePhotoProps) {
  const [uploadedFiles, setUploadedFiles] = useState<(File | SmartFolderItemResult)[]>([]);
  const [registeredImages, setRegisteredImages] = useState<IRegisteredImage[]>([]); // 등록된 이미지 상태
  const [ulistHeidht, setUlistHeidht] = useState<number>(180); // 등록된 이미지 상태
  const [isPreviewImgOpen, setIsPreviewImgOpen] = useState(false); // 사진 클릭 시 미리보기
  const [isChanged, setIsChanged] = useState(false);

  // 아이 활동 작품 미리보기
  const previewImageTemplate = {
    title: '',
    contents: '',
    thumbImageUrl: '',
    fullImageUrl: '/images/kinder_board_introduce.png',
  };
  const [previewImgItem, setPreviewImgItem] = useState<typeof previewImageTemplate>(previewImageTemplate);

  const addToast = useToast((state) => state.add);
  const { showAlert } = useAlertStore();
  const windowSize = useWindowSize();

  // 최대 이미지 제한
  const MAX_IMAGES = 300;
  const [isImageLimitReached, setIsImageLimitReached] = useState<boolean>(false); // 이미지 리미트 300개여부

  // Thumbnail 이미지
  // 대표 이미지
  const registeredImgItem = useMemo(() => {
    return registeredImages.find((img) => img.isRepresent);
  }, [registeredImages]);

  // 활동 사진 리스트
  const activityImgItems = useMemo(() => {
    return registeredImages.filter((img) => !img.isRepresent);
  }, [registeredImages]);

  // 활동 사진 리스트
  const photoItemList = useMemo(() => {
    if (registeredImgItem) return [registeredImgItem, ...activityImgItems];
    if (registeredImgItem && activityImgItems) return [registeredImgItem, ...activityImgItems];
    return [];
  }, [registeredImgItem, activityImgItems]);

  // 활동 사진 더보기 버튼 노출
  const showMoreButton = useMemo(() => {
    return photoItemList.length > 13;
  }, [photoItemList]);

  const hasData = photoItemList?.length > 0;

  // 중복 체크 및 이미지 제한 처리를 위한 헬퍼 함수
  const processNewImages = (newImages: IRegisteredImage[]) => {
    // 이미 등록된 이미지와 중복 검사
    const uniqueImages = newImages.filter(
      (newImg) =>
        !registeredImages.some(
          (regImg) =>
            regImg.registerId === newImg.registerId ||
            regImg.name === newImg.name ||
            // File 객체와 SmartFolderItemResult 객체 모두 처리
            (regImg.type === 'SMART' && regImg.photoDriveItemId === newImg.photoDriveItemId),
        ),
    );

    // 남은 슬롯 계산
    const availableCount = MAX_IMAGES - registeredImages.length;

    if (availableCount <= 0) {
      addToast({
        message: `최대 ${MAX_IMAGES}개의 이미지만 등록할 수 있습니다.`,
      });
      return [];
    }

    // 추가할 이미지 목록 (제한 적용)
    const imagesToAdd = uniqueImages.slice(0, availableCount);

    // 추가 후 제한에 도달하는지 확인
    if (registeredImages.length + imagesToAdd.length >= MAX_IMAGES) {
      setIsImageLimitReached(true);
      addToast({
        message: `최대 ${MAX_IMAGES}개 이미지 중 ${registeredImages.length + imagesToAdd.length}개가 등록되었습니다.`,
      });
      return imagesToAdd;
    }

    // 중복 메시지 처리
    if (uniqueImages.length < newImages.length) {
      const duplicateCount = newImages.length - uniqueImages.length;
      let toastMsg = `${newImages.length}개 중 ${duplicateCount}개는 중복되어 제외했습니다.`;
      if (newImages.length === duplicateCount) {
        toastMsg = `이미 등록된 이미지입니다.`;
      }
      addToast({
        message: toastMsg,
      });
      return imagesToAdd;
    }

    // 이미지 추가 개수 알림
    if (imagesToAdd.length > 0) {
      addToast({
        message: `${imagesToAdd.length}개의 이미지가 추가되었습니다.`,
      });
    }

    return imagesToAdd;
  };

  // 첨부된 이미지 제거
  const handleRemoveImage = (registerId: string) => {
    // 삭제 아이템 가져오기
    const removedImage = registeredImages.find((img) => img.registerId === registerId);
    if (removedImage) {
      setIsChanged(true);
      // registeredImages에서 삭제
      setRegisteredImages((prev) => {
        const updatedImages = prev.filter((image) => image.registerId !== registerId);
        // 제한 상태 업데이트
        if (updatedImages.length < MAX_IMAGES) setIsImageLimitReached(false);
        return updatedImages;
      });
      // // 만약 로컬 파일이었다면 URL 해제 및 uploadedFiles에서 삭제
      if (removedImage && removedImage.originalFile && removedImage.type === 'FIEL') {
        if (removedImage && removedImage?.thumbUrl) URL.revokeObjectURL(removedImage.thumbUrl || '');
        setUploadedFiles((prev) => {
          const files = prev.filter(
            (fileItem) =>
              !(
                fileItem.name === removedImage.name &&
                (fileItem as File).lastModified &&
                removedImage.photoDriveItemId
              ),
          );
          return files;
        });
      }
    }
  };

  // 대표 뱃지 클릭
  const handleBadge = (registerId: string, isRepresent: boolean | undefined) => {
    if (isRepresent) {
      const photoItems = registeredImages.map((reg) => {
        return {
          ...reg,
          isRepresent: false,
        };
      });
      setIsChanged(true);
      setRegisteredImages(photoItems);
    } else {
      showAlert({
        isConfirm: true,
        message: '대표 사진으로 설정하시겠습니까?',
        // onConfirm: () => setIsHistoryModalOpen(true),
        onConfirm: () => {
          const photoItems = registeredImages.map((reg) => {
            return {
              ...reg,
              isRepresent: reg.registerId === registerId,
            };
          });
          setIsChanged(true);
          setRegisteredImages(photoItems);
        },
        onCancel: () => {},
      });
    }
  };

  /**
   * 로컬 파일 드롭/업로드 처리 & SNB 파일 드롭/업로드 처리
   * File 객체를 StudentRecordAttachedPhotoResult 형태로 변환하여 처리합니다.
   * SmartFolderItemResult 객체를 StudentRecordAttachedPhotoResult 형태로 변환하여 처리합니다.
   */
  const handleFilesUpload = (items: File[] | SmartFolderItemResult[], isProcessed = false) => {
    if (items.length === 0) return;
    const photoItemCnt = photoItemList.length;
    if (items[0] instanceof File) {
      const fileItems = items as File[];
      setUploadedFiles((prev) => [...prev, ...fileItems]);

      // File 객체를 StudentRecordAttachedPhotoResult 형태로 변환
      const convertedImages: IRegisteredImage[] = fileItems.map((file, index) => ({
        registerId: `Upload_${Date.now() + index}`,
        id: Date.now() + index,
        name: file.name,
        sortOrder: -1,
        photoDriveItemId: file.lastModified,
        thumbUrl: URL.createObjectURL(file),
        isRepresent: photoItemCnt === 0 && index === 0,
        represent: false,
        originalFile: file,
        type: 'FIEL',
      }));

      const imagesToAdd = processNewImages(convertedImages);
      if (imagesToAdd.length > 0) {
        setIsChanged(true);
        setRegisteredImages((prev) => [...prev, ...imagesToAdd]);
      }
    } else {
      // SmartFolderItemResult 객체 처리
      const smartFolderItems = items as SmartFolderItemResult[];

      // SmartFolderItemResult 객체를 StudentRecordAttachedPhotoResult 형태로 변환
      const convertedImages: IRegisteredImage[] = smartFolderItems.map((item, index) => ({
        registerId: `smartFolder_${Date.now() + index}`,
        id: Date.now() + index,
        name: item.driveItemResult?.name || '',
        sortOrder: -1,
        photoDriveItemId: item.driveItemResult?.id,
        thumbUrl: item.thumbUrl || item.driveItemResult?.thumbUrl || '',
        isRepresent: photoItemCnt === 0 && index === 0,
        represent: false,
        type: 'SMART',
      }));

      setUploadedFiles((prev) => [...prev, ...items]);
      const imagesToAdd = isProcessed ? convertedImages : processNewImages(convertedImages);
      if (imagesToAdd.length > 0) {
        setIsChanged(true);
        setRegisteredImages((prev) => [...prev, ...imagesToAdd]);
      }
    }
  };

  const [boxState, setBoxState] = useState(false);
  const handleMore = () => {
    setBoxState((prev) => !prev);
  };

  // ulist max-height 높이 제어
  const refUlthumbnailGrid = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    if (refUlthumbnailGrid) {
      const liItem = refUlthumbnailGrid.current?.children?.[0];
      if (liItem) {
        if (liItem.clientHeight > 180) {
          setUlistHeidht(liItem.clientHeight);
          return;
        }
      }
    }
    setUlistHeidht(180);
  }, [windowSize, showMoreButton]);

  // 파일 업로드 구현
  const refUploadItem = useRef<HTMLDivElement | null>(null);

  // useImageUpload 가져오기
  const {
    isUploadModalOpen,
    drop,
    handleOpenUploadModal,
    handleCloseUploadModal,
    handleConfirmUploadModal,
    handleSetItemData,
    processUploadedFiles,
  } = useImageUpload({
    uploadedFiles,
    onFilesUpload: (items) => {
      handleFilesUpload(items, false);
    },
  });

  const [fileData, setFileData] = useState<File[]>([]);

  useEffect(() => {
    if (fileData && fileData.length > 0) {
      processUploadedFiles(fileData);
      setFileData([]);
      handleCloseUploadModal();
    }
  }, [fileData, handleCloseUploadModal, handleSetItemData, processUploadedFiles]);

  /**
   * SNB 내 컴퓨터 버튼 핸들러
   */
  const { files: snbFiles, handleFileSelect, hasNewFiles, resetNewFilesFlag } = useFileContext();

  // 파일 처리 useEffect 수정
  useEffect(() => {
    console.log('RepresentativePhoto - hasNewFiles:', hasNewFiles);
    console.log('RepresentativePhoto - snbFiles:', snbFiles);

    // 새 파일이 있는 경우에만 처리
    if (snbFiles && snbFiles.length > 0 && hasNewFiles) {
      console.log('RepresentativePhoto - 파일 처리 시작');
      const fileArray = Array.from(snbFiles);
      processUploadedFiles(fileArray);

      // 플래그 리셋 후 파일 상태 초기화
      if (resetNewFilesFlag) resetNewFilesFlag();
      handleFileSelect([]);
    }
  }, [snbFiles, hasNewFiles, resetNewFilesFlag, processUploadedFiles, handleFileSelect]);

  // ref를 drop에 연결 - moved to useEffect to prevent render phase updates
  // useEffect(() => {
  // }, [drop, refUploadItem]);
  drop(refUploadItem);

  const handleOpenModal = () => {
    if (disabled) return; // TODO: 만약 max되었을경우 얼럿처리 필요함
    handleOpenUploadModal();
  };

  // 저장된 활동 이미지 registeredImages에 저장
  useEffect(() => {
    if (attachedPhotos && attachedPhotos.length > 0) {
      const convertedImages: IRegisteredImage[] = attachedPhotos.map((attachedPhoto, index) => ({
        registerId: `Attache_${Date.now() + index}`,
        id: attachedPhoto.id,
        name: attachedPhoto.photoItem?.name || '',
        sortOrder: attachedPhoto.sortOrder,
        photoDriveItemId: attachedPhoto.photoDriveItemId,
        thumbUrl: attachedPhoto.photoItem?.thumbUrl || '',
        isRepresent: attachedPhoto.isRepresent,
        represent: attachedPhoto.represent,
        type: 'ATTACHED',
      }));
      setRegisteredImages(convertedImages);
    }
  }, [attachedPhotos, setRegisteredImages]);

  useEffect(() => {
    if (isChanged) {
      onChangeAttachedPhoto?.(registeredImages);
    }
  }, [registeredImages, onChangeAttachedPhoto, isChanged]);

  // 미리보기
  const handleOpenPreviewImg = (item: IRegisteredImage) => {
    // console.log('handleOpenPreviewImg', item);
    // const { name, thumbUrl } = item;
    // const previewItem = {
    //   title: name,
    //   fullImageUrl: thumbUrl,
    // };
    // setPreviewImgItem(previewItem as typeof previewImageTemplate);
    // setIsPreviewImgOpen(true);
  };

  const onCancel = async () => {
    setIsPreviewImgOpen(false);
    setPreviewImgItem(previewImageTemplate);
  };

  return (
    <div className="group-report">
      <div
        className={cx(
          'box-report box-picture',
          !hasData && 'box-empty',
          showMoreButton && (boxState ? 'box-open' : 'box-close'),
        )}
      >
        <div className="head-box">
          <h4 className="subtitle-type1">아이활동작품</h4>
          <div className="util-box">
            <Button
              size="small"
              color="line"
              icon="plus-g"
              className="btn-add"
              onClick={handleOpenUploadModal}
              disabled={isImageLimitReached}
            >
              사진추가
            </Button>
          </div>
        </div>
        <div ref={refUploadItem}>
          {hasData ? (
            <ul
              ref={refUlthumbnailGrid}
              className={cx('list-thumbnail-grid', registeredImgItem && 'representative-photo')}
              style={{
                ...(showMoreButton && !boxState && { maxHeight: `${ulistHeidht}px` }),
                minHeight: '100%',
              }}
            >
              {photoItemList.map((data) => (
                <li key={data.registerId} style={{ minWidth: '100%' }}>
                  <Thumbnail
                    hover
                    floating={data.isRepresent}
                    contentHideen
                    style={{ cursor: 'pointer' }}
                    className="type-upload active"
                    floatingType={data.isRepresent ? 'badge' : 'badgeClose'}
                    hoverFloatingType={data.isRepresent ? 'badge' : 'none'}
                    fileName={data.name}
                    fileType="IMAGE"
                    thumbUrl={data.thumbUrl}
                    onClose={() => handleRemoveImage(data.registerId)}
                    onBadge={() => handleBadge(data.registerId, data.isRepresent)}
                    onClick={() => handleOpenPreviewImg(data)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <button
              type="button"
              className="item-file"
              onClick={handleOpenModal}
              disabled={isImageLimitReached}
              style={{ width: '100%' }}
            >
              <span className="ico-comm ico-upload-g" />
              <strong className="tit-file">아이활동작품이 없습니다.</strong>
              <p className="txt-file">
                사진을 선택하여 여기에 드래그 하거나,
                <span className="btn-file">업로드</span>
                해주세요.
              </p>
            </button>
          )}

          {hasData && registeredImages?.length > 13 && (
            <div className="box-more">
              <button className="btn-more" onClick={handleMore} aria-expanded={boxState}>
                {boxState ? '접기' : '더보기'}
                <span className={cx('ico-comm', boxState ? 'ico-chevron-up' : 'ico-chevron-down')}>
                  {boxState ? '닫힘' : '펼쳐짐'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
      {/* 업로드 모달 */}
      {isUploadModalOpen && (
        <UploadModal
          isOpen={isUploadModalOpen}
          onCancel={handleCloseUploadModal}
          onConfirm={handleConfirmUploadModal}
          setItemData={handleSetItemData}
          setFileData={setFileData}
          taskType="STUDENT_RECORD"
          allowsFileTypes={[SmartFolderItemResultFileType.IMAGE]}
          isMultiUpload={isMultiUpload}
        />
      )}
      <PreviewImage preview={previewImgItem} isOpen={isPreviewImgOpen} onCancel={onCancel} />
    </div>
  );
}
