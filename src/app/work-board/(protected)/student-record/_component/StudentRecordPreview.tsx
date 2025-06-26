import dayjs, { dateFormat } from '@/lib/dayjs';
import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { Button, Loader } from '@/components/common';
import { useRouter } from 'next/navigation';
import useCaptureImage from '@/hooks/useCaptureImage';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import {
  StudentEvaluationDomainResult,
  StudentRecordCommentForAdd,
  StudentRecordCommentForUpdate,
  StudentRecordCommentResult,
} from '@/service/file/schemas';
import usePrint from '@/hooks/usePrint';

type StudentRecordPreviewProps = {
  studentName: string | undefined;
  modifiedAt: string | undefined;
  studentThumbnail: string | undefined;
  educationalClassAge: number | undefined;
  studentBirthday: string | undefined;
  domains?: StudentEvaluationDomainResult[] | undefined;
  summaryScores: string | null | undefined;
  observeComments:
    | StudentRecordCommentResult[]
    | StudentRecordCommentForAdd[]
    | StudentRecordCommentForUpdate[]
    | null
    | undefined;
  observeSummary: string | undefined;
  teacherComment: string | undefined;
  teacherSupport: string | undefined;
  parentSupport: string | undefined;
  onBack?: () => void;
  showUtilButtons?: boolean;
};

const StudentRecordPreview = ({
  studentName,
  modifiedAt,
  studentThumbnail,
  educationalClassAge,
  studentBirthday,
  domains,
  summaryScores,
  observeComments,
  observeSummary,
  teacherComment,
  teacherSupport,
  parentSupport,
  onBack,
  showUtilButtons = true,
}: StudentRecordPreviewProps) => {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessage, setIsLoadingMessage] = useState('');
  const { printForStudentRecord } = usePrint();
  const { showAlert } = useAlertStore();

  const handleClickPreviousButton = () => {
    if (onBack) {
      onBack();
      return;
    }
    router.back();
  };

  const handleClickPrintButton = async () => {
    setIsLoadingMessage('인쇄 준비 중입니다.');
    setIsLoading(true);
    await printForStudentRecord('student-record-preview');
    setIsLoading(false);
  };

  const summaryScoreMap =
    summaryScores?.split(',')?.reduce((acc: Record<string, number>, item) => {
      const [key, value] = item.split(':');
      acc[key] = Number(value);
      return acc;
    }, {}) ?? {};

  const handleClickShareButton = () => {
    showAlert({ message: '서비스 준비 중입니다.' });
  };

  const formatModifiedAt = useMemo(() => {
    return dayjs(modifiedAt).format('YYYY년 MM월 DD일');
  }, [modifiedAt]);

  return (
    <>
      {showUtilButtons && (
        <div className="head-report">
          <div className="util-head util-left">
            <button type="button" className="btn-prev" onClick={handleClickPreviousButton}>
              <span className="ico-comm ico-arrow-left">이전으로</span>
            </button>
          </div>
          <div className="util-head util-right">
            <Button size="small" color="line" icon="print-14" onClick={handleClickPrintButton}>
              인쇄
            </Button>
            <Button size="small" color="line" icon="share-14" onClick={handleClickShareButton}>
              공유
            </Button>
          </div>
        </div>
      )}
      <div id="student-record-preview">
        <div className="group-report group-title">
          <h3 className="txt-title">아이 관찰 기록</h3>
          <dl className="info-title">
            <dt>작성일</dt>
            <dd>{formatModifiedAt}</dd>
          </dl>
        </div>
        <div className="group-report group-info">
          <div className="box-report box-profile">
            <h4 className="screen_out">아이 정보</h4>
            {studentThumbnail ? (
              <Image className="thumb-profile" width={134} height={134} src={studentThumbnail} alt="반 아이 프로필" />
            ) : (
              <div className="thumb-profile">
                <span className="ico-comm ico-image-45" />
              </div>
            )}
            <div className="inner-profile">
              <dl className="info-profile">
                <dt>이름</dt>
                {studentName && educationalClassAge && (
                  <dd>
                    {studentName} / {educationalClassAge}세
                  </dd>
                )}
              </dl>
              <dl className="info-profile">
                <dt>생년월일</dt>
                {studentBirthday && <dd>{dayjs(studentBirthday).format(dateFormat.default)}</dd>}
              </dl>
            </div>
          </div>
          <div className="box-report box-graph">
            <h4 className="tit-box">발달 영역별 그래프</h4>
            <div className="inner-box">
              {domains?.map((domain, index) => {
                return (
                  <div
                    key={domain.code}
                    className={`item-graph type-color${index + 1} graph${summaryScoreMap[domain.code]}`}
                  >
                    <strong className="tit-graph">{domain.title}</strong>
                    <div className="inner-graph">
                      <div className="line-graph line1" />
                      <div className="line-graph line2" />
                      <em className="txt-graph">{summaryScoreMap[domain.code]}</em>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="group-report observation">
          <div className="box-report box-summary">
            <h4 className="tit-box">관찰요약</h4>
            <p className="txt-box">{observeSummary || '-'}</p>
          </div>
          {domains?.map((domain, index) => {
            const comment = observeComments?.find((item) => {
              return item?.evaluationDomainCode === domain.code;
            });
            return (
              <div key={domain.code} className={`box-observation type-color${index + 1}`}>
                <div className="head-box">
                  <h4 className="tit-box">{domain.title}</h4>
                  <dl className="score-box">
                    <dt className="screen_out">점수</dt>
                    <dd>{summaryScoreMap[domain.code]} </dd>
                  </dl>
                </div>
                <div className="inner-box">
                  <p className="txt-box">{comment?.evaluationDescription ? comment?.evaluationDescription : '-'}</p>
                </div>
              </div>
            );
          })}
          <div className="box-observation">
            <div className="head-box">
              <h4 className="tit-box">총평</h4>
            </div>
            <div className="inner-box">
              <p className="txt-box txt-type2">{teacherComment || '-'}</p>
            </div>
          </div>
          <div className="box-observation">
            <div className="head-box">
              <h4 className="tit-box">교사지원</h4>
            </div>
            <div className="inner-box">
              <p className="txt-box">{teacherSupport || '-'}</p>
            </div>
          </div>
          <div className="box-observation">
            <div className="head-box">
              <h4 className="tit-box">가정 연계 지원</h4>
            </div>
            <div className="inner-box">
              <p className="txt-box">{parentSupport || '-'}</p>
            </div>
          </div>
        </div>
      </div>
      {isLoading && <Loader hasOverlay loadingMessage={isLoadingMessage} />}
    </>
  );
};

export default StudentRecordPreview;
