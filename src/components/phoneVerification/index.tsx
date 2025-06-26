import { useCallback, useEffect, useRef, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useRequestValidate1, useValidateCode1 } from '@/service/message/messageStore';
import { useGetByPhoneNumber1 } from '@/service/member/memberStore';
import { IP_ADDRESS } from '@/const';
import { Button, FormField, Input } from '../common';

interface IPhoneVerificationProps {
  form: UseFormReturn<any>;
  isVerified: boolean;
  setIsVerified: (verified: boolean) => void;
  setAccountId?: (id: number) => void;
  isNew?: boolean;
  disabled?: boolean;
}

export default function PhoneVerification({
  form,
  setIsVerified,
  setAccountId,
  isVerified,
  isNew = false,
  disabled,
}: IPhoneVerificationProps) {
  const { setError, clearErrors, getValues, control, formState } = form;
  const { errors } = formState;

  // 인증번호 발송 여부 상태
  const [isCodeSent, setIsCodeSent] = useState(false);
  // 타이머 값은 부모 리렌더링 없이 useRef로 관리 (초기값: 180초 = 3분)
  const timerRef = useRef<number>(180);
  // 재전송 횟수를 state로 관리하여 재전송 시 useEffect 재실행 유도
  const [resendCount, setResendCount] = useState(0);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  // 입력된 전화번호 상태
  const [phoneNumber, setPhoneNumber] = useState<string>('');

  // 타이머 포맷 함수 (예: "02분 45초")
  function formatTimer(seconds: number) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${String(min).padStart(2, '0')}분 ${String(sec).padStart(2, '0')}초`;
  }
  const initialTimeStr = formatTimer(timerRef.current);

  // 타이머 업데이트 함수
  const updateTimerDisplay = useCallback(() => {
    if (inputContainerRef.current) {
      const timeSpan = inputContainerRef.current.querySelector('.txt-error');
      if (timeSpan) {
        timeSpan.textContent = formatTimer(timerRef.current);
      }
    }
  }, [inputContainerRef, timerRef]);

  // 타이머 효과: 코드 발송 후 timerRef를 매 초마다 감소시키고, DOM 업데이트는 직접 수행
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCodeSent && timerRef.current > 0) {
      clearErrors('phoneCert');
      interval = setInterval(() => {
        timerRef.current -= 1;
        updateTimerDisplay();
        if (timerRef.current === 0 && !isVerified) {
          setError('phoneCert', {
            type: 'manual',
            message: '인증번호 입력 시간이 만료되었습니다. 다시 요청해 주세요.',
          });
          clearInterval(interval);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCodeSent, resendCount, clearErrors, setError, isVerified, updateTimerDisplay]);

  // 인증번호 전송 API
  const { mutate: sendValidationCode } = useRequestValidate1({
    mutation: {
      onSuccess: () => {
        console.log('인증번호 발송 성공');
        // 이미 sendVerificationCode에서 타이머를 재설정하므로 별도 처리 없음
      },
      onError: (error) => {
        console.error('인증번호 발송 실패:', error);
        setError('phone', { type: 'manual', message: '인증번호 전송에 실패했습니다.' });
      },
    },
  });

  // 인증번호 확인 API
  const { mutateAsync: verifyCodeMutation } = useValidateCode1();

  // 핸드폰 번호로 계정 조회 API (전화번호가 등록된 회원인지 확인)
  const {
    data: referrerData,
    error: fetchError,
    isLoading,
  } = useGetByPhoneNumber1({ includes: 'profiles' }, phoneNumber, {
    query: { enabled: !!phoneNumber && (isNew ? true : resendCount === 0), retry: 0 },
  });

  // 인증번호 직접 발송 함수
  const sendVerificationCodeHandler = useCallback(
    async (phoneNum: string) => {
      try {
        sendValidationCode({
          data: {
            phoneNumber: `+82${phoneNum.slice(1)}`,
            ip: IP_ADDRESS, // 임시 IP 값
            expiredIn: 3,
          },
        });
        timerRef.current = 180; // 테스트용 3초
        setIsCodeSent(true);
        updateTimerDisplay();
        setResendCount((prev) => prev + 1);
      } catch (error) {
        console.error('인증번호 발송 중 오류:', error);
        setError('phone', { type: 'manual', message: '인증번호 전송에 실패했습니다.' });
      }
    },
    [sendValidationCode, setError, updateTimerDisplay],
  );

  // 인증번호 전송 버튼 클릭 핸들러
  const handleSendCode = async () => {
    const currPhoneNumber = getValues('phone');
    if (!currPhoneNumber) {
      setError('phone', { type: 'manual', message: '전화번호를 입력해 주세요.' });
      return;
    }
    clearErrors('phone');
    clearErrors('phoneCert');

    if (isLoading) return; // 중복 호출 방지

    // 재전송 조건: 타이머가 만료되었거나, 이미 발송된 상태에서 재전송인 경우
    if (timerRef.current === 0 || (isCodeSent && resendCount > 0)) {
      sendVerificationCodeHandler(currPhoneNumber);
      return;
    }

    // 최초 발송 또는 번호 변경 시
    setResendCount(0); // 카운터 초기화
    await new Promise((resolve) => {
      setPhoneNumber('');
      setTimeout(resolve, 0);
    });
    setPhoneNumber(currPhoneNumber);
  };

  // 계정 조회 후 인증번호 전송 처리 (최초 발송 시)
  useEffect(() => {
    if (!phoneNumber || resendCount > 0) return;

    if (fetchError && isNew) {
      if ((fetchError as any)?.status === 404) {
        sendVerificationCodeHandler(phoneNumber);
        return;
      }
    }

    try {
      if (referrerData) {
        if (referrerData.result?.profiles?.length && isNew) {
          alert('이미 가입된 회원입니다.');
          setIsCodeSent(false);
          return;
        }
        if (setAccountId && referrerData.result?.profiles) {
          setAccountId(referrerData.result?.profiles[0].accountId);
        }
        // 최초 발송 시 API 호출
        sendVerificationCodeHandler(phoneNumber);
      }
    } catch (error) {
      console.log(error);
    }
  }, [referrerData, fetchError, phoneNumber, isNew, setAccountId, resendCount, sendVerificationCodeHandler]);

  // 인증번호 확인 핸들러 (6자리 입력 시 API 호출)
  const handleVerifyCode = useCallback(
    async (currVerifyCode: string) => {
      const currPhoneNumber = getValues('phone');
      if (currVerifyCode.length === 6) {
        try {
          const response = await verifyCodeMutation({
            data: {
              phoneNumber: `+82${currPhoneNumber.slice(1)}`,
              validateCode: currVerifyCode,
            },
          });
          switch (response.result) {
            case 'VALIDATED':
              setIsVerified(true);
              setError('phoneCert', { type: 'manual', message: '인증이 완료되었습니다.' });
              clearErrors();
              timerRef.current = 0;
              updateTimerDisplay();
              break;
            case 'REQUESTED':
              alert('인증번호가 아직 입력되지 않았습니다.');
              break;
            case 'ALREADYVALIDATED':
              alert('이미 인증된 번호입니다.');
              break;
            case 'NOTMATCHED':
              setError('phoneCert', { type: 'manual', message: '인증번호가 일치하지 않습니다.' });
              break;
            default:
              alert('인증에 실패했습니다. 다시 시도해 주세요.');
              break;
          }
        } catch (e) {
          setError('phoneCert', { type: 'manual', message: '인증번호가 올바르지 않습니다.' });
        }
      }
    },
    [getValues, setError, clearErrors, setIsVerified, verifyCodeMutation, updateTimerDisplay],
  );

  // 입력값에서 숫자만 허용하도록 처리
  const handleInputVerifyCode = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = e.target.value.replace(/\D/g, '');
    if (e.target.value.length === 6) {
      handleVerifyCode(e.target.value);
    }
  };

  return (
    <>
      <Button
        disabled={(timerRef.current !== 0 && isCodeSent) || isVerified || disabled}
        type="button"
        color="line"
        onClick={handleSendCode}
      >
        {!isCodeSent ? '인증번호 발송' : '재전송'}
      </Button>
      {isCodeSent && (
        <div className="FieldClassifyNumber" style={{ marginTop: '10px', flex: 1 }} ref={inputContainerRef}>
          <FormField
            control={control}
            name="phoneCert"
            required
            useErrorMessage
            render={({ field }) => (
              <Input
                id="phoneCert"
                sizeType="large"
                placeholder="인증번호"
                time={initialTimeStr}
                isError={!!errors.phoneCert}
                maxLength={6}
                disabled={isVerified || timerRef.current === 0}
                {...field}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  handleInputVerifyCode(e);
                  field.onChange(e);
                }}
              />
            )}
          />
        </div>
      )}
    </>
  );
}
