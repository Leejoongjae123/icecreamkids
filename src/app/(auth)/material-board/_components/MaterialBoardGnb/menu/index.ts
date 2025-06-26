import { IMenuList } from '@/const/menu/types';

const pathPrefix = '/material-board';
const createMenuList = (): IMenuList => {
  let currentId = 0;
  const generateId = () => currentId++;
  return [
    {
      id: generateId(),
      name: '자료보드',
      path: pathPrefix,
    },
    {
      id: 1,
      name: '스마트 폴더',
      path: `${pathPrefix}/smart-folder`,
      subMenu: [
        {
          id: generateId(),
          name: '사진',
          path: `/photos`,
          subMenu: [
            {
              id: generateId(),
              name: '우리반 아이들',
              path: `/students`,
            },
            {
              id: generateId(),
              name: '활동별 사진',
              path: `/lectures`,
            },
            {
              id: generateId(),
              name: '빠른 작업 사진',
              path: `/quick-actions`,
            },
          ],
        },
        {
          id: generateId(),
          name: '문서',
          path: `/documents`,
          subMenu: [], // 위젯 생성 리스트를 하위 메뉴로 가져오기
        },
      ],
    },
    {
      id: 2,
      name: '내 폴더',
      path: `${pathPrefix}/my-folder`,
      subMenu: [
        {
          id: generateId(),
          name: '즐겨찾기',
          path: `/favorite`,
        },
      ],
    },
    {
      id: 3,
      name: '공개자료',
      path: `${pathPrefix}/public`,
    },
    {
      id: 4,
      name: '휴지통',
      path: `${pathPrefix}/trash`,
    },
    {
      id: 5,
      name: '공개자료 테스트 공개자료 테스트 공개',
      path: `${pathPrefix}/public`,
    },
  ];
};

export const MENU_LIST = createMenuList();
