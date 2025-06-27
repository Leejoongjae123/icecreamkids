import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { IImageUploader } from '@/app/(auth)/my-board/[tab]/(story-board)/_components/ImageUploader/types';
import {
    CdnFileResult,
    SmartFolderItemResult,
    StoryBoardContentForAddContentType,
    StoryBoardContentPhotoForAdd,
    StoryBoardContentPhotoResult,
} from '@/service/file/schemas';
import Cropper from 'react-cropper';
import { useImageEditor } from '@/hooks/useImageEditor';
import { UploadModal } from '@/components/modal';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import { getDefaultImageData } from '@/app/(auth)/my-board/utils';
import { useGetCdnFile } from '@/hooks/useGetCdnFile';
import { getBypassCorsUrl } from '@/utils';
import { usePathname } from 'next/navigation';
import useUserStore from '@/hooks/store/useUserStore';

const ImageUploader: React.FC<Omit<IImageUploader, 'control'>> = ({
                                                                      data,
                                                                      onChange,
                                                                      index,
                                                                      isEdit,
                                                                      onOpenModal,
                                                                      onCloseModal,
                                                                      isUploadModalOpen,
                                                                      previewMode = false,
                                                                  }: Omit<IImageUploader, 'control'>) => {
    const imageData: StoryBoardContentPhotoResult & { driveItemIdOrKey: string } = useMemo(() => {
        return data.images?.[index] as StoryBoardContentPhotoResult & { driveItemIdOrKey: string };
    }, [data.images, index]);

    const { showAlert } = useAlertStore();
    const { userInfo } = useUserStore();

    const { image, cropperRef, setImage, handleZoomIn, handleZoomOut, getCroppedImageData } = useImageEditor(
        imageData?.photoUrl ?? '',
    );

    useEffect(() => {
        setImage(imageData?.photoUrl ?? '');
    }, [imageData?.photoUrl, setImage]);

    const isDefault = useMemo(() => {
        return !image;
    }, [image]);

    const [itemData, setItemData] = useState<SmartFolderItemResult[]>([]);
    const [fileData, setFileData] = useState<File[]>([]);

    const handleOpenUploadModal = () => {
        onOpenModal(); // 부모 컴포넌트에서 모달을 열기 위한 함수 호출
    };

    const handleCloseUploadModal = () => {
        onCloseModal(); // 부모 컴포넌트에서 모달을 닫기 위한 함수 호출
    };

    const handleDeleteImageData = useCallback(() => {
        const newImages = data.images?.map((img, idx) =>
            idx === index ? getDefaultImageData(index) : img,
        ) as StoryBoardContentPhotoForAdd[];
        onChange({ images: newImages });
    }, [data.images, index, onChange]);

    const handleDeleteImageFile = useCallback(() => {
        const newImageFiles = data.imageFiles?.map((file, idx) => (idx === index ? undefined : file));
        onChange({ imageFiles: newImageFiles });
    }, [data.imageFiles, index, onChange]);

    const handleDelete = () => {
        handleDeleteImageData();
        handleDeleteImageFile();
        setImage('');
    };

    const handleInitImageData = useCallback(() => {
        if (!cropperRef.current?.cropper.getImageData().aspectRatio) return;
        cropperRef.current?.cropper?.zoomTo(0);
    }, [cropperRef]);

    const currentPath = usePathname();

    const elmStoryBoardForm = document.querySelector('#story-board > group-form');
    const storyBoardFormWidth = useMemo(() => {
        if (elmStoryBoardForm) return elmStoryBoardForm.clientWidth;
        if (previewMode) {
            if (userInfo) return 1360 - 480 - 50 - 68;
            return 1360 - 480 - 68;
        }
        return -1;
    }, [elmStoryBoardForm, previewMode, userInfo]);

    const imageRatioData = useMemo(() => {
        if (previewMode) {
            if (storyBoardFormWidth > 0) {
                const ratio = storyBoardFormWidth / 1040;
                return parseFloat(ratio.toFixed(4));
            }
        }
        return 1;
    }, [previewMode, storyBoardFormWidth]);

    const getImageRatio = useCallback(
        (contentType: StoryBoardContentForAddContentType) => {
            if (previewMode) {
                if (imageRatioData > 0) {
                    return { x: imageRatioData, y: imageRatioData };
                }
            }
            if (contentType === 'TYPE_B') return { x: 0.7326, y: 0.7326 };
            if (contentType === 'TYPE_C') return { x: 0.73, y: 0.73 };
            if (contentType === 'TYPE_D') return { x: 0.7274, y: 0.7273 };
            if (['TYPE_E', 'TYPE_F'].includes(contentType)) return { x: 0.7247, y: 0.7247 };
            return { x: 1, y: 1 };
        },
        [imageRatioData, previewMode],
    );

    const handleInitViewImageData = useCallback(() => {
        if (!cropperRef.current?.cropper.getImageData().aspectRatio) return;

        // 비율 계산 (자료 상세 대응)
        const ratio = getImageRatio(data.contentType);
        cropperRef.current?.cropper?.setCanvasData({
            left: currentPath.includes('preview') ? imageData.positionX * ratio.x : imageData.positionX,
            top: currentPath.includes('preview') ? imageData.positionY * ratio.y : imageData.positionY,
            width: currentPath.includes('preview') ? imageData.width * ratio.x : imageData.width,
            height: currentPath.includes('preview') ? imageData.height * ratio.y : imageData.height,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cropperRef, currentPath, data.contentType, imageData.id]);

    const latestDataRef = useRef(data);
    const latestOnChangeRef = useRef(onChange);

    useEffect(() => {
        latestDataRef.current = data;
    }, [data]);

    useEffect(() => {
        latestOnChangeRef.current = onChange;
    }, [onChange]);

    const handleSaveImageData = useCallback(() => {
        const images = latestDataRef.current.images ?? [];
        const newImages = images?.map((img, idx) =>
            idx === index
                ? {
                    ...img,
                    ...getCroppedImageData(),
                }
                : img,
        ) as StoryBoardContentPhotoForAdd[];
        latestOnChangeRef.current({ images: newImages });
    }, [getCroppedImageData, index, latestOnChangeRef]);

    const handleZoomInImage = () => {
        handleZoomIn();
        handleSaveImageData();
    };

    const handleZoomOutImage = () => {
        handleZoomOut();
        handleSaveImageData();
    };

    const handleUploadedFile = useCallback(() => {
        if (fileData.length > 0) {
            // 파일 상태가 변경되었을 때 실행되는 코드
            const file = fileData[0]; // 파일 선택
            if (file) {
                const reader = new FileReader();

                // 파일을 읽었을 때 실행되는 콜백 함수
                reader.onloadend = () => {
                    setImage(reader.result as string); // 이미지 URL을 상태에 저장
                };

                // 자료 그대로, 이미지 위치값만 저장
                handleSaveImageData();

                const newImageFiles: (File | undefined)[] = data.imageFiles?.map((f, idx) => (idx === index ? file : f)) as (
                    | File
                    | undefined
                    )[];
                onChange({ imageFiles: newImageFiles });
                setFileData([]);

                reader.readAsDataURL(file); // 파일을 data URL로 변환
            }
        }
    }, [data.imageFiles, fileData, handleSaveImageData, index, onChange, setImage]);

    /* 원본 자료 요청 */
    const { getCdnFile } = useGetCdnFile();

    const handleUploadedItem = useCallback(
        async (items: SmartFolderItemResult[]) => {
            if (items.length < 1) return;

            if (!items[0]?.driveItemKey) {
                showAlert({ message: '업로드에 실패했습니다.' });
                return;
            }

            const cdnFile: CdnFileResult[] | undefined = await getCdnFile(items[0]);
            if (cdnFile && cdnFile.length > 0 && cdnFile[0].url) setImage(getBypassCorsUrl(cdnFile[0].url));

            const newImages = data.images?.map((img, idx) =>
                idx === index
                    ? {
                        ...img,
                        ...getCroppedImageData(),
                        driveItemIdOrKey: items[0]?.driveItemKey,
                    }
                    : img,
            ) as StoryBoardContentPhotoForAdd[];
            onChange({ images: newImages });
            setItemData([]);
        },
        [data.images, getCdnFile, getCroppedImageData, index, onChange, setImage, showAlert],
    );

    const handleConfirmUploadModal = async (items?: SmartFolderItemResult[]) => {
        if (items && items.length > 0) await handleUploadedItem(items);
        handleCloseUploadModal();
    };

    useEffect(() => {
        handleUploadedFile();
    }, [fileData, handleUploadedFile, setImage]); // fileData 변경될 때마다 실행

    /* 이미지 선택 및 편집  */
    const renderEditView = () => {
        if (isDefault) {
            return (
                <>
                    <span className="ico-comm ico-upload-60" />
                    <button type="button" className="btn-image" onClick={handleOpenUploadModal}>
                        <span className="screen_out">사진 선택</span>
                    </button>
                </>
            );
        }

        return (
            <div className="visual-thumbnail">
                <Cropper
                    style={{ width: '100%' }}
                    className="visual-thumbnail"
                    crossOrigin="anonymous"
                    ref={cropperRef}
                    src={image}
                    alt={imageData ? `img_${imageData?.contentId}` : 'no image'}
                    guides={false}
                    background={false}
                    viewMode={2}
                    autoCropArea={1}
                    dragMode="move"
                    autoCrop={false}
                    cropBoxMovable={false}
                    cropBoxResizable={false}
                    responsive
                    zoomOnWheel={false}
                    toggleDragModeOnDblclick={false} // crop 전환 사용 - 기본값 true
                    cropend={handleSaveImageData}
                    zoom={handleSaveImageData}
                    ready={imageData?.contentId ? handleInitViewImageData : handleInitImageData}
                />
                <button type="button" className="btn-delete" onClick={handleDelete}>
                    <span className="ico-comm ico-close2">삭제</span>
                </button>
                <div className="group-controls">
                    <button type="button" className="btn-zoomin" onClick={handleZoomInImage}>
                        <span className="ico-comm ico-zoomin">확대</span>
                    </button>
                    <button type="button" className="btn-zoomout" onClick={handleZoomOutImage}>
                        <span className="ico-comm ico-zoomout">축소</span>
                    </button>
                </div>
            </div>
        );
    };

    /* 이미지 읽기 전용 */
    const renderViewMode = () => (
        <Cropper
            style={{ width: '100%' }}
            className="visual-thumbnail"
            crossOrigin="anonymous"
            ref={cropperRef}
            src={imageData?.photoUrl}
            alt="Image Viewer"
            guides={false}
            background={false}
            viewMode={2}
            autoCropArea={1}
            dragMode="none"
            autoCrop={false}
            cropBoxMovable={false}
            cropBoxResizable={false}
            zoomable={false}
            rotatable={false}
            responsive
            toggleDragModeOnDblclick={false} // crop 전환 사용 - 기본값 true
            ready={handleInitViewImageData}
        />
    );

    return (
        <>
            <div className="item-form type-image story-board-image-editor" style={{ backgroundColor: '#E5E7EC' }}>
                {isEdit ? renderEditView() : renderViewMode()}
            </div>
            {isUploadModalOpen && (
                <UploadModal
                    isOpen={isUploadModalOpen}
                    onCancel={handleCloseUploadModal}
                    onConfirm={handleConfirmUploadModal}
                    setItemData={setItemData}
                    setFileData={setFileData}
                    taskType="STORY_BOARD"
                    allowsFileTypes={['IMAGE']}
                    isMultiUpload={false}
                />
            )}
        </>
    );
};

export default ImageUploader;
