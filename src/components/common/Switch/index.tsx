import cx from 'clsx';
import { ISwitch } from '@/components/common/Switch/types';

export function Switch({ id, name, label, size = 'small', ...props }: ISwitch) {
  return (
    <div className="item-choice">
      <input type="checkbox" name={name} id={id} className="inp-comm" {...props} />
      <label htmlFor={id} className="lab-switch">
        <span className={cx('ico-comm', size === 'small' ? 'ico-inp-switch' : 'ico-inp-switch-large')} />
        <span className="screen_out">{label}</span>
      </label>
    </div>
  );
}
