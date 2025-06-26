import dayjs from 'dayjs';
import { getCleaned } from '@/utils';

const valueAsNumber = {
  setValueAs: (value: string | number): number | null => {
    const cleaned = getCleaned(value);
    return cleaned ? +cleaned : null;
  },
};

const valueAsDateSameOrAfterToday = {
  setValueAs: (value: string): string | null => {
    return dayjs(value).isSameOrAfter(dayjs(), 'day') ? value : null;
  },
};

const validateDate = {
  validate: (value: string | number | undefined): boolean => {
    return dayjs(value).isValid();
  },
};
const validationRule = {
  valueAsNumber,
  validateDate,
  getRequired: (typeName: string, isRequired: boolean = true) => {
    const obj = {
      setValueAs: (value: any) => {
        return typeof value === 'string' ? value.trimStart() : value;
      },
      required: {
        value: isRequired,
        message: typeName,
      },
    };
    return obj;
  },
  getRequiredNum: (typeName: string, isRequired: boolean = true) => {
    const obj = {
      required: {
        value: isRequired,
        message: typeName,
      },
      ...valueAsNumber,
    };
    return obj;
  },
  getRequiredDate: (typeName: string, isRequired: boolean = true) => {
    const obj = {
      required: {
        value: isRequired,
        message: typeName,
      },
      ...validateDate,
    };
    return obj;
  },
  getRequiredDateRange: (typeName: string, isRequired: boolean = true) => {
    const obj = {
      required: {
        value: isRequired,
        message: typeName,
      },
      ...valueAsDateSameOrAfterToday,
    };
    return obj;
  },
  getRequiredBoolean: (typeName: string, isRequired: boolean = true) => {
    const obj = {
      validate: (value: string | null | undefined | boolean) => {
        if (value === undefined || value === null) {
          return typeName;
        }
        return true;
      },
    };
    return obj;
  },

  required: {
    required: {
      value: true,
      message: '필수값을 확인해주세요.',
    },
  },
  requiredNum: {
    required: {
      value: true,
      message: '필수값을 확인해주세요.',
    },
    ...valueAsNumber,
  },
  requiredDate: {
    required: {
      value: true,
      message: '필수값을 확인해주세요.',
    },
    ...valueAsDateSameOrAfterToday,
  },
  id: {
    required: {
      value: true,
      message: '아이디/비밀번호를 정확하게 입력해 주세요.',
    },
  },
  password: {
    required: {
      value: true,
      message: '아이디/비밀번호를 정확하게 입력해 주세요.',
    },
  },
  email: {
    required: {
      value: true,
      message: '이메일',
    },
    pattern: {
      value:
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      message: '올바른 이메일 형식으로 입력해주세요.',
    },
  },
  phone: {
    required: {
      value: true,
      message: '연락처',
    },
    pattern: {
      value: /^01([0|1|6|7|8|9]?)-?([0-9]{3,4})-?([0-9]{4})$/,
      message: '휴대폰 번호를 확인해 주세요.',
    },
  },
  url: {
    required: {
      value: true,
      message: 'url을 입력해 주세요',
    },
    pattern: {
      value: /^(https?:\/\/)?(www\.)?((((\w|-)+)\.){1,}|(((\w|-)+)\.){1,})[a-zA-Z]{2,}(\/[^\s]*)?/,
      message: 'URL 형식이 올바르지 않습니다. 입력 내용을 다시 확인해 주세요.',
    },
  },
};

export default validationRule;
