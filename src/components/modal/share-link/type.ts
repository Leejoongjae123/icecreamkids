import {
  SmartFolderItemDetailedResult,
  SmartFolderItemResult,
  SmartFolderItemResultSmartFolderApiType,
} from '@/service/file/schemas';

export interface IShareLinkModal {
  item?:
    | SmartFolderItemResult
    | (SmartFolderItemDetailedResult & { smartFolderApiType: SmartFolderItemResultSmartFolderApiType })
    | null;
  onCancel?: () => void;
  onCloseRefetch?: () => void;
}

export interface IDetailtoItem extends SmartFolderItemDetailedResult {
  smartFolderApiType: SmartFolderItemResultSmartFolderApiType;
}
