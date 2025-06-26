import React from 'react';
import { FLOATING_BUTTON_TYPE } from '@/const';
import { IDropDownMenu } from '@/components/common/Thumbnail/_components/DropDownMenu/types';
import { SmartFolderItemResultFileType } from '@/service/file/schemas';

export interface IFloatingButton {
  floatingType?: (typeof FLOATING_BUTTON_TYPE)[keyof typeof FLOATING_BUTTON_TYPE];
  hoverFloatingType?: (typeof FLOATING_BUTTON_TYPE)[keyof typeof FLOATING_BUTTON_TYPE];
  onDownload?: React.MouseEventHandler<HTMLButtonElement>;
  onEdit?: React.MouseEventHandler<HTMLButtonElement>;
  onClose?: React.MouseEventHandler<HTMLButtonElement>;
  onFavorite?: React.MouseEventHandler<HTMLButtonElement>;
  onEditToggle?: React.ChangeEventHandler<HTMLInputElement>;
  onDropDown?: React.MouseEventHandler<HTMLButtonElement>;
  onBadge?: React.MouseEventHandler<HTMLButtonElement>;
  isEditActive?: boolean;
  floating?: boolean;
  fileName: string;
  isMine?: boolean; // 내 파일 여부
  favorite?: boolean; // 즐겨찾기 여부
  dropDown?: boolean; // 메뉴 클릭 여부
  dropDownMenu?: IDropDownMenu; // 드롭다운 메뉴
  dropDownDirection?: 'left' | 'right'; // 드롭다운 메뉴 노출 방향
  fileType: SmartFolderItemResultFileType; // 파일 타입(폴더 시 체크박스 비활성화)
  showIndexOnCheck?: boolean; // 놀이보고서용 체크될 경우 숫자가 보여져야하는 경우
  showNumber?: number; // 보여져야 할 숫자
  /**
   * 체크 박스 대신 check number 표시
   */
  checkNum?: number;
  hover?: boolean; // 호업 모드 활성화 여부
  folderCheckBox?: boolean; // 폴더 체크박스 활성화
  userEditable?: boolean; // 시스템 폴더 or 유저 생성 폴더 여부 (true: 유저 생성, false: 시스템)
}
