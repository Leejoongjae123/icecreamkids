import React, { useId, useState } from 'react';
import { Button, Tooltip } from '@/components/common';
import { StudentEvaluationIndicatorResultWithScoreAndIsFolding } from '@/components/modal/student-record-indicators/types';
import {
  StudentEvaluationDomainResult,
  StudentEvaluationIndicatorResult,
  StudentRecordEvaluationIndicatorScoreForAdd,
  type StudentRecordEvaluationIndicatorScoreForUpdate,
} from '@/service/file/schemas';
import { StudentRecordIndicatorsModal } from '@/components/modal/student-record-indicators';
import StudentRecordRadarChart from '@/app/work-board/(protected)/student-record/_component/StudentRecordRadarChart';

type StudentRecordGraphProps = {
  domains: StudentEvaluationDomainResult[] | undefined;
  indicators: StudentEvaluationIndicatorResult[] | undefined;
  indicatorScores:
    | StudentRecordEvaluationIndicatorScoreForUpdate[]
    | StudentRecordEvaluationIndicatorScoreForAdd[]
    | null
    | undefined;
  onChangeStudentRecordGraph: (
    summaryScores: string,
    indicatorScores: StudentRecordEvaluationIndicatorScoreForUpdate[] | StudentRecordEvaluationIndicatorScoreForAdd[],
  ) => void;
  summaryScores: string | null | undefined;
};

const colors = ['#5B95EF', '#9E7CF3', '#EF64A1', '#EEB252', '#54C5D3'];
const image = '/images/img_student_record_graph.png';
const initialValue = 3;
const initialData = [
  { id: 'SUK', subject: '신체운동∙건강', value: initialValue, color: colors[0], image },
  { id: 'COM', subject: '의사소통', value: initialValue, color: colors[1], image },
  { id: 'SOC', subject: '사회관계', value: initialValue, color: colors[2], image },
  { id: 'ART', subject: '예술경험', value: initialValue, color: colors[3], image },
  { id: 'NAT', subject: '자연탐구', value: initialValue, color: colors[4], image },
];

export default function StudentRecordGraph({
  domains,
  summaryScores,
  indicatorScores,
  indicators,
  onChangeStudentRecordGraph,
}: StudentRecordGraphProps) {
  const [isShowIndicatorModal, setIsShowIndicatorModal] = useState(false);

  const scoreMap = Object.fromEntries(
    summaryScores
      ? summaryScores.split(',')?.map((score) => {
          const [key, value] = score.split(':');
          return [key, Number(value) || 0]; // NaN 방지
        })
      : [],
  );

  const graphData =
    domains && domains?.length > 0
      ? domains?.map((domain, index) => {
          return {
            id: domain.code,
            subject: domain.title,
            value: scoreMap ? (scoreMap[domain.code] ?? initialValue) : initialValue,
            color: colors[index % colors.length],
            image,
          };
        })
      : initialData.map((item, index) => {
          return {
            id: item.id,
            subject: item.subject,
            value: scoreMap ? (scoreMap[item.id] ?? initialValue) : initialValue,
            color: colors[index % colors.length],
            image,
          };
        });

  const getSummaryScoresByString = (scores: Record<string, number>) => {
    return Object.entries(scores)
      .map(([key, value]) => `${key}:${value}`)
      .join(',');
  };
  const handleChangeGraphData = (id: string, newValue: number) => {
    // 차트 데이터 변경
    scoreMap[id] = newValue;
    const newSummaryScores = getSummaryScoresByString(scoreMap);

    // 아이 관찰 상세 평가 변경
    const domainIndicatorScores = indicators
      ?.filter((indicator) => indicator.evaluationDomainCode === id)
      ?.flatMap((item) => item.subIndicators ?? [])
      ?.map((item) => {
        return {
          indicatorCode: item.indicatorCode,
          score: newValue,
        };
      });

    const newIndicatorScores =
      indicatorScores?.map(
        (scores: StudentRecordEvaluationIndicatorScoreForUpdate | StudentRecordEvaluationIndicatorScoreForAdd) => {
          const indicatorScore = domainIndicatorScores?.find(
            (newScores) => newScores.indicatorCode === scores?.indicatorCode,
          );
          if (indicatorScore) {
            return {
              ...scores,
              score: indicatorScore?.score as number,
              indicatorCode: scores?.indicatorCode as string,
              indicatorDepth: scores?.indicatorDepth as number,
            };
          }
          return scores;
        },
      ) ?? [];

    onChangeStudentRecordGraph(newSummaryScores, newIndicatorScores);
  };

  const handleSaveIndicatorModal = (newIndicators: StudentEvaluationIndicatorResultWithScoreAndIsFolding[]) => {
    const score: Record<string, number> = {};

    if (newIndicators.length < 1) {
      setIsShowIndicatorModal(false);
      return;
    }

    // 아이 관찰 상세 평가 값으로 차트 변경
    domains?.forEach((domain) => {
      const indicatorIncludeDomain =
        newIndicators?.filter(
          (indicator: StudentEvaluationIndicatorResultWithScoreAndIsFolding) =>
            domain.code === indicator.evaluationDomainCode,
        ) ?? [];
      score[domain.code] = Math.round(
        indicatorIncludeDomain.reduce(
          (acc: number, value: StudentEvaluationIndicatorResultWithScoreAndIsFolding) => acc + (value.score ?? 0),
          0,
        ) / indicatorIncludeDomain.length,
      );
    });
    const newSummaryScores = getSummaryScoresByString(score);

    // 아이 관찰 상세 평가 변경
    const newIndicatorScores = newIndicators
      ?.flatMap((item) => item.subIndicators ?? [])
      ?.map((item) => {
        return {
          indicatorScoreId: item?.id,
          indicatorDepth: item?.depth,
          indicatorCode: item?.indicatorCode,
          score: item?.score ?? 3,
        };
      });

    onChangeStudentRecordGraph(newSummaryScores, newIndicatorScores);
    setIsShowIndicatorModal(false);
  };

  return (
    <div className="box-report box-graph">
      <div className="head-box">
        <h4 className="subtitle-type1">아이 관찰 그래프</h4>
        <div className="tooltip-g">
          <Tooltip
            id={useId()}
            className="btn-tooltip inner-tooltip"
            contents={
              <div className="inner-tooltip">
                <p className="txt-tooltip">
                  그래프를 변형하면 아이 관찰 상세평가에서도 그래프 점수를 반영한 결과가 나옵니다.
                </p>
              </div>
            }
          >
            <span className="ico-comm ico-help-18-g">안내</span>
          </Tooltip>
        </div>
      </div>
      <StudentRecordRadarChart
        data={graphData.length > 0 ? graphData : initialData}
        onChangeGraphData={handleChangeGraphData}
      />
      <Button
        size="small"
        color="line"
        icon="setting-18"
        className="btn-setting align-right"
        onClick={() => setIsShowIndicatorModal(true)}
      >
        상세 설정
      </Button>
      {isShowIndicatorModal && (
        <StudentRecordIndicatorsModal
          domains={domains}
          indicators={indicators}
          indicatorScores={indicatorScores}
          onCancel={() => setIsShowIndicatorModal(false)}
          onSave={handleSaveIndicatorModal}
        />
      )}
    </div>
  );
}
