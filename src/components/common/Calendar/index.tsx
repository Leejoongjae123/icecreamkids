import { DatePicker } from '@/components/common/DatePicker';
import cx from 'clsx';
import dayjs from 'dayjs';
import { Korean } from 'flatpickr/dist/l10n/ko';
import { DateTimePickerProps } from 'react-flatpickr';

export interface ICalendarProps extends Omit<DateTimePickerProps, 'value' | 'onChange' | 'size'> {
  /**
   * 사이즈
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * placeholder 텍스트
   */
  placeholder?: string;
  /**
   * 비활성화 여부
   */
  disabled?: boolean;
  /**
   * 선택 날짜 값
   */
  value: string;
  /**
   * 날짜 값 형식
   */
  format?: string;
  /**
   * 선택 가능 최소 날짜
   */
  minDate?: string;
  /**
   * 선택 가능 최대 날짜
   */
  maxDate?: string;
  /**
   * 날짜 변경 이벤트
   */
  isFocus?: boolean;
  /**
   * 포커스인 이벤트
   */
  isError?: any;
  /**
   * 에러케이스
   */
  onChange: (date: string) => void;
}
export function Calendar(props: ICalendarProps) {
  // disabled와 readOnly도 구조 분해 할당에 추가
  const {
    size = 'small',
    format,
    onChange,
    minDate,
    maxDate,
    isFocus,
    disabled,
    isError,
    readOnly,
    ...otherProps
  } = props;
  const options = {
    locale: Korean,
    timezone: 'Asia/Seoul',
    minDate,
    maxDate,
  };
  const handleChange = (date: Date[]) => {
    const formattedDate = dayjs(date[0]).format(format);
    onChange(formattedDate);
  };
  return (
    <div className={cx('group-range')}>
      <div className={cx('item-text type-calendar', `type-${size}`)}>
        <div
          className={cx('inner-text', {
            focus: isFocus,
            disabled,
            readOnly,
            error: isError,
          })}
        >
          <DatePicker className="inp-text" {...otherProps} options={options} onChange={handleChange} />
          <span className="ico-comm ico-calendar-18" />
        </div>
      </div>
    </div>
  );
}
