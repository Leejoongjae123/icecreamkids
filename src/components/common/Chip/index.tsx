import cx from 'clsx';
import Link from 'next/link';

export interface ChipOption {
  label: string;
  value: string;
  link?: string;
}

export interface ChipProps {
  chipList: ChipOption[];
  isEdit?: boolean;
  onDelete?: (v: string) => void;
}

export function Chip({ chipList, isEdit = false, onDelete }: ChipProps) {
  const handleDeleteItem = (value: string) => {
    if (onDelete) {
      onDelete(value);
    }
  };
  return (
    <div className="group_chip">
      {chipList?.map((chip) => {
        return (
          <div key={chip.value} className={cx('item_chip', isEdit && 'type_edit')}>
            <span className="tit_chip">
              {chip.link ? (
                <Link href={chip.link} className="link_g">
                  {chip.label}
                </Link>
              ) : (
                chip.label
              )}
              {isEdit && (
                <button type="button" className="btn_chip" onClick={() => handleDeleteItem(chip.value)}>
                  <span className="ico_comm ico_close_s">삭제</span>
                </button>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
