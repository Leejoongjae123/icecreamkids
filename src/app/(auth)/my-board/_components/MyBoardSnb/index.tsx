'use client';

import useUserStore from '@/hooks/store/useUserStore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGetCounts } from '@/service/file/fileStore';
import { useSearchParams } from 'next/navigation';
import { useAddFollow, useGetByIdOrCode1, useUnFollow } from '@/service/member/memberStore';
import { formatCompactNumber } from '@/utils';
import { FollowModal, ReportModal } from 'src/components/modal';
import { Avatar, Button, TooltipContent } from '@/components/common';
import cx from 'clsx';
import AvatarEdit from '@/components/common/AvatarEdit';
import { useToast } from '@/hooks/store/useToastStore';
import { getAllOptions, getGetAllOptionsQueryKey } from '@/service/core/coreStore';
import { useQueryClient } from '@tanstack/react-query';
import { tokenManager } from '@/utils/tokenManager';
import useUserProfile from '@/hooks/useUserProfile';

export function MyBoardSnb() {
  const { userInfo, setUserInfo } = useUserStore();
  // const searchParams = useSearchParams();
  // const PROFILE_CODE = searchParams.get('user') ?? (userInfo?.code.toString() || '');

  const [currentFollowTabIdx, setCurrentFollowTabIdx] = useState<number>(0);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  /*
   * 신고 관리 모달 열기
   */
  const handleReportModalOpen = () => {
    setIsReportModalOpen(true);
  };

  /*
   * 신고 관리 모달 닫기
   */
  const handleReportModalClose = () => {
    setIsReportModalOpen(false);
  };

  const addToast = useToast((state) => state.add);
  const handleToast = (toastMessage: string) => {
    addToast({
      message: toastMessage,
    });
  };

  // // 팔로워, 팔로잉수 호출, TODO: 서버 prefetch
  // const {
  //   data: profileData,
  //   refetch: refetchProfile,
  //   isLoading: profileIsLoading,
  // } = useGetByIdOrCode1(
  //   PROFILE_CODE,
  //   {
  //     requestedProfileId: userInfo?.id.toString(),
  //   },
  //   { query: { enabled: !!PROFILE_CODE && !!userInfo?.id.toString() && userInfo?.id.toString() !== '0' } },
  // );

  // const profile = useMemo(() => {
  //   return profileData?.result;
  // }, [profileData]);
  const { refetchProfile, userProfile: profile, profileIsLoading } = useUserProfile();

  // 프로파일 수정 확인 - 변경된 경우 쿠키 갱신
  const setProfileCookies = useCallback(async () => {
    if (profile) {
      const result = await tokenManager.setTokenProfile(profile);
      if (result?.userInfo) {
        setUserInfo({ ...result?.userInfo });
      }
    }
  }, [profile, setUserInfo]);

  const isProfileChanged = useMemo(() => {
    if (profile?.photoUrl && userInfo) {
      if (profile?.id === userInfo.id) {
        return profile.photoUrl !== userInfo?.photoUrl;
      }
    }
    return false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.photoUrl]);

  useEffect(() => {
    if (isProfileChanged) {
      if (profile) {
        setProfileCookies();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProfileChanged]);

  const profileId = useMemo(() => {
    return profile?.id.toString() ?? '0';
  }, [profile]);

  // 게시물, 조회수 호출, TODO: 서버 prefetch
  const { data: countData } = useGetCounts(profileId, { query: { enabled: !!profileId && profileId !== '0' } });
  const count = useMemo(() => {
    return countData?.result;
  }, [countData]);

  // 맞팔로우 여부 확인
  const { data: myProfileData, refetch: refetchMyProfile } = useGetByIdOrCode1(
    userInfo?.id.toString() ?? '',
    {
      requestedProfileId: profileId,
    },
    { query: { enabled: !!profileId && profileId !== '0' } },
  );

  const myProfile = useMemo(() => {
    return myProfileData?.result;
  }, [myProfileData]);

  const isMyProfile = useMemo(() => {
    return userInfo?.id.toString() === profileId;
  }, [userInfo, profileId]);

  const currentFollowing = profile?.followdingState;
  const currentFollowBack = myProfile?.followdingState;

  // 팔로우 버튼명 설정 로직
  const followButtonLabel = useMemo(() => {
    if (currentFollowing) {
      return '팔로잉'; // 내가 이미 팔로우 중이면 '팔로잉'
    }
    return currentFollowBack ? '맞팔로우' : '팔로우';
  }, [currentFollowing, currentFollowBack]);

  /*
   *  팔로우/언팔로우 실행 mutation
   */
  const { mutate: follow } = useAddFollow();
  const { mutate: unFollow } = useUnFollow();

  /*
   *  팔로우/언팔로우 요청 실행
   */
  const handleFollow = async (targetProfileId: number, targetName: string, isFollowing: boolean) => {
    const requestBody = {
      profileIdOrCode: userInfo?.id.toString() || '',
      data: {
        followingProfileIdOrCode: targetProfileId.toString(),
      },
    };

    if (isFollowing) {
      unFollow(requestBody, {
        onSuccess: () => {
          handleToast(`${targetName} 팔로우를 취소합니다`);
          refetchProfile();
          refetchMyProfile();
        },
        onError: () => {
          handleToast(`${targetName} 팔로우 취소에 실패했습니다`);
        },
      });
    } else {
      follow(requestBody, {
        onSuccess: () => {
          handleToast(`${targetName} 팔로우 합니다`);
          refetchProfile();
          refetchMyProfile();
        },
        onError: () => {
          handleToast(`${targetName} 팔로우에 실패했습니다`);
        },
      });
    }
  };

  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);

  /*
   * 팔로워/팔로잉 모달 열기
   */
  const handleOpenFollowPopup = (tabIdx: number) => {
    setCurrentFollowTabIdx(tabIdx);
    setIsFollowModalOpen(true);
  };

  /*
   * 팔로워/팔로잉 모달 닫기
   */
  const handleCancelFollowPopup = async () => {
    await refetchProfile();
    setIsFollowModalOpen(false);
  };

  // 툴팁 노출
  const [isHovered, setIsHovered] = useState(false);

  /* 신고 하기 */
  const REPORT_CONTENT_TYPE = 'USER';
  const queryClient = useQueryClient();

  /* 신고 사유 prefetch */
  const handleEnterReportButton = async () => {
    await queryClient.prefetchQuery({
      queryKey: getGetAllOptionsQueryKey({ contentType: REPORT_CONTENT_TYPE }),
      queryFn: () => getAllOptions({ contentType: REPORT_CONTENT_TYPE }),
    });
  };

  /* 프로필 정보 업데이트 */
  const refetchData = async () => {
    if (refetchProfile) await refetchProfile();

    await queryClient.refetchQueries({
      queryKey: [`/file/v1/my-board/${profileId}/search`],
      type: 'active',
    });
    await queryClient.refetchQueries({
      queryKey: [`/file/v1/my-board/${profileId}/list`],
      type: 'all',
    });
  };

  return (
    <>
      <section className="content-sub">
        <div className="inner-sub">
          <h2 className="screen_out">마이보드</h2>
          <div className="wrap-profile">
            <div className="inner-profile">
              <Avatar src={profile?.photoUrl} classNames={cx(profile?.photoUrl ? 'thumb-profile' : '')}>
                <span className="screen_out">{`${profile?.name} 프로필 이미지`}</span>
                {isMyProfile && <AvatarEdit isMyboard refetchData={refetchData} />}
              </Avatar>
            </div>
            <strong
              className={`tit-profile ${isHovered ? 'hover' : ''}`}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {profile?.name}
            </strong>
            <TooltipContent colorType="default" sizeType="small" position="top" contents={profile?.name ?? ''} />
            {!profileIsLoading && !isMyProfile && (
              <div className="group-btn">
                <Button
                  size="small"
                  color={currentFollowing ? 'line' : 'black'}
                  onClick={() => handleFollow(profile?.id ?? 0, profile?.name ?? '', currentFollowing!)}
                >
                  {followButtonLabel}
                </Button>
              </div>
            )}
          </div>
          <div className="wrap-info">
            <div className="group-info">
              <div className="box-info">
                <dl className="list-info">
                  <button onClick={() => handleOpenFollowPopup(1)}>
                    <dt>팔로워</dt>
                    <dd>{formatCompactNumber(profile?.followerCount)}</dd>
                  </button>
                </dl>
                <dl className="list-info">
                  <button onClick={() => handleOpenFollowPopup(0)}>
                    <dt>팔로잉</dt>
                    <dd>{formatCompactNumber(profile?.followingCount)}</dd>
                  </button>
                </dl>
                <dl className="list-info">
                  <dt>게시물</dt>
                  <dd>
                    {isMyProfile
                      ? formatCompactNumber(count?.myBoardAllItemCount)
                      : `${formatCompactNumber(count?.myBoardPublicItemCount)}`}
                  </dd>
                </dl>
                <dl className="list-info">
                  <dt>조회수</dt>
                  <dd>
                    {isMyProfile
                      ? formatCompactNumber(count?.myBoardAllViewCount)
                      : formatCompactNumber(count?.myBoardPublicViewCount)}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="group-info">
              <strong className="tit-g">소개</strong>
              <p className="txt-desc">{profile?.bio}</p>
            </div>
            {!profileIsLoading && !isMyProfile && (
              <div className="group-btn">
                <Button
                  size="small"
                  color="line"
                  onClick={handleReportModalOpen}
                  onMouseEnter={handleEnterReportButton}
                >
                  신고
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
      {isFollowModalOpen && (
        <FollowModal
          profile={profile!}
          isOpen={isFollowModalOpen}
          onCancel={handleCancelFollowPopup}
          initialTabIdx={currentFollowTabIdx}
        />
      )}
      {isReportModalOpen && (
        <ReportModal
          isOpen={isReportModalOpen}
          onReport={handleReportModalOpen}
          onCancel={handleReportModalClose}
          targetProfile={profile}
          contentType={REPORT_CONTENT_TYPE}
        />
      )}
    </>
  );
}
