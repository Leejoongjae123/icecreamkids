import type { ITextAreaElemProps } from '@/components/common/Textarea/elem/types';

export interface ITextareaProps extends ITextAreaElemProps {
  itemClassName?: string;
  errorMessage?: string;
  infoMessage?: string;
  label?: string;
}
