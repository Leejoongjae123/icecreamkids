'use client';

import NoAuthLayout from '@/components/layout/NoAuthLayout';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { resetPassword } from '@/service/member/memberStore';
import FindPasswordVerify from '@/app/(noAuth)/findPassword/step/FindPasswordVerify';
import FindPasswordForm from '@/app/(noAuth)/findPassword/step/FindPasswordForm';
import Image from 'next/image';
import Link from 'next/link';
import { IP_ADDRESS, prefix } from '@/const';

// 비밀번호 찾기 상수
const STEPS = {
  VERIFY: 1,
  RESET: 2,
  COMPLETE: 3,
};

const STEP_TITLES = {
  [STEPS.VERIFY]: {
    title: '비밀번호 찾기',
    message: '가입한 전화번호를 입력하시면 인증번호가 발송 됩니다.',
  },
  [STEPS.RESET]: {
    title: '비밀번호 재설정',
    message: '새 비밀번호로 변경해 주세요.',
  },
  [STEPS.COMPLETE]: {
    title: '비밀번호가 변경 되었습니다.',
    message: '',
  },
};

interface IPasswordFormData {
  cellPhoneNumber: string;
  name: string;
  password: string;
  joinIp: string;
  organizationAndPositionClassification: string;
  verifyCode: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [cellPhoneNumber, setCellPhoneNumber] = useState('');
  const [step, setStep] = useState(STEPS.VERIFY);
  const currentTitle = STEP_TITLES[step];

  // 1. 전화번호 체크
  const handleNextStep = (id: number, phoneNumber: string) => {
    setCellPhoneNumber(phoneNumber);
    setStep(STEPS.RESET);
  };

  // 2. 비밀번호 변경
  const handleFormComplete = async (data: IPasswordFormData) => {
    try {
      await resetPassword({
        phoneNumber: cellPhoneNumber,
        newPassword: data.password,
        ip: IP_ADDRESS,
      });
      setStep(STEPS.COMPLETE);
    } catch (error) {
      console.error('비밀번호 변경 오류:', error);
      alert('비밀번호 변경에 실패하였습니다.');
    }
  };

  // 스텝별 컨텐츠 렌더링
  const renderStepContent = () => {
    switch (step) {
      case STEPS.VERIFY:
        return <FindPasswordVerify onNext={handleNextStep} onBack={() => router.back()} />;
      case STEPS.RESET:
        return <FindPasswordForm onComplete={handleFormComplete} onBack={() => setStep(STEPS.VERIFY)} />;
      case STEPS.COMPLETE:
        return (
          <>
            <span className="ico-comm ico-illust2" />
            <Link href={prefix.login} className="btn btn-xlarge btn-black">
              로그인 페이지로 이동
            </Link>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <NoAuthLayout>
      <div className="wrap-auth wrap-find">
        <Image src="/images/logo_auth@2x.png" width="300" height="57" className="img-logo" alt="kinderboard beta" />
        {step !== STEPS.COMPLETE && (
          <>
            <h3 className="tit-auth">{currentTitle.title}</h3>
            <p className="txt-auth">{currentTitle.message}</p>
          </>
        )}
        {step === STEPS.COMPLETE && <h3 className="tit-auth">{currentTitle.title}</h3>}
        {renderStepContent()}
      </div>
    </NoAuthLayout>
  );
}
