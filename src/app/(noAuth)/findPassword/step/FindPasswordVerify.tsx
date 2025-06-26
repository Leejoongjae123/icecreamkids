'use client';

import { useForm } from 'react-hook-form';
import { useState } from 'react';
import PhoneVerification from '@/components/phoneVerification';
import { Button, Form, FormField, Input } from '@/components/common';

interface IProps {
  onNext?: (id: number, phone: string) => void;
  onBack?: () => void;
}

export default function FindPasswordVerify({ onNext, onBack }: IProps) {
  // react-hook-form 인스턴스 생성 (필드명은 "phone"과 "phoneCert"로 통일)
  const form = useForm({
    mode: 'onSubmit',
    defaultValues: {
      phone: '',
      phoneCert: '',
    },
  });

  // 전화번호 검증 관련 상태
  const [accountId, setAccountId] = useState<number>(0);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const handleInputPhoneNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = e.target.value.replace(/\D/g, '');
  };
  // 폼 제출 시 accountId를 부모로 전달
  const onSubmit = () => {
    onNext?.(accountId, form.getValues()?.phone);
  };

  return (
    <Form form={form} className="type-vertical" onSubmit={onSubmit}>
      <fieldset>
        <legend className="screen_out">비밀번호 찾기 입력폼</legend>
        <div className="wrap-form">
          {/* 전화번호 입력 필드 */}
          <FormField
            control={form.control}
            name="phone"
            label="전화번호"
            required
            useErrorMessage
            render={({ field }) => (
              <Input
                id="phone"
                sizeType="large"
                placeholder="- 없이 숫자만 입력해 주세요."
                isError={!!form.formState.errors.phone}
                // 인증 완료 시 더 이상 입력 불가
                disabled={isVerified}
                {...field}
              />
            )}
          />

          <PhoneVerification
            form={form}
            isVerified={isVerified}
            setIsVerified={setIsVerified}
            setAccountId={setAccountId}
          />
        </div>

        <Button type="submit" size="xlarge" color="black" disabled={!isVerified}>
          비밀번호 찾기
        </Button>
      </fieldset>
    </Form>
  );
}
