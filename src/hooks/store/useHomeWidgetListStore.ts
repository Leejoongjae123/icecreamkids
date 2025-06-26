import { ApiResponseListSmartFolderResult } from '@/service/aiAndProxy/schemas/apiResponseListSmartFolderResult';
import { SmartFolderResult } from '@/service/file/schemas';
import { create } from 'zustand';

interface IHomeWidgetList {
  homeWidgetList?: SmartFolderResult[] | undefined;
  setHomeWidgetList: (widgetList: ApiResponseListSmartFolderResult) => void;
  setHomeWidgetResult: (widgetList: SmartFolderResult[] | null) => void;
  removeHomeWidgetList: () => void;
}

export const useHomeWidgetListStore = create<IHomeWidgetList>((set) => ({
  homeWidgetList: undefined,
  setHomeWidgetList: (widthList) =>
    set(() => ({
      homeWidgetList: widthList?.result ? widthList.result?.filter((item) => !item.isHidden) : undefined,
    })),
  setHomeWidgetResult: (widthList) =>
    set(() => ({
      homeWidgetList: widthList ? widthList?.filter((item) => !item.isHidden) : undefined,
    })),
  removeHomeWidgetList: () => set(() => ({ homeWidgetList: undefined })),
}));
