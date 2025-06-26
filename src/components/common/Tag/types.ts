export interface ITag {
  type?: 'default' | 'delete';
  text: string;
  onClick?: (e?: React.MouseEvent<HTMLSpanElement, MouseEvent>) => void;
}
