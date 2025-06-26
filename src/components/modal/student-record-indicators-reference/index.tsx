import cx from 'clsx';
import { StudentEvaluationIndicatorResult } from '@/service/file/schemas';
import { Fragment, ReactNode } from 'react';

type Reference = {
  indicatorCode: string;
  description: string;
  referenceData: ReactNode[] | null;
};
type referenceMapType = {
  [key in string]?: Reference[];
};

export function StudentRecordIndicatorsReferenceModal({
  indicators,
  index,
  tabCode,
}: {
  indicators: StudentEvaluationIndicatorResult[] | undefined;
  index: number;
  tabCode: string;
}) {
  const referenceMap =
    indicators?.reduce((acc, indicator) => {
      const code = indicator.evaluationDomainCode;

      if (!acc[code]) {
        acc[code] = [];
      }

      const referenceData =
        indicator?.referenceData?.split('\\n').map((sentence, subIndicatorIndex) => (
          // eslint-disable-next-line react/no-array-index-key
          <li key={`${indicator.indicatorCode}-${subIndicatorIndex}`}>{sentence}</li>
        )) ?? null;

      acc[code].push({
        indicatorCode: indicator.indicatorCode,
        description: indicator.description ?? '',
        referenceData,
      });
      return acc;
    }, {} as referenceMapType) ?? {};

  return (
    <div className={cx('box-reference', `bg-type${index + 1}`)} style={{ minHeight: '597px' }}>
      {referenceMap[tabCode]?.map((reference) => {
        return (
          <Fragment key={reference.indicatorCode}>
            <strong className="tit-reference">{reference.description}</strong>
            <ul className="list-reference">{reference.referenceData}</ul>
          </Fragment>
        );
      })}
    </div>
  );
}
