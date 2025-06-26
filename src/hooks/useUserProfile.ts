import { useMemo, useEffect } from 'react';
import { debounce } from '@/utils';
import { useSearchParams } from 'next/navigation';
import useUserStore from '@/hooks/store/useUserStore';
import { useUserProfileStroe } from '@/hooks/store/useUserProfileStroe';
import { useGetByIdOrCode1 } from '@/service/member/memberStore';

export default function useUserProfile(isApiCalled: boolean = true) {
  const { userInfo } = useUserStore();
  const { userProfile, setUserProfile: setUserProfileData } = useUserProfileStroe();
  const searchParams = useSearchParams();

  const PROFILE_CODE = searchParams.get('user') ?? (userInfo?.code.toString() || '');

  const {
    data: profileData,
    refetch: refetchProfile,
    isLoading: profileIsLoading,
  } = useGetByIdOrCode1(
    PROFILE_CODE,
    {
      requestedProfileId: userInfo?.id?.toString(),
    },
    { query: { enabled: false } },
  );

  const userProfileCode = useMemo(() => {
    return userProfile?.code?.toString() ?? userInfo?.code?.toString() ?? '';
  }, [userProfile?.code, userInfo?.code]);

  const userProfileId = useMemo(() => {
    return userProfile?.id?.toString() ?? userInfo?.id?.toString() ?? '0';
  }, [userProfile?.id, userInfo?.id]);

  const debounceRefetch = useMemo(() => {
    const callBack = async () => {
      await refetchProfile();
    };
    return debounce(callBack, 200);
  }, [refetchProfile]);

  useEffect(() => {
    if (profileData?.result) {
      setUserProfileData(profileData.result);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileData?.result]);

  useEffect(() => {
    if (isApiCalled) {
      if (userInfo) {
        debounceRefetch();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [PROFILE_CODE]);

  return { refetchProfile, userProfile, userProfileCode, userProfileId, profileIsLoading };
}
