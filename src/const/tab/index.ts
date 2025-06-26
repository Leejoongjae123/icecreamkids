import { ITabItem } from '@/components/common/Tab/types';

const MY_BOARD_TAB_LIST: ITabItem[] = [
  {
    text: '놀이 사진',
    tabName: 'lecturePhoto',
    tabId: 'tabPhoto',
    contentsId: 'panelPhoto',
    path: 'lecture-photo',
  },
  {
    text: '놀이 계획',
    tabName: 'lecturePlan',
    tabId: 'tabPlan',
    contentsId: 'panelPlan',
    path: 'lecture-plan',
  },
  {
    text: '스토리 보드',
    tabName: 'storyBoard',
    tabId: 'tabStoryBoard',
    contentsId: 'panelStoryBoard',
    path: 'story-board',
  },
];

const FOLLOW_MODAL_TAB_LIST: ITabItem[] = [
  {
    text: '팔로잉',
    tabName: 'following',
    tabId: 'tabFollowing',
    contentsId: 'panelFollowing',
    path: '/following',
  },
  {
    text: '팔로워',
    tabName: 'follower',
    tabId: 'tabFollower',
    contentsId: 'panelFollower',
    path: '/follower',
  },
];

const UPLOAD_MODAL_TAB_LIST: ITabItem[] = [
  {
    text: '추천자료',
    tabName: 'recommend',
    tabId: 'tabRecommend',
    contentsId: 'panelRecommend',
    path: '/recommend',
  },
  {
    text: '자료보드',
    tabName: 'material',
    tabId: 'tabMaterial',
    contentsId: 'panelMaterial',
    path: '/material',
  },
];

const DOWNLOAD_MODAL_TAB_LIST: ITabItem[] = [
  {
    text: '내폴더',
    tabName: 'myFolder',
    tabId: 'tabMyFolder',
    contentsId: 'panelMyFolder',
    path: '/my-folder',
  },
  {
    text: '자료보드',
    tabName: 'material',
    tabId: 'tabMaterial',
    contentsId: 'panelMaterial',
    path: '/material',
  },
];

const WORK_BOARD_SNB_TAB = [
  {
    text: '추천자료',
    tabName: 'recommend',
    tabId: 'tabRecommend',
    contentsId: 'panelRecommend',
    path: 'lecture-photo',
  },
  {
    text: '자료보드',
    tabName: 'materialBoard',
    tabId: 'tabMaterialBoard',
    contentsId: 'panelMaterialBoard',
    path: 'lecture-plan',
  },
];

export { MY_BOARD_TAB_LIST, FOLLOW_MODAL_TAB_LIST, UPLOAD_MODAL_TAB_LIST, DOWNLOAD_MODAL_TAB_LIST, WORK_BOARD_SNB_TAB };
