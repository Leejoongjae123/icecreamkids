import { IModal } from '@/components/common/ModalBase/types';
import { SmartFolderResult } from '@/service/file/schemas';

export interface IWidgetModal extends Pick<IModal, 'isOpen' | 'onCancel'> {
  widgetList: SmartFolderResult[];
  onCancel?: (type?: 'close' | 'refetch') => void;
}
