import { IModal } from '@/components/common/ModalBase/types';

export interface IApplyModalProps extends Omit<IModal, 'message'> {
  message: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

