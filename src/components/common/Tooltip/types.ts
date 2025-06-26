import React from 'react';

export interface ITooltip {
  id: string;
  type?: 'click' | 'toggle' | 'hover' | 'rightClick';
  title?: string;
  contents: React.ReactNode;
  isOpen?: boolean;
  onToggle?: (state?: boolean) => void;
  style?: React.CSSProperties;
  className?: string;
  parentRef?: React.RefObject<HTMLDivElement>;
}

export interface IMenuPosition {
  x: number;
  y: number;
}
