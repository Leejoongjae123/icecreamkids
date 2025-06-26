import React, { useState } from 'react';
import { ProfileEditModal } from '@/components/modal';
import useUserStore from '@/hooks/store/useUserStore';
import { useImageEditor } from '@/hooks/useImageEditor';
import { modifyPhoto } from '@/service/member/memberStore';
import useS3FileUpload from '@/hooks/useS3FileUpload';
import { useToast } from '@/hooks/store/useToastStore';
import { tokenManager } from '@/utils/tokenManager';

interface IAvatar {
  handleUpdateData?: (file: File, data: string) => void;
  isMyboard?: boolean;
  refetchData?: () => void;
  profileImage?: string;
}
// 내정보페이지에서만 쓰이는 프로필사진 편집
const AvatarEdit = ({ handleUpdateData, isMyboard, refetchData, profileImage }: IAvatar) => {
  const { postFile } = useS3FileUpload();
  const { userInfo, setUserInfo } = useUserStore();
  const addToast = useToast((state) => state.add);
  const imageEditor = useImageEditor(userInfo?.photoUrl ?? '/images/profile.png');

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<string>('');

  const handleOpenEditPopup = async () => {
    if (imageEditor.image === '/images/profile.png' || !imageEditor.image) {
      imageEditor.setImage(userInfo?.photoUrl ?? '/images/profile.png');
    }
    if (!isMyboard) {
      if (
        profileImage &&
        profileImage !== '/images/profile.png' &&
        profileImage !== userInfo?.photoUrl &&
        profileImage?.startsWith('blob:')
      ) {
        imageEditor.setImage(profileData);
      }
    }
    setIsModalOpen(true);
  };
  const handleCloseEditPopup = () => setIsModalOpen(false);

  /*
   * 프로필 편집 즉시 저장 [마이보드용]
   */
  const imageToBase64 = (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleConfirmEditPopup = async (fileOrIsChar: any) => {
    // 파일 객체가 직접 전달된 경우 (ProfileEditModal에서 크롭된 이미지 파일)
    const imageFileData = fileOrIsChar instanceof File ? fileOrIsChar : await imageEditor.getCroppedImageFile();
    if (!imageFileData || !userInfo) {
      handleCloseEditPopup();
      return;
    }

    if (isMyboard) {
      try {
        const uploadResult = await postFile({
          file: imageFileData,
          fileType: 'IMAGE',
          taskType: 'ETC',
          source: 'THUMBNAIL',
        });
        if (!uploadResult || !Array.isArray(uploadResult) || !uploadResult[0]) return;

        const imageURL = `${uploadResult[0]?.host}/${uploadResult[0]?.bucket}/${uploadResult[0]?.key}`;

        const moifyPhotoResult = await modifyPhoto(String(userInfo && userInfo.id), {
          profile: {
            photoObjectId: uploadResult[0]?.id,
            photoUrl: imageURL,
          },
        });

        imageEditor.setImage(imageURL);
        // 이미지 수정 후 프로파일 수정된 결과값 리턴 확인
        if (moifyPhotoResult?.result) {
          const result = await tokenManager.setTokenProfile({ ...moifyPhotoResult?.result });
          if (result?.userInfo) {
            setUserInfo({ ...result?.userInfo });
          }
        }
        // const result = await tokenManager.getToken();
        // if (result && result.token) {
        //   await tokenManager.setToken(result.token, { ...userInfo, photoUrl: imageURL });
        //   setUserInfo({ ...userInfo, photoUrl: imageURL });
        // }

        if (refetchData) {
          refetchData();
        }

        addToast({ message: '저장되었습니다.' });
        handleCloseEditPopup();
      } catch (error) {
        console.error('이미지 업로드 오류:', error);
      }
      return;
    }

    // 크롭된 이미지를 URL로 변환
    const imageURL = URL.createObjectURL(imageFileData);

    // MyInfo 페이지 전용: 크롭된 이미지와 파일 모두 전달
    if (handleUpdateData) {
      // 선택된 이미지 유지를 위한 useState
      const base64ImageBuffer = await imageToBase64(fileOrIsChar);
      if (base64ImageBuffer) {
        setProfileData(base64ImageBuffer as string);
      } else if (imageEditor.image) setProfileData(imageEditor.image);

      handleUpdateData(imageFileData, imageURL);
    }
    handleCloseEditPopup();
  };

  return (
    <>
      <button type="button" className="btn-edit btn-thumb" onClick={handleOpenEditPopup}>
        <span className="ico-comm ico-edit-20">프로필 수정</span>
      </button>
      {isModalOpen && (
        <ProfileEditModal
          isOpen={isModalOpen}
          imageEditor={imageEditor}
          onConfirm={handleConfirmEditPopup}
          onCancel={handleCloseEditPopup}
          isProfile
          size="medium"
          className="modal-profile"
        />
      )}
    </>
  );
};

export default AvatarEdit;
