import React, { useMemo, useState } from 'react';
import { BannerEditModal } from '@/components/modal';
import Image from 'next/image';
import useUserStore from '@/hooks/store/useUserStore';
// import { useGetByIdOrCode1 } from '@/service/member/memberStore';
// import { useSearchParams } from 'next/navigation';
// import { MyBannerResult } from '@/service/core/schemas';
// import { getGetMyBoardBannersQueryKey, getMyBoardBanners, useGetMyBoardBanners } from '@/service/core/coreStore';
import { getGetMyBoardBannersQueryKey, getMyBoardBanners } from '@/service/core/coreStore';
import { useQueryClient } from '@tanstack/react-query';
import useUserProfile from '@/hooks/useUserProfile';

const Banner = () => {
  const { userInfo } = useUserStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // const searchParams = useSearchParams();
  // const PROFILE_CODE = searchParams.get('user') ?? userInfo?.code.toString();

  // const { data: profileData, refetch: profileRefetch } = useGetByIdOrCode1(PROFILE_CODE ?? '');
  // console.log('%ctest', 'font-size:20px;color: red');
  // const { userProfile: profileData2 } = useUserProfileStroe();
  // console.log('profileData2', profileData2);
  const { refetchProfile: profileRefetch, userProfile: profileData } = useUserProfile(false);

  const profile = useMemo(() => {
    return profileData;
  }, [profileData]);

  const isMine = userInfo?.id === profile?.id || !profile?.id;

  /*
   * 배너 편집 모달 열기
   */
  const handleOpenEditPopup = () => {
    setIsModalOpen(true);
  };

  /*
   * 배너 편집 모달 닫기
   */
  const handleCloseEditPopup = () => {
    setIsModalOpen(false);
  };

  const queryClient = useQueryClient();
  const handleEnterEditButton = async () => {
    if (!isMine) return;
    await queryClient.prefetchQuery({
      queryKey: getGetMyBoardBannersQueryKey(),
      queryFn: getMyBoardBanners,
    });
  };

  return (
    <div className="group-banner">
      {profile?.myBoardBannerUrl ? (
        <Image style={{ width: '100%' }} priority src={profile?.myBoardBannerUrl} alt="banner" fill />
      ) : (
        <div className="item-banner" style={{ background: '#E9EBF0', textAlign: 'center' }}>
          <span
            style={{
              position: 'relative',
              top: '30%',
              color: '#00000033',
              fontWeight: 800,
              fontSize: '30px',
            }}
          >
            BANNER
          </span>
        </div>
      )}
      {isMine && (
        <button type="button" className="btn-edit" onClick={handleOpenEditPopup} onMouseEnter={handleEnterEditButton}>
          <span className="ico-comm ico-edit-16">편집</span>
        </button>
      )}
      {isModalOpen && isMine && (
        <BannerEditModal profileRefetch={profileRefetch} isOpen={isModalOpen} onCancel={handleCloseEditPopup} />
      )}
    </div>
  );
};

export default Banner;
