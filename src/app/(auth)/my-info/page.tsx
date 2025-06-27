'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import cx from 'clsx';
import { isEqual } from 'lodash';

import { MY_LOCATION, MY_JOB, IP_ADDRESS } from '@/const';
import { modifyPhoto, useChangePassword, useGetById, useUpdateAccountInfo } from '@/service/member/memberStore';
import useUserStore, { UserInfo } from '@/hooks/store/useUserStore';
import {
  AccountV2ForUpdateOrganizationAndPositionClassification,
  ApiResponseAccountResultV2,
} from '@/service/member/schemas';
import { Form, FormField, Textarea, Input, Button, Radio, Avatar } from '@/components/common';
import useS3FileUpload from '@/hooks/useS3FileUpload';
import { useImageEditor } from '@/hooks/useImageEditor';
import AvatarEdit from '@/components/common/AvatarEdit';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import PasswordChangeModal from '@/components/modal/change-password';
import { useToast } from '@/hooks/store/useToastStore';
import { tokenManager } from '@/utils/tokenManager';
import { IFormData, IAvatarProps, IButtonGroupProps, IPasswordFormData } from './types';

// 메인 폼 유효성
const formSchema = z.object({
  nickname: z.string().min(1, '닉네임을 입력해주세요.').optional(),
  introduce: z.string().optional(),
  email: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().email('올바른 이메일형식을 입력해주세요.').nullable().optional(),
  ),
  location: z.string().optional(),
  org: z.string().optional(),
  job: z.string().optional(),
});

// 비밀번호 변경 팝업 유효성 체크
const passwordSchema = z
  .object({
    phone: z
      .string()
      .min(1, '전화번호를 입력해 주세요.')
      .regex(/^[0-9]+$/, '숫자만 입력해 주세요.'),
    password: z
      .string()
      .min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
      .max(48, '비밀번호는 최대 48자를 넘을 수 없습니다.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  });

const getDefaultFormValues = (): IFormData => ({
  nickname: '',
  introduce: '',
  phone: '',
  password: '',
  email: '',
  location: '서울', // 기본설정
  org: '-',
  job: 'NURSERY_TEACHER',
});

const MemoizedAvatar = memo(
  ({ src, classNames, isModifyMode, handleUpdateData }: IAvatarProps) => (
    <Avatar src={src} classNames={cx(classNames)}>
      {isModifyMode && <AvatarEdit profileImage={src} handleUpdateData={handleUpdateData} />}
    </Avatar>
  ),
  (prev, next) =>
    prev.src === next.src && prev.isModifyMode === next.isModifyMode && prev.classNames === next.classNames,
);

MemoizedAvatar.displayName = 'MemoizedAvatar';

const ButtonGroup = memo(
  ({ isModifyMode, onCancel, onToggleModify }: IButtonGroupProps) => (
    <div className="group-btn">
      {isModifyMode ? (
        <>
          <Button type="button" size="medium" color="gray" onClick={onCancel}>
            취소
          </Button>
          <Button type="submit" size="medium" color="black">
            저장
          </Button>
        </>
      ) : (
        <Button
          type="button"
          size="medium"
          color="line"
          onClick={(e) => {
            e?.preventDefault();
            onToggleModify();
          }}
        >
          수정
        </Button>
      )}
    </div>
  ),
  (prev, next) => prev.isModifyMode === next.isModifyMode,
);

ButtonGroup.displayName = 'ButtonGroup';

const handleRadioChange = (onChange: (value: string) => void) => (e: React.MouseEvent<HTMLInputElement>) => {
  const { value } = e.currentTarget;
  onChange(value);
};

export default function MyInfo() {
  const { userInfo, setUserInfo } = useUserStore();
  const router = useRouter();
  const { postFile } = useS3FileUpload();
  const { mutateAsync: updateAccountInfo } = useUpdateAccountInfo();
  const { mutateAsync: changePassword } = useChangePassword();
  const { showAlert } = useAlertStore();
  const addToast = useToast((state) => state.add);

  const [isModifyMode, setModifyMode] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [accountId, setAccountId] = useState<number>(0);
  const [profileImage, setProfileImage] = useState<string>('');
  const [imageFileData, setImageFileData] = useState<File | null>(null);
  const [isPasswordEditModalOpen, setPasswordEditModal] = useState<boolean>(false);

  // userId 및 프로필 사진 클래스
  const userId = useMemo(() => userInfo?.accountId?.toString() || '', [userInfo?.accountId]);
  const photoUrlClass = useMemo(() => (userInfo?.photoUrl ? 'thumb-profile' : ''), [userInfo?.photoUrl]);

  const form = useForm<IFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultFormValues(),
    mode: 'onSubmit',
  });

  const formPassword = useForm<IPasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { phone: '', password: '', confirmPassword: '' },
    mode: 'onChange',
  });

  const { data: userInfoData, refetch } = useGetById<ApiResponseAccountResultV2>(userId, {
    includes: 'profiles',
  });
  const userDataResult = userInfoData?.result;
  const { setImage, image: savedImage } = useImageEditor(
    userDataResult?.profiles?.[0]?.photoUrl ?? '/images/profile.png',
  );

  const tokenProfileChange = useCallback(
    async (updatedUserInfo: object) => {
      const profileResult = await tokenManager.setTokenProfile(updatedUserInfo);
      if (profileResult?.userInfo) {
        setUserInfo({ ...profileResult?.userInfo });
      }
    },
    [setUserInfo],
  );

  useEffect(() => {
    if (!isModifyMode) {
      if (userDataResult && userInfo) {
        if (userDataResult?.profiles?.[0]) {
          if (userDataResult?.profiles?.[0]?.id === userInfo.id) {
            if (userDataResult?.profiles?.[0]?.photoUrl !== userInfo.photoUrl) {
              const updatedUserInfo = {
                ...userInfo,
                ...userDataResult?.profiles?.[0],
              };
              tokenProfileChange(updatedUserInfo);
            }
          }
        }
      }
    }
  }, [userDataResult, userInfo, isModifyMode, tokenProfileChange]);

  useEffect(() => {
    // 프로필 이미지 초기화 (데이터 변화가 있을 때만)
    const photo = userDataResult?.profiles?.[0]?.photoUrl || '/images/profile.png';
    setProfileImage(photo);
    setImage(photo);
  }, [userDataResult?.profiles, setImage]);

  const resetUserForm = useCallback(() => {
    if (!userDataResult?.profiles?.[0]) return;
    const profile = userDataResult.profiles[0];
    // 수정 모드가 아니거나 폼이 변경되지 않은 경우에만 초기화
    if (!isModifyMode || !form.formState.isDirty) {
      form.reset({
        nickname: profile.name || '',
        introduce: profile.bio || '',
        phone: userDataResult.cellPhoneNumber || '',
        email: userDataResult.email || '',
        location: userDataResult.organizationName || '서울',
        org: userDataResult.workplaceName || '-',
        job: userDataResult.organizationAndPositionClassification || 'NURSERY_TEACHER',
      });
    }
    setAccountId(profile.accountId);
    setProfileImage(profile.photoUrl || '/images/profile.png');
  }, [userDataResult, isModifyMode, form]);

  useEffect(() => {
    resetUserForm();
  }, [resetUserForm]);

  const handleClickBack = useCallback(() => router.back(), [router]);

  const handleUpdateData = useCallback(
    (file: File, image: string) => {
      // 크롭된 이미지 파일과 URL 저장
      setImageFileData(file);
      setProfileImage(image);
      setImage(image);
    },
    [setImage],
  );

  const handleToggleModifyMode = useCallback(() => {
    setModifyMode((prev) => !prev);
  }, []);

  const handleCancel = useCallback(() => {
    if (isModifyMode) {
      handleToggleModifyMode();
      resetUserForm(); // 취소 시 초기화
    } else {
      handleClickBack();
    }
  }, [isModifyMode, handleToggleModifyMode, handleClickBack, resetUserForm]);

  const uploadProfileImageHandler = useCallback(async (): Promise<string | null> => {
    if (!imageFileData || !userInfo) return null;
    try {
      const uploadResult = await postFile({
        file: imageFileData,
        fileType: 'IMAGE',
        taskType: 'ETC',
        source: 'THUMBNAIL',
      });
      if (!uploadResult || !Array.isArray(uploadResult) || !uploadResult[0]) return null;
      const imageURL = `${uploadResult[0]?.host}/${uploadResult[0]?.bucket}/${uploadResult[0]?.key}`;
      const modifyImage = await modifyPhoto(String(userInfo.id), {
        profile: {
          photoObjectId: uploadResult[0]?.id,
          photoUrl: imageURL,
        },
      });
      if (modifyImage.status === 200) {
        setImage(imageURL);
        setProfileImage(imageURL);
        addToast({ message: '저장되었습니다.' });
        return imageURL;
      }
    } catch (error) {
      console.error('Image upload error:', error);
      showAlert({ message: '이미지 업로드 오류가 발생하였습니다.' });
    }
    return null;
  }, [imageFileData, userInfo, postFile, setImage, addToast, showAlert]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const updateAccountInfoHandler = useCallback(
    async (data: IFormData) => {
      const result = await updateAccountInfo({
        accountId: accountId.toString(),
        data: {
          account: {
            email: data.email || null,
            cellPhoneNumber: data.phone,
            name: data.nickname,
            organizationAndPositionClassification: data.job as AccountV2ForUpdateOrganizationAndPositionClassification,
            workplaceName: data.org,
            organizationName: data.location,
          },
          profile: {
            profileId: userDataResult?.profiles?.[0]?.id || 0,
            name: data.nickname,
            bio: data.introduce,
          },
        },
      });
      return result;
    },
    [accountId, updateAccountInfo, userDataResult],
  );

  const onSubmit = useCallback(
    async (data: IFormData) => {
      try {
        const originalData = {
          nickname: userDataResult?.profiles?.[0]?.name || '',
          introduce: userDataResult?.profiles?.[0]?.bio || '',
          phone: userDataResult?.cellPhoneNumber || '',
          email: userDataResult?.email || null,
          location: userDataResult?.organizationName || '서울',
          org: userDataResult?.workplaceName || '-',
          job: userDataResult?.organizationAndPositionClassification || 'NURSERY_TEACHER',
        };

        // 변경사항이 없으면 수정 모드 종료
        if (!imageFileData && isEqual(originalData, data)) {
          setModifyMode(false);
          return;
        }

        // 이미지 업로드를 먼저 처리
        let imageURL: string | null = null;
        if (imageFileData) {
          imageURL = await uploadProfileImageHandler();
          console.log('이미지 저장완료');
        }

        // 이미지 업로드 여부와 관계없이 사용자 정보 업데이트 수행
        const updateResponse = await updateAccountInfoHandler(data);
        if (!updateResponse.result) throw new Error('업데이트 실패');

        if (userInfo) {
          const { result } = updateResponse;
          let userProfile = {};
          if (result.profiles) {
            if (!Array.isArray(result.profiles)) {
              userProfile = result.profiles;
            } else {
              userProfile = { ...result.profiles[0] };
            }
          } else {
            userProfile = { ...userInfo };
          }
          const updatedUserInfo: UserInfo = {
            ...userInfo,
            ...userProfile,
            email: data.email || userInfo.email || '',
            name: data.nickname,
            ...(imageURL ? { photoUrl: imageURL } : {}),
          };
          await tokenProfileChange(updatedUserInfo);
          // const profileResult = await tokenManager.setTokenProfile(updatedUserInfo);
          // if (profileResult?.userInfo) {
          //   setUserInfo({ ...profileResult?.userInfo });
          // }
          // const tokenResult = await tokenManager.getToken();
          // console.log('tokenResult', tokenResult);
          // const result = await tokenManager.getToken();
          // if (result && result.token) {
          //   await tokenManager.setToken(result.token, updatedUserInfo);
          //   setUserInfo(updatedUserInfo);
          // }
        }

        await refetch();
        setModifyMode(false);
        addToast({ message: '정보가 저장되었습니다.' });
      } catch (error) {
        console.log('error', error);
        showAlert({ message: '회원정보 업데이트 오류가 발생하였습니다.' });
        console.error('회원정보 업데이트 오류:', error);
      }
    },
    [
      userDataResult?.profiles,
      userDataResult?.cellPhoneNumber,
      userDataResult?.email,
      userDataResult?.organizationName,
      userDataResult?.workplaceName,
      userDataResult?.organizationAndPositionClassification,
      imageFileData,
      updateAccountInfoHandler,
      userInfo,
      refetch,
      addToast,
      uploadProfileImageHandler,
      tokenProfileChange,
      showAlert,
    ],
  );

  const onSubmitPassword = useCallback(
    async (data: IPasswordFormData) => {
      if (!isVerified) {
        formPassword.setError('phone', {
          type: 'manual',
          message: '인증번호를 확인해 주세요.',
        });
        return;
      }
      try {
        await changePassword({
          accountId: accountId.toString(),
          data: { newPassword: data.password, ip: IP_ADDRESS },
        });
        setPasswordEditModal(false);
        addToast({ message: '비밀번호가 변경되었습니다.' });
      } catch (error) {
        console.error('비밀번호 변경 오류:', error);
        showAlert({ message: '비밀번호 변경 오류가 발생하였습니다.' });
      }
    },
    [isVerified, formPassword, accountId, changePassword, showAlert, addToast],
  );

  const isPasswordFormValid = useMemo(() => formPassword.formState.isValid, [formPassword.formState.isValid]);
  const jobValue = form.getValues('job');
  const jobKey = useMemo(() => MY_JOB.find(({ value }) => value === jobValue)?.text ?? '', [jobValue]);

  return (
    <div className="wrap-my">
      <h3 className="title-type3">내 정보 관리</h3>
      <Form form={form} className="type-vertical" onSubmit={onSubmit}>
        {/* 기본 정보 */}
        <fieldset>
          <legend className="screen_out">기본 정보</legend>
          <div className="fieldset-form fieldset-thumb">
            <strong className="screen_out">프로필 이미지</strong>
            <MemoizedAvatar
              src={profileImage}
              classNames={photoUrlClass}
              isModifyMode={isModifyMode}
              handleUpdateData={handleUpdateData}
            />
          </div>
          <FormField
            control={form.control}
            name="nickname"
            label="닉네임"
            render={({ field }) => (
              <Input
                id="nickname"
                sizeType="large"
                readOnly={!isModifyMode}
                {...field}
                maxLength={10}
                onKeyDown={handleKeyDown}
              />
            )}
          />
          <FormField
            control={form.control}
            name="introduce"
            label="소개"
            render={({ field }) => <Textarea id="introduce" maxLength={200} disabled={!isModifyMode} {...field} />}
          />
        </fieldset>
        {/* 계정 정보 */}
        <fieldset>
          <legend className="title-fieldset">계정 정보</legend>
          <div className="wrap-form" style={{ alignItems: 'end' }}>
            <FormField
              control={form.control}
              name="phone"
              label="전화번호"
              render={({ field }) => <Input id="phone" sizeType="large" disabled {...field} />}
            />
          </div>
          <Button
            style={{ width: '100%', marginTop: 10 }}
            type="button"
            color="line"
            onClick={() => setPasswordEditModal(true)}
            iconAfter="arrow-right-16"
          >
            비밀번호 변경하기
          </Button>
        </fieldset>
        {/* 추가 정보 */}
        <fieldset>
          <legend className="title-fieldset">추가 정보</legend>
          <FormField
            control={form.control}
            name="email"
            label="이메일"
            useErrorMessage
            render={({ field }) => (
              <Input id="email" sizeType="large" readOnly={!isModifyMode} {...field} onKeyDown={handleKeyDown} />
            )}
          />
          {isModifyMode ? (
            <FormField
              control={form.control}
              name="location"
              label="근무 지역"
              render={({ field }) => (
                <Radio
                  name="location"
                  options={MY_LOCATION}
                  disabled={!isModifyMode}
                  value={field.value}
                  onChange={handleRadioChange(field.onChange)}
                />
              )}
            />
          ) : (
            <div style={{ marginTop: 24 }}>
              <h3 className="lab-form">근무지역</h3>
              <Input id="viewLocation" sizeType="large" readOnly value={userInfoData?.result?.organizationName || ''} />
            </div>
          )}
          <FormField
            control={form.control}
            name="org"
            label="기관명"
            render={({ field }) => (
              <Input id="org" readOnly={!isModifyMode} sizeType="large" {...field} onKeyDown={handleKeyDown} />
            )}
          />
          {isModifyMode ? (
            <FormField
              control={form.control}
              name="job"
              label="직업"
              render={({ field }) => (
                <Radio
                  name="job"
                  options={MY_JOB}
                  disabled={!isModifyMode}
                  value={field.value}
                  onChange={handleRadioChange(field.onChange)}
                />
              )}
            />
          ) : (
            <div style={{ marginTop: 24 }}>
              <h3 className="lab-form">직업</h3>
              <Input id="viewJob" sizeType="large" readOnly value={jobKey} />
            </div>
          )}
        </fieldset>
        <ButtonGroup isModifyMode={isModifyMode} onCancel={handleCancel} onToggleModify={handleToggleModifyMode} />
      </Form>
      {/* 비밀번호 변경 모달 (한 소스 내 통합) */}
      {isPasswordEditModalOpen && (
        <PasswordChangeModal
          isOpen={isPasswordEditModalOpen}
          isValid={isPasswordFormValid}
          isVerified={isVerified}
          form={formPassword}
          onConfirm={formPassword.handleSubmit(onSubmitPassword)}
          onCancel={() => setPasswordEditModal(false)}
          setIsVerified={setIsVerified}
          setAccountId={setAccountId}
        />
      )}
    </div>
  );
}

MyInfo.displayName = 'MyInfo';
