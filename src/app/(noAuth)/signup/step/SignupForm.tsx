'use client';

import { useForm } from 'react-hook-form';
import { useState, useEffect, useCallback } from 'react';
import { Button, Form, FormField, Input, Radio } from '@/components/common';
import PhoneVerification from '@/components/phoneVerification';
import { useSearchParams } from 'next/navigation'; // query parameter 사용을 위한 import
import { existedByNameV2 } from '@/service/member/memberStore';
import { IFormData, IProps } from './types';

const jobPreset = [
  { text: '유치원 교사', value: 'NURSERY_TEACHER' },
  { text: '어린이집 교사', value: 'KINDERGARTEN_TEACHER' },
  { text: '원장/원감', value: 'MANAGER' },
  { text: '기타', value: 'ETC' },
];

export default function SignupForm({ onComplete }: IProps) {
  const [currentJob, setCurrentJob] = useState(jobPreset[0].value);
  const [accountId, setAccountId] = useState<number>(0);
  const form = useForm<IFormData>({
    mode: 'onChange',
    defaultValues: {
      organizationAndPositionClassification: 'NURSERY_TEACHER',
      phone: '',
      phoneCert: '',
      name: '',
      password: '',
      confirmPassword: '',
      recommender: '',
    },
  });
  const {
    watch,
    formState: { errors, isValid },
    setError,
    control,
    setValue,
    clearErrors,
  } = form;
  const [isVerified, setIsVerified] = useState(false);

  // 추천인 닉네임 가져오기 (query parameter)
  const searchParams = useSearchParams();
  const recommenderFromQuery = searchParams.get('recmooandId');

  // query 값이 있으면 recommender 필드에 설정 (마운트 시 한 번 실행)
  useEffect(() => {
    if (recommenderFromQuery) {
      setValue('recommender', recommenderFromQuery);
    }
  }, [recommenderFromQuery, setValue]);

  // watch로 각 필드 값 가져오기
  const { password } = watch();

  const onSubmit = (data: IFormData) => {
    // 전화번호 인증 코드 필드 유효성 검사
    if (!data.phoneCert) {
      setError('phoneCert', { type: 'manual', message: '인증번호를 확인해 주세요.' });
      return;
    }
    onComplete(data);
  };

  // 추천인 체크 (예시로 로그 찍음)
  const handleInputVerifyCode = useCallback(
    async (name: string) => {
      if (!name) return;
      try {
        const { result } = await existedByNameV2(name);
        if (result) {
          clearErrors('recommender');
        } else {
          setError('recommender', { type: 'manual', message: '등록되지 않은 닉네임입니다.' });
        }
      } catch (error) {
        setError('recommender', { type: 'manual', message: '등록되지 않은 닉네임입니다.' });
      }
    },
    [clearErrors, setError],
  );

  // 페이지 인입 시 (쿼리 값이 있을 경우) 자동 유효성 체크
  useEffect(() => {
    if (recommenderFromQuery) {
      setValue('recommender', recommenderFromQuery);
      handleInputVerifyCode(recommenderFromQuery);
    }
  }, [recommenderFromQuery, setValue, handleInputVerifyCode]);

  const [nicknameInfoMessage, setNicknameInfoMessage] = useState('');

  // 닉네임 중복체크
  const handleCheckSameNickName = async (name: string) => {
    if (name.trim().length === 0) return;

    if (!name) {
      setNicknameInfoMessage('');
      return;
    }
    try {
      const { result } = await existedByNameV2(name);
      if (result) {
        // 이미 사용 중이면 에러 메시지 등록 (입력창은 활성 상태)
        setError('name', { type: 'manual', message: '이미 사용중인 닉네임입니다.' });
        setNicknameInfoMessage('');
      }
    } catch (error) {
      console.error('닉네임 중복 체크 실패', error);
      setNicknameInfoMessage('사용 가능한 닉네임입니다.');
    }
  };

  return (
    <div className="wrap-auth wrap-signup">
      <Form form={form} className="type-vertical" onSubmit={onSubmit}>
        <fieldset>
          <legend className="screen_out">회원가입 입력폼</legend>

          {/* 직업 선택 */}
          <div className="wrap-form">
            <strong className="lab-form">
              직업<span className="txt-required">필수입력</span>
            </strong>
            <Radio
              label="직업"
              options={jobPreset}
              name="organizationAndPositionClassification"
              value={currentJob}
              className="type-btn"
              onChange={(e) => {
                const { value } = e.target as HTMLInputElement;
                setCurrentJob(value);
                setValue('organizationAndPositionClassification', value, { shouldValidate: true });
              }}
            />
            {errors.organizationAndPositionClassification && (
              <p className="txt-error">{errors.organizationAndPositionClassification.message}</p>
            )}
          </div>

          {/* 전화번호 입력 및 인증 */}
          <div className="wrap-form">
            <FormField
              control={control}
              name="phone"
              label="전화번호"
              required
              useErrorMessage
              rules={{
                required: '전화번호를 입력해 주세요.',
                pattern: { value: /^[0-9]+$/, message: '숫자만 입력해 주세요.' },
              }}
              render={({ field }) => (
                <Input
                  id="phone"
                  sizeType="large"
                  placeholder="- 없이 숫자만 입력해 주세요."
                  isError={!!errors.phone}
                  infoMessage={isVerified ? '인증이 완료되었습니다.' : ''}
                  disabled={isVerified}
                  {...field}
                />
              )}
            />
            {!isVerified && (
              <PhoneVerification
                form={form}
                isNew
                isVerified={isVerified}
                setIsVerified={setIsVerified}
                setAccountId={setAccountId}
              />
            )}
          </div>

          {/* 닉네임 입력 (onBlur 시 중복 체크 수행) */}
          <div className="wrap-form">
            <FormField
              control={control}
              name="name"
              label="닉네임"
              required
              useErrorMessage
              rules={{
                required: '닉네임을 입력해 주세요.',
                minLength: { value: 2, message: '닉네임은 최소 2자 이상이어야 합니다.' },
                maxLength: { value: 10, message: '닉네임은 10자 이하이어야 합니다.' },
              }}
              render={({ field }) => (
                <Input
                  id="nickname"
                  sizeType="large"
                  maxLength={10}
                  minLength={2}
                  autoComplete="off"
                  placeholder="닉네임을 입력해 주세요 (2~10자 사이)"
                  isError={!!errors.name}
                  infoMessage={nicknameInfoMessage}
                  {...field}
                  onBlur={async (e: React.ChangeEvent<HTMLInputElement>) => {
                    field.onBlur();
                    await handleCheckSameNickName(e.target.value);
                  }}
                />
              )}
            />
          </div>

          {/* 비밀번호 및 비밀번호 확인 */}
          <div className="wrap-form form-type2">
            <FormField
              control={control}
              name="password"
              label="비밀번호"
              required
              useErrorMessage
              rules={{
                required: '비밀번호를 입력해 주세요.',
                minLength: { value: 10, message: '비밀번호는 최소 10자 이상이어야 합니다.' },
              }}
              render={({ field }) => (
                <Input
                  type="password"
                  id="password"
                  sizeType="large"
                  autoComplete="off"
                  placeholder="최소 10자 입력해주세요."
                  isError={!!errors.password}
                  {...field}
                />
              )}
            />
            <FormField
              control={control}
              name="confirmPassword"
              label="비밀번호 확인"
              labelHidden
              required
              useErrorMessage
              rules={{
                required: '비밀번호 확인을 입력해 주세요.',
                validate: (value) => value === password || '비밀번호가 일치하지 않습니다.',
              }}
              render={({ field }) => (
                <Input
                  type="password"
                  id="confirmPassword"
                  sizeType="large"
                  autoComplete="off"
                  placeholder="비밀번호를 한번 더 입력해 주세요."
                  isError={!!errors.confirmPassword}
                  {...field}
                />
              )}
            />
          </div>

          {/* 추천인 닉네임 (query에 recmooandId가 있으면 값 적용 및 disabled) */}
          <div className="wrap-form">
            <FormField
              control={control}
              name="recommender"
              label="추천인 닉네임"
              useErrorMessage
              render={({ field }) => (
                <Input
                  type="text"
                  id="recommender"
                  sizeType="large"
                  placeholder="추천인 닉네임을 입력해 주세요."
                  isError={!!errors.recommender}
                  disabled={!!recommenderFromQuery} // 쿼리 값이 있으면 disabled 처리
                  {...field}
                  onBlur={async (e: React.ChangeEvent<HTMLInputElement>) => {
                    field.onBlur();
                    await handleInputVerifyCode(e.target.value);
                  }}
                />
              )}
            />
          </div>

          {/* 버튼 영역 */}
          <div className="wrap-form">
            <Button type="submit" size="xlarge" color="black" disabled={!(isValid && isVerified)}>
              회원가입
            </Button>
          </div>
        </fieldset>
      </Form>
    </div>
  );
}
