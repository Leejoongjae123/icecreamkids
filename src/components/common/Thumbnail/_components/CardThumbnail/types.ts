import { IThumbnail } from '@/components/common/Thumbnail/types';

export interface ICardThumbnail
  extends Pick<
    IThumbnail,
    | 'isEditActive'
    | 'onEditToggle'
    | 'fileName'
    | 'floating'
    | 'lecturePlan'
    | 'favorite'
    | 'onFavorite'
    | 'dropDown'
    | 'dropDownMenu'
    | 'onDropDown'
    | 'onEdit'
    | 'userProfileName'
    | 'userProfileThumbUrl'
    | 'likes'
    | 'views'
  > {
  isHovered: boolean;
  handleWrapperClick?: React.MouseEventHandler<HTMLDivElement>;
  onDoubleClick?: React.MouseEventHandler<HTMLDivElement>;
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
}
