import { HTMLAttributes } from 'react';

export interface ITextHighlight extends Omit<HTMLAttributes<HTMLSpanElement>, 'color'> {
  text: string;
  highlight?: string;
  color?: string;
  highlightColor?: string;
}
