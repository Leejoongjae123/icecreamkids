import type { TextareaHTMLAttributes } from 'react';
import type { UseFormRegisterReturn, InternalFieldName } from 'react-hook-form';

export interface ITextAreaElemProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> {
  value?: string;
  libProps?: Partial<UseFormRegisterReturn<InternalFieldName>>;
  onChange?: (value: string) => void;
}
