'use client';

import NoAuthLayout from '@/components/layout/NoAuthLayout';
import { useEffect, useState } from 'react';
import SignupTermsClient from '@/app/(noAuth)/signup/step/SignupTerms';
import SignupForm from '@/app/(noAuth)/signup/step/SignupForm';
import { useParams, useRouter } from 'next/navigation';
import { useGetByIdOrCodeV2, useJoinWithPhone1 } from '@/service/member/memberStore';
import {
  AccountJoinWithPhoneRequest,
  AccountResultV2OrganizationAndPositionClassification,
  InvitationV2Result,
} from '@/service/member/schemas';
import { useCreateV2 } from '@/service/file/fileStore';
import Image from 'next/image';
import Link from 'next/link';
import { prefix } from '@/const';

interface IFormData {
  phone: string;
  name: string;
  password: string;
  joinIp?: string;
  organizationAndPositionClassification: string;
  // verifyCode: string;
}

export default function SignupPage() {
  const [loading, setLoading] = useState(true);
  const [referrerInfo, setReferrerInfo] = useState<InvitationV2Result | null>(null);

  const router = useRouter();
  const [step, setStep] = useState(1);
  // 회원가입 링크를 통해 들어온 경우 추천인 코드 추출
  const { idOrCode } = useParams();
  const safeIdOrCode = Array.isArray(idOrCode) ? idOrCode[0] : idOrCode || '';
  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);
  const handleHistoryBack = () => {
    router.back();
  };

  const { mutateAsync: joinWithPhone } = useJoinWithPhone1();
  const { mutateAsync: createV2 } = useCreateV2();
  const handleFormComplete = async (data: IFormData) => {
    let ipVal;
    await fetch('https://api.ipify.org?format=json')
      .then((response) => response.json())
      .then((result) => {
        ipVal = result.ip;
      })
      .catch((error) => console.error('IP 가져오기 실패:', error));
    // 회원가입 API 호출
    const param: AccountJoinWithPhoneRequest = {
      // invitationCode: safeIdOrCode,
      // inviterProfileId: 0,
      account: {
        cellPhoneNumber: data.phone,
        name: data.name,
        password: data.password,
        joinIp: ipVal || 'unknown',
        organizationAndPositionClassification:
          AccountResultV2OrganizationAndPositionClassification[
            data.organizationAndPositionClassification as keyof typeof AccountResultV2OrganizationAndPositionClassification
          ],
        // workplaceName: 'string',
        // organizationName: 'string',
      },
      profile: {
        name: data.name,
      },
    };
    // 추천인 코드가 있는 경우 invitationCode 보내기.추천인 코드 없을때 보내면 에러
    if (safeIdOrCode) {
      param.invitationCode = safeIdOrCode;
    }
    try {
      const response = await joinWithPhone({ data: param });
      if (response.result) {
        const profiles = response.result?.profiles ?? [];
        if (profiles.length > 0) {
          nextStep();
        }
      }
    } catch (error) {
      console.error(error);
      alert('오류가 발생했습니다.');
    }
  };
  const containerStyle = {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
  };

  const { data: referrerData, refetch } = useGetByIdOrCodeV2(safeIdOrCode, {
    query: { enabled: Boolean(safeIdOrCode) }, // ✅ idOrCode가 있을 때만 실행
  });

  useEffect(() => {
    if (!safeIdOrCode) {
      setReferrerInfo(null);
      setLoading(false);
      return;
    }

    const fetchReferrerInfo = async () => {
      try {
        await refetch(); // 필요 시 refetch() 호출

        if (referrerData?.result?.isValid === false || !referrerData?.result) {
          router.push('/error/500'); // 추천인 정보가 없으면 에러 페이지로 이동
        } else {
          setReferrerInfo(referrerData.result);
        }
      } catch (error) {
        console.error('추천인 정보 조회 중 오류 발생:', error);
        router.push('/error/500'); // API 요청 실패 시 에러 페이지로 이동
      } finally {
        setLoading(false);
      }
    };

    fetchReferrerInfo();
  }, [safeIdOrCode, router, referrerData, refetch]);
  if (loading) return <p>로딩 중...</p>;

  return (
    <NoAuthLayout>
      <div className="wrap-auth wrap-signup">
        <Image src="/images/logo_auth@2x.png" width="300" height="57" className="img-logo" alt="kinderboard beta" />

        {step === 1 && (
          <>
            <h3 className="tit-auth">
              서비스 이용 약관을 확인하고
              <br />
              동의해주세요.
            </h3>
            <SignupTermsClient onNext={nextStep} onBack={handleHistoryBack} />
          </>
        )}
        {step === 2 && (
          <>
            <h3 className="tit-auth">기본정보를 입력해주세요.</h3>
            <p className="txt-auth">안전한 회원가입을 위해 기본정보를 확인 합니다.</p>
            <SignupForm referrerInfo={referrerInfo || null} onComplete={handleFormComplete} onBack={prevStep} />
          </>
        )}
        {step === 3 && (
          <div className="wrap-auth wrap-signup">
            <span className="ico-comm ico-illust1" />
            <h3 className="tit-auth">회원가입이 완료되었습니다.</h3>
            <p className="txt-auth">알찬 자료 관리 시작해 보아요!</p>
            <Link href={prefix.login} className="btn btn-xlarge btn-black">
              로그인 하기
            </Link>
          </div>
        )}
      </div>
    </NoAuthLayout>
  );
}
