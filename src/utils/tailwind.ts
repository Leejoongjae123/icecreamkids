import { clsx, type ClassValue } from 'clsx';

/**
 * Tailwind CSS 클래스를 조건부로 결합하는 유틸리티 함수
 * @param inputs - 클래스 이름들
 * @returns 결합된 클래스 문자열
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * 버튼 스타일 변형을 위한 유틸리티
 */
export const buttonVariants = {
  primary: 'bg-primary-500 hover:bg-primary-600 text-white',
  secondary: 'bg-secondary-200 hover:bg-secondary-300 text-secondary-800',
  outline: 'border border-primary-500 text-primary-500 hover:bg-primary-50',
  ghost: 'text-primary-500 hover:bg-primary-50',
};

/**
 * 크기 변형을 위한 유틸리티
 */
export const sizeVariants = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl',
};

/**
 * 카드 스타일 변형을 위한 유틸리티
 */
export const cardVariants = {
  default: 'bg-white rounded-lg shadow-md',
  elevated: 'bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow',
  outlined: 'bg-white rounded-lg border border-secondary-200',
};

/**
 * 반응형 브레이크포인트 유틸리티
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/**
 * 색상 팔레트 유틸리티
 */
export const colors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
} as const; 