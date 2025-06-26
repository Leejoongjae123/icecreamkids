export interface ISnackbar {
  id: number;
  message: string;
  actionFunc?: () => void;
  actionText?: string;
}

export interface ISnackbarStore {
  messages: ISnackbar[];
  add: (message: Omit<ISnackbar, 'id'>) => void;
  remove: (id: number) => void;
}
