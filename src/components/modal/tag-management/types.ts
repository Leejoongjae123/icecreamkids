import { IModal } from '@/components/common/ModalBase/types';

interface ITagModalProps extends Omit<IModal, 'message'> {
  onSave: () => void;
  driveItemKey: string;
}

export type { ITagModalProps };
