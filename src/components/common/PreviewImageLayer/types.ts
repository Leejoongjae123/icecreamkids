import { IModal } from '@/components/common/ModalBase/types';
import { TaskExampleResult } from '@/service/core/schemas/taskExampleResult';

export interface IPreviewImageModal extends Pick<IModal, 'isOpen' | 'onCancel'> {
  preview: TaskExampleResult | { title: string; fullImageUrl: string };
  onCancel?: (type?: 'close' | 'refetch') => void;
}
