'use client';

import { type ReactNode, useEffect } from 'react';
import ReactQueryProvider from '@/hooks/useReactQuery';
import { ToastProvider } from '@/providers/toast-provider';
import { AlertProvider } from '@/providers/alert-provider';
import { SnackbarProvider } from '@/providers/snackbar-provider';
import ClassManageModalProvider from '@/providers/class-manage-provider';
import useUserStore from '@/hooks/store/useUserStore';
import { usePathname, useRouter } from 'next/navigation';
import { NavigationGuardProvider } from 'next-navigation-guard';
import { DndProviderWrapper } from '@/context/DnDContext';
import { FileProvider } from '@/context/fileContext';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function ClientProviders({ children }: { children: ReactNode }) {
  const { userInfo, clearUserInfo } = useUserStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const channel = new BroadcastChannel('data-share-channel');
    if (userInfo) {
      channel.onmessage = (event: MessageEvent) => {
        if (event.data === 'REQUEST_SESSION_DATA') {
          const encryptedUserInfo = sessionStorage.getItem('encryptedUserInfo');
          const userStorage = sessionStorage.getItem('user-storage');
          if (encryptedUserInfo && userStorage) {
            const sessionItems = { encryptedUserInfo, userStorage };
            channel.postMessage({
              type: 'RESPONSE_SESSION_DATA',
              session: sessionItems,
            });
          } else {
            channel.postMessage('REJECT');
          }
        }
      };
    }
    const channelLogout = new BroadcastChannel('data-share-remove-channel');
    if (userInfo) {
      channelLogout.onmessage = async (event: MessageEvent) => {
        if (event.data === 'REQUEST_SESSION_REMOVE' || event.data?.type === 'REQUEST_SESSION_REMOVE') {
          sessionStorage.removeItem('encryptedUserInfo');
          await clearUserInfo();
          router.push('/');
        }
      };
    }
    // 세션 삭제 처리
    if (!pathname.includes('/work-board/student-record')) {
      sessionStorage.removeItem('openWorkboardSnB');
    }
    return () => {
      channel.close();
      channelLogout.close();
    };
  }, [userInfo, pathname, clearUserInfo, router]);

  return (
    <ReactQueryProvider>
      {/* <GlobalLoading /> */}
      <TooltipProvider>
        <DndProviderWrapper>
          <FileProvider>
            <NavigationGuardProvider>{children}</NavigationGuardProvider>
          </FileProvider>
        </DndProviderWrapper>
        <ClassManageModalProvider />
        <ToastProvider />
        <SnackbarProvider />
        <AlertProvider />
      </TooltipProvider>
    </ReactQueryProvider>
  );
}
