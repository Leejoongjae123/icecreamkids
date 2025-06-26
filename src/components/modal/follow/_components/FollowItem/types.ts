import { FollowResult } from '@/service/member/schemas';

export interface IFollowItem {
  item: FollowResult;
  /**
   * isFollowing: 내가 해당 유저를 팔로우하고 있는지 여부
   */
  isFollowing: boolean;
  handleFollow: (targetProfileId: number, targetName: string, isFollowing: boolean) => void;
  profileIdKey: 'followerProfileId' | 'followingProfileId';
  myFollower: FollowResult[];
  closeModal?: (() => void | Promise<void>) | null | undefined;
}
