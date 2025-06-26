import { IModal } from '@/components/common/ModalBase/types';
import { IImageEditorResult } from '@/hooks/useImageEditor';

export interface IProfileEditModal extends Omit<IModal, 'message'> {
  imageEditor: IImageEditorResult;
  message?: string;
  /**
   * 프로필사진여부 (캐릭터 이미지 노출 제어용)
   */
  isProfile?: boolean;
}
