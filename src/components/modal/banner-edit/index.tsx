import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { IBannerEditModal } from '@/components/modal/banner-edit/types';
import { ModalBase } from '@/components/common';
import { MyBannerResult } from '@/service/core/schemas';
import { useUpdateMyBoardBanner } from '@/service/member/memberStore';
import useUserStore, { UserInfo } from '@/hooks/store/useUserStore';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import { useToast } from '@/hooks/store/useToastStore';
import { createPortal } from 'react-dom';
import { useGetMyBoardBanners } from '@/service/core/coreStore';
import { tokenManager } from '@/utils/tokenManager';

export const BannerEditModal = ({ profileRefetch, isOpen, onCancel }: IBannerEditModal) => {
  const { showAlert } = useAlertStore();
  const addToast = useToast((state) => state.add);
  const { userInfo, setUserInfo } = useUserStore();

  /*
   * 배너 조회
   */
  const { data: bannerData } = useGetMyBoardBanners();
  const bannerList: MyBannerResult[] = useMemo(() => {
    return bannerData?.result ?? [];
  }, [bannerData?.result]);

  const userBanner = useMemo(() => {
    return bannerList.find((banner: MyBannerResult) => banner.bannerUrl === userInfo?.myBoardBannerUrl);
  }, [bannerList, userInfo?.myBoardBannerUrl]);

  const defaultBanner = useMemo(() => {
    return bannerList.find((banner: MyBannerResult) => banner.isDefuault);
  }, [bannerList]);

  const myBoardBanner: MyBannerResult = useMemo(() => {
    return userBanner ?? defaultBanner ?? bannerList[0];
  }, [bannerList, defaultBanner, userBanner]);

  const [banner, setBanner] = useState<string>(myBoardBanner?.id.toString());

  useEffect(() => {
    setBanner(myBoardBanner?.id.toString());
  }, [myBoardBanner]);

  // 쿠키 갱신
  const setProfileCookies = useCallback(
    async (profile: UserInfo) => {
      if (profile) {
        const result = await tokenManager.setTokenProfile(profile);
        if (result?.userInfo) {
          setUserInfo({ ...result?.userInfo });
        }
      }
    },
    [setUserInfo],
  );

  /*
   * 배너 편집 저장
   */
  const { mutateAsync: updateMyBoardBanner } = useUpdateMyBoardBanner();
  const onConfirm = async () => {
    if (!banner) {
      showAlert({ message: '선택된 배너가 없습니다.' });
      return;
    }

    try {
      const selectedBanner = bannerList.find((item: MyBannerResult) => item.id.toString() === banner);

      if (!selectedBanner) {
        showAlert({ message: '선택된 배너가 없습니다.' });
        return;
      }

      const result = await updateMyBoardBanner({
        data: { bannerUrl: selectedBanner.bannerUrl },
      });

      if (result.status === 200) {
        // setUserInfo({ ...(userInfo as UserInfo), myBoardBannerUrl: selectedBanner.bannerUrl });
        const userProfile = { ...(userInfo as UserInfo), myBoardBannerUrl: selectedBanner.bannerUrl };
        await setProfileCookies(userProfile);
        addToast({ message: '저장되었습니다.' });
        profileRefetch();
        if (onCancel) {
          onCancel();
        }
      } else {
        showAlert({ message: '저장에 실패하였습니다.' });
      }
    } catch (error) {
      showAlert({ message: '저장에 실패하였습니다.' });
    }
  };

  return createPortal(
    <ModalBase
      isOpen={isOpen}
      cancelText="취소"
      confirmText="적용"
      message="배너 수정"
      onCancel={onCancel}
      onConfirm={onConfirm}
      size="medium"
      className="modal-banner"
    >
      <div className="group-choice">
        {bannerList.map((item: MyBannerResult) => (
          <div className="item-choice" key={item.id}>
            <input
              type="radio"
              id={item.id.toString()}
              name={`banner_${item.id}`}
              className="inp-comm"
              value={item.id.toString()}
              checked={banner === item.id.toString()}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBanner((e.target as HTMLInputElement).value)}
            />
            <label htmlFor={item.id.toString()} className="lab-radio">
              <span className="ico-comm ico-inp-radio" />
              <span className="banner-radio" style={{ backgroundImage: `url(${item.bannerUrl})` }}>
                <span className="ico-comm ico-image-45" />
              </span>
              {/* 디폴트 배너 영역 주석처리 */}
              {/* <span className="banner-radio banner-empty"> */}
              {/*  <span className="ico-comm ico-image-45" /> */}
              {/* </span> */}
            </label>
          </div>
        ))}
      </div>
    </ModalBase>,
    document.getElementById('modal-root') as HTMLElement,
  );
};

BannerEditModal.displayName = 'BannerEditModal';
