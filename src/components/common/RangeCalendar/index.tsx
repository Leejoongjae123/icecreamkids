import dayjs from 'dayjs';
import cx from 'clsx';
import { Korean } from 'flatpickr/dist/l10n/ko';
import { DateTimePickerProps } from 'react-flatpickr';
import { DatePicker } from '@/components/common/DatePicker';
import { useCallback } from 'react';

export interface RangeCalendarProps extends Omit<DateTimePickerProps, 'value' | 'onChange' | 'size'> {
  size?: 'small' | 'large';
  type?: 'default' | 'title';
  placeholder?: string;
  disabled?: boolean;
  value: { startDate: string; endDate: string };
  format?: string;
  startDate?: string;
  endDate?: string;
  minDate?: string;
  maxDate?: string;
  onChange: (key: string, value: string) => void;
}

export function RangeCalendar({
  size = 'small',
  type = 'default',
  format = 'YYYY-MM-DD',
  onChange,
  minDate,
  maxDate,
  value,
  ...props
}: RangeCalendarProps) {
  // 날짜 변경 핸들러 (시작/종료일 역전 시 서로 교환)
  const handleChange = useCallback(
    (key: 'startDate' | 'endDate', dates: Date[]) => {
      if (!dates || dates.length === 0) return;
      const newDate = dayjs(dates[0]);
      const formattedNewDate = newDate.format(format);
      console.log(`${key} 선택됨:`, formattedNewDate);

      const currentStart = value.startDate ? dayjs(value.startDate, format) : null;
      const currentEnd = value.endDate ? dayjs(value.endDate, format) : null;

      if (key === 'startDate') {
        if (currentEnd && newDate.isAfter(currentEnd)) {
          // 시작일이 종료일보다 늦으면 날짜를 서로 교환
          onChange('startDate', currentEnd.format(format));
          onChange('endDate', formattedNewDate);
          return;
        }
      } else if (key === 'endDate') {
        if (currentStart && newDate.isBefore(currentStart)) {
          // 종료일이 시작일보다 이르면 날짜를 서로 교환
          onChange('startDate', formattedNewDate);
          onChange('endDate', currentStart.format(format));
          return;
        }
      }
      onChange(key, formattedNewDate);
    },
    [format, onChange, value.startDate, value.endDate],
  );

  // Delete/Backspace 키보드 처리
  const handleKeyDown = useCallback(
    (key: string) => (_selectedDates: Date[], _dateStr: string, _instance: any, event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        onChange(key, '');
        return false;
      }
      return undefined;
    },
    [onChange],
  );

  // Flatpickr 옵션 설정 (appendTo 옵션 제거)
  const createOptions = useCallback(
    (dateKey: 'startDate' | 'endDate') => ({
      locale: Korean,
      dateFormat: 'Y-m-d',
      minDate,
      maxDate,
      clickOpens: true,
      static: false,
      inline: false,
      defaultOpen: false,
      open: false,
      closeOnSelect: true,
      mode: 'single' as const,
      onClose: () => {},
      onKeyDown: handleKeyDown(dateKey),
    }),
    [handleKeyDown, maxDate, minDate],
  );

  return (
    <div className={cx('group-range', type === 'title' && 'type-title')}>
      <div className={cx('item-text type-calendar', `type-${size}`)}>
        {type === 'title' && <span className="lab-range">시작일</span>}
        <div className={cx('inner-text', props.disabled && 'disabled', props.readOnly && 'readonly')}>
          <DatePicker
            className="inp-text"
            {...props}
            value={value.startDate}
            options={createOptions('startDate')}
            onChange={(dates) => handleChange('startDate', dates)}
            placeholder={type === 'title' ? 'YY-MM-DD' : '시작일'}
          />
          {type !== 'title' && <span className="ico-comm ico-calendar-18" />}
        </div>
      </div>

      <span className="txt-separator">~</span>

      <div className={cx('item-text type-calendar', `type-${size}`)}>
        {type === 'title' && <span className="lab-range">종료일</span>}
        <div className={cx('inner-text', props.disabled && 'disabled', props.readOnly && 'readonly')}>
          <DatePicker
            className="inp-text"
            {...props}
            value={value.endDate}
            options={createOptions('endDate')}
            onChange={(dates) => handleChange('endDate', dates)}
            placeholder={type === 'title' ? 'YY-MM-DD' : '종료일'}
          />
          {type !== 'title' && <span className="ico-comm ico-calendar-18" />}
        </div>
      </div>
    </div>
  );
}
