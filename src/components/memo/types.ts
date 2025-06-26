interface IUser {
  id: number;
  name: string;
  avatarUrl?: string;
}

interface IMemoData {
  id: number;
  users: IUser[];
  content: string;
}

export type { IUser, IMemoData };
