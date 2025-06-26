import { IModal } from '@/components/common/ModalBase/types';
import { ProfileResult } from '@/service/member/schemas';

export interface IFollowModal extends Omit<IModal, 'message'> {
  profile: ProfileResult;
  initialTabIdx: number;
}
