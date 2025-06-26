import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Avatar, Button, TooltipContent } from '@/components/common';
import { useGetCounts } from '@/service/file/fileStore';
import { IFollowItem } from '@/components/modal/follow/_components/FollowItem/types';
import useUserStore from '@/hooks/store/useUserStore';
import { FollowResult } from '@/service/member/schemas';

const FollowItem = ({ item, isFollowing, handleFollow, profileIdKey, myFollower, closeModal }: IFollowItem) => {
  const { userInfo } = useUserStore();
  const { data: countData } = useGetCounts(item[profileIdKey].toString());
  const postCount = useMemo(() => {
    return countData?.result?.myBoardPublicItemCount ?? 0;
  }, [countData]);

  // 버튼명 설정 로직
  const buttonLabel = useMemo(() => {
    if (isFollowing) {
      return '팔로잉'; // 내가 이미 팔로우 중이면 '팔로잉'
    }

    // 타인 팔로워 모달 조회 >  내 팔로워 목록에 있으면, '맞팔로우
    if (item[profileIdKey] !== userInfo?.id) {
      return myFollower.map((data: FollowResult) => data.followerProfileId).includes(item[profileIdKey])
        ? '맞팔로우'
        : '팔로우';
    }

    // 내 팔로워 모달 조회 > isFollowBack 결과에 따라 구현
    return item.isFollowBack ? '팔로우' : '맞팔로우';
  }, [isFollowing, item, myFollower, profileIdKey, userInfo?.id]);

  const [isHovered, setIsHovered] = useState<number | null>(null);

  return (
    <li key={item[profileIdKey]}>
      <div className="item-contents">
        <div className="inner-profile">
          <Link
            href={`/my-board/story-board?user=${item.profile?.code}`}
            className="link-thumb"
            onClick={closeModal || (() => {})}
          >
            <Avatar icon height={48} width={48} src={item.profile?.photoUrl} classNames="thumb-profile" />
          </Link>
        </div>
        <div className="info-contents">
          <Link
            href={`/my-board/story-board?user=${item.profile?.code}`}
            className="link-name"
            onClick={closeModal || (() => {})}
            onMouseEnter={() => setIsHovered(item[profileIdKey])}
            onMouseLeave={() => setIsHovered(null)}
          >
            <strong className="name-profile">
              {item.profile?.name && item.profile?.name.length > 20
                ? `${item.profile?.name.slice(0, 20)}...`
                : item.profile?.name}
            </strong>
            {isHovered === item[profileIdKey] && item.profile?.name && item.profile?.name.length > 20 && (
              <TooltipContent sizeType="small" position="top" contents={item.profile?.name ?? ''} />
            )}
          </Link>
          <span className="txt-num">{`${postCount.toLocaleString()}건`}</span>
        </div>
        {/* 로그인 유저는 팔로우/팔로잉/맞팔로우 버튼 미노출 */}
        {item[profileIdKey] !== userInfo?.id && (
          <Button
            size="small"
            color={isFollowing ? 'line' : 'primary'}
            onClick={() => handleFollow(item[profileIdKey], item.profile?.name ?? '', isFollowing)}
          >
            {buttonLabel}
          </Button>
        )}
      </div>
    </li>
  );
};

export default FollowItem;
