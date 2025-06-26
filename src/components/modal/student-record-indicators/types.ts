import { StudentEvaluationIndicatorResult } from '@/service/file/schemas';

export interface RadarChartData {
  id: string;
  subject: string;
  value: number;
  color: string;
  image: string;
}

export interface StudentEvaluationIndicatorResultWithScoreAndIsFolding extends StudentEvaluationIndicatorResult {
  id?: number;
  score?: number;
  prevScore?: number;
  isFolding?: boolean;
  subIndicators?: StudentEvaluationIndicatorResultWithScoreAndIsFolding[];
}
