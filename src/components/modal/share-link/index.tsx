'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '@/hooks/store/useToastStore';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import { useChangePublicStateOfItemWithKey, useGetPublicUrlItemCode } from '@/service/file/fileStore';
import type { SmartFolderItemResultPublicState, SmartFolderItemResultSmartFolderApiType } from '@/service/file/schemas';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Loader, ModalBase } from '@/components/common';
import { Switch } from '@/components/common/Switch';
import { IShareLinkModal } from '@/components/modal/share-link/type';

export function ShareLinkModal({ item, onCancel, onCloseRefetch }: IShareLinkModal) {
  const isDataOpen = item?.publicState?.includes('PUBLIC') || false; // 자료 공개 여부
  const [dataOpen, setDataOpen] = useState<boolean>(isDataOpen);
  const [shareLink, setShareLink] = useState<string>('');

  const { showAlert } = useAlertStore();
  const addToast = useToast((state) => state.add);

  const queryParams = {
    smartFolderApiType: item?.smartFolderApiType as SmartFolderItemResultSmartFolderApiType,
    smartFolderItemId: `${item?.id}`,
  };

  const {
    data: publicUrlItemCode,
    error: errorGetPublicUrlItemCode,
    isLoading: isLoadingPublicUrlItemCode,
  } = useGetPublicUrlItemCode(queryParams, {
    query: {
      enabled: item?.publicState !== 'PRIVATE',
    },
  });

  useEffect(() => {
    if (errorGetPublicUrlItemCode) {
      setTimeout(() => {
        showAlert({
          message: `${errorGetPublicUrlItemCode}`,
        });
      }, 300);
    }
  }, [errorGetPublicUrlItemCode, showAlert]);

  const code = publicUrlItemCode?.result?.code;

  const getShareLinkWithBaseUrl = (linkUrl: string) => {
    const baseUrl = `${window.location.origin}/preview`;

    return `${baseUrl}?publicBoardItemIdOrCode=${linkUrl}`;
  };

  useEffect(() => {
    if (code) {
      const linkUrl = getShareLinkWithBaseUrl(code);
      setShareLink(linkUrl);
    }
  }, [item?.id, item?.smartFolderApiType, code]);

  const { mutateAsync: changePublicStateOfItem, error: changePublicStateOfItemError } =
    useChangePublicStateOfItemWithKey();

  if (changePublicStateOfItemError) {
    addToast({ message: `${changePublicStateOfItemError}` });
  }

  const changePublicState = async (publicState: SmartFolderItemResultPublicState) => {
    const data = {
      driveItemKey: item?.driveItemKey as string,
      publicState,
    };

    return changePublicStateOfItem({ data });
  };

  const handleChangeOpenData = async () => {
    const publicState = dataOpen ? 'PRIVATE' : 'PUBLIC_AND_URL_SHARE';
    const { result } = await changePublicState(publicState);

    if (result?.publicUrlItemCode) {
      const linkUrl = getShareLinkWithBaseUrl(result.publicUrlItemCode);
      setShareLink(linkUrl);
    } else {
      setShareLink('');
    }
    setDataOpen(!dataOpen);
  };

  const handleCreateLinkButton = async () => {
    const { result } = await changePublicState('PRIVATE_AND_URL_SHARE');

    if (result?.publicUrlItemCode) {
      const linkUrl = getShareLinkWithBaseUrl(result.publicUrlItemCode);
      setShareLink(linkUrl);
    } else {
      setShareLink('');
    }
  };

  const handleDeleteLinkButton = () => {
    showAlert({
      message: `[${item?.name}] 에 대한 공유를 삭제하시겠어요? <br /> 더 이상 해당 링크로 접속할 수 없습니다.`,
      onConfirm: async () => {
        await changePublicState('PRIVATE');
        setShareLink('');
        setDataOpen(false);
      },
      onCancel: () => {},
    });
  };

  const handleClickLinkCopy = async () => {
    await window.navigator.clipboard.writeText(shareLink);
    addToast({ message: '링크가 복사되었습니다.' });
  };

  const handleClickCancelButton = async () => {
    if (onCancel) {
      onCancel();
    }
    if (onCloseRefetch) {
      await onCloseRefetch();
    }
  };

  const linkButton = () => {
    const linkDeleteButton = (
      <Button size="small" color="gray" icon="delete-14" className="btn-sharelink" onClick={handleDeleteLinkButton}>
        링크삭제
      </Button>
    );
    const linkCreateButton = (
      <Button
        size="small"
        color="primary"
        icon={dataOpen ? 'link-14-off' : 'link-14'}
        disabled={dataOpen}
        className="btn-sharelink"
        onClick={handleCreateLinkButton}
      >
        링크생성
      </Button>
    );

    if (!item?.isMine) {
      return null;
    }
    if (shareLink) {
      return linkDeleteButton;
    }

    return linkCreateButton;
  };

  const message = item?.isMine ? '공개 및 공유 링크 관리' : '공유 링크 관리';

  if (isLoadingPublicUrlItemCode) {
    return createPortal(
      <Loader hasOverlay loadingMessage={null} disableBodyScroll={false} />,
      document.getElementById('modal-root') || document.body,
    );
  }

  return createPortal(
    <ModalBase
      message={message}
      isOpen
      size="small"
      cancelText="닫기"
      className="modal-sharelink"
      onCancel={handleClickCancelButton}
    >
      {item?.isMine && (
        <div className="item-modal">
          <div className="item-head">
            <strong className="tit-info">자료공개</strong>
            <Switch name="fileopen" id="fileOpen" label="fileOpen" checked={dataOpen} onChange={handleChangeOpenData} />
          </div>
          <div className="cont-info">
            <span className="txt-tip">
              <span className="ico-comm ico-information-14-g" />
              공개된 자료는 내 프로필에 공개되며, 추천 자료 및 검색 결과로 다른 사용자에게 보일 수 있습니다.
            </span>
          </div>
        </div>
      )}
      <div className="item-modal">
        <div className="item-head">
          <strong className="tit-info">공유 링크 관리</strong>
          {linkButton()}
        </div>
        <div className="cont-info">
          <span className="txt-tip">
            <span className="ico-comm ico-information-14-g" />
            공유 링크로 공유 시, 로그인 없이 자료를 확인 할 수 있습니다.
          </span>
          <div className="inner-share">
            <Input id="inpLink" readOnly value={shareLink} />
            <Button
              disabled={shareLink === ''}
              color="line"
              size="small"
              icon={shareLink === '' ? 'copy-14-b-off' : 'copy-14-b'}
              className="btn-sharelink"
              onClick={handleClickLinkCopy}
            >
              링크복사
            </Button>
          </div>
        </div>
      </div>
    </ModalBase>,
    document.getElementById('modal-root') || document.body,
  );
}
