import { UserInfo } from '@/hooks/store/useUserStore';
import { StudentAddRequestState } from '@/service/member/schemas';

type StateWithoutLeaved = Exclude<StudentAddRequestState, 'LEAVED'>;

export interface IChildData {
  name: string;
  birthday: string;
  state: StateWithoutLeaved;
  thumbUrl?: string | null;
  gender: 'MALE' | 'FEMALE';
  photoFileInfos?: { photoFileObjectId: number; imageUrl: string }[];
}

export interface IMyChildrenClientProps {
  userInfo: UserInfo;
  classId?: number;
  isActive: boolean;
}
