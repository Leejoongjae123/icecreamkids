export interface IMenuItem {
  id: number;
  name: string;
  path: string;
  subMenu?: IMenuItem[];
  bold?: boolean;
}

export interface IMenuList<T = IMenuItem> extends Array<T> {}
