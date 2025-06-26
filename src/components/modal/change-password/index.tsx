import React from 'react';
import { Form, FormField, Textarea, Input, Button, Radio, ModalBase, Avatar } from '@/components/common';
import PhoneVerification from '@/components/phoneVerification';
import cx from 'clsx';
import frontCustomStyle from './front.style.module.scss';
import { IPasswordChangeModalProps } from './types';

function PasswordChangeModal({
  isOpen,
  isValid,
  isVerified,
  form,
  onConfirm,
  onCancel,
  setIsVerified,
  setAccountId,
}: IPasswordChangeModalProps) {
  return (
    <ModalBase
      isOpen={isOpen}
      message="비밀번호 변경"
      confirmText="비밀번호 변경"
      disabled={!(isValid && isVerified)}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <Form form={form} className={`type-vertical ${frontCustomStyle.wrapPasswordModal}`}>
        <fieldset>
          <legend className="screen_out">비밀번호 변경</legend>
          <div className="wrap-form form_phoneNumber">
            <FormField
              control={form.control}
              name="phone"
              label="전화번호"
              required
              render={({ field }) => (
                <Input
                  id="phone"
                  autoComplete="off"
                  sizeType="large"
                  placeholder="- 없이 숫자만 입력해 주세요."
                  isError={!!form.formState.errors.phone}
                  infoMessage={isVerified ? '인증이 완료되었습니다.' : ''}
                  disabled={isVerified}
                  {...field}
                />
              )}
            />
            {!isVerified && (
              <PhoneVerification
                form={form}
                isVerified={isVerified}
                setIsVerified={setIsVerified}
                setAccountId={setAccountId}
              />
            )}
          </div>
          {isVerified && (
            <div className={cx('wrap-form', frontCustomStyle.rowForm)}>
              <FormField
                control={form.control}
                name="password"
                label="새 비밀번호"
                required
                useErrorMessage
                render={({ field }) => (
                  <Input
                    type="password"
                    id="password"
                    autoComplete="new-password"
                    sizeType="large"
                    placeholder="최소 8자 입력해주세요."
                    isError={!!form.formState.errors.password}
                    {...field}
                  />
                )}
              />

              <div style={{ marginTop: 4, width: '100%' }}>
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  required
                  useErrorMessage
                  render={({ field }) => (
                    <Input
                      type="password"
                      id="confirmPassword"
                      autoComplete="new-password"
                      sizeType="large"
                      placeholder="비밀번호를 한번 더 입력해 주세요."
                      isError={!!form.formState.errors.confirmPassword}
                      {...field}
                    />
                  )}
                />
              </div>
            </div>
          )}
        </fieldset>
      </Form>
    </ModalBase>
  );
}

export default PasswordChangeModal;
