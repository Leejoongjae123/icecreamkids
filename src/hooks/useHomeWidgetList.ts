import { useMemo, useEffect } from 'react';
import { useGetWidgetFolders } from '@/service/file/fileStore';
import { useHomeWidgetListStore } from '@/hooks/store/useHomeWidgetListStore';
import { debounce } from '@/utils';
import { usePathname } from 'next/navigation';
import useUserStore from './store/useUserStore';

export default function useHomeWidgetList() {
  const { userInfo } = useUserStore();
  const pathname = usePathname();
  const { homeWidgetList, setHomeWidgetList } = useHomeWidgetListStore();

  const { data: homeWidgetListItems, refetch: widgetListRefetch } = useGetWidgetFolders(
    {},
    {
      query: { enabled: false },
    },
  );

  const debounceRefetch = useMemo(() => {
    const callBack = () => {
      widgetListRefetch();
    };
    return debounce(callBack, 200);
  }, [widgetListRefetch]);

  useEffect(() => {
    if (homeWidgetListItems?.result) {
      setHomeWidgetList(homeWidgetListItems);
    }
  }, [homeWidgetListItems, setHomeWidgetList]);

  useEffect(() => {
    if (userInfo) {
      if (!['/login', '/preview'].includes(pathname)) {
        debounceRefetch();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, userInfo]);

  return { homeWidgetList };
}
