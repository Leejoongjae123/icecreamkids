import { IModal } from '@/components/common/ModalBase/types';
import { MyBannerResult } from '@/service/core/schemas';
import { QueryObserverResult, RefetchOptions } from '@tanstack/react-query';
import { ApiResponseProfileResult } from '@/service/member/schemas';

export interface IBannerEditModal extends Omit<IModal, 'message' | 'onConfirm'> {
  profileRefetch: (options?: RefetchOptions) => Promise<QueryObserverResult<ApiResponseProfileResult, unknown>>;
}
