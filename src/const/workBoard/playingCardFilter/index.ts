import type { RadioOption } from '@/components/common/Radio';

/**
 * * 놀이연령
 */
const activityAgeRanges: RadioOption[] = [
  { text: '0~2세', value: 2 }, // BE상 2세이하는 모두 영아처리
  { text: '3세', value: 3 },
  { text: '4세', value: 4 },
  { text: '5세', value: 5 },
];

/**
 * * 놀이시간
 */
const activityTimeRanges: RadioOption[] = [
  { text: '20분', value: 'MINUTES_20' },
  { text: '30분', value: 'MINUTES_30' },
  { text: '60분', value: 'MINUTES_60' },
  { text: '1일', value: 'DAYS_1' },
];

export { activityAgeRanges, activityTimeRanges };
