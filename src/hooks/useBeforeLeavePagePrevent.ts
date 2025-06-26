import { usePathname } from 'next/navigation';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import { useState } from 'react';
import { LEAVE_PAGE_CONFIRM_MESSAGE_WITH_BREAK } from '@/const';
import { useNavigationGuard } from 'next-navigation-guard';
import { useQueryClient } from '@tanstack/react-query';

export const useBeforeLeavePagePrevent = (isChanged: boolean, isFreePath: boolean = false) => {
  const { showAlert } = useAlertStore();
  const [confirmResult, setConfirmResult] = useState<boolean | null>(null); // 상태 관리
  // react query 캐시 삭제
  const pathname = usePathname();
  const queryClient = useQueryClient();

  // 페이지 이동을 차단하고 커스텀 메시지를 띄우는 훅
  useNavigationGuard({
    enabled: () => {
      if (isFreePath) return false;
      return isChanged;
    }, // isChanged가 true일 때만 페이지 이동 차단
    confirm: () => {
      return new Promise<boolean>((resolve) => {
        showAlert({
          message: LEAVE_PAGE_CONFIRM_MESSAGE_WITH_BREAK,
          isConfirm: true,
          onConfirm: async () => {
            if (pathname.includes('/work-board/playing-plan')) {
              await queryClient.clear();
            }
            setConfirmResult(true); // 확인을 클릭했을 경우
            resolve(true); // 사용자가 '확인'을 클릭하면 true 반환
          },
          onCancel: () => {
            setConfirmResult(false); // 취소를 클릭했을 경우
            resolve(false); // 사용자가 '취소'를 클릭하면 false 반환
          },
        });
      });
    },
  });

  // confirmResult가 설정된 후, 이동을 허용하거나 막기 위해 확인
  if (confirmResult === null) {
    // 아직 사용자가 버튼을 클릭하지 않았을 때는 처리하지 않음
  }
};
