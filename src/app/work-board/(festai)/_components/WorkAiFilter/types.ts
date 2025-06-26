import { T_FILTER_TYPE, IFilterOption } from '../../types';

// 빠른업무AI 필터목록 (상수 유지)
export const FILTER_TYPE: Record<T_FILTER_TYPE, IFilterOption[]> = {
  sort: [
    {
      id: 'sortChild',
      label: '아이별 분류',
      type: 'checkbox',
      value: 'students',
      checked: true,
      isIcoHidden: true,
      thumbnail: '/images/img_ai_sort1.png',
    },
    {
      id: 'sortCategory',
      label: '놀이별 분류',
      type: 'checkbox',
      value: 'activityPhotos',
      checked: false,
      isIcoHidden: true,
      thumbnail: '/images/img_ai_sort2.png',
    },
  ],
  edit: [
    {
      id: 'convertFace',
      label: '아이얼굴 분리',
      type: 'radio',
      value: 'convertFace',
      checked: true,
      isIcoHidden: false,
      thumbnail: '/images/img_ai_edit1.png',
    },
    {
      id: 'removeBackground',
      label: '배경삭제',
      type: 'radio',
      value: 'removeBackground',
      checked: false,
      isIcoHidden: false,
      thumbnail: '/images/img_ai_edit2.png',
    },
    {
      id: 'mergePhoto',
      label: '사진합성',
      type: 'radio',
      value: 'mergePhoto',
      checked: false,
      isIcoHidden: false,
      thumbnail: '/images/img_ai_edit3.png',
    },
  ],
  face: [
    {
      id: 'fetchBlurFace',
      label: '흐림효과',
      type: 'radio',
      value: 'fetchBlurFace',
      checked: true,
      isIcoHidden: false,
      thumbnail: '/images/img_ai_face1.png',
    },
    {
      id: 'fetchSticker',
      label: '스티커',
      type: 'radio',
      value: 'fetchSticker',
      checked: false,
      isIcoHidden: false,
      thumbnail: '/images/img_ai_face2.png',
    },
    {
      id: 'faceReplaceFace',
      label: '얼굴교체',
      type: 'radio',
      value: 'faceReplaceFace',
      checked: false,
      isIcoHidden: false,
      thumbnail: '/images/img_ai_face3.png',
    },
  ],
};
