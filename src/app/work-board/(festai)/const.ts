interface MessageSet {
  result: string;
  loading: string;
  complete: string;
}

export const ImageProcessMessages: Record<string, MessageSet> = {
  convertFace: {
    result: '선택한 사진에서 아이의 얼굴을 분리하였어요.',
    loading: '아이의 얼굴이 분리되고 있어요. 잠시만 기다려주세요.',
    complete: '아이얼굴 분리가 완료되었습니다.',
  },
  removeBackground: {
    result: '선택한 사진에서 아이의 배경을 삭제하여 투명하게 만들었어요.',
    loading: '아이의 배경을 삭제하고 있어요. 잠시만 기다려주세요.',
    complete: '배경삭제가 완료되었습니다.',
  },
  fetchBlurFace: {
    result: '선택한 사진들의 아이 얼굴을 모두 흐리게 처리했어요.',
    loading: '아이 얼굴을 흐리게 하고 있어요. 잠시만 기다려주세요.',
    complete: '흐림효과가 완료되었습니다.',
  },
  fetchSticker: {
    result: '선택한 사진들의 아이 얼굴에 모두 스티커를 붙여 가렸어요.',
    loading: '아이 얼굴에 스티커를 붙이고 있어요. 잠시만 기다려주세요.',
    complete: '스티커 붙임이 완료되었습니다.',
  },
};
