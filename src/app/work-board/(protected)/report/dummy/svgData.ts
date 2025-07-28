import { SvgItem, ClipPathItem } from './types';

// 원형과 자유형상 사각형 클리핑 패스 9가지 변형
export const clipPathItems: ClipPathItem[] = [
  {
    id: 'circle-1',
    name: '원형 1',
    pathData: 'M 0.5 0.05 C 0.78 0.05 1.0 0.27 1.0 0.55 C 1.0 0.83 0.78 1.05 0.5 1.05 C 0.22 1.05 0 0.83 0 0.55 C 0 0.27 0.22 0.05 0.5 0.05 Z'
  },
  {
    id: 'rounded-square-2',
    name: '둥근 사각형 2 (더 둥글게)',
    pathData: 'M 0.3 0.12 L 0.7 0.12 C 0.82 0.12 0.92 0.22 0.92 0.34 L 0.92 0.76 C 0.92 0.88 0.82 0.98 0.7 0.98 L 0.3 0.98 C 0.18 0.98 0.08 0.88 0.08 0.76 L 0.08 0.34 C 0.08 0.22 0.18 0.12 0.3 0.12 Z'
  }
]; 