import { IMenuList } from '@/const/menu/types';

const createMenuList = (): IMenuList => {
  let currentId = 0;
  const generateId = () => currentId++;
  return [
    {
      id: generateId(),
      name: '서비스 소개',
      path: '/introduce',
    },
    {
      id: generateId(),
      name: '업무 보드',
      path: '/work-board',
    },
    {
      id: generateId(),
      name: '자료 보드',
      path: '/material-board',
    },
    {
      id: generateId(),
      name: '마이 보드',
      path: '/my-board/lecture-photo',
    },
  ];
};

export const MENU_LIST: IMenuList = createMenuList();

const createGnbMenuList = (): IMenuList => {
  let currentId = 0;
  const generateId = () => currentId++;
  return [
    {
      id: generateId(),
      name: '업무 보드',
      path: '/work-board',
      subMenu: [
        {
          id: generateId(),
          name: '놀이계획',
          path: '/playing-plan/plan-list',
        },
        {
          id: generateId(),
          name: '놀이보고서',
          path: '/playing-report',
        },
        {
          id: generateId(),
          name: '아이관찰기록',
          path: '/student-record',
        },
        {
          id: generateId(),
          name: '빠른AI-사진분류',
          path: '/image-sort',
        },
        {
          id: generateId(),
          name: '빠른AI-아이합성',
          path: '/image-merge',
        },
        {
          id: generateId(),
          name: '빠른AI-초상권해결',
          path: '/image-face-privacy',
        },
      ],
    },
    {
      id: generateId(),
      name: '자료 보드',
      path: '/material-board',
      subMenu: [
        {
          id: generateId(),
          name: '공개자료',
          path: `/public`,
        },
        {
          id: generateId(),
          name: '내드라이브',
          path: `https://i-screamdrive.com`,
        },
      ],
    },
    {
      id: generateId(),
      name: '마이 보드',
      path: '/my-board',
      subMenu: [
        {
          id: generateId(),
          name: '놀이사진',
          path: '/lecture-photo',
        },
        {
          id: generateId(),
          name: '놀이계획',
          path: '/lecture-plan',
        },
        {
          id: generateId(),
          name: '스토리보드',
          path: '/story-board',
        },
      ],
    },
  ];
};
export const GNB_MENU_LIST: IMenuList = createGnbMenuList();

const createProfileMenuList = (): IMenuList => {
  let currentId = 0;
  const generateId = () => currentId++;
  return [
    {
      id: generateId(),
      name: '우리 반 관리',
      path: '/',
    },
    {
      id: generateId(),
      name: '내 정보 관리',
      path: '/my-info',
    },
  ];
};
export const PROFILE_MENU_LIST: IMenuList = createProfileMenuList();

const createFooterMenuList = (): IMenuList => {
  let currentId = 0;
  const generateId = () => currentId++;
  return [
    {
      id: generateId(),
      name: '개인정보처리방침',
      path: '/terms/privacyPolicy',
    },
    {
      id: generateId(),
      name: '웹사이트 이용약관',
      // bold: true,
      path: '/terms/termsOfService',
    },
    {
      id: generateId(),
      name: '이메일무단수집거부',
      path: '',
    },
    {
      id: generateId(),
      name: '고객센터',
      path: '',
    },
  ];
};
export const FOOTER_MENU_LIST: IMenuList = createFooterMenuList();
