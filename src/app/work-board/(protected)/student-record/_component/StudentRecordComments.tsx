import cx from 'clsx';
import { Button } from '@/components/common';
import {
  StudentEvaluationDomainResult,
  StudentEvaluationIndicatorResult,
  StudentRecordAddRequest,
  StudentRecordUpdateRequest,
} from '@/service/file/schemas';
import { ObservationReportCommentEditModal } from '@/components/modal/observation-report/comment-edit';
import { useState } from 'react';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import type { StudentRecordAiRecreateRequestIndicatorScores } from '@/service/aiAndProxy/schemas';

type StudentRecordCommentsProps = {
  domains?: StudentEvaluationDomainResult[] | undefined;
  indicators?: StudentEvaluationIndicatorResult[] | undefined;
  formData: StudentRecordUpdateRequest | StudentRecordAddRequest | undefined;
  onRecreateObservation: (code: string, indicatorScores: StudentRecordAiRecreateRequestIndicatorScores) => void;
  onSave: (code: string, value: string) => void;
};

type IEditModalInfo = {
  isOpen: boolean;
  code?: string;
  text?: string | undefined;
};

const StudentRecordComments = ({
  domains,
  indicators,
  formData,
  onRecreateObservation,
  onSave,
}: StudentRecordCommentsProps) => {
  const [editModalInfo, setEditModalInfo] = useState<IEditModalInfo>();

  const { showAlert } = useAlertStore();

  const handleClickReCreateObservationButton = (code: string) => {
    const formIndicatorScores = formData?.indicatorScores;
    if (formIndicatorScores && formIndicatorScores?.length < 1) {
      showAlert({ message: '아이 관찰 상세 평가 데이터 없습니다. <br/> AI 결과를 생성할 수 없습니다.' });
      return;
    }
    showAlert({
      message: 'AI 추천 문장은 보조 자료일 뿐, <br/>실제 활용 전 교사의 확인과 수정이 필요합니다.',
      onConfirm: () => {
        const domainCodeMap = indicators
          ?.flatMap((item) => item.subIndicators ?? [])
          ?.map((item) => {
            return {
              indicatorCode: item?.indicatorCode,
              evaluationDomainCode: item?.evaluationDomainCode,
            };
          })
          .reduce((acc: Record<string, string[]>, { evaluationDomainCode, indicatorCode }) => {
            if (!acc[evaluationDomainCode]) {
              acc[evaluationDomainCode] = [];
            }
            acc[evaluationDomainCode].push(indicatorCode);
            return acc;
          }, {});
        const indicatorScores =
          formIndicatorScores
            ?.filter((item) => domainCodeMap?.[code].includes(item?.indicatorCode as string))
            ?.reduce((acc, value) => {
              return { ...acc, [value?.indicatorCode as string]: value?.score as number };
            }, {}) ?? {};

        if (onRecreateObservation) {
          onRecreateObservation(code, indicatorScores);
        }
      },
    });
  };

  const handleClickEditButton = (code: string, text: string | undefined) => {
    setEditModalInfo({
      isOpen: true,
      code,
      text,
    });
  };

  const handleSave = (code: string, value: string) => {
    if (onSave) {
      onSave(code, value);
    }
    setEditModalInfo({
      isOpen: false,
    });
  };

  return (
    <div className={cx('box-report box-rating')}>
      <h4 className="subtitle-type1">아이 관찰 평가</h4>
      <div className="group-rating">
        <dl className="item-rating rating-summary">
          <dt>
            <strong className="tit-rating">관찰요약</strong>
            <div className="group-btn">
              <Button
                size="xsmall"
                color="line"
                onClick={() => handleClickEditButton('observeSummary', formData?.observeSummary)}
              >
                편집
              </Button>
            </div>
          </dt>
          <dd>{formData?.observeSummary ? formData.observeSummary : '데이터가 없습니다'}</dd>
        </dl>
        <div className="inner-rating">
          {domains?.map((domain, index) => {
            const observeCommentList = formData?.observeComments;

            const observeComment = observeCommentList?.find((item) => {
              return item?.evaluationDomainCode === domain.code;
            });

            return (
              <dl key={domain.code} className="item-rating">
                <dt>
                  <strong className={`tit-rating type-color${index + 1}`}>{domain.title}</strong>
                  <div className="group-btn">
                    <Button
                      size="xsmall"
                      color="line"
                      disabled={observeComment?.userEdited}
                      onClick={() => handleClickReCreateObservationButton(domain.code)}
                    >
                      AI 생성
                    </Button>
                    <Button
                      size="xsmall"
                      color="line"
                      onClick={() => handleClickEditButton(domain.code, observeComment?.evaluationDescription)}
                    >
                      편집
                    </Button>
                  </div>
                </dt>
                <dd>
                  {observeComment?.evaluationDescription ? observeComment?.evaluationDescription : '데이터가 없습니다.'}
                </dd>
              </dl>
            );
          })}
          <dl className="item-rating">
            <dt>
              <strong className="tit-rating">총평</strong>
              <div className="group-btn">
                <Button
                  size="xsmall"
                  color="line"
                  onClick={() => handleClickEditButton('teacherComment', formData?.teacherComment)}
                >
                  편집
                </Button>
              </div>
            </dt>
            <dd>{formData?.teacherComment ? formData.teacherComment : '데이터가 없습니다'}</dd>
          </dl>
          <dl className="item-rating">
            <dt>
              <strong className="tit-rating">교사지원</strong>
              <div className="group-btn">
                <Button
                  size="xsmall"
                  color="line"
                  onClick={() => handleClickEditButton('teacherSupport', formData?.teacherSupport)}
                >
                  편집
                </Button>
              </div>
            </dt>
            <dd>{formData?.teacherSupport ? formData.teacherSupport : '데이터가 없습니다'}</dd>
          </dl>
          <dl className="item-rating">
            <dt>
              <strong className="tit-rating">부모지원</strong>
              <div className="group-btn">
                <Button
                  size="xsmall"
                  color="line"
                  onClick={() => handleClickEditButton('parentSupport', formData?.parentSupport)}
                >
                  편집
                </Button>
              </div>
            </dt>
            <dd>{formData?.parentSupport ? formData.parentSupport : '데이터가 없습니다'}</dd>
          </dl>
        </div>
      </div>
      {editModalInfo?.isOpen && (
        <ObservationReportCommentEditModal
          code={editModalInfo?.code}
          text={editModalInfo?.text}
          onSave={handleSave}
          onCancel={() => setEditModalInfo({ isOpen: false })}
        />
      )}
    </div>
  );
};

export default StudentRecordComments;
