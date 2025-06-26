'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Button, Form, FormField, Checkbox } from '@/components/common';
import useUserStore from '@/hooks/store/useUserStore';
import { useRouter } from 'next/navigation';
import NoAuthLayout from '@/components/layout/NoAuthLayout';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { automaticLoginManager } from '@/utils/tokenManager';
import { prefix } from '@/const';
import { RefreshAuthSessionRequest } from '@/service/member/schemas';

const formSchema = z.object({
  phoneNumber: z
    .string()
    .nonempty({ message: '전화번호를 입력해 주세요.' })
    .regex(/^\d+$/, { message: '숫자만 입력해 주세요.' })
    .refine((val) => val.length === 11, { message: '전화번호 11자리를 초과할수 없습니다.' }),
  password: z.string().regex(/^[A-Za-z\d@$!%*?&#]{10,48}$/, {
    message: '비밀번호는 10~48자리 영문, 숫자, 특수문자가 허용됩니다.',
  }),
});

// TODO: 1차때 오픈 안하는 SNS 게졍 표시용
// const snsLinks = [
//   { href: '#none', className: 'ico-sns-kakao', label: '카카오톡' },
//   { href: '#none', className: 'ico-sns-naver', label: '네이버' },
//   { href: '#none', className: 'ico-sns-google', label: '구글' },
//   { href: '#none', className: 'ico-sns-apple', label: '애플' },
// ];

const LoginPage = () => {
  const { login, refreshLogin } = useAuth();
  const { userInfo, clearUserInfo } = useUserStore();
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const [deviceModelName, setDeviceModelName] = useState<string>('');
  const [saveID, setSaveID] = useState<boolean>(false);
  const [autoLogin, setAutoLogin] = useState<boolean>(false);
  const [automaticLogin, setAutomaticLogin] = useState<boolean>(false);
  const [isAutomaticLogin, setIsAutomaticLogin] = useState<boolean>(false);

  const {
    control,
    setValue,
    formState: { errors, isValid },
    handleSubmit,
    setError,
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  });

  // 아이디 저장 이벤트
  const handleSaveIDChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSaveID(e.target.checked);
    if (!e.target.checked) {
      localStorage.removeItem('savedPhoneNumber');
    }
  }, []);

  // 자동 로그인 이벤트
  const handleAutoLoginChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAutoLogin(e.target.checked);
  }, []);

  // 로그인
  const onSubmit = useCallback(
    async (values: z.infer<typeof formSchema>) => {
      try {
        // userInfo 데이터 갱신 이슈 수정을 위한 로직
        const params = {
          ...values,
          ip: ipAddress || 'unknown',
          deviceModelName: deviceModelName || 'unknown',
        };
        await login(params);
        // 아이디 저장
        if (saveID) {
          localStorage.setItem('savedPhoneNumber', values.phoneNumber);
        } else {
          localStorage.removeItem('savedPhoneNumber');
        }

        // 자동로그인
        if (autoLogin) {
          // 쿠키를 통한 자동 로그인 셋팅
          await automaticLoginManager.setAutomaticToken(values.phoneNumber);
          // localStorage.setItem('autoLogin', 'true');
        }
        if (!autoLogin) {
          if (automaticLogin) {
            await automaticLoginManager.clearAutomaticToken();
          }
        }
        router.push(prefix.root);
      } catch (error) {
        setError('phoneNumber', { type: 'manual', message: '전화번호 또는 비밀번호를 다시 확인해 주세요.' });
        setError('password', { type: 'manual', message: '' });
      }
    },
    [router, ipAddress, deviceModelName, automaticLogin, login, saveID, autoLogin, setError],
  );

  // 자동 로그인
  const callAutomaticLogin = (phoneNumber: string, token: string) => {
    if (ipAddress && deviceModelName) {
      const refreshAuthSession: RefreshAuthSessionRequest = {
        ip: ipAddress,
        deviceModelName,
      };
      refreshLogin({ phoneNumber, token, refreshAuthSessionRequest: refreshAuthSession })
        .then(() => {
          router.push(prefix.root);
        })
        .catch(() => {
          // 자동 로그인 삭제
          setIsAutomaticLogin(false);
          setAutoLogin(false);
          setAutomaticLogin(false);
          automaticLoginManager.clearAutomaticToken();
        });
    }
  };

  // 자동 로그인 체크
  const checkAutomaticLogin = async () => {
    try {
      const autoLoginCookies = await automaticLoginManager.getAutomaticToken();
      if (autoLoginCookies) {
        const { phoneNumber, authToken, stopAutoLogging } = autoLoginCookies;
        if (stopAutoLogging) {
          setAutoLogin(true);
          setAutomaticLogin(true);
        }
        if (authToken) {
          setIsAutomaticLogin(true);
          setAutoLogin(true);
          setAutomaticLogin(true);
          callAutomaticLogin(phoneNumber, authToken);
        }
      }
    } catch (error) {
      console.error('자동 로그인 정보 조회 실패:', error);
    }
  };

  const initCheckLogin = useCallback(async () => {
    // 로그인 페이지 진입 시 쿠키 삭제되었다는 전제 하에 userInfo가 있을 경우 세션 스토리지 삭제
    if (userInfo) clearUserInfo();

    // ip address가 없는 경우만 호출
    if (!ipAddress) {
      const repIpity = await fetch('https://api.ipify.org?format=json');
      try {
        const result = await repIpity.json();
        setIpAddress(result.ip);
      } catch (error) {
        console.error('IP 가져오기 실패:', error);
      }
    }

    setDeviceModelName(navigator.userAgent);

    // 저장된 아이디 불러오기
    const storedID = localStorage.getItem('savedPhoneNumber');
    if (storedID) {
      setValue('phoneNumber', storedID);
      setSaveID(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ipAddress]);

  // ip 조회 통신 이후 자동 로그인 체크
  useEffect(() => {
    if (ipAddress) {
      checkAutomaticLogin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ipAddress]);

  useEffect(() => {
    // 클라이언트에서만 실행
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      initCheckLogin();
    }
    // 페이지 처음 진입 시에만 작동하기 위해
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]);

  return (
    <NoAuthLayout>
      <div className="wrap-auth wrap-login">
        <Image src="/images/logo_auth@2x.png" width="300" height="57" className="img-logo" alt="kinderboard beta" />
        <h3 className="tit-auth">로그인</h3>

        <Form form={{ control, errors, isValid, handleSubmit } as any} onSubmit={onSubmit} className="type-vertical2">
          <fieldset>
            <legend className="screen_out">로그인 입력폼</legend>

            {/* 입력 필드 */}
            <FormField
              control={control}
              name="phoneNumber"
              render={({ field }) => (
                <Input
                  errorMessage={null}
                  id="phoneNumber"
                  type="text"
                  isError={Boolean(errors.phoneNumber)}
                  placeholder="전화번호를 입력해 주세요."
                  disabled={isAutomaticLogin}
                  {...field}
                />
              )}
            />
            <FormField
              control={control}
              name="password"
              render={({ field }) => (
                <Input
                  id="userPassword"
                  errorMessage={null}
                  autoComplete="new-password"
                  type="password"
                  isError={Boolean(errors.password)}
                  placeholder="비밀번호를 입력해 주세요."
                  disabled={isAutomaticLogin}
                  {...field}
                />
              )}
            />
            {errors && <p className="txt-error">{errors.phoneNumber?.message || errors.password?.message}</p>}
            {isAutomaticLogin && <p className="txt-info">자동 로그인 중입니다.</p>}

            {/* 아이디 저장 & 자동 로그인 */}
            <div className="group-chk">
              <Checkbox
                name="loginChk"
                id="saveId"
                checked={saveID}
                label="아이디 저장"
                onChange={(e) => handleSaveIDChange(e)}
              />
              <Checkbox
                name="loginChk"
                id="autoLogin"
                label="자동로그인"
                checked={autoLogin}
                onChange={(e) => handleAutoLoginChange(e)}
              />
              <Link href="/findPassword" className="link-g link-find">
                비밀번호를 잊으셨나요?
              </Link>
            </div>

            {/* 로그인 버튼 */}
            <Button disabled={!isValid || isAutomaticLogin} type="submit" size="xlarge">
              로그인
            </Button>
          </fieldset>
        </Form>

        {/* TODO: 25.02.27 : SNS로그인은 1차 페이즈때 하지 않음 */}
        {/* <div className="group-sns">
          <span className="screen_out">SNS 계정 로그인</span>
          {snsLinks.map((link, index) => (
            <a key={index} href={link.href} className="link-sns">
              <span className={`ico-comm ${link.className}`}>{link.label}</span>
            </a>
          ))}
        </div> */}

        <div className="group-info">
          <p className="txt-info">
            베타 서비스 사용 관련 문의는
            <br />
            <a href="https://pf.kakao.com/_PexdVC" className="link-mail" target="_blank" rel="noreferrer">
              카카오톡 채널
            </a>{' '}
            또는
            <br />
            <a href="#mailto:drive@i-screammedia.com" className="link-mail">
              idrive@i-screammedia.com
            </a>
            으로 연락해 주세요.
          </p>
          <div className="info-policy">
            <Link href="/terms/privacyPolicy" className="link-policy font-bold">
              개인정보 처리방침
            </Link>
            <Link href="/terms/termsOfService" className="link-policy">
              이용약관
            </Link>
          </div>
        </div>
      </div>
    </NoAuthLayout>
  );
};

export default LoginPage;
