export const ActivityTimeTypeData = {
  '20분': 'MINUTES_20',
  '30분': 'MINUTES_30',
  '40분': 'MINUTES_40',
  '60분': 'MINUTES_60',
  '1일': 'DAYS_1',
  '3일': 'DAYS_3',
  '5일': 'DAYS_5',
  '2주': 'WEEKS_2',
  '3주': 'WEEKS_3',
  '4주': 'WEEKS_4',
} as const;

export const ActivityTimeStringData = {
  MINUTES_20: '20분',
  MINUTES_30: '30분',
  MINUTES_40: '40분',
  MINUTES_60: '60분',
  DAYS_1: '1일',
  DAYS_3: '3일',
  DAYS_5: '5일',
  WEEKS_2: '2주',
  WEEKS_3: '3주',
  WEEKS_4: '4주',
};

export function transformActivityTime(timeInfo: string): string {
  // 입력값이 한국어 형식(예: "20분")인지 확인
  if (timeInfo in ActivityTimeTypeData) {
    // 한국어 형식을 코드 형식으로 변환 (예: "20분" → "MINUTES_20")
    return ActivityTimeTypeData[timeInfo as keyof typeof ActivityTimeTypeData];
  }

  // 입력값이 코드 형식(예: "MINUTES_20")인지 확인
  if (timeInfo in ActivityTimeStringData) {
    // 코드 형식을 한국어 형식으로 변환 (예: "MINUTES_20" → "20분")
    return ActivityTimeStringData[timeInfo as keyof typeof ActivityTimeStringData];
  }

  // 매칭되는 변환 규칙이 없으면 원래 값 반환
  return timeInfo;
}
