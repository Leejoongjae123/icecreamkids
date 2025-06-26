'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField } from '@/components/common/Form';
import { Button, Input } from '@/components/common';

export interface IPasswordFormData {
  cellPhoneNumber: string;
  name: string;
  joinIp: string;
  organizationAndPositionClassification: string;
  verifyCode: string;
  password: string;
  confirmPassword: string;
}

interface IProps {
  onComplete: (data: IPasswordFormData) => Promise<void>;
  onBack: () => void;
}

const baseSchema = z
  .object({
    password: z.string().min(10, '비밀번호는 최소 10자 이상이어야 합니다.'),
    confirmPassword: z.string().min(10, '비밀번호는 최소 10자 이상이어야 합니다.'),
  })
  .merge(
    z.object({
      cellPhoneNumber: z.string().optional(),
      name: z.string().optional(),
      joinIp: z.string().optional(),
      organizationAndPositionClassification: z.string().optional(),
      verifyCode: z.string().optional(),
    }),
  );

const formSchema = baseSchema.superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: '새 비밀번호와 새 비밀번호 확인이 일치하지 않습니다.',
      path: ['confirmPassword'],
    });
  }
});

export default function FindPasswordForm({ onComplete, onBack }: IProps) {
  const form = useForm<IPasswordFormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      cellPhoneNumber: '',
      name: '',
      joinIp: '',
      organizationAndPositionClassification: '',
      verifyCode: '',
      password: '',
      confirmPassword: '',
    },
  });

  const {
    formState: { errors, isValid },
  } = form;

  const onSubmit = async (data: IPasswordFormData) => {
    await onComplete(data);
  };

  return (
    <Form form={form} onSubmit={onSubmit} className="type-vertical">
      <fieldset>
        <legend className="screen_out">비밀번호 재설정 입력폼</legend>
        <div className="wrap-form form-type2">
          <FormField
            control={form.control}
            name="password"
            label="새 비밀번호"
            required
            render={({ field, fieldState }) => (
              <Input
                type="password"
                id="password"
                sizeType="large"
                placeholder="최소 10자 입력해주세요."
                isError={Boolean(fieldState.error)}
                {...field}
              />
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            label="비밀번호 확인"
            labelHidden
            required
            render={({ field, fieldState }) => (
              <Input
                type="password"
                id="passwordCheck"
                sizeType="large"
                placeholder="비밀번호를 한번 더 입력해 주세요."
                isError={Boolean(fieldState.error)}
                {...field}
              />
            )}
          />
        </div>
        {(errors.password || errors.confirmPassword) && (
          <p className="txt-error">{errors.password?.message || errors.confirmPassword?.message}</p>
        )}
        <div className="group-btn">
          <Button type="button" size="xlarge" color="line" onClick={onBack}>
            취소
          </Button>
          <Button type="submit" size="xlarge" color="black" disabled={!isValid}>
            변경
          </Button>
        </div>
      </fieldset>
    </Form>
  );
}
