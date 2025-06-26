'use client';

import { Button } from '@/components/common';
import AppLayout from '@/components/layout/AppLayout';
import { useRouter } from 'next/navigation';

export default function Error() {
  const router = useRouter();

  return (
    <AppLayout customDocClass="doc-error">
      <div>
        <h3 className="screen_out">안내</h3>
        <div className="group-error">
          <span className="ico-comm ico-error" />
          <strong className="tit-error">이용에 불편을 드려 죄송합니다.</strong>
          <p className="txt-error">
            서비스가 일시적으로 중단되었습니다. <br />
            잠시 후 다시 한번 시도해 주세요.
          </p>
          <Button onClick={() => router.back()} size="medium" color="line">
            이전 화면
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
