import dayjsLib, { ConfigType, Dayjs } from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isBetween from 'dayjs/plugin/isBetween';
import arraySupport from 'dayjs/plugin/arraySupport';
import updateLocale from 'dayjs/plugin/updateLocale';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isoWeek from 'dayjs/plugin/isoWeek';
import 'dayjs/locale/ko';

export const dateFormat = {
  default: 'YYYY.MM.DD',
  kekaba: 'YYYY-MM-DD',
  second: 'YYYY.MM.DD HH:mm:ss',
};

// global
dayjsLib.extend(isSameOrBefore);
dayjsLib.extend(arraySupport);
dayjsLib.extend(isSameOrAfter);
dayjsLib.extend(isBetween);
dayjsLib.extend(utc);
dayjsLib.extend(updateLocale);
dayjsLib.locale('ko');
dayjsLib.extend(timezone);
dayjsLib.extend(isoWeek);
dayjsLib.tz.setDefault('Asia/Seoul');

dayjsLib.updateLocale('ko', {
  invalidDate: '-',
  timezone: 'Asia/Seoul',
});

const dayjs = (date?: ConfigType, ...props: any): Dayjs => {
  if (typeof date === 'string') {
    return dayjsLib(date.replace(/\./g, '-'));
  }
  return dayjsLib(date, ...props).tz('Asia/Seoul');
};

export default dayjs;
