import { useState, useEffect } from 'react';
import useUserStore from '@/hooks/store/useUserStore';

interface MemoCheckResponse {
  hasMemo: boolean;
  memoCount?: number;
}

/**
 * 이미지에 메모가 있는지 확인하는 훅
 * @param driveItemId - 이미지의 drive item ID
 * @returns {boolean} hasMemo - 메모 존재 여부
 */
export const useMemoCheck = (driveItemId?: string) => {
  const [hasMemo, setHasMemo] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const { userInfo } = useUserStore();

  useEffect(() => {
    const checkMemo = async () => {
      if (!driveItemId || !userInfo?.accountId) {
        setHasMemo(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `/api/file/v1/drive-items/${driveItemId}/memos?owner_account_id=${userInfo.accountId}`,
          {
            method: 'GET',
            headers: {
              'accept': '*/*',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          // API 응답에 따라 메모 존재 여부 확인
          // 메모가 있으면 배열이 비어있지 않을 것으로 가정
          const memoExists = Array.isArray(data.result) ? data.result.length > 0 : false;
          setHasMemo(memoExists);
        } else {
          setHasMemo(false);
        }
      } catch (error) {
        setHasMemo(false);
      } finally {
        setLoading(false);
      }
    };

    checkMemo();
  }, [driveItemId, userInfo?.accountId]);

  return { hasMemo, loading };
};
