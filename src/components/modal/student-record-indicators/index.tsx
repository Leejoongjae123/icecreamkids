'use client';

import React, { useEffect, useState } from 'react';
import { Button, Radio } from '@/components/common';
import { Tab } from '@/components/common/Tab';
import { Modal } from '@/components/common/Modal';
import cx from 'clsx';
import { StudentEvaluationIndicatorResultWithScoreAndIsFolding } from '@/components/modal/student-record-indicators/types';
import { StudentRecordIndicatorsReferenceModal } from '@/components/modal/student-record-indicators-reference';
import {
  StudentEvaluationDomainResult,
  StudentEvaluationIndicatorResult,
  StudentRecordEvaluationIndicatorScoreForAdd,
  type StudentRecordEvaluationIndicatorScoreForUpdate,
} from '@/service/file/schemas';

interface StudentRecordIndicatorsModalProps {
  domains: StudentEvaluationDomainResult[] | undefined;
  indicators: StudentEvaluationIndicatorResult[] | undefined;
  indicatorScores:
    | StudentRecordEvaluationIndicatorScoreForUpdate[]
    | StudentRecordEvaluationIndicatorScoreForAdd[]
    | null
    | undefined;
  onSave(indicator?: StudentEvaluationIndicatorResultWithScoreAndIsFolding[]): void;
  onCancel(): void;
}

export function StudentRecordIndicatorsModal({
  domains,
  indicators,
  indicatorScores,
  onSave,
  onCancel,
}: StudentRecordIndicatorsModalProps) {
  const defaultFocusIdx = 0;
  const [focusIdx, setFocusIdx] = useState<number>(defaultFocusIdx);
  const [isReferenceModal, setReferenceModal] = useState(false);
  const [indicatorData, setIndicatorData] = useState<StudentEvaluationIndicatorResultWithScoreAndIsFolding[]>();

  useEffect(() => {
    const indicatorWithScore =
      indicators?.map((indicator) => {
        const subIndicatorDataWithScore = indicator.subIndicators?.map((subIndicator) => {
          const indicatorScoreInfo = indicatorScores?.find(
            (score) => score?.indicatorCode === subIndicator.indicatorCode,
          ) as StudentRecordEvaluationIndicatorScoreForUpdate;

          return {
            ...subIndicator,
            ...(indicatorScoreInfo?.indicatorScoreId && { id: indicatorScoreInfo?.indicatorScoreId }),
            score: indicatorScoreInfo?.score ?? 3,
            prevScore: indicatorScoreInfo?.score ?? 3,
          };
        });
        let avgScore = 0;
        if (subIndicatorDataWithScore) {
          const totalScore = subIndicatorDataWithScore.reduce((sum, item) => sum + (item.score ?? 0), 0);
          const count = subIndicatorDataWithScore.length;
          avgScore = count > 0 ? Math.round(totalScore / count) : 0;
        }
        return {
          ...indicator,
          subIndicators: subIndicatorDataWithScore,
          score: avgScore,
          prevScore: avgScore, // 이전 값
          isFolding: true, // 접기,펴기
        };
      }) ?? [];
    setIndicatorData(indicatorWithScore);
  }, [indicatorScores, indicators]);

  const handleTabClick = (index: number) => {
    setFocusIdx(index);
  };

  const handleClickFoldingButton = (indicatorCode: string, isFolding: boolean) => {
    setIndicatorData((prevIndicator) => {
      return (
        prevIndicator?.map((indicator) => {
          if (indicator.indicatorCode === indicatorCode) {
            return {
              ...indicator,
              isFolding,
            };
          }
          return indicator;
        }) ?? []
      );
    });
  };

  const handleClickPointButton = (indicatorCode: string, value: number, depth: number) => {
    setIndicatorData((prevIndicator) => {
      return (
        prevIndicator?.map((indicator) => {
          // 1뎁스 라디오 버튼 변경 시 → 모든 2뎁스 값 동기화
          if (depth === 1) {
            if (indicator.indicatorCode === indicatorCode) {
              return {
                ...indicator,
                score: value,
                subIndicators: indicator.subIndicators?.map((subIndicator) => ({ ...subIndicator, score: value })),
              };
            }
          }

          const updatedSubIndicators =
            indicator.subIndicators?.map((subIndicator) => {
              if (subIndicator.indicatorCode === indicatorCode) {
                return { ...subIndicator, score: value };
              }
              return subIndicator;
            }) ?? [];

          const subIndicatorScores = updatedSubIndicators?.map((s) => s.score as number);
          const averageScore = subIndicatorScores.length
            ? Math.round(subIndicatorScores.reduce((a, b) => a + b, 0) / subIndicatorScores.length)
            : 0;

          return {
            ...indicator,
            score: averageScore,
            subIndicators: updatedSubIndicators,
          };
        }) ?? []
      );
    });
  };

  const handleClickSaveButton = () => {
    onSave(indicatorData);
  };

  const renderPointChoice = (depth: number, name: string, prevValue = 0, value = 0, readonly: boolean) => {
    const tooltip = {
      colorType: 'default',
      sizeType: 'small',
      position: name.includes('Main') ? 'top' : 'bottom',
      contents: 'Tooltip',
    };

    const className = (num: number) => {
      if (value === num && prevValue === num) return 'checked prev';
      if (value === num) return 'checked';
      if (prevValue === num) return 'prev';
      return undefined;
    };

    const options = [1, 2, 3, 4, 5].map((num) => ({
      text: `${num}`,
      value: num,
      className: className(num),
      tooltip,
    }));

    // return <Radio options={options} name={name} value={value} readOnly={readonly} />;
    return (
      <Radio
        name={`depth${depth}_${name}`}
        value={value}
        options={options}
        readOnly={readonly}
        onChange={(e) => handleClickPointButton(name, Number((e.target as HTMLInputElement).value), depth)}
      />
    );
  };
  const referenceBtn = (
    <Button
      size="small"
      color="line"
      icon="document-14"
      className="btn-reference"
      onClick={() => setReferenceModal(true)}
    >
      참고자료
    </Button>
  );

  const tabItems =
    domains?.map((item) => {
      return {
        text: item.title,
        tabName: item.title,
        tabId: item.code,
        contentsId: item.code,
        path: '',
      };
    }) ?? [];

  return (
    <div className={cx('modal-layer', `type-medium`, `modal-rating`)}>
      <style>
        {/* 모달 켜짐 시 스크롤 비활성화 */}
        {`
        body {
          overflow: hidden;
        }
      `}
      </style>
      <div className="inner-modal">
        <div className="modal-head">
          <strong className="tit-txt">아이 관찰 상세평가</strong>
        </div>
        <div className="modal-body">
          {domains && domains?.length > 0 ? (
            <Tab focusIdx={focusIdx} items={tabItems} commonArea={referenceBtn} onChange={handleTabClick}>
              {tabItems.map((tab, index) => (
                <div key={tab.tabId}>
                  {indicatorData && indicatorData?.length > 0 ? (
                    <ul className={`list-rating type-color${index + 1}`}>
                      {indicatorData
                        ?.filter((indicator) => tab.tabId === indicator.evaluationDomainCode)
                        .map((indicator) => (
                          <li key={indicator.indicatorCode} className={indicator.isFolding ? '' : 'expand'}>
                            <div className="inner-rating">
                              <strong className="tit-rating">{indicator.description}</strong>
                              {renderPointChoice(
                                indicator.depth,
                                indicator.indicatorCode,
                                indicator.prevScore,
                                indicator.score,
                                !indicator.isFolding,
                              )}
                              <Button
                                size="small"
                                color="line"
                                icon={indicator.isFolding ? 'plus-g' : 'minus-g'}
                                onClick={() => handleClickFoldingButton(indicator.indicatorCode, !indicator.isFolding)}
                              >
                                {indicator.isFolding ? '더보기' : '간단히'}
                              </Button>
                            </div>
                            <ul className="list-sub">
                              {indicator.subIndicators?.map((subIndi) => (
                                <li key={subIndi.indicatorCode}>
                                  <em className="tit-rating">{subIndi.description}</em>
                                  {renderPointChoice(
                                    subIndi.depth,
                                    subIndi.indicatorCode,
                                    subIndi.prevScore,
                                    subIndi.score,
                                    false,
                                  )}
                                </li>
                              ))}
                            </ul>
                          </li>
                        ))}
                    </ul>
                  ) : (
                    '데이터가 없습니다'
                  )}
                </div>
              ))}
            </Tab>
          ) : (
            <div className="tab-panel active">데이터가 없습니다.</div>
          )}
        </div>
        <div className="modal-foot">
          <div className="group-btn">
            <button type="button" className={cx(`btn btn-gray btn-medium`)} onClick={onCancel}>
              취소
            </button>
            <button
              type="button"
              disabled={(indicatorData && indicatorData?.length < 1) || (domains && domains?.length < 1)}
              className={cx(`btn btn-primary btn-medium`)}
              onClick={handleClickSaveButton}
            >
              평가완료
            </button>
          </div>
        </div>
        <button className="btn btn-icon btn-close" onClick={onCancel}>
          <span className="ico-comm ico-close-20">닫기</span>
        </button>
      </div>
      {/* {isReferenceModal && ( */}
      <Modal
        isOpen={isReferenceModal}
        onCancel={() => setReferenceModal(false)}
        className="modal-reference"
        message="참고자료"
        size="medium"
      >
        <StudentRecordIndicatorsReferenceModal
          index={focusIdx}
          indicators={indicators}
          tabCode={tabItems[focusIdx]?.tabId}
        />
      </Modal>
      {/* )} */}
    </div>
  );
}
