export interface IFormData {
  nickname: string;
  introduce: string;
  phone: string;
  password: string;
  email: string;
  location: string;
  org: string;
  job: string;
}

export interface IPasswordFormData {
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface IAvatarProps {
  src: string;
  classNames: string;
  isModifyMode: boolean;
  handleUpdateData: (file: File, base64: string) => void;
}

export interface IButtonGroupProps {
  isModifyMode: boolean;
  onCancel: () => void;
  onToggleModify: () => void;
}
