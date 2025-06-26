import { IModal } from '@/components/common/ModalBase/types';
import { ProfileResult } from '@/service/member/schemas';
import {
  AbusingReportOptionResultContentType,
  CreateAbusingReportRequestContentSmartFolderApiType,
} from '@/service/core/schemas';

export interface IReportModalProps extends Omit<IModal, 'message'> {
  onReport: (reason: string) => void;
  onCancel: () => void;
  contentType?: AbusingReportOptionResultContentType;
  contentId?: number;
  targetProfile?: Pick<ProfileResult, 'name' | 'accountId'>;
  contentSmartFolderApiType?: CreateAbusingReportRequestContentSmartFolderApiType;
}
