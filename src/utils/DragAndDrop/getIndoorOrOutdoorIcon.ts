/**
 * * 놀이 장소 유형에 따른 아이콘 클래스명을 반환하는 함수
 * @param indoorOrOutdoor - 놀이 장소 유형 ('INDOOR', 'OUTDOOR', 'BOTH')
 * @returns 해당 장소 유형에 맞는 아이콘 클래스명
 */

// 상수로 추출하여 일관성 유지 및 오타 방지
const PLACE_TYPES = {
  INDOOR: 'INDOOR',
  OUTDOOR: 'OUTDOOR',
  BOTH: 'BOTH',
} as const;

// 아이콘 클래스명도 상수로 관리
const ICON_CLASSES = {
  INDOOR: 'ico-home',
  OUTDOOR: 'ico-image',
  BOTH: 'ico-etc',
} as const;

// 타입 정의로 안전성 강화
type PlaceType = (typeof PLACE_TYPES)[keyof typeof PLACE_TYPES];

export default function getIndoorOrOutdoorIcon(indoorOrOutdoor: string, size: number = 30): string {
  if (!indoorOrOutdoor) return '';

  // 매핑 객체 사용
  const iconMap: Record<PlaceType, string> = {
    [PLACE_TYPES.INDOOR]: `${ICON_CLASSES.INDOOR}-${size}`,
    [PLACE_TYPES.OUTDOOR]: `${ICON_CLASSES.OUTDOOR}-${size}`,
    [PLACE_TYPES.BOTH]: `${ICON_CLASSES.BOTH}-${size}`,
  };

  // 대문자 변환으로 대소문자 불일치 문제 해결
  const normalizedInput = indoorOrOutdoor.toUpperCase() as PlaceType;

  // 기본값 처리 개선
  return iconMap[normalizedInput] || `${ICON_CLASSES.BOTH}-${size}`;
}
