export interface IDropDownMenu {
  /* show: DropDownMenu 노출 여부 */
  show?: boolean;
  /* save: 스마트 폴더에 저장됨 */
  save?: boolean;
  text?: boolean;
  top?: number;
  left?: number;
  /* direction: 드롭다운 노출 방향 */
  direction?: 'left' | 'right';
  onDropDown?: React.MouseEventHandler<HTMLButtonElement>;
  /* list: 상세 메뉴 리스트 */
  list: {
    /* list.key: 상세 메뉴 키 */
    key?: string;
    /* list.key: 상세 메뉴 노출 라벨 */
    text: string;
    /* list.key: 상세 메뉴 클릭 액션 */
    action?: () => void;
  }[];
}
