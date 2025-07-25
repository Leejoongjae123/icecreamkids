import { SvgItem, ClipPathItem } from './types';

// 베지어 곡선 기반 클리핑 패스 9가지 변형 (외곽 꽉 차게 확장)
export const clipPathItems: ClipPathItem[] = [
  {
    id: 'organic-1',
    name: '유기체 형태 1',
    pathData: 'M 1.02 0.15 C 1.02 0.55 1.08 1.05 0.75 1.05 C 0.42 1.05 -0.02 1.08 -0.02 0.68 C -0.02 0.28 -0.08 -0.05 0.25 -0.05 C 0.58 -0.05 1.02 -0.08 1.02 0.15 Z'
  },
  {
    id: 'organic-2',
    name: '유기체 형태 2',
    pathData: 'M 0.88 0.02 C 1.0 0.25 1.15 0.88 0.68 1.02 C 0.21 1.16 -0.02 0.95 -0.02 0.58 C -0.02 0.21 -0.08 -0.02 0.39 -0.08 C 0.86 -0.14 0.76 -0.08 0.88 0.02 Z'
  },
  {
    id: 'organic-3',
    name: '유기체 형태 3',
    pathData: 'M 0.95 0.18 C 0.95 0.62 1.02 0.95 0.65 1.02 C 0.28 1.09 0.05 1.02 -0.02 0.65 C -0.09 0.28 -0.02 -0.02 0.35 -0.09 C 0.72 -0.16 0.95 -0.16 0.95 0.18 Z'
  },
  {
    id: 'organic-4',
    name: '유기체 형태 4',
    pathData: 'M 0.85 0.05 C 1.08 0.28 0.98 0.85 0.55 0.98 C 0.12 1.11 -0.02 0.85 0.08 0.42 C 0.18 0.05 0.05 -0.02 0.48 -0.02 C 0.91 -0.02 0.62 -0.15 0.85 0.05 Z'
  },
  {
    id: 'organic-5',
    name: '유기체 형태 5',
    pathData: 'M 0.78 0.08 C 0.92 0.48 0.85 0.92 0.48 1.02 C 0.11 1.12 0.05 0.75 0.08 0.32 C 0.11 -0.05 0.08 -0.02 0.45 0.05 C 0.82 0.12 0.64 -0.02 0.78 0.08 Z'
  },
  {
    id: 'organic-6',
    name: '유기체 형태 6',
    pathData: 'M 0.75 0.22 C 0.88 0.42 0.95 0.82 0.58 0.95 C 0.21 1.08 0.08 0.85 -0.05 0.58 C -0.18 0.25 0.05 0.05 0.32 -0.02 C 0.65 -0.15 0.62 0.02 0.75 0.22 Z'
  },
  {
    id: 'organic-7',
    name: '유기체 형태 7',
    pathData: 'M 0.98 0.02 C 1.12 0.42 0.95 0.88 0.52 1.02 C 0.09 1.16 -0.05 0.95 0.02 0.52 C 0.09 0.09 -0.05 -0.05 0.38 0.02 C 0.81 0.09 0.88 -0.05 0.98 0.02 Z'
  },
  {
    id: 'organic-8',
    name: '유기체 형태 8',
    pathData: 'M 0.95 -0.02 C 1.08 0.35 1.02 0.78 0.58 0.95 C 0.15 1.12 -0.02 0.88 -0.02 0.45 C -0.02 0.02 -0.08 -0.02 0.35 -0.02 C 0.78 -0.02 0.82 -0.12 0.95 -0.02 Z'
  },
  {
    id: 'organic-9',
    name: '유기체 형태 9',
    pathData: 'M 0.88 0.15 C 1.02 0.28 1.12 0.75 0.65 0.88 C 0.18 1.08 -0.02 0.82 0.05 0.35 C 0.12 -0.02 0.02 0.02 0.42 0.05 C 0.85 0.12 0.75 0.02 0.88 0.15 Z'
  }
]; 