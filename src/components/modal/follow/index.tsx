import React, { Children, useEffect, useMemo, useRef, useState } from 'react';
import { Loader, ModalBase } from '@/components/common';
import { IFollowModal } from '@/components/modal/follow/types';
import { useToast } from '@/hooks/store/useToastStore';
import useUserStore from '@/hooks/store/useUserStore';
import { FollowResult, GetAllFollowingsParams } from '@/service/member/schemas';
import {
  getAllFollowers,
  getAllFollowings,
  getGetAllFollowersQueryOptions,
  getGetAllFollowingsQueryOptions,
  useAddFollow,
  useUnFollow,
} from '@/service/member/memberStore';
import { Tab } from '@/components/common/Tab';
import { FOLLOW_MODAL_TAB_LIST } from '@/const/tab';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useInfiniteQueryWithLimit } from '@/utils/react-query';
import { getFlattenedData } from '@/utils';
import FollowItem from '@/components/modal/follow/_components/FollowItem';
import { createPortal } from 'react-dom';

export const FollowModal = ({ profile, isOpen, onCancel, initialTabIdx }: IFollowModal) => {
  const { userInfo } = useUserStore();
  const [focusIdx, setFocusIdx] = useState<number>(initialTabIdx);

  const profileId = useMemo(() => {
    return profile?.id.toString() ?? '0';
  }, [profile]);

  const params: GetAllFollowingsParams = {
    includes: 'profile',
  };

  const addToast = useToast((state) => state.add);
  const handleToast = (toastMessage: string) => {
    addToast({
      message: toastMessage,
    });
  };

  /** 무한 스크롤 */
  const LIMIT = 20;

  // 팔로잉 리스트 데이터
  const { queryKey } = getGetAllFollowingsQueryOptions(profileId, params);
  const {
    data: followingData,
    fetchNextPage: followingListNextPage,
    hasNextPage: followingListsHasNext,
    isFetchingNextPage: followingListFetchingNextPage,
    refetch: followingRefetch,
  } = useInfiniteQueryWithLimit({
    queryKey,
    queryFn: (pageParam) => getAllFollowings(profileId, { ...params, offsetWithLimit: `${pageParam},${LIMIT}` }),
    limit: LIMIT,
  });

  const followingResults = useMemo(() => {
    return getFlattenedData(followingData?.pages);
  }, [followingData]);

  // 팔로잉 리스트 useState 관리
  const [currentFollowingResults, setCurrentFollowingResults] = useState<FollowResult[]>([]);

  useEffect(() => {
    setCurrentFollowingResults(followingResults);
  }, [followingResults]);

  // 팔로워 리스트 데이터
  const { queryKey: followerQueryKey } = getGetAllFollowersQueryOptions(profileId, params);
  const {
    data: followerData,
    fetchNextPage: followerListNextPage,
    hasNextPage: followerListsHasNext,
    isFetchingNextPage: followerListFetchingNextPage,
    refetch: followerRefetch,
  } = useInfiniteQueryWithLimit({
    queryKey: followerQueryKey,
    queryFn: (pageParam) => getAllFollowers(profileId, { ...params, offsetWithLimit: `${pageParam},${LIMIT}` }),
    limit: LIMIT,
  });

  const followerResults: FollowResult[] = useMemo(() => {
    return getFlattenedData(followerData?.pages);
  }, [followerData]);

  // 팔로워 리스트 useState 관리
  const [currentFollowerResults, setCurrentFollowerResults] = useState<FollowResult[]>([]);

  useEffect(() => {
    setCurrentFollowerResults(followerResults);
  }, [followerResults]);

  // 나의 팔로잉 리스트 데이터
  const { queryKey: myFollowingQueryKey } = getGetAllFollowingsQueryOptions(userInfo?.id.toString() || '', params);
  const {
    data: myFollowingData,
    fetchNextPage: myFollowingListNextPage,
    refetch: myFollowingRefetch,
  } = useInfiniteQueryWithLimit({
    queryKey: myFollowingQueryKey,
    queryFn: (pageParam) =>
      getAllFollowings(userInfo?.id.toString() ?? profileId, { ...params, offsetWithLimit: `${pageParam},${LIMIT}` }),
    limit: LIMIT,
  });

  const myFollowingResults = useMemo(() => {
    return getFlattenedData(myFollowingData?.pages);
  }, [myFollowingData]);

  // 나의 팔로워 리스트 데이터
  const { queryKey: myFollowerQueryKey } = getGetAllFollowersQueryOptions(userInfo?.id.toString() || '', params);
  const {
    data: myFollowerData,
    fetchNextPage: myFollowerListNextPage,
    refetch: myFollowerRefetch,
  } = useInfiniteQueryWithLimit({
    queryKey: myFollowerQueryKey,
    queryFn: (pageParam) =>
      getAllFollowers(userInfo?.id.toString() ?? profileId, { ...params, offsetWithLimit: `${pageParam},${LIMIT}` }),
    limit: LIMIT,
  });

  const myFollowerResults = useMemo(() => {
    return getFlattenedData(myFollowerData?.pages);
  }, [myFollowerData]);

  // 나의 팔로잉 리스트 useState로 관리
  const [currentMyFollowingResults, setMyFollowingResults] = useState<FollowResult[]>([]);

  useEffect(() => {
    setMyFollowingResults(myFollowingResults);
  }, [myFollowingResults]);

  /** following 옵저브 관리 * */
  const followingLoadMoreRef = useRef<HTMLDivElement | null>(null);
  const followingCallbackRef = useRef<() => void>(() => {}); // 데이터의 최신 상태 유지하기 위해 ref 생성

  useEffect(() => {
    followingCallbackRef.current = async () => {
      if (followingListsHasNext && !followingListFetchingNextPage) {
        await followingListNextPage();
        await myFollowingListNextPage();
        await myFollowerListNextPage();
      }
    };
  }, [
    followingListsHasNext,
    followingListFetchingNextPage,
    followingListNextPage,
    myFollowingListNextPage,
    myFollowerListNextPage,
  ]);

  /** 옵저브 선언 * */
  const { observe: followingObserve } = useInfiniteScroll({
    callback: () => followingCallbackRef.current(),
    threshold: 0.1,
    root: document.querySelector('.inner-modal') as HTMLElement,
    rootMargin: '0px 0px 0px 0px',
  });

  /** 옵저브 요소 할당 */
  useEffect(() => {
    if (followingLoadMoreRef.current) {
      followingObserve(followingLoadMoreRef.current);
    }
  }, [followingObserve]);

  /** follower 옵저브 관리 * */
  const followerLoadMoreRef = useRef<HTMLDivElement | null>(null);
  const followerCallbackRef = useRef<() => void>(() => {}); // 데이터의 최신 상태 유지하기 위해 ref 생성

  useEffect(() => {
    followerCallbackRef.current = async () => {
      if (followerListsHasNext && !followerListFetchingNextPage) {
        await followerListNextPage();
        await myFollowingListNextPage();
        await myFollowerListNextPage();
      }
    };
  }, [
    followerListsHasNext,
    followerListFetchingNextPage,
    followerListNextPage,
    myFollowingListNextPage,
    myFollowerListNextPage,
  ]);

  /** 옵저브 선언 * */
  const { observe: followerObserve } = useInfiniteScroll({
    callback: () => followerCallbackRef.current(),
    threshold: 0.1,
    root: document.querySelector('.inner-modal') as HTMLElement,
    rootMargin: '0px 0px 0px 0px',
  });

  /** 옵저브 요소 할당 */
  useEffect(() => {
    if (followerLoadMoreRef.current) {
      followerObserve(followerLoadMoreRef.current);
    }
  }, [followerObserve]);

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
      profileIdOrCode: userInfo?.id.toString() ?? profileId,
      data: {
        followingProfileIdOrCode: targetProfileId.toString(),
      },
    };

    if (isFollowing) {
      unFollow(requestBody, {
        onSuccess: () => {
          handleToast(`${targetName} 팔로우를 취소합니다`);
          // 팔로잉 리스트 유지, 버튼 상태만 변경
          setCurrentFollowingResults((prev) =>
            prev.map((item) => (item.followingProfileId === targetProfileId ? { ...item, isFollowing: false } : item)),
          );
          // 팔로우 리스트 유지, 버튼 상태만 변경
          setCurrentFollowerResults((prev) =>
            prev.map((item) => (item.followerProfileId === targetProfileId ? { ...item, isFollowBack: false } : item)),
          );
          // 내 팔로잉 리스트에서도 제거 (isFollowing 판단용)
          setMyFollowingResults((prev) => prev.filter((item) => item.followingProfileId !== targetProfileId));
        },
        onError: () => {
          handleToast(`${targetName} 팔로우 취소에 실패했습니다`);
        },
      });
    } else {
      follow(requestBody, {
        onSuccess: () => {
          handleToast(`${targetName} 팔로우 합니다`);
          // 팔로잉 리스트 유지, 버튼 상태만 변경
          setCurrentFollowingResults((prev) =>
            prev.map((item) =>
              item.followingProfileId === targetProfileId ? { ...item, isFollowing: true, isFollowBack: true } : item,
            ),
          );

          // 팔로우 리스트 유지, 버튼 상태만 변경
          setCurrentFollowerResults((prev) =>
            prev.map((item) => (item.followerProfileId === targetProfileId ? { ...item, isFollowBack: true } : item)),
          );

          // 내 팔로잉 리스트에 추가 (isFollowing 판단용)
          setMyFollowingResults((prev) => [
            ...prev,
            { followingProfileId: targetProfileId } as FollowResult, // 필요한 정보만 추가
          ]);
        },
        onError: () => {
          handleToast(`${targetName} 팔로우에 실패했습니다`);
        },
      });
    }

    await followerRefetch();
  };

  // 모달을 구성하는 팔로잉탭/팔로우탭
  interface ITabContents {
    list: FollowResult[];
    profileIdKey: 'followingProfileId' | 'followerProfileId';
    loadMoreRef: React.MutableRefObject<HTMLDivElement | null>;
    isFetchingNextPage: boolean;
  }

  const tabContents: ITabContents[] = [
    {
      list: currentFollowingResults,
      profileIdKey: 'followingProfileId',
      loadMoreRef: followingLoadMoreRef,
      isFetchingNextPage: followingListFetchingNextPage,
    },
    {
      list: currentFollowerResults,
      profileIdKey: 'followerProfileId',
      loadMoreRef: followerLoadMoreRef,
      isFetchingNextPage: followerListFetchingNextPage,
    },
  ] as const;

  const dataRefetch = async () => {
    await followingRefetch();
    await followerRefetch();
    await myFollowingRefetch;
  };

  // initialTabIdx 변경시 focusIdx 업데이트
  useEffect(() => {
    setFocusIdx(initialTabIdx);
  }, [initialTabIdx]);

  // 탭 변경시 데이터 리패치
  const handleTabClick = async (index: number) => {
    await dataRefetch();
    setFocusIdx(index);
  };

  const handleClose = async () => {
    await dataRefetch();

    if (onCancel) {
      onCancel();
    }
  };

  const renderTab = (tab: ITabContents) => {
    if (tab.list.length > 0) {
      return (
        <>
          <ul className="list-follower" key={tab.profileIdKey}>
            {tab.list.map((item: FollowResult) => {
              const targetProfileId =
                tab.profileIdKey === 'followerProfileId' ? item.followerProfileId : item.followingProfileId;

              const isFollowing = currentMyFollowingResults
                .map((i: FollowResult) => i.followingProfileId)
                .includes(targetProfileId);

              return (
                <FollowItem
                  key={targetProfileId}
                  item={item}
                  isFollowing={isFollowing}
                  handleFollow={handleFollow}
                  profileIdKey={tab.profileIdKey}
                  myFollower={myFollowerResults}
                  closeModal={onCancel}
                />
              );
            })}
            {tab.isFetchingNextPage && <Loader />}
          </ul>
          <div ref={tab.loadMoreRef} style={{ height: '10px', background: 'transparent' }} />
        </>
      );
    }

    return (
      <div className="item-empty type3">
        {tab.profileIdKey === 'followingProfileId' ? (
          <span className="txt-empty">{`${profile?.name}님이 팔로우하는 모든 사람이 여기에 표시됩니다.`}</span>
        ) : (
          <span className="txt-empty">{`${profile?.name}님을 팔로우하는 모든 사람이 여기에 표시됩니다.`}</span>
        )}
      </div>
    );
  };

  return createPortal(
    <ModalBase
      isOpen={isOpen}
      className="modal-follower"
      message="팔로워"
      cancelText="닫기"
      onCancel={handleClose}
      size="small"
    >
      <Tab items={FOLLOW_MODAL_TAB_LIST} focusIdx={focusIdx} onChange={handleTabClick} sizeType="medium" fullType>
        {Children.toArray(tabContents.map((tab: ITabContents) => renderTab(tab)))}
      </Tab>
    </ModalBase>,
    document.getElementById('modal-root') as HTMLElement,
  );
};

FollowModal.displayName = 'FollowModal';
export default FollowModal;
