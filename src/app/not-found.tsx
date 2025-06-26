'use client';

import { Button } from '@/components/common';
import AppLayout from '@/components/layout/AppLayout';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();
  return (
    <AppLayout customDocClass="doc-error">
      <div>
        <h3 className="screen_out">안내</h3>
        <div className="group-error">
          <span className="ico-comm ico-error" />
          <strong className="tit-error">페이지를 찾을 수 없습니다.</strong>
          <p className="txt-error">
            요청한 페이지는 변경 또는 삭제되었거나, 현재 사용할 수 없는 페이지입니다.
            <br />
            입력한 주소가 정확한지 다시 한 번 확인해주세요.
          </p>
          <Button onClick={() => router.back()} size="medium" color="line">
            이전 화면
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
