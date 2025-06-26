import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button, ModalBase } from '@/components/common';
import Cropper from 'react-cropper';

import cx from 'clsx';
import { IProfileEditModal } from '@/components/modal/proifile-edit/types';
import { useGetAllPhotos } from '@/service/core/coreStore';
import { BasicProfilePhotoResult } from '@/service/core/schemas';
import CharacterListStyle from './list_character.module.scss';

// API가 정적이므로 한 번 호출한 결과를 캐싱합니다.
let cachedCharacterPhotos: BasicProfilePhotoResult[] | null = null;

export const ProfileEditModal: React.FC<IProfileEditModal> = ({
  isOpen,
  size,
  onCancel,
  onConfirm,
  imageEditor,
  isProfile,
  ...props
}) => {
  const { image, cropperRef, handleImageUpload, handleZoomIn, setImage, handleZoomOut, handleRotate, isUploadImage } =
    imageEditor;

  const [currentImage, setCurrentImage] = useState<string>(image);
  const [selectedCharacter, setSelectedCharacter] = useState<number | null>(null);
  // const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUploaded, setFileUploaded] = useState<boolean>(false);
  const [showCharacterList, setShowCharacterList] = useState<boolean>(false);

  const [characterPhotos, setCharacterPhotos] = useState<BasicProfilePhotoResult[]>([]);

  // API 데이터 가져오기
  const { data: apiData } = useGetAllPhotos();
  /**
   * 캐릭터를 선택했을 때 호출되는 함수
   */
  const handleCharacterOptionSelect = useCallback(
    async (photo: BasicProfilePhotoResult, index: number) => {
      try {
        setSelectedCharacter(index);
        setCurrentImage(photo.imageUrl);
        setImage(photo.imageUrl);
      } catch (error) {
        console.error('캐릭터 이미지 적용 실패:', error);
      }
    },
    [setImage],
  );

  // 1. 캐릭터 사진 API 호출 및 캐싱 처리
  useEffect(() => {
    if (cachedCharacterPhotos) {
      setCharacterPhotos(cachedCharacterPhotos);
    } else if (apiData?.result) {
      cachedCharacterPhotos = apiData.result;
      setCharacterPhotos(apiData.result);
    }
  }, [apiData]);

  // 2. 파일 업로드가 완료되면 캐릭터 관련 상태 초기화
  useEffect(() => {
    if (fileUploaded) {
      setShowCharacterList(false);
      setSelectedCharacter(null);
      // setSelectedFile(null);
      setCurrentImage(image);
    }
  }, [fileUploaded, image]);

  // 3. currentImage가 변경되면 Cropper 인스턴스의 이미지를 교체
  useEffect(() => {
    if (currentImage && cropperRef.current?.cropper.replace) {
      cropperRef.current.cropper.replace(currentImage);
    }
  }, [currentImage, cropperRef]);

  // 4. 캐릭터 목록이 열릴 때, 아직 선택된 캐릭터가 없으면 첫 번째 캐릭터를 기본 선택
  useEffect(() => {
    if (showCharacterList && selectedCharacter === null && characterPhotos.length > 0) {
      handleCharacterOptionSelect(characterPhotos[0], 0);
    }
  }, [showCharacterList, selectedCharacter, characterPhotos, handleCharacterOptionSelect]);

  // 5. 컴포넌트 언마운트 시 blob URL 해제
  useEffect(() => {
    return () => {
      if (currentImage?.startsWith('blob:')) {
        URL.revokeObjectURL(currentImage);
      }
    };
  }, [currentImage]);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFileUploaded(true);
      setShowCharacterList(false);
      setSelectedCharacter(null);
      // setSelectedFile(null);
      handleImageUpload(e);
    },
    [handleImageUpload],
  );

  /**
   * "캐릭터 설정" 버튼 클릭 시, 캐릭터 목록을 표시
   */
  const handleSelectCharacter = useCallback(() => {
    setShowCharacterList(true);
    setFileUploaded(false);
  }, []);

  const handleConfirm = useCallback(() => {
    // 기본 이미지인 경우, 취소로 처리
    if (image === '/images/profile.png') {
      onCancel?.();
      return;
    }

    // 캐릭터를 선택한 경우와 파일 업로드 경우 모두 크롭된 이미지 사용
    // 고품질 설정으로 캔버스 생성
    const croppedCanvas = cropperRef.current?.cropper.getCroppedCanvas({
      maxWidth: 4096, // 최대 너비 설정 (고해상도 지원)
      maxHeight: 4096, // 최대 높이 설정 (고해상도 지원)
      fillColor: 'transparent', // 투명 배경 지원
      imageSmoothingEnabled: true, // 이미지 부드럽게 처리
      imageSmoothingQuality: 'high', // 높은 이미지 품질
    });

    const croppedImage = croppedCanvas?.toDataURL('image/png', 1.0); // PNG 형식으로 최대 품질 설정

    if (croppedImage && croppedCanvas) {
      // 크롭된 이미지 URL을 imageEditor의 image 값으로 설정
      setImage(croppedImage);

      // 크롭된 이미지를 파일로 변환하여 전달
      croppedCanvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], 'cropped-image.png', { type: 'image/png' }); // PNG 형식 사용
            onConfirm?.(file);
          } else {
            onConfirm?.();
          }
        },
        'image/png', // PNG 형식 (투명도 지원 및 무손실)
        1.0, // 최대 품질 (100%)s
      );
    } else {
      onConfirm?.();
    }
  }, [image, cropperRef, onCancel, setImage, onConfirm]);

  const handleCancel = useCallback(() => {
    // const isCustomImage = image.startsWith('https://') || image.startsWith('blob:');

    // if (!isCustomImage) {
    // }
    // 기본 이미지로 초기화
    setImage('/images/profile.png');
    setCurrentImage('/images/profile.png');

    // 공통 초기화
    setShowCharacterList(false);
    setSelectedCharacter(null);
    // setSelectedFile(null);
    setFileUploaded(false);

    if (cropperRef.current?.cropper) {
      cropperRef.current.cropper.reset();
      // if (!isCustomImage) {
      //   // 기본 이미지를 다시 로드
      //   cropperRef.current.cropper.replace('/images/profile.png');
      // } else {
      //   // 사용자 이미지로 복원
      //   cropperRef.current.cropper.replace(image);
      // }
    }
    onCancel?.();
  }, [cropperRef, onCancel, setImage]);
  // }, [image, cropperRef, onCancel, setImage]);

  if (!isOpen) return null;

  return createPortal(
    <ModalBase
      isOpen={isOpen}
      cancelText="닫기"
      confirmText="저장"
      message="프로필 사진 편집"
      size={size}
      onCancel={handleCancel}
      onConfirm={handleConfirm}
      disabled={!isUploadImage}
      {...props}
    >
      {!isProfile && (
        <span className="txt-tip" style={{ marginBottom: '24px' }}>
          <span className="ico-comm ico-information-14-g" />
          사진을 등록하면, 아이별 분류가 정확해져요.
        </span>
      )}
      {/* 이미지 편집 영역 */}
      <div className="group-image">
        <div
          className={cx('item-thumb', {
            [CharacterListStyle.itemThumbChild]: !isProfile,
          })}
        >
          <Cropper
            ref={cropperRef}
            src={!isProfile ? '/image/childProfileImage.jpg' : currentImage}
            aspectRatio={1}
            viewMode={3}
            className={CharacterListStyle.img_preview}
            guides={false} // 내부 점선 가이드 숨김
            background={false} // 배경(회색 체크무늬) 숨김
            autoCropArea={1} // 자동 크롭 영역 비율
            highlight={isProfile} // 모달 효과(외부 영역 반투명) 여부
            dragMode="move" // 이미지를 드래그로 이동
            cropBoxMovable={false} // 크롭 박스 이동 비활성화
            cropBoxResizable={false} // 크롭 박스 리사이즈 활성화
            autoCrop // 초기 자동 크롭 활성화
            modal={isProfile} // 크롭 영역 밖 어둡게 처리
            toggleDragModeOnDblclick={false}
            disabled={!isUploadImage} // 비활성화
            responsive // 반응형 크롭 박스 조정
            checkCrossOrigin // CORS 확인 활성화
            checkOrientation // 이미지 방향(EXIF) 확인S 처리로 품질 손실 방지
          />
        </div>

        {/* 우측 버튼 영역 */}
        <div className="box-btn">
          <div className="top-btn">
            <input
              type="file"
              className="screen_out"
              accept={isProfile ? 'image/*' : 'image/png, image/jpeg, image/jpg'}
              id="inputFile_profile_edit"
              onChange={handleFileInputChange}
            />
            <label
              style={{ display: 'block', cursor: 'pointer' }}
              className="btn btn-edit btn-small btn-line"
              htmlFor="inputFile_profile_edit"
            >
              찾아보기
            </label>
            {isProfile && (
              <Button className="btn-edit" size="small" color="black" onClick={handleSelectCharacter}>
                캐릭터 설정
              </Button>
            )}
          </div>
          <div className="cont-btn">
            <Button
              className="btn-edit"
              size="small"
              color="line"
              icon="zoom-in-14"
              disabled={!isUploadImage}
              onClick={handleZoomIn}
            >
              사진 확대
            </Button>
            <Button
              className="btn-edit"
              size="small"
              color="line"
              icon="zoom-out-14"
              disabled={!isUploadImage}
              onClick={handleZoomOut}
            >
              사진 축소
            </Button>
            <Button
              className="btn-edit"
              size="small"
              color="line"
              icon="rotate-14"
              disabled={!isUploadImage}
              onClick={handleRotate}
            >
              사진 회전
            </Button>
          </div>
        </div>
      </div>

      {/* 아이 등록일 경우 - 가이드 영역 */}
      {!isProfile && (
        <div className="group-info">
          <strong className="tit-info">사진 등록 가이드</strong>
          <ul className="list-info">
            <li>아이 얼굴이 잘 보이는 정면 사진을 등록해 주세요.</li>
            <li>얼굴 가이드에 맞춰 사진을 올려주세요.</li>
            <li>밝은 곳에서 찍은 사진을 올려주세요.</li>
            <li>단체 사진이 아닌 단독 사진으로 올려주세요.</li>
            <li>2G 이하의 사진으로 올려주세요.</li>
            <li>확장자 PNG, JPGE, JPG 파일로 올려주세요.</li>
          </ul>
        </div>
      )}

      {/* 프로필 등록일 경우 캐릭터 목록 영역 */}
      {isProfile && showCharacterList && characterPhotos.length > 0 && (
        <div className="wrap-character">
          <strong className="screen_out">캐릭터로 프로필 이미지 설정하기</strong>
          <ul className={CharacterListStyle.list_thumb}>
            {characterPhotos.map((photo, index) => (
              <li key={photo.imageUrl + new Date()}>
                <input
                  type="radio"
                  id={`character${index}`}
                  name="character"
                  value={index}
                  onChange={() => handleCharacterOptionSelect(photo, index)}
                  checked={selectedCharacter === index}
                />
                <label className={CharacterListStyle.item_thumb} htmlFor={`character${index}`}>
                  <img
                    className={CharacterListStyle.character}
                    src={photo.imageUrl}
                    alt={`캐릭터 ${index + 1} 이미지`}
                  />
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ModalBase>,
    document.getElementById('modal-root') as HTMLElement,
  );
};

ProfileEditModal.displayName = 'ProfileEditModal';
export default ProfileEditModal;
