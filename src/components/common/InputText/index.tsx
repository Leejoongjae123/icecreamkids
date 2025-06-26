import { useClickOutside } from '@/hooks/useClickOutside';
import cx from 'clsx';
import type React from 'react';
import {
  type ChangeEventHandler,
  type FocusEventHandler,
  forwardRef,
  useCallback,
  useMemo,
  type KeyboardEvent,
  type KeyboardEventHandler,
  useRef,
  useState,
} from 'react';

type InputType = 'text' | 'number' | 'tel' | 'password' | 'search';
type InputSizeType = 'small' | 'large';

export interface SelectOption {
  [key: string]: string | number;
}
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * id
   */
  id: string;
  /**
   * type 생략시 text
   */
  type?: InputType;
  /**
   * sizeType 생략시 small
   */
  sizeType?: InputSizeType;
  /**
   * disabled
   */
  disabled?: boolean;
  /**
   * readOnly
   */
  readOnly?: boolean;
  /**
   * style
   */
  style?: React.CSSProperties;
  /**
   * 에러 여부
   */
  isError?: boolean;
  /**
   * Enter 키보드 클릭 이벤트
   */
  onPressEnter?: KeyboardEventHandler<HTMLInputElement>;
  /**
   * 입력 이벤트
   */
  onChange?: ChangeEventHandler<HTMLInputElement>;
  /**
   * blur 이벤트 처리
   */
  onBlur?: FocusEventHandler<HTMLInputElement>;
  /**
   * focus 이벤트
   */
  onFocus?: FocusEventHandler<HTMLInputElement>;
  time?: string;
  infoMsg?: string;
  errorMsg?: string;
  confirmMsg?: string;
  options?: SelectOption[] | (string | number)[];
  value?: string | number | string[];
  name?: string;
  textKey?: string;
  valueKey?: string;
  iconKey?: string;
  labelKey?: string;
  hasDelBtn?: boolean;
  className?: string;
}

export const InputText = forwardRef<any, InputProps>((props: InputProps, ref) => {
  const {
    options = [],
    style,
    type = 'text',
    sizeType = 'small',
    onPressEnter,
    onKeyDown,
    onChange,
    onFocus,
    onBlur,
    isError = false,
    disabled = false,
    hasDelBtn = false,
    value,
    name,
    textKey = 'text',
    valueKey = 'value',
    labelKey = 'label',
    iconKey = 'icon',
    time,
    infoMsg,
    errorMsg,
    confirmMsg,
    className,
    ...restProps
  } = props;

  const [isFocus, setIsFocus] = useState(false);
  const [isShow, setIsShow] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const boxRef = useRef<HTMLDivElement>(null);
  const optionList = useMemo(() => {
    return options.map((d) => {
      if (typeof d === 'string' || typeof d === 'number') {
        return { text: d, value: d };
      }
      return d;
    });
  }, [options]);

  // 선택된 값 계산
  const selectedValues = useMemo(() => {
    return typeof value === 'string' || typeof value === 'number' ? [value] : [];
  }, [value]);

  // 옵션 클릭 핸들러
  const handleClickOption = useCallback(
    (optionValue: string) => {
      if (onChange) {
        // onChange(optionValue);
        setIsOpen(false);
      }
    },
    [onChange],
  );

  // 셀렉트 버튼 클릭 핸들러
  const handleClickSelectButton = useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
    }
  }, [disabled]);

  // 포커스 아웃 시 닫힘 처리
  useClickOutside(boxRef, () => {
    setIsOpen(false);
  });

  // 검색어 하이라이트
  const highlightText = (text: string, queryZZ: string) => {
    if (!queryZZ) return text;
    const parts = text.split(new RegExp(`(${queryZZ})`, 'gi'));

    return parts.map((part, index) =>
      part.toLowerCase() === queryZZ.toLowerCase() ? (
        <span key={part} className="font-bold">
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  // key 입력 이벤트
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (onPressEnter && e.key === 'Enter') {
      onPressEnter(e);
    } else {
      onKeyDown?.(e);
    }
  };

  // 입력 이벤트
  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setQuery(e.target.value);
    onChange?.(e); // props에서 전달된 onChange 이벤트 호출
  };

  // 포커스 아웃 이벤트
  const handleFocus: FocusEventHandler<HTMLInputElement> = (e) => {
    onFocus?.(e); // props에서 전달된 onBlur 이벤트 호출
    setIsFocus(true);
  };

  // 포커스 아웃 이벤트
  const handleBlur: FocusEventHandler<HTMLInputElement> = (e) => {
    onBlur?.(e); // props에서 전달된 onBlur 이벤트 호출
    setTimeout(() => {
      setIsFocus(false);
    }, 200);
  };

  const showPassword = () => {
    if (isShow) {
      setIsShow(false);
    } else {
      setIsShow(true);
    }
  };

  const clearValue = (target: any) => {
    // target.previousSibling.value = '';
  };

  return (
    <div
      className={cx(
        'item-text',
        type === 'password' && 'type-password',
        type === 'search' && 'type-search',
        `type-${sizeType}`,
        className,
      )}
      style={style}
    >
      <div
        ref={boxRef}
        className={cx(
          'inner-text',
          isOpen && 'open',
          isFocus && 'focus',
          props.disabled && 'disabled',
          props.readOnly && 'readonly',
          isError && 'error',
        )}
        // onClick={handleClickSelectButton}
      >
        <input
          type={type === 'password' && isShow ? 'text' : type}
          value={query}
          className="inp-text"
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          {...restProps}
        />
        {type === 'password' && (
          <button type="button" className="btn-show" onClick={showPassword}>
            <span className="ico-comm ico-eye-16">입력한 비밀번호 보기/가리기</span>
          </button>
        )}
        {type === 'search' && (
          <>
            <button type="button" className="btn-clear" onClick={(e) => clearValue(e.currentTarget)}>
              <span className="ico-comm ico-delete-18">입력내용 초기화</span>
            </button>
            <button type="button" className="btn-search">
              <span className={cx('ico-comm', sizeType === 'large' ? 'ico-search' : 'ico-search-18')}>검색하기</span>
            </button>
            {isOpen && (
              <div className={cx('box-option', optionList.length === 0 && 'empty')}>
                {optionList.length > 0 ? (
                  <>
                    <em className="screen_out">선택옵션</em>
                    <ul className="list-option">
                      {optionList
                        .filter((option) =>
                          (option.text as string).toLowerCase().includes((query as string).toLowerCase()),
                        )
                        .map((option) => {
                          return (
                            <li key={option[valueKey] as string}>
                              <button
                                type="button"
                                className="btn-option"
                                onClick={() => handleClickOption(option[valueKey] as string)}
                              >
                                {option[iconKey] && <span className={cx('ico-comm', `ico-${option[iconKey]}`)} />}
                                <span className="txt-option">
                                  {highlightText(option[textKey] as string, query as string)}
                                </span>
                                {option[labelKey] && <span className="txt-label">{option[labelKey]}</span>}
                              </button>
                              {hasDelBtn && (
                                <button type="button" className="btn-del">
                                  <span className="ico-comm ico-delete-12">삭제</span>
                                </button>
                              )}
                            </li>
                          );
                        })}
                    </ul>
                  </>
                ) : (
                  <p className="txt-empty">검색된 내용이 없습니다.</p>
                )}
              </div>
            )}
          </>
        )}
        {time && <span className="txt-time">{time}</span>}
      </div>
      {infoMsg && <p className="txt-info">{infoMsg}</p>}
      {errorMsg && <p className="txt-error">{errorMsg}</p>}
      {confirmMsg && <p className="txt-confirm">{confirmMsg}</p>}
    </div>
  );
});

InputText.displayName = 'InputText';
