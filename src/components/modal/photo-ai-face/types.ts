import { IModal } from '@/components/common/Modal/types';

export interface IPhotoAiFaceModal extends Omit<IModal, 'message' | 'onConfirm'> {
  onConfirm: (selectedOption: string) => void | Promise<void>;
}
