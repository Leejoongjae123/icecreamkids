import Flatpickr, { DateTimePickerProps } from 'react-flatpickr';

const CustomDatePicker = Flatpickr as unknown as React.ComponentType<DateTimePickerProps>;

export function DatePicker({ ...props }: DateTimePickerProps) {
  return <CustomDatePicker {...props} />;
}
