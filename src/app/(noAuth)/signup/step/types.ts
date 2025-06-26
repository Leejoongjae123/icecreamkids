import { InvitationV2Result } from '@/service/member/schemas';

// 1. 약관동의페이지
export interface IAgreeForm {
  allAgree: boolean;
  ageAgree: boolean;
  termsAgree: boolean;
  privacyAgree: boolean;
}

export interface ITermsProps {
  onNext: () => void;
  onBack: () => void;
}

// 2. 회원가입 폼

export interface IFormData {
  phone: string;
  name: string;
  password: string;
  confirmPassword: string;
  organizationAndPositionClassification: string;
  phoneCert: string;
  recommender?: string;
}

export interface IProps {
  onComplete: (data: IFormData) => void;
  onBack: () => void;
  referrerInfo: InvitationV2Result | null;
}
