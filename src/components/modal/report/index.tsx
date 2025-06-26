import { ModalBase, Radio, Textarea } from '@/components/common';
import React, { useEffect, useMemo, useState } from 'react';
import { useCreateAbusingReport, useGetAllOptions } from '@/service/core/coreStore';
import type { CreateAbusingReportRequest } from '@/service/core/schemas';
import { useToast } from '@/hooks/store/useToastStore';
import { IP_ADDRESS } from '@/const';
import useUserStore from '@/hooks/store/useUserStore';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import type { IReportModalProps } from './types';

export const ReportModal = ({
  isOpen,
  onReport,
  onCancel,
  contentType = 'USER',
  contentId,
  targetProfile,
  contentSmartFolderApiType,
}: IReportModalProps) => {
  const { showAlert } = useAlertStore();
  const addToast = useToast((state) => state.add);
  const { userInfo } = useUserStore();

  const [cause, setCause] = useState<string>('');
  const [customReason, setCustomReason] = useState('');
  const isETC = useMemo(() => {
    return cause === '-1';
  }, [cause]); // 기타

  const { mutateAsync: createAbusingReport } = useCreateAbusingReport();
  const { data: options } = useGetAllOptions({ contentType });
  const selectOption = useMemo(() => {
    return options && options.result
      ? [
          ...options.result.map((item) => {
            return { text: item.contents, value: item.id?.toString() };
          }),
          { text: '기타 (직접입력)', value: '-1' },
        ]
      : [{ text: '기타 (직접입력)', value: '-1' }];
  }, [options]);

  useEffect(() => {
    if (selectOption[0].value) setCause(selectOption[0].value.toString());
  }, [selectOption]);

  const isSubmitDisabled = !cause || (isETC && customReason.trim().length < 2); // 두 글자 입력 필요

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCause(event.target.value);
  };

  const handleReport = async () => {
    try {
      const reportRequest: CreateAbusingReportRequest = {
        contentType,
        contentId: (contentType === 'USER' ? targetProfile?.accountId : contentId) ?? 0,
        reportContents: isETC ? customReason : (selectOption.find((item) => item.value === cause)?.text ?? ''), // 기타 신고 사유
        reporterAccountId: userInfo?.accountId ?? 0,
        createdIp: IP_ADDRESS,
      };

      const contentRepostRequest = {
        ...reportRequest,
        contentSmartFolderApiType,
      };

      const { result: reportResult } = await createAbusingReport({
        data: contentType === 'CONTENT' ? contentRepostRequest : reportRequest,
      });
      if (reportResult && reportResult?.status === 'REPORT') {
        addToast({ message: '신고 되었습니다.' });
        onCancel();
      } else {
        showAlert({ message: '신고가 정상 처리되지 않았습니다.' });
      }
    } catch (error) {
      console.error(error);
      showAlert({ message: '신고가 정상 처리되지 않았습니다.' });
    }
  };

  return (
    <ModalBase
      isOpen={isOpen}
      message="신고하기"
      confirmText="신고"
      onConfirm={handleReport}
      onCancel={onCancel}
      className="modal-report"
      disabled={isSubmitDisabled}
    >
      <div className="item-modal">
        <div className="cont-info">
          <span className="txt-tip">
            <span className="ico-comm ico-information-14-g" />
            신고 사유를 남겨주시면 운영팀 확인 후 적절한 조치를 할게요.
          </span>
        </div>
      </div>
      <div className="item-modal">
        <strong className="tit-info">신고 대상</strong>
        <div className="cont-info">
          <dl className="list-report">
            <dt>닉네임</dt>
            <dd>{targetProfile?.name}</dd>
          </dl>
        </div>
      </div>
      <div className="item-modal">
        <strong className="tit-info">신고 사유</strong>
        <div className="cont-info">
          <Radio options={selectOption} name="cause" value={cause} onChange={handleChange} />
          {isETC && (
            <Textarea
              placeholder="사유를 입력해 주세요."
              maxLength={100}
              value={customReason}
              onChange={(value: string) => {
                setCustomReason(value);
              }}
            />
          )}
        </div>
      </div>
    </ModalBase>
  );
};
