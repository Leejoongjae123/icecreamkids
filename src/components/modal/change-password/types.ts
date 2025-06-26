import { IPasswordFormData } from '@/app/(auth)/my-info/types';
import { useForm } from 'react-hook-form';

export interface IPasswordChangeModalProps {
  isOpen: boolean;
  isValid: boolean;
  isVerified: boolean;
  form: ReturnType<typeof useForm<IPasswordFormData>>;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  setIsVerified: React.Dispatch<React.SetStateAction<boolean>>;
  setAccountId: React.Dispatch<React.SetStateAction<number>>;
}
