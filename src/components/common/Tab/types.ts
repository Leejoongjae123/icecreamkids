import type { PropsWithChildren, ReactNode } from 'react';

export interface ITabItem {
  text: string;
  tabName: string;
  tabId: string;
  contentsId: string;
  path?: string;
  disabled?: boolean;
}

export interface ITab {
  fullType?: boolean;
  sizeType?: 'small' | 'medium' | 'large';
  focusIdx: number;
  items: ITabItem[];
  theme?: 'undefined' | 'fill' | 'box';
  className?: string;
  children?: PropsWithChildren;
  commonArea?: ReactNode;
  contentsHide?: boolean;
  onChange: (focusIdx: number) => void;
  panelRef?: React.RefObject<HTMLDivElement>;
  onPanelScroll?: () => void;
}
