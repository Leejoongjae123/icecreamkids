'use client';

import { ModalBase } from '@/components/common';
import { Tab } from '@/components/common/Tab';
import type { ITabItem } from '@/components/common/Tab/types';

import { useCallback, useState, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import useClassManageStore from '@/hooks/store/useClassManageStore';
import useUserStore from '@/hooks/store/useUserStore';
import { useQueryClient } from '@tanstack/react-query';
import MyClassClient from './_components/MyClass';
import MyChildrenClient from './_components/MyChildren';

// 컴포넌트 외부로 상수 이동하여 리렌더링 시 재생성 방지
const CLASS_MANAGE_TAB_LIST: ITabItem[] = [
  {
    text: '나의반 관리',
    tabName: 'MyClassManage',
    tabId: 'myClass',
    contentsId: 'panelMyClass',
    path: 'manage-my-class',
  },
  {
    text: '아이 관리',
    tabName: 'MyChildrenManage',
    tabId: 'myChildren',
    contentsId: 'panelMyChildren',
    path: 'manage-my-children',
  },
];

const MemoizedMyClassClient = memo(MyClassClient);
const MemoizedMyChildrenClient = memo(MyChildrenClient);

const ClassManageModalClient = () => {
  const { isModalOpen, activatedTab, selectedClassId, closeModal } = useClassManageStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const { userInfo } = useUserStore();
  const queryClient = useQueryClient();
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalContainer(document.getElementById('modal-root'));
  }, []);

  // 모달이 열릴 때마다 '나의반 관리' 쿼리 캐시 무효화 (반관리 데이터 최신화)
  useEffect(() => {
    if (isModalOpen) {
      queryClient.invalidateQueries({ queryKey: ['educationalClasses'] });
    }
  }, [isModalOpen, queryClient]);

  // 활성화 탭 정보가 있는 경우
  useEffect(() => {
    if (activatedTab === 'children') setActiveIndex(1);
  }, [activatedTab]);

  const handleManageChange = useCallback((idx: number) => {
    setActiveIndex(idx);
  }, []);

  // 닫은 후 탭 초기화
  const handleCloseModal = useCallback(() => {
    closeModal();
    setActiveIndex(0);
  }, [closeModal]);

  // 모달이 닫혀 있거나 포털 컨테이너가 준비되지 않았으면 아무것도 렌더링하지 않음
  if (!isModalOpen || !portalContainer) {
    return null;
  }

  return createPortal(
    <ModalBase
      cancelText="닫기"
      className="modal-class"
      onCancel={handleCloseModal}
      size="large"
      isOpen={isModalOpen}
      message="우리반 관리"
    >
      <Tab onChange={handleManageChange} items={CLASS_MANAGE_TAB_LIST} focusIdx={activeIndex}>
        {userInfo && <MemoizedMyClassClient userInfo={userInfo} isActive={activeIndex === 0} />}
        {userInfo && (
          <MemoizedMyChildrenClient userInfo={userInfo} classId={selectedClassId} isActive={activeIndex === 1} />
        )}
      </Tab>
    </ModalBase>,
    portalContainer,
  );
};

export default ClassManageModalClient;
